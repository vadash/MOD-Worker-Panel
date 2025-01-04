import { initializeParams } from './helpers/init';
import { vlessOverWSHandler } from './protocols/vless';
import { trojanOverWSHandler } from './protocols/trojan';
import { logout, resetPassword, login } from './authentication/auth';
import { renderErrorPage } from './pages/error';
import { getXrayCustomConfigs } from './cores-configs/xray';
import { getSingBoxCustomConfig } from './cores-configs/sing-box';
import { getClashNormalConfig } from './cores-configs/clash';
import { getNormalConfigs } from './cores-configs/normalConfigs';
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
                    if (globalThis.client === 'sfa') return await getSingBoxCustomConfig(request, env, false);
                    if (globalThis.client === 'clash') return await getClashNormalConfig(request, env);
                    if (globalThis.client === 'xray') return await getXrayCustomConfigs(request, env, false);
                    return await getNormalConfigs(request, env);

                case `/fragsub/${globalThis.userID}`:
                    return globalThis.client === 'hiddify'
                        ? await getSingBoxCustomConfig(request, env, true)
                        : await getXrayCustomConfigs(request, env, true);

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