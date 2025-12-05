const DNS_SERVERS = {
    cloudflare_primary: '1.1.1.1',
    cloudflare_secondary: '1.0.0.1',
    google_primary: '8.8.8.8',
    google_secondary: '8.8.4.4',
    quad9: '9.9.9.9',
    radar: '10.202.10.10',
    electro: '78.157.42.100',
    opendns_primary: '208.67.222.222',
    opendns_secondary: '208.67.220.220',
    shecan_primary: '185.55.226.26',
    shecan_secondary: '185.55.225.25',
    irancell: '185.51.200.2'
};

const OPERATORS = {
    irancell: {
        addresses: ['2.144.0.0/16'],
        addressesV6: ['2a01:5ec0:1000::1/128', '2a01:5ec0:1000::2/128']
    },
    mci: {
        addresses: ['5.52.0.0/16'],
        addressesV6: ['2a02:4540::1/128', '2a02:4540::2/128']
    },
    tci: {
        addresses: ['2.176.0.0/15', '2.190.0.0/15'],
        addressesV6: ['2a04:2680:13::1/128', '2a04:2680:13::2/128']
    },
    rightel: {
        addresses: ['37.137.128.0/17', '95.162.0.0/17'],
        addressesV6: ['2a03:ef42::1/128', '2a03:ef42::2/128']
    },
    shatel: {
        addresses: ['94.182.0.0/16', '37.148.0.0/18'],
        addressesV6: ['2a0e::1/128', '2a0e::2/128']
    }
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

        const { country, ipType, operator, dns, countryIPv4, countryIPv6 } = await request.json();

        const today = new Date().toISOString().split('T')[0];
        const usageKey = `usage:${user.telegramId}:${today}`;
        
        let usage = { wireguard: 0, dns: 0, wireguard_dual: 0 };
        if (env.DB) {
            const usageData = await env.DB.get(usageKey);
            if (usageData) {
                usage = JSON.parse(usageData);
                if (usage.wireguard_dual === undefined) usage.wireguard_dual = 0;
            }
            
            // Initialize resetTimestamp if not exists
            if (!usage.resetTimestamp) {
                usage.resetTimestamp = Date.now() + (24 * 60 * 60 * 1000);
            }
        }

        if (!user.isAdmin) {
            if (ipType === 'ipv4_ipv6') {
                if (usage.wireguard_dual >= 1) {
                    return new Response(JSON.stringify({ 
                        error: 'محدودیت روزانه: شما امروز ۱ کانفیگ IPv4+IPv6 تولید کرده‌اید',
                        resetTimestamp: usage.resetTimestamp,
                        resetTimer: usage.resetTimestamp ? Math.max(0, usage.resetTimestamp - Date.now()) : 0
                    }), {
                        status: 429,
                        headers: { 'Content-Type': 'application/json' }
                    });
                }
            } else {
                if (usage.wireguard >= 3) {
                    return new Response(JSON.stringify({ 
                        error: 'محدودیت روزانه: شما امروز ۳ کانفیگ WireGuard تولید کرده‌اید',
                        resetTimestamp: usage.resetTimestamp,
                        resetTimer: usage.resetTimestamp ? Math.max(0, usage.resetTimestamp - Date.now()) : 0
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
        
        // بررسی موجودی
        if (ipType === 'ipv4' && (!countryInfo.ipv4 || countryInfo.ipv4.length === 0)) {
            return new Response(JSON.stringify({ error: 'موجودی IPv4 برای این کشور تمام شده است' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }
        if (ipType === 'ipv6' && (!countryInfo.ipv6 || countryInfo.ipv6.length === 0)) {
            return new Response(JSON.stringify({ error: 'موجودی IPv6 برای این کشور تمام شده است' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }
        
        // DNS از لیست انتخابی کاربر
        const selectedDNS = DNS_SERVERS[dns] || DNS_SERVERS.cloudflare_primary;
        
        let dnsServers;
        if (ipType === 'ipv4_ipv6') {
            // برای IPv4+IPv6: یک IPv4 کشور + دو IPv6 کشور + DNS انتخابی
            let countryDNSv4 = '1.1.1.1';
            if (ipv4Country.ipv4 && ipv4Country.ipv4.length > 0) {
                countryDNSv4 = ipv4Country.ipv4[0];
            }
            
            let countryDNSv6 = [];
            if (ipv6Country.ipv6 && ipv6Country.ipv6.length >= 2) {
                countryDNSv6 = [ipv6Country.ipv6[0], ipv6Country.ipv6[1]];
            } else if (ipv6Country.ipv6 && ipv6Country.ipv6.length === 1) {
                countryDNSv6 = [ipv6Country.ipv6[0]];
            }
            
            if (countryDNSv6.length > 0) {
                dnsServers = `${countryDNSv4}, ${countryDNSv6.join(', ')}, ${selectedDNS}`;
            } else {
                dnsServers = `${countryDNSv4}, ${selectedDNS}`;
            }
        } else {
            // DNS از کشور (اولین IPv4 کشور)
            let countryDNS = '1.1.1.1';
            if (countryInfo.ipv4 && countryInfo.ipv4.length > 0) {
                countryDNS = countryInfo.ipv4[0];
            }
            
            // ترکیب دو DNS
            dnsServers = `${countryDNS}, ${selectedDNS}`;
        }
        
        // آدرس‌های اپراتور
        const operatorData = OPERATORS[operator] || OPERATORS.mci;

        const privateKey = generateRandomKey();
        const peerPublicKey = generateRandomKey();
        
        let address;
        let usedIpv4 = null;
        let usedIpv6 = [];
        let ipv4Country = countryInfo;
        let ipv6Country = countryInfo;
        
        if (ipType === 'ipv6') {
            if (!countryInfo.ipv6 || countryInfo.ipv6.length === 0) {
                return new Response(JSON.stringify({ 
                    error: 'موجودی IPv6 برای این کشور وجود ندارد'
                }), {
                    status: 400,
                    headers: { 'Content-Type': 'application/json' }
                });
            }
            if (countryInfo.ipv6.length >= 2) {
                const shuffled = [...countryInfo.ipv6].sort(() => Math.random() - 0.5);
                usedIpv6 = [shuffled[0], shuffled[1]];
            } else {
                usedIpv6 = [countryInfo.ipv6[0]];
            }
            
            // فقط آدرس‌های IPv4 اپراتور (بدون IPv6)
            const operatorAddresses = operatorData.addresses.join(', ');
            const formattedIpv6 = usedIpv6.map(ip => ip.includes('/') ? ip : `${ip}/128`).join(', ');
            address = `${formattedIpv6}, ${operatorAddresses}`;
        } else if (ipType === 'ipv4_ipv6') {
            if (countryIPv4 && countryIPv6) {
                const foundIPv4Country = countries.find(c => c.code === countryIPv4);
                const foundIPv6Country = countries.find(c => c.code === countryIPv6);
                
                if (foundIPv4Country) ipv4Country = foundIPv4Country;
                if (foundIPv6Country) ipv6Country = foundIPv6Country;
            }
            
            if (!ipv4Country.ipv4 || ipv4Country.ipv4.length === 0) {
                return new Response(JSON.stringify({ 
                    error: `موجودی IPv4 برای کشور ${ipv4Country.name || ipv4Country.code} وجود ندارد`
                }), {
                    status: 400,
                    headers: { 'Content-Type': 'application/json' }
                });
            }
            if (!ipv6Country.ipv6 || ipv6Country.ipv6.length === 0) {
                return new Response(JSON.stringify({ 
                    error: `موجودی IPv6 برای کشور ${ipv6Country.name || ipv6Country.code} وجود ندارد`
                }), {
                    status: 400,
                    headers: { 'Content-Type': 'application/json' }
                });
            }
            
            usedIpv4 = ipv4Country.ipv4[Math.floor(Math.random() * ipv4Country.ipv4.length)];
            
            if (ipv6Country.ipv6.length >= 2) {
                const shuffled = [...ipv6Country.ipv6].sort(() => Math.random() - 0.5);
                usedIpv6 = [shuffled[0], shuffled[1]];
            } else {
                usedIpv6 = [ipv6Country.ipv6[0]];
            }
            
            // برای IPv4+IPv6: هم آدرس‌های IPv4 و هم IPv6 اپراتور
            const operatorIPv4 = operatorData.addresses.join(', ');
            const operatorIPv6 = operatorData.addressesV6.join(', ');
            const formattedIpv4 = usedIpv4.includes('/') ? usedIpv4 : `${usedIpv4}/32`;
            const formattedIpv6Dual = usedIpv6.map(ip => ip.includes('/') ? ip : `${ip}/128`).join(', ');
            address = `${formattedIpv4}, ${operatorIPv4}, ${formattedIpv6Dual}, ${operatorIPv6}`;
        } else {
            // برای IPv4: فقط آدرس‌های IPv4 اپراتور
            if (!countryInfo.ipv4 || countryInfo.ipv4.length === 0) {
                return new Response(JSON.stringify({ 
                    error: 'موجودی IPv4 برای این کشور وجود ندارد'
                }), {
                    status: 400,
                    headers: { 'Content-Type': 'application/json' }
                });
            }
            usedIpv4 = countryInfo.ipv4[Math.floor(Math.random() * countryInfo.ipv4.length)];
            
            const operatorAddresses = operatorData.addresses.join(', ');
            const formattedIpv4Single = usedIpv4.includes('/') ? usedIpv4 : `${usedIpv4}/32`;
            address = `${formattedIpv4Single}, ${operatorAddresses}`;
        }

        const endpoint = `${country}.vpn.example.com:51820`;

        const config = `[Interface]
PrivateKey = ${privateKey}
Address = ${address}
DNS = ${dnsServers}
MTU = 1280`;

        // مصرف IP و به‌روزرسانی موجودی
        let consumedIPv4 = null;
        let consumedIPv6 = null;
        
        if (ipType === 'ipv4' && countryInfo.ipv4 && countryInfo.ipv4.length > 0) {
            consumedIPv4 = countryInfo.ipv4.shift();
        }
        if (ipType === 'ipv6' && countryInfo.ipv6 && countryInfo.ipv6.length > 0) {
            consumedIPv6 = countryInfo.ipv6.shift();
        }
        
        const historyItem = {
            id: generateId(),
            type: 'wireguard',
            country: country,
            ipType: ipType,
            operator: operator,
            dns: dns,
            config: config,
            consumedIPv4: consumedIPv4,
            consumedIPv6: consumedIPv6,
            createdAt: new Date().toISOString()
        };

        if (env.DB) {
            // به‌روزرسانی موجودی کشورها در KV
            await env.DB.put('countries', JSON.stringify(countries));
            
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

            // Update country inventory in KV
            if (ipType === 'ipv4_ipv6') {
                // Remove consumed IPv4 from ipv4Country
                const ipv4Index = ipv4Country.ipv4.indexOf(usedIpv4);
                if (ipv4Index > -1) {
                    ipv4Country.ipv4.splice(ipv4Index, 1);
                }
                // Remove consumed IPv6s from ipv6Country
                usedIpv6.forEach(ip => {
                    const ipv6Index = ipv6Country.ipv6.indexOf(ip);
                    if (ipv6Index > -1) {
                        ipv6Country.ipv6.splice(ipv6Index, 1);
                    }
                });
                
                // Update both countries if different
                for (const c of countries) {
                    if (c.code === ipv4Country.code) {
                        c.ipv4 = ipv4Country.ipv4;
                    }
                    if (c.code === ipv6Country.code) {
                        c.ipv6 = ipv6Country.ipv6;
                    }
                }
            } else if (ipType === 'ipv4') {
                const ipIndex = countryInfo.ipv4.indexOf(usedIpv4);
                if (ipIndex > -1) {
                    countryInfo.ipv4.splice(ipIndex, 1);
                }
                const countryIndex = countries.findIndex(c => c.code === countryInfo.code);
                if (countryIndex > -1) {
                    countries[countryIndex].ipv4 = countryInfo.ipv4;
                }
            } else if (ipType === 'ipv6') {
                usedIpv6.forEach(ip => {
                    const ipIndex = countryInfo.ipv6.indexOf(ip);
                    if (ipIndex > -1) {
                        countryInfo.ipv6.splice(ipIndex, 1);
                    }
                });
                const countryIndex = countries.findIndex(c => c.code === countryInfo.code);
                if (countryIndex > -1) {
                    countries[countryIndex].ipv6 = countryInfo.ipv6;
                }
            }
            
            await env.DB.put('countries', JSON.stringify(countries));
        }

        // Prepare inventory info for response
        let inventoryInfo = {};
        if (ipType === 'ipv4_ipv6') {
            inventoryInfo = {
                ipv4Country: {
                    code: ipv4Country.code,
                    name: ipv4Country.name,
                    flag: ipv4Country.flag,
                    remaining: ipv4Country.ipv4.length
                },
                ipv6Country: {
                    code: ipv6Country.code,
                    name: ipv6Country.name,
                    flag: ipv6Country.flag,
                    remaining: ipv6Country.ipv6.length
                }
            };
        } else {
            inventoryInfo = {
                country: {
                    code: countryInfo.code,
                    name: countryInfo.name,
                    flag: countryInfo.flag,
                    remainingIPv4: countryInfo.ipv4?.length || 0,
                    remainingIPv6: countryInfo.ipv6?.length || 0
                }
            };
        }

        return new Response(JSON.stringify({
            success: true,
            config: config,
            country: countryInfo,
            ipv4Country: ipType === 'ipv4_ipv6' ? ipv4Country : null,
            ipv6Country: ipType === 'ipv4_ipv6' ? ipv6Country : null,
            ipType: ipType,
            operator: operator,
            dns: dns,
            inventory: inventoryInfo,
            consumedIPv4: usedIpv4,
            consumedIPv6: usedIpv6
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
    const bytes = new Uint8Array(32);
    crypto.getRandomValues(bytes);
    
    bytes[0] &= 248;
    bytes[31] &= 127;
    bytes[31] |= 64;
    
    const base64Chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
    let result = '';
    const len = bytes.length;
    for (let i = 0; i < len; i += 3) {
        const a = bytes[i];
        const b = i + 1 < len ? bytes[i + 1] : 0;
        const c = i + 2 < len ? bytes[i + 2] : 0;
        result += base64Chars[a >> 2];
        result += base64Chars[((a & 3) << 4) | (b >> 4)];
        result += base64Chars[((b & 15) << 2) | (c >> 6)];
        result += base64Chars[c & 63];
    }
    return result.slice(0, 43) + '=';
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
