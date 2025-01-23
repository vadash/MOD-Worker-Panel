import { initializeParams } from './helpers/init';
import { vlessOverWSHandler } from './protocols/vless';
import { trojanOverWSHandler } from './protocols/trojan';
import { logout, resetPassword, login } from './authentication/auth';
import { renderErrorPage } from './pages/error';
import { getSingBoxCustomConfig } from './cores-configs/sing-box';
import { getMyIP, handlePanel } from './helpers/helpers';

export default {
    async fetch(request, env) {
        try {
            initializeParams(request, env);
            const upgradeHeader = request.headers.get('Upgrade');

            // Prioritize vless/trojan proxy requests
            if (upgradeHeader === 'websocket') {
                return globalThis.pathName.startsWith('/tr')
                    ? await trojanOverWSHandler(request)
                    : await vlessOverWSHandler(request);
            }

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