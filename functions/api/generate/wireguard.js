const DNS_SERVERS = {
    cloudflare: '1.1.1.1',
    google: '8.8.8.8',
    quad9: '9.9.9.9',
    opendns: '208.67.222.222'
};

export async function onRequestPost(context) {
    const { request, env } = context;

    try {
        const user = await getAuthUser(request, env);
        if (!user) {
            return new Response(JSON.stringify({ error: 'احراز هویت نشده' }), {
                status: 401,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        const { country, ipType, operator, dns } = await request.json();

        const today = new Date().toISOString().split('T')[0];
        const usageKey = `usage:${user.telegramId}:${today}`;
        
        let usage = { wireguard: 0, dns: 0, wireguard_dual: 0 };
        if (env.DB) {
            const usageData = await env.DB.get(usageKey);
            if (usageData) {
                usage = JSON.parse(usageData);
                if (usage.wireguard_dual === undefined) usage.wireguard_dual = 0;
            }
        }

        if (!user.isAdmin) {
            if (ipType === 'ipv4_ipv6') {
                if (usage.wireguard_dual >= 1) {
                    return new Response(JSON.stringify({ 
                        error: 'محدودیت روزانه: شما امروز ۱ کانفیگ IPv4+IPv6 تولید کرده‌اید'
                    }), {
                        status: 429,
                        headers: { 'Content-Type': 'application/json' }
                    });
                }
            } else {
                if (usage.wireguard >= 3) {
                    return new Response(JSON.stringify({ 
                        error: 'محدودیت روزانه: شما امروز ۳ کانفیگ WireGuard تولید کرده‌اید'
                    }), {
                        status: 429,
                        headers: { 'Content-Type': 'application/json' }
                    });
                }
            }
        }

        let countries = [];
        if (env.DB) {
            const countriesData = await env.DB.get('countries');
            if (countriesData) {
                countries = JSON.parse(countriesData);
            }
        }

        const countryInfo = countries.find(c => c.code === country) || { code: country, name: country };
        const dnsServer = DNS_SERVERS[dns] || DNS_SERVERS.cloudflare;

        const privateKey = generateRandomKey();
        const peerPublicKey = generateRandomKey();
        
        let address;
        let usedIpv4 = null;
        let usedIpv6 = [];
        
        if (ipType === 'ipv6') {
            if (countryInfo.ipv6 && countryInfo.ipv6.length > 0) {
                usedIpv6 = [countryInfo.ipv6[Math.floor(Math.random() * countryInfo.ipv6.length)]];
                address = `${usedIpv6[0]}/128`;
            } else {
                const hexSegments = [];
                for (let i = 0; i < 4; i++) {
                    hexSegments.push(Math.floor(Math.random() * 65536).toString(16));
                }
                address = `fd00:${hexSegments.join(':')}::1/128`;
            }
        } else if (ipType === 'ipv4_ipv6') {
            if (countryInfo.ipv4 && countryInfo.ipv4.length > 0) {
                usedIpv4 = countryInfo.ipv4[Math.floor(Math.random() * countryInfo.ipv4.length)];
            } else {
                usedIpv4 = `10.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 254) + 1}`;
            }
            
            if (countryInfo.ipv6 && countryInfo.ipv6.length >= 2) {
                const shuffled = [...countryInfo.ipv6].sort(() => Math.random() - 0.5);
                usedIpv6 = [shuffled[0], shuffled[1]];
            } else if (countryInfo.ipv6 && countryInfo.ipv6.length === 1) {
                usedIpv6 = [countryInfo.ipv6[0]];
            } else {
                const hex1 = [];
                const hex2 = [];
                for (let i = 0; i < 4; i++) {
                    hex1.push(Math.floor(Math.random() * 65536).toString(16));
                    hex2.push(Math.floor(Math.random() * 65536).toString(16));
                }
                usedIpv6 = [`fd00:${hex1.join(':')}::1`, `fd00:${hex2.join(':')}::2`];
            }
            
            address = `${usedIpv4}/32, ${usedIpv6.map(ip => `${ip}/128`).join(', ')}`;
        } else {
            if (countryInfo.ipv4 && countryInfo.ipv4.length > 0) {
                usedIpv4 = countryInfo.ipv4[Math.floor(Math.random() * countryInfo.ipv4.length)];
                address = `${usedIpv4}/32`;
            } else {
                address = `10.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 254) + 1}/32`;
            }
        }

        const endpoint = `${country}.vpn.example.com:51820`;

        const config = `[Interface]
PrivateKey = ${privateKey}
Address = ${address}
DNS = ${dnsServer}
MTU = 1280

[Peer]
PublicKey = ${peerPublicKey}
Endpoint = ${endpoint}
AllowedIPs = 0.0.0.0/0, ::/0
PersistentKeepalive = 25`;

        const historyItem = {
            id: generateId(),
            type: 'wireguard',
            country: country,
            ipType: ipType,
            operator: operator,
            dns: dns,
            config: config,
            createdAt: new Date().toISOString()
        };

        if (env.DB) {
            if (ipType === 'ipv4_ipv6') {
                usage.wireguard_dual++;
            } else {
                usage.wireguard++;
            }
            await env.DB.put(usageKey, JSON.stringify(usage), { expirationTtl: 86400 });

            const historyKey = `history:${user.telegramId}`;
            let history = [];
            const historyData = await env.DB.get(historyKey);
            if (historyData) {
                history = JSON.parse(historyData);
            }
            history.unshift(historyItem);
            if (history.length > 50) history = history.slice(0, 50);
            await env.DB.put(historyKey, JSON.stringify(history));

            await updateStats(env, 'wireguard');
        }

        return new Response(JSON.stringify({
            success: true,
            config: config,
            country: countryInfo,
            ipType: ipType,
            operator: operator,
            dns: dns
        }), {
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('WireGuard generation error:', error);
        return new Response(JSON.stringify({ error: 'خطا در تولید کانفیگ' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}

function generateRandomKey() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
    let key = '';
    for (let i = 0; i < 43; i++) {
        key += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return key + '=';
}

function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

async function updateStats(env, type) {
    const today = new Date().toISOString().split('T')[0];
    const statsKey = `stats:${today}`;
    
    let stats = { wireguard: 0, dns: 0 };
    const statsData = await env.DB.get(statsKey);
    if (statsData) {
        stats = JSON.parse(statsData);
    }
    
    stats[type]++;
    await env.DB.put(statsKey, JSON.stringify(stats), { expirationTtl: 86400 * 30 });

    const totalKey = `stats:total`;
    let total = { wireguard: 0, dns: 0 };
    const totalData = await env.DB.get(totalKey);
    if (totalData) {
        total = JSON.parse(totalData);
    }
    total[type]++;
    await env.DB.put(totalKey, JSON.stringify(total));
}

async function getAuthUser(request, env) {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) return null;

    const token = authHeader.slice(7);
    if (!env.DB) return null;

    const telegramId = await env.DB.get(`token:${token}`);
    if (!telegramId) return null;

    const userData = await env.DB.get(`user:${telegramId}`);
    if (!userData) return null;

    return JSON.parse(userData);
}
