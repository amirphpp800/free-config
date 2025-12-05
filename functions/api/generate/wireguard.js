const COUNTRIES = [
    { code: 'de', name: 'آلمان', flag: '🇩🇪' },
    { code: 'nl', name: 'هلند', flag: '🇳🇱' },
    { code: 'us', name: 'آمریکا', flag: '🇺🇸' },
    { code: 'uk', name: 'انگلستان', flag: '🇬🇧' },
    { code: 'fr', name: 'فرانسه', flag: '🇫🇷' },
    { code: 'fi', name: 'فنلاند', flag: '🇫🇮' },
    { code: 'se', name: 'سوئد', flag: '🇸🇪' },
    { code: 'ca', name: 'کانادا', flag: '🇨🇦' }
];

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

        const today = new Date().toISOString().split('T')[0];
        const usageKey = `usage:${user.telegramId}:${today}`;
        
        let usage = { wireguard: 0, dns: 0 };
        if (env.DB) {
            const usageData = await env.DB.get(usageKey);
            if (usageData) {
                usage = JSON.parse(usageData);
            }
        }

        if (usage.wireguard >= 3) {
            return new Response(JSON.stringify({ 
                error: 'محدودیت روزانه: شما امروز ۳ کانفیگ WireGuard تولید کرده‌اید'
            }), {
                status: 429,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        const { country, ipType, operator, dns } = await request.json();

        const countryInfo = COUNTRIES.find(c => c.code === country) || COUNTRIES[0];
        const dnsServer = DNS_SERVERS[dns] || DNS_SERVERS.cloudflare;

        const privateKey = generateRandomKey();
        const publicKey = generateRandomKey();
        const peerPublicKey = generateRandomKey();
        
        let address;
        if (ipType === 'ipv6') {
            const hexSegments = [];
            for (let i = 0; i < 4; i++) {
                hexSegments.push(Math.floor(Math.random() * 65536).toString(16));
            }
            address = `fd00:${hexSegments.join(':')}::1/128`;
        } else if (ipType === 'ipv4_ipv6') {
            const hexSegments = [];
            for (let i = 0; i < 4; i++) {
                hexSegments.push(Math.floor(Math.random() * 65536).toString(16));
            }
            const ipv4 = `10.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 254) + 1}/32`;
            const ipv6 = `fd00:${hexSegments.join(':')}::1/128`;
            address = `${ipv4}, ${ipv6}`;
        } else {
            address = `10.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 254) + 1}/32`;
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
            usage.wireguard++;
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
