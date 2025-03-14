import { isValidUUID } from "./helpers";

export function initializeParams(request, env) {
    const proxyIPs = env.PROXYIP?.split(',').map(proxyIP => proxyIP.trim());
    const url = new URL(request.url);
    const searchParams = new URLSearchParams(url.search);
    globalThis.panelVersion = '2.8.1';
    globalThis.defaultHttpPorts = ['80', '8080', '2052', '2082', '2086', '2095', '8880'];
    globalThis.defaultHttpsPorts = ['443', '8443', '2053', '2083', '2087', '2096'];
    globalThis.userID = env.ID;
    globalThis.trojanPassword = env.PASS;
    globalThis.trojanHash = env.HASH;
    globalThis.proxyIP = proxyIPs ? proxyIPs[Math.floor(Math.random() * proxyIPs.length)] : '';
    globalThis.hostName = request.headers.get('Host');
    globalThis.pathName = url.pathname;
    globalThis.client = searchParams.get('app');
    globalThis.urlOrigin = url.origin;
    globalThis.dohURL = env.DOH_URL || 'https://cloudflare-dns.com/dns-query';
    if (!globalThis.userID || !globalThis.trojanPassword) throw new Error(`Please set ID and PASS first.`, { cause: "init" });
    if (globalThis.userID && !isValidUUID(globalThis.userID)) throw new Error(`Invalid ID: ${globalThis.userID}`, { cause: "init" });
    if (typeof env[env.DATABASE] !== 'object') throw new Error('KV Dataset is not properly set! Please refer to tutorials.', { cause: "init" });
}