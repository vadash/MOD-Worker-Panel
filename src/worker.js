import { initializeParams } from './helpers/init';
import { initializeMockDb } from './helpers/mockDb';
import { vlessOverWSHandler } from './protocols/vless';
import { trojanOverWSHandler } from './protocols/trojan';
import { logout, resetPassword, login } from './authentication/auth';
import { renderErrorPage } from './pages/error';
import { getSingBoxCustomConfig } from './cores-configs/sing-box';
import { getMyIP, handlePanel } from './helpers/helpers';

// Forbid Russian colos so it picks proper EU one
export const NETWORK = Object.freeze({
    FORBIDDEN_COLOS: ["DME", "LED", "SVX", "KJA"],
});

export default {
    async fetch(request, env) {
        try {
            initializeParams(request, env);
            const upgradeHeader = request.headers.get('Upgrade');

            // Prioritize vless/trojan proxy requests
            if (upgradeHeader === 'websocket') {
                const colo = request.cf?.colo;
                if (colo && NETWORK.FORBIDDEN_COLOS.includes(colo)) {
                    return new Response(`Bad Cloudflare colo: ${colo}. Try again with another clean IP.`, {
                        status: 403,
                        headers: { 'Content-Type': 'text/plain' },
                    });
                }
                else {
                    return globalThis.pathName.startsWith('/tr')
                        ? await trojanOverWSHandler(request)
                        : await vlessOverWSHandler(request);
                }
            }

            // Force proper region for CF worker via D1 trick
            await initializeMockDb(env.MOCK_DB);

            // Handle other paths
            switch (globalThis.pathName) {

                case `/sub/${globalThis.userID}`:
                    return await getSingBoxCustomConfig(request, env, false);

                case `/fragsub/${globalThis.userID}`:
                    return await getSingBoxCustomConfig(request, env, true);

                case '/panel':
                    return await handlePanel(request, env);

                case '/login':
                    return await login(request, env);

                case '/logout':
                    return logout();

                case '/panel/password':
                    return await resetPassword(request, env);

                default:
                    return await getMyIP(request);
            }
        } catch (err) {
            return await renderErrorPage(err);
        }
    }
};