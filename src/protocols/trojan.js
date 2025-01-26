import { connect } from 'cloudflare:sockets';

/**
 * Handles Trojan protocol over WebSocket.
 * @param {Request} request The incoming HTTP request.
 * @returns {Response} The WebSocket response.
 */
export async function trojanOverWSHandler(request) {
    const webSocketPair = new WebSocketPair();
    const [client, webSocket] = Object.values(webSocketPair);
    webSocket.accept();

    let address = "";
    let portWithRandomLog = "";
    const log = (info, event) => {
        console.log(`[${address}:${portWithRandomLog}] ${info}`, event || "");
    };

    const earlyDataHeader = request.headers.get("sec-websocket-protocol") || "";
    const readableWebSocketStream = makeReadableWebSocketStream(webSocket, earlyDataHeader, log);

    let remoteSocketWapper = {
        value: null,
    };

    let udpStreamWrite = null;

    readableWebSocketStream
        .pipeTo(
            new WritableStream({
                async write(chunk, controller) {
                    if (udpStreamWrite) {
                        return udpStreamWrite(chunk);
                    }

                    if (remoteSocketWapper.value) {
                        const writer = remoteSocketWapper.value.writable.getWriter();
                        try {
                            await writer.write(chunk);
                        } catch (error) {
                            log('Remote socket write error', error);
                            controller.error(error);
                            safeCloseWebSocket(webSocket);
                        } finally {
                            writer.releaseLock();
                        }
                        return;
                    }

                    try {
                        const {
                            hasError,
                            message,
                            portRemote = 443,
                            addressRemote = "",
                            rawClientData,
                        } = await parseTrojanHeader(chunk);

                        address = addressRemote;
                        portWithRandomLog = `${portRemote}--${Math.random()} tcp`;

                        if (hasError) {
                            throw new Error(message);
                        }

                        await handleTCPOutBound(remoteSocketWapper, addressRemote, portRemote, rawClientData, webSocket, log);
                    } catch (error) {
                        log('Connection handling error', error);
                        controller.error(error);
                        safeCloseWebSocket(webSocket);
                    }
                },
                close() {
                    log(`readableWebSocketStream is closed`);
                },
                abort(reason) {
                    log(`readableWebSocketStream is aborted`, JSON.stringify(reason));
                },
            })
        )
        .catch((err) => {
            log("readableWebSocketStream pipeTo error", err);
        });

    return new Response(null, {
        status: 101,
        // @ts-ignore
        webSocket: client,
    });
}

/**
 * Creates a readable stream from a WebSocket server, allowing for data to be read from the WebSocket with backpressure handling.
 * @param {import("@cloudflare/workers-types").WebSocket} webSocketServer The WebSocket server to create the readable stream from.
 * @param {string} earlyDataHeader The header containing early data for WebSocket 0-RTT.
 * @param {(info: string, event?: any)=> void} log The logging function.
 * @returns {ReadableStream} A readable stream that can be used to read data from the WebSocket.
 */
function makeReadableWebSocketStream(webSocketServer, earlyDataHeader, log) {
    let readableStreamCancel = false;
    let messageListener;
    let closeListener;
    let errorListener;
    let isListeningToMessages = false;

    return new ReadableStream({
        start(controller) {
            isListeningToMessages = true;

            messageListener = (event) => {
                if (readableStreamCancel) return;
                controller.enqueue(event.data);
                // Apply backpressure when queue is full
                if (controller.desiredSize <= 0) {
                    webSocketServer.removeEventListener("message", messageListener);
                    isListeningToMessages = false;
                }
            };

            closeListener = () => {
                if (!readableStreamCancel) controller.close();
                safeCloseWebSocket(webSocketServer);
            };

            errorListener = (err) => {
                log("WebSocket error", err);
                controller.error(err);
            };

            webSocketServer.addEventListener("message", messageListener);
            webSocketServer.addEventListener("close", closeListener);
            webSocketServer.addEventListener("error", errorListener);

            // Handle early data
            const { earlyData, error } = base64ToArrayBuffer(earlyDataHeader);
            if (error) {
                controller.error(error);
            } else if (earlyData) {
                controller.enqueue(earlyData);
                if (controller.desiredSize <= 0) {
                    webSocketServer.removeEventListener("message", messageListener);
                    isListeningToMessages = false;
                }
            }
        },
        pull(controller) {
            // Resume message listening when backpressure is relieved
            if (!isListeningToMessages) {
                webSocketServer.addEventListener("message", messageListener);
                isListeningToMessages = true;
            }
        },
        cancel(reason) {
            readableStreamCancel = true;
            log(`Stream canceled: ${reason}`);
            webSocketServer.removeEventListener("message", messageListener);
            webSocketServer.removeEventListener("close", closeListener);
            webSocketServer.removeEventListener("error", errorListener);
            safeCloseWebSocket(webSocketServer);
        }
    });
}

/**
 * Handles outbound TCP connections.
 * @param {any} remoteSocket
 * @param {string} addressRemote The remote address to connect to.
 * @param {number} portRemote The remote port to connect to.
 * @param {Uint8Array} rawClientData The raw client data to write.
 * @param {import("@cloudflare/workers-types").WebSocket} webSocket The WebSocket to pass the remote socket to.
 * @param {(info: string, event?: any)=> void} log The logging function.
 * @returns {Promise<void>} The remote socket.
 */
async function handleTCPOutBound(
    remoteSocket,
    addressRemote,
    portRemote,
    rawClientData,
    webSocket,
    log
) {
    /**
     * Connects to a TCP socket and writes initial data.
     * @async
     * @param {string} address The address to connect to.
     * @param {number} port The port to connect to.
     * @returns {Promise<import("@cloudflare/workers-types").Socket>} The connected TCP socket.
     */
    async function connectAndWrite(address, port) {
        /* @type {import("@cloudflare/workers-types").Socket} */
        const tcpSocket = connect({
            hostname: address,
            port: port,
        });
        remoteSocket.value = tcpSocket;
        log(`Connected to ${address}:${port}`);

        try {
            const writer = tcpSocket.writable.getWriter();
            await writer.write(rawClientData);
            writer.releaseLock();
        } catch (error) {
            log('Initial write failed', error);
            tcpSocket.close();
            throw error;
        }
        return tcpSocket;
    }

    /**
     * Retries the TCP connection with a different IP if the initial connection fails or has no incoming data.
     * @async
     * @returns {Promise<void>}
     */
    async function retry() {
        const panelProxyIP = globalThis.pathName.split('/')[2];
        const panelProxyIPs = panelProxyIP ? atob(panelProxyIP).split(',') : undefined;
        const finalProxyIP = panelProxyIPs?.[Math.floor(Math.random() * panelProxyIPs.length)] || globalThis.proxyIP || addressRemote;

        try {
            const tcpSocket = await connectAndWrite(finalProxyIP, portRemote);
            // Cleanup existing connection before replacing
            if (remoteSocket.value) safeCloseSocket(remoteSocket.value);
            remoteSocket.value = tcpSocket;

            tcpSocket.closed
                .catch((error) => {
                    log("Retry socket closed with error", error);
                })
                .finally(() => {
                    safeCloseWebSocket(webSocket);
                });

            trojanRemoteSocketToWS(tcpSocket, webSocket, null, log);
        } catch (error) {
            log("Retry failed", error);
            safeCloseWebSocket(webSocket);
        }
    }

    try {
        const tcpSocket = await connectAndWrite(addressRemote, portRemote);
        trojanRemoteSocketToWS(tcpSocket, webSocket, retry, log);
    } catch (error) {
        log("Initial connection failed", error);
        safeCloseWebSocket(webSocket);
        throw error;
    }
}

/**
 * Pipes data from a remote socket to a WebSocket.
 * @async
 * @param {import("@cloudflare/workers-types").Socket} remoteSocket The remote socket to read from.
 * @param {import("@cloudflare/workers-types").WebSocket} webSocket The WebSocket to write to.
 * @param {(() => Promise<void>) | null} retry A function to retry the connection, or null if no retry is needed.
 * @param {(info: string, event?: any)=> void} log The logging function.
 * @returns {Promise<void>}
 */
async function trojanRemoteSocketToWS(remoteSocket, webSocket, retry, log) {
    let hasIncomingData = false;
    let isWebSocketOpen = true;

    // Handle WebSocket closure
    webSocket.addEventListener('close', () => {
        isWebSocketOpen = false;
        safeCloseSocket(remoteSocket);
    });

    try {
        await remoteSocket.readable.pipeTo(
            new WritableStream({
                /**
                 * Writes a chunk of data to the WebSocket.
                 *
                 * @param {Uint8Array} chunk The chunk of data to write.
                 * @returns {void}
                 */
                write(chunk) {
                    if (!isWebSocketOpen) throw new Error("WebSocket closed");
                    hasIncomingData = true;
                    webSocket.send(chunk);
                },
                close() {
                    log(`Remote socket closed${hasIncomingData ? '' : ' (no data)'}`);
                    if (isWebSocketOpen) safeCloseWebSocket(webSocket);
                },
                abort(error) {
                    log("Remote socket abort", error);
                    if (isWebSocketOpen) safeCloseWebSocket(webSocket);
                }
            })
        );
    } catch (error) {
        log(`Remote to WebSocket pipe error: ${error}`);
        safeCloseWebSocket(webSocket);
    }

    if (!hasIncomingData && retry) {
        log("No incoming data - initiating retry");
        retry();
    }
}

/**
 * Safely closes a socket, catching any potential errors.
 * @param {import("@cloudflare/workers-types").Socket | undefined} socket The socket to close.
 */
function safeCloseSocket(socket) {
    try {
        if (socket) socket.close();
    } catch (error) {
        console.error('Safe socket close error:', error);
    }
}

const WS_READY_STATE_OPEN = 1;
const WS_READY_STATE_CLOSING = 2;

/**
 * Closes a WebSocket connection safely without throwing exceptions.
 * @param {import("@cloudflare/workers-types").WebSocket} socket The WebSocket connection to close.
 */
function safeCloseWebSocket(socket) {
    try {
        if (socket.readyState === WS_READY_STATE_OPEN || socket.readyState === WS_READY_STATE_CLOSING) {
            socket.close();
        }
    } catch (error) {
        console.error('safeCloseWebSocket error', error);
    }
}

/**
 * Decodes a base64 string into an ArrayBuffer.
 * @param {string} base64Str The base64 string to decode.
 * @returns {{earlyData: ArrayBuffer|null, error: Error|null}} An object containing the decoded ArrayBuffer or null if there was an error, and any error that occurred during decoding or null if there was no error.
 */
function base64ToArrayBuffer(base64Str) {
    if (!base64Str) {
        return { earlyData: null, error: null };
    }

    try {
        base64Str = base64Str.replace(/-/g, '+').replace(/_/g, '/');
        const decode = atob(base64Str);
        const arryBuffer = Uint8Array.from(decode, (c) => c.charCodeAt(0));
        return { earlyData: arryBuffer.buffer, error: null };
    } catch (error) {
        return { earlyData: null, error };
    }
}

/**
 * Parses the Trojan header from the incoming buffer.
 * @async
 * @param {ArrayBuffer} buffer The buffer containing the Trojan header and SOCKS5 request.
 * @returns {Promise<{ hasError: boolean, message?: string, portRemote?: number, addressRemote?: string, rawClientData?: Uint8Array }>} An object containing parsing results.
 */
async function parseTrojanHeader(buffer) {
    if (buffer.byteLength < 56) {
        return {
            hasError: true,
            message: "invalid data",
        };
    }

    let crLfIndex = 56;
    if (new Uint8Array(buffer.slice(56, 57))[0] !== 0x0d || new Uint8Array(buffer.slice(57, 58))[0] !== 0x0a) {
        return {
            hasError: true,
            message: "invalid header format (missing CR LF)",
        };
    }

    const password = new TextDecoder().decode(buffer.slice(0, crLfIndex));
    if (password !== globalThis.trojanHash) {
        return {
            hasError: true,
            message: "invalid password",
        };
    }

    const socks5DataBuffer = buffer.slice(crLfIndex + 2);
    if (socks5DataBuffer.byteLength < 6) {
        return {
            hasError: true,
            message: "invalid SOCKS5 request data",
        };
    }

    const view = new DataView(socks5DataBuffer);
    const cmd = view.getUint8(0);
    if (cmd !== 1) {
        return {
            hasError: true,
            message: "unsupported command, only TCP (CONNECT) is allowed",
        };
    }

    const atype = view.getUint8(1);
    // 0x01: IPv4 address
    // 0x03: Domain name
    // 0x04: IPv6 address
    let addressLength = 0;
    let addressIndex = 2;
    let address = "";

    switch (atype) {
        case 1:
            addressLength = 4;
            address = new Uint8Array(socks5DataBuffer.slice(addressIndex, addressIndex + addressLength)).join(".");
            break;
        case 3:
            addressLength = new Uint8Array(socks5DataBuffer.slice(addressIndex, addressIndex + 1))[0];
            addressIndex += 1;
            address = new TextDecoder().decode(socks5DataBuffer.slice(addressIndex, addressIndex + addressLength));
            break;
        case 4:
            addressLength = 16;
            const dataView = new DataView(socks5DataBuffer.slice(addressIndex, addressIndex + addressLength));
            const ipv6 = [];
            for (let i = 0; i < 8; i++) {
                ipv6.push(dataView.getUint16(i * 2).toString(16));
            }
            address = ipv6.join(":");
            break;
        default:
            return {
                hasError: true,
                message: `invalid addressType is ${atype}`,
            };
    }

    if (!address) {
        return {
            hasError: true,
            message: `address is empty, addressType is ${atype}`,
        };
    }

    const portIndex = addressIndex + addressLength;
    const portBuffer = socks5DataBuffer.slice(portIndex, portIndex + 2);
    const portRemote = new DataView(portBuffer).getUint16(0);

    return {
        hasError: false,
        addressRemote: address,
        portRemote,
        rawClientData: socks5DataBuffer.slice(portIndex + 4),
    };
}