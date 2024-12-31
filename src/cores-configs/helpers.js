import { resolveDNS, isDomain } from '../helpers/helpers';

const MAX_IPS_TO_PICK = 8;

export async function getConfigAddresses(cleanIPs, enableIPv6) {
    const ips = cleanIPs ? cleanIPs.split(',') : [];
    
    // Group IPs by first two octets
    const ipGroups = {};
    ips.forEach(ip => {
        if (isIPv4(ip)) {
            const [first, second] = ip.split('.');
            const groupKey = `${first}.${second}`;
            if (!ipGroups[groupKey]) {
                ipGroups[groupKey] = [];
            }
            ipGroups[groupKey].push(ip);
        }
    });

    // Get unique group keys and shuffle them
    const groupKeys = Object.keys(ipGroups);
    const shuffledGroups = groupKeys.sort(() => Math.random() - 0.5);
    
    let selectedIPs = [];
    
    // Try to get one IP from each group first (up to MAX_IPS_TO_PICK)
    shuffledGroups.slice(0, MAX_IPS_TO_PICK).forEach(groupKey => {
        const groupIPs = ipGroups[groupKey];
        const randomIP = groupIPs[Math.floor(Math.random() * groupIPs.length)];
        selectedIPs.push(randomIP);
    });

    // If we don't have enough IPs yet, fill the rest randomly from any group
    if (selectedIPs.length < MAX_IPS_TO_PICK) {
        const remainingCount = MAX_IPS_TO_PICK - selectedIPs.length;
        const allRemainingIPs = ips.filter(ip => !selectedIPs.includes(ip));
        const additionalIPs = allRemainingIPs
            .sort(() => Math.random() - 0.5)
            .slice(0, remainingCount);
        selectedIPs = [...selectedIPs, ...additionalIPs];
    }

    return [
        'www.vimeo.com',
        'www.speedtest.net',
        ...selectedIPs
    ];
}

export function extractWireguardParams(warpConfigs, isWoW) {
    const index = isWoW ? 1 : 0;
    const warpConfig = warpConfigs[index].account.config;
    return {
        warpIPv6: `${warpConfig.interface.addresses.v6}/128`,
        reserved: warpConfig.client_id,
        publicKey: warpConfig.peers[0].public_key,
        privateKey: warpConfigs[index].privateKey,
    };
}

export function generateRemark(index, port, address, cleanIPs, protocol, configType) {
    let addressType;
    const type = configType ? ` ${configType}` : '';

    cleanIPs.includes(address)
        ? addressType = 'Clean IP'
        : addressType = isDomain(address) ? 'Domain' : isIPv4(address) ? 'IPv4' : isIPv6(address) ? 'IPv6' : '';

    return `💦 ${index} - ${protocol}${type} - ${addressType} : ${port}`;
}

export function randomUpperCase(str) {
    let result = '';
    for (let i = 0; i < str.length; i++) {
        result += Math.random() < 0.5 ? str[i].toUpperCase() : str[i];
    }
    return result;
}

export function getRandomPath(length) {
    let result = '';
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const charactersLength = characters.length;
    for (let i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
}

export function base64ToDecimal(base64) {
    const binaryString = atob(base64);
    const hexString = Array.from(binaryString).map(char => char.charCodeAt(0).toString(16).padStart(2, '0')).join('');
    const decimalArray = hexString.match(/.{2}/g).map(hex => parseInt(hex, 16));
    return decimalArray;
}

export function isIPv4(address) {
    const ipv4Pattern = /^(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)(?:\/([0-9]|[1-2][0-9]|3[0-2]))?$/;
    return ipv4Pattern.test(address);
}

export function isIPv6(address) {
    const ipv6Pattern = /^\[(?:(?:[a-fA-F0-9]{1,4}:){7}[a-fA-F0-9]{1,4}|(?:[a-fA-F0-9]{1,4}:){1,7}:|::(?:[a-fA-F0-9]{1,4}:){0,7}|(?:[a-fA-F0-9]{1,4}:){1,6}:[a-fA-F0-9]{1,4}|(?:[a-fA-F0-9]{1,4}:){1,5}(?::[a-fA-F0-9]{1,4}){1,2}|(?:[a-fA-F0-9]{1,4}:){1,4}(?::[a-fA-F0-9]{1,4}){1,3}|(?:[a-fA-F0-9]{1,4}:){1,3}(?::[a-fA-F0-9]{1,4}){1,4}|(?:[a-fA-F0-9]{1,4}:){1,2}(?::[a-fA-F0-9]{1,4}){1,5}|[a-fA-F0-9]{1,4}:(?::[a-fA-F0-9]{1,4}){1,6})\](?:\/(1[0-1][0-9]|12[0-8]|[0-9]?[0-9]))?$/;
    return ipv6Pattern.test(address);
}