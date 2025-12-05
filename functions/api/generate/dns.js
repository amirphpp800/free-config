const DNS_SERVERS = {
    cloudflare: { name: 'Cloudflare', primary: '1.1.1.1', secondary: '1.0.0.1', doh: 'https://cloudflare-dns.com/dns-query' },
    google: { name: 'Google', primary: '8.8.8.8', secondary: '8.8.4.4', doh: 'https://dns.google/dns-query' },
    quad9: { name: 'Quad9', primary: '9.9.9.9', secondary: '149.112.112.112', doh: 'https://dns.quad9.net/dns-query' },
    opendns: { name: 'OpenDNS', primary: '208.67.222.222', secondary: '208.67.220.220', doh: 'https://doh.opendns.com/dns-query' }
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
        
        let usage = { wireguard: 0, dns: 0, wireguard_dual: 0 };
        if (env.DB) {
            const usageData = await env.DB.get(usageKey);
            if (usageData) {
                usage = JSON.parse(usageData);
                
                // Initialize resetTimestamp if not exists
                if (!usage.resetTimestamp) {
                    usage.resetTimestamp = Date.now() + (24 * 60 * 60 * 1000);
                }
            }
        }

        if (!user.isAdmin && usage.dns >= 3) {
            return new Response(JSON.stringify({ 
                error: 'محدودیت روزانه: شما امروز ۳ کانفیگ DNS تولید کرده‌اید'
            }), {
                status: 429,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        const { country, ipType, operator, dns } = await request.json();

        let countries = [];
        if (env.DB) {
            const countriesData = await env.DB.get('countries');
            if (countriesData) {
                countries = JSON.parse(countriesData);
            }
        }

        const countryInfo = countries.find(c => c.code === country) || { code: country, name: country };
        const dnsInfo = DNS_SERVERS[dns] || DNS_SERVERS.cloudflare;

        let selectedIp = '';
        let consumedIPs = [];
        
        if (ipType === 'ipv6') {
            if (countryInfo.ipv6 && countryInfo.ipv6.length >= 2) {
                // انتخاب دو آدرس IPv6 تصادفی
                const shuffled = [...countryInfo.ipv6].sort(() => Math.random() - 0.5);
                consumedIPs = [shuffled[0], shuffled[1]];
                selectedIp = consumedIPs.join('\n');
            } else if (countryInfo.ipv6 && countryInfo.ipv6.length === 1) {
                consumedIPs = [countryInfo.ipv6[0]];
                selectedIp = consumedIPs[0];
            } else {
                selectedIp = '2606:4700:4700::1111\n2606:4700:4700::1001';
            }
        } else {
            if (countryInfo.ipv4 && countryInfo.ipv4.length > 0) {
                const ip = countryInfo.ipv4[Math.floor(Math.random() * countryInfo.ipv4.length)];
                consumedIPs = [ip];
                selectedIp = ip;
            } else {
                selectedIp = dnsInfo.primary;
            }
        }

        const config = selectedIp;

        const historyItem = {
            id: generateId(),
            type: 'dns',
            country: country,
            ipType: ipType,
            operator: operator,
            dns: dns,
            config: config,
            createdAt: new Date().toISOString()
        };

        if (env.DB) {
            usage.dns++;
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

            await updateStats(env, 'dns');

            // Update country inventory in KV
            if (ipType === 'ipv4') {
                if (consumedIPs.length > 0 && countryInfo.ipv4) {
                    consumedIPs.forEach(ip => {
                        const ipIndex = countryInfo.ipv4.indexOf(ip);
                        if (ipIndex > -1) {
                            countryInfo.ipv4.splice(ipIndex, 1);
                        }
                    });
                    const countryIndex = countries.findIndex(c => c.code === countryInfo.code);
                    if (countryIndex > -1) {
                        countries[countryIndex].ipv4 = countryInfo.ipv4;
                    }
                    await env.DB.put('countries', JSON.stringify(countries));
                }
            } else if (ipType === 'ipv6') {
                if (consumedIPs.length > 0 && countryInfo.ipv6) {
                    consumedIPs.forEach(ip => {
                        const ipIndex = countryInfo.ipv6.indexOf(ip);
                        if (ipIndex > -1) {
                            countryInfo.ipv6.splice(ipIndex, 1);
                        }
                    });
                    const countryIndex = countries.findIndex(c => c.code === countryInfo.code);
                    if (countryIndex > -1) {
                        countries[countryIndex].ipv6 = countryInfo.ipv6;
                    }
                    await env.DB.put('countries', JSON.stringify(countries));
                }
            }
        }

        return new Response(JSON.stringify({
            success: true,
            config: config,
            country: countryInfo,
            ipType: ipType,
            operator: operator,
            dns: dns,
            inventory: {
                country: {
                    code: countryInfo.code,
                    name: countryInfo.name,
                    flag: countryInfo.flag,
                    remainingIPv4: countryInfo.ipv4?.length || 0,
                    remainingIPv6: countryInfo.ipv6?.length || 0
                }
            }
        }), {
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('DNS generation error:', error);
        return new Response(JSON.stringify({ error: 'خطا در تولید کانفیگ DNS' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
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
