
const CORS_HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Content-Type': 'application/json'
};

function jsonResponse(data, status = 200) {
    return new Response(JSON.stringify(data), {
        status,
        headers: CORS_HEADERS
    });
}

function errorResponse(message, status = 400) {
    return jsonResponse({ error: message }, status);
}

function generateCode() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

async function hashCode(code) {
    const encoder = new TextEncoder();
    const data = encoder.encode(code);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

async function sendTelegramMessage(botToken, chatId, text) {
    const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
    
    const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            chat_id: chatId,
            text: text,
            parse_mode: 'HTML'
        })
    });

    return response.json();
}

async function getSession(env, token) {
    if (!token || !env.DB) return null;
    
    const sessionData = await env.DB.get(`session:${token}`);
    if (!sessionData) return null;
    
    const session = JSON.parse(sessionData);
    if (session.expiresAt < Date.now()) {
        await env.DB.delete(`session:${token}`);
        return null;
    }
    
    return session;
}

async function getUserLimits(env, telegramId) {
    const today = new Date().toISOString().split('T')[0];
    const key = `limits:${telegramId}:${today}`;
    
    const data = await env.DB.get(key);
    if (!data) {
        return { wireguard: 0, dns: 0 };
    }
    
    return JSON.parse(data);
}

async function incrementLimit(env, telegramId, type) {
    const today = new Date().toISOString().split('T')[0];
    const key = `limits:${telegramId}:${today}`;
    
    const limits = await getUserLimits(env, telegramId);
    limits[type] = (limits[type] || 0) + 1;
    
    await env.DB.put(key, JSON.stringify(limits), { 
        expirationTtl: 86400 * 2
    });
    
    return limits;
}

export async function onRequest(context) {
    const { request, env } = context;
    const url = new URL(request.url);
    const path = url.pathname;
    
    if (request.method === 'OPTIONS') {
        return new Response(null, { headers: CORS_HEADERS });
    }

    try {
        if (path === '/api/auth/request' && request.method === 'POST') {
            return await handleAuthRequest(request, env);
        }
        
        if (path === '/api/auth/verify' && request.method === 'POST') {
            return await handleAuthVerify(request, env);
        }
        
        if (path === '/api/admin/auth/request' && request.method === 'POST') {
            return await handleAdminAuthRequest(request, env);
        }
        
        if (path === '/api/admin/auth/verify' && request.method === 'POST') {
            return await handleAdminAuthVerify(request, env);
        }
        
        if (path === '/api/countries' && request.method === 'GET') {
            return await handleGetCountries(request, env);
        }
        
        if (path === '/api/user/limits' && request.method === 'GET') {
            return await handleGetUserLimits(request, env);
        }
        
        if (path === '/api/config/generate' && request.method === 'POST') {
            return await handleGenerateConfig(request, env);
        }
        
        if (path === '/api/dns/generate' && request.method === 'POST') {
            return await handleGenerateDns(request, env);
        }
        
        if (path === '/api/admin/countries' && request.method === 'POST') {
            return await handleAddCountry(request, env);
        }
        
        if (path === '/api/admin/countries' && request.method === 'GET') {
            return await handleGetAllCountries(request, env);
        }
        
        if (path.startsWith('/api/admin/countries/') && request.method === 'DELETE') {
            const countryId = path.split('/').pop();
            return await handleDeleteCountry(request, env, countryId);
        }

        if (path === '/api/announcements' && request.method === 'GET') {
            return await handleGetAnnouncements(request, env);
        }

        if (path === '/api/admin/announcements' && request.method === 'POST') {
            return await handlePublishAnnouncement(request, env);
        }

        if (path === '/api/admin/announcements' && request.method === 'GET') {
            return await handleGetAllAnnouncements(request, env);
        }

        if (path.startsWith('/api/admin/announcements/') && request.method === 'DELETE') {
            const announcementId = path.split('/').pop();
            return await handleDeleteAnnouncement(request, env, announcementId);
        }

        if (path === '/api/admin/system-status' && request.method === 'GET') {
            return await handleSystemStatus(request, env);
        }

        return errorResponse('Not Found', 404);
        
    } catch (error) {
        console.error('API Error:', error);
        return errorResponse('Internal Server Error', 500);
    }
}

async function handleAuthRequest(request, env) {
    const body = await request.json();
    const { telegramId } = body;

    if (!telegramId || !/^\d{5,15}$/.test(telegramId)) {
        return errorResponse('شناسه تلگرام نامعتبر است');
    }

    const rateLimitKey = `ratelimit:${telegramId}`;
    if (env.DB) {
        const rateLimit = await env.DB.get(rateLimitKey);
        if (rateLimit) {
            const data = JSON.parse(rateLimit);
            if (data.count >= 5 && Date.now() < data.resetAt) {
                return errorResponse('تعداد درخواست‌های شما زیاد است. لطفا کمی صبر کنید.', 429);
            }
        }
    }

    const code = generateCode();
    const codeHash = await hashCode(code);
    const expiresAt = Date.now() + (5 * 60 * 1000);

    if (env.DB) {
        await env.DB.put(`verification:${telegramId}`, JSON.stringify({
            codeHash,
            expiresAt,
            attempts: 0
        }), { expirationTtl: 300 });

        const rateData = { count: 1, resetAt: Date.now() + (60 * 60 * 1000) };
        const existing = await env.DB.get(rateLimitKey);
        if (existing) {
            const data = JSON.parse(existing);
            if (Date.now() < data.resetAt) {
                rateData.count = data.count + 1;
                rateData.resetAt = data.resetAt;
            }
        }
        await env.DB.put(rateLimitKey, JSON.stringify(rateData), { expirationTtl: 3600 });
    }

    const message = `🔐 <b>کد تایید سرویس گیمینگ</b>\n\nکد تایید شما: <code>${code}</code>\n\nاین کد 5 دقیقه اعتبار دارد.\n\n📢 کانال ما: @ROOTLeaker`;
    
    const botToken = env.BOT_TOKEN;
    
    if (!botToken) {
        console.log(`[DEV MODE] کد تایید برای ${telegramId}: ${code}`);
        return jsonResponse({ 
            success: true, 
            message: 'کد تایید ارسال شد (حالت توسعه - لاگ سرور را بررسی کنید)',
            devCode: code
        });
    }
    
    const result = await sendTelegramMessage(botToken, telegramId, message);
    
    if (!result.ok) {
        console.error('Telegram API Error:', result);
        return errorResponse('ارسال کد ناموفق بود. ابتدا به ربات @jojo85_robot پیام دهید و دستور /start را ارسال کنید.', 400);
    }

    return jsonResponse({ 
        success: true, 
        message: 'کد تایید به تلگرام شما ارسال شد' 
    });
}

async function handleAuthVerify(request, env) {
    const body = await request.json();
    const { telegramId, code } = body;

    if (!telegramId || !code || code.length !== 6) {
        return errorResponse('درخواست نامعتبر');
    }

    let storedData = null;
    
    if (env.DB) {
        const stored = await env.DB.get(`verification:${telegramId}`);
        if (!stored) {
            return errorResponse('کد تایید منقضی شده یا یافت نشد');
        }
        storedData = JSON.parse(stored);
    } else {
        return errorResponse('دیتابیس در دسترس نیست');
    }

    if (Date.now() > storedData.expiresAt) {
        await env.DB.delete(`verification:${telegramId}`);
        return errorResponse('کد تایید منقضی شده است');
    }

    if (storedData.attempts >= 3) {
        await env.DB.delete(`verification:${telegramId}`);
        return errorResponse('تلاش‌های ناموفق زیاد. لطفا کد جدید درخواست کنید.');
    }

    const submittedHash = await hashCode(code);
    
    if (submittedHash !== storedData.codeHash) {
        storedData.attempts += 1;
        await env.DB.put(`verification:${telegramId}`, JSON.stringify(storedData), { 
            expirationTtl: Math.floor((storedData.expiresAt - Date.now()) / 1000) 
        });
        return errorResponse('کد تایید اشتباه است');
    }

    await env.DB.delete(`verification:${telegramId}`);

    const sessionToken = crypto.randomUUID();
    const sessionData = {
        telegramId,
        createdAt: Date.now(),
        expiresAt: Date.now() + (24 * 60 * 60 * 1000)
    };
    
    await env.DB.put(`session:${sessionToken}`, JSON.stringify(sessionData), { 
        expirationTtl: 86400 
    });

    return jsonResponse({
        success: true,
        token: sessionToken,
        telegramId,
        createdAt: sessionData.createdAt
    });
}

async function handleGetCountries(request, env) {
    const token = request.headers.get('Authorization')?.replace('Bearer ', '');
    const session = await getSession(env, token);
    
    if (!session) {
        return errorResponse('احراز هویت نشده', 401);
    }

    const countriesData = await env.DB.get('countries:list');
    const countries = countriesData ? JSON.parse(countriesData) : [];
    
    return jsonResponse({ countries });
}

async function handleGetUserLimits(request, env) {
    const token = request.headers.get('Authorization')?.replace('Bearer ', '');
    const session = await getSession(env, token);
    
    if (!session) {
        return errorResponse('احراز هویت نشده', 401);
    }

    const limits = await getUserLimits(env, session.telegramId);
    
    return jsonResponse({
        wireguardRemaining: Math.max(0, 3 - (limits.wireguard || 0)),
        dnsRemaining: Math.max(0, 3 - (limits.dns || 0)),
        wireguardUsed: limits.wireguard || 0,
        dnsUsed: limits.dns || 0
    });
}

async function handleGenerateConfig(request, env) {
    const token = request.headers.get('Authorization')?.replace('Bearer ', '');
    const session = await getSession(env, token);
    
    if (!session) {
        return errorResponse('احراز هویت نشده', 401);
    }

    const limits = await getUserLimits(env, session.telegramId);
    if ((limits.wireguard || 0) >= 3) {
        return errorResponse('محدودیت روزانه شما تمام شده است', 429);
    }

    const body = await request.json();
    const { locationId, dnsType = 'both', primaryDns = '1.1.1.1', operator = 'irancell' } = body;

    const countriesData = await env.DB.get('countries:list');
    const countries = countriesData ? JSON.parse(countriesData) : [];
    const location = countries.find(c => c.id === locationId);

    if (!location) {
        return errorResponse('کشور یافت نشد');
    }

    const operators = {
        irancell: {
            title: "ایرانسل",
            addresses: ["2.144.0.0/16"],
            addressesV6: ["2a01:5ec0:1000::1/128", "2a01:5ec0:1000::2/128"]
        },
        mci: {
            title: "همراه اول",
            addresses: ["5.52.0.0/16"],
            addressesV6: ["2a02:4540::1/128", "2a02:4540::2/128"]
        },
        tci: {
            title: "مخابرات",
            addresses: ["2.176.0.0/15", "2.190.0.0/15"],
            addressesV6: ["2a04:2680:13::1/128", "2a04:2680:13::2/128"]
        },
        rightel: {
            title: "رایتل",
            addresses: ["37.137.128.0/17", "95.162.0.0/17"],
            addressesV6: ["2a03:ef42::1/128", "2a03:ef42::2/128"]
        },
        shatel: {
            title: "شاتل موبایل",
            addresses: ["94.182.0.0/16", "37.148.0.0/18"],
            addressesV6: ["2a0e::1/128", "2a0e::2/128"]
        }
    };

    const selectedOperator = operators[operator] || operators.irancell;
    
    let address = selectedOperator.addresses[0];
    if (dnsType === 'ipv6') {
        address = selectedOperator.addressesV6[0];
    } else if (dnsType === 'both') {
        address = selectedOperator.addresses[0] + ', ' + selectedOperator.addressesV6[0];
    }

    let locationDns = [];
    if (dnsType === 'ipv4' || dnsType === 'both') {
        locationDns = locationDns.concat(location.dns.ipv4 || []);
    }
    if (dnsType === 'ipv6' || dnsType === 'both') {
        locationDns = locationDns.concat(location.dns.ipv6 || []);
    }

    const dnsServers = [primaryDns];
    if (locationDns.length > 0) {
        dnsServers.push(locationDns[0]);
    }

    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    const privateKey = btoa(String.fromCharCode.apply(null, array));

    const config = `[Interface]
# تولید شده توسط سرویس VPN
# مکان: ${location.name} (${location.city})
# اپراتور: ${selectedOperator.title}
PrivateKey = ${privateKey}
Address = ${address}
DNS = ${dnsServers.join(', ')}`;

    await incrementLimit(env, session.telegramId, 'wireguard');

    return jsonResponse({
        success: true,
        config,
        location: location.name
    });
}

async function handleGenerateDns(request, env) {
    const token = request.headers.get('Authorization')?.replace('Bearer ', '');
    const session = await getSession(env, token);
    
    if (!session) {
        return errorResponse('احراز هویت نشده', 401);
    }

    const limits = await getUserLimits(env, session.telegramId);
    if ((limits.dns || 0) >= 3) {
        return errorResponse('محدودیت روزانه شما تمام شده است', 429);
    }

    const body = await request.json();
    const { locationId, dnsType = 'both' } = body;

    const countriesData = await env.DB.get('countries:list');
    const countries = countriesData ? JSON.parse(countriesData) : [];
    const location = countries.find(c => c.id === locationId);

    if (!location) {
        return errorResponse('کشور یافت نشد');
    }

    let dns = [];
    if (dnsType === 'ipv4' || dnsType === 'both') {
        dns = dns.concat(location.dns.ipv4 || []);
    }
    if (dnsType === 'ipv6' || dnsType === 'both') {
        dns = dns.concat(location.dns.ipv6 || []);
    }

    await incrementLimit(env, session.telegramId, 'dns');

    return jsonResponse({
        success: true,
        dns,
        location: location.name
    });
}

async function handleAdminAuthRequest(request, env) {
    const body = await request.json();
    const { telegramId } = body;

    if (!telegramId || telegramId !== env.ADMIN_ID) {
        return errorResponse('شناسه تلگرام نامعتبر است یا دسترسی ادمین ندارید');
    }

    const rateLimitKey = `admin_ratelimit:${telegramId}`;
    if (env.DB) {
        const rateLimit = await env.DB.get(rateLimitKey);
        if (rateLimit) {
            const data = JSON.parse(rateLimit);
            if (data.count >= 3 && Date.now() < data.resetAt) {
                return errorResponse('تعداد درخواست‌های شما زیاد است. لطفا کمی صبر کنید.', 429);
            }
        }
    }

    const code = generateCode();
    const codeHash = await hashCode(code);
    const expiresAt = Date.now() + (5 * 60 * 1000);

    if (env.DB) {
        await env.DB.put(`admin_verification:${telegramId}`, JSON.stringify({
            codeHash,
            expiresAt,
            attempts: 0
        }), { expirationTtl: 300 });

        const rateData = { count: 1, resetAt: Date.now() + (60 * 60 * 1000) };
        const existing = await env.DB.get(rateLimitKey);
        if (existing) {
            const data = JSON.parse(existing);
            if (Date.now() < data.resetAt) {
                rateData.count = data.count + 1;
                rateData.resetAt = data.resetAt;
            }
        }
        await env.DB.put(rateLimitKey, JSON.stringify(rateData), { expirationTtl: 3600 });
    }

    const message = `🔐 <b>کد تایید پنل مدیریت</b>\n\nکد تایید شما: <code>${code}</code>\n\nاین کد 5 دقیقه اعتبار دارد.\n\n⚠️ این کد برای دسترسی به پنل مدیریت است.`;
    
    const botToken = env.BOT_TOKEN;
    
    if (!botToken) {
        console.log(`[DEV MODE] کد تایید ادمین برای ${telegramId}: ${code}`);
        return jsonResponse({ 
            success: true, 
            message: 'کد تایید ارسال شد (حالت توسعه - لاگ سرور را بررسی کنید)',
            devCode: code
        });
    }
    
    const result = await sendTelegramMessage(botToken, telegramId, message);
    
    if (!result.ok) {
        console.error('Telegram API Error:', result);
        return errorResponse('ارسال کد ناموفق بود. ابتدا به ربات @jojo85_robot پیام دهید و دستور /start را ارسال کنید.', 400);
    }

    return jsonResponse({ 
        success: true, 
        message: 'کد تایید به تلگرام شما ارسال شد' 
    });
}

async function handleAdminAuthVerify(request, env) {
    const body = await request.json();
    const { telegramId, code } = body;

    if (!telegramId || !code || code.length !== 6 || telegramId !== env.ADMIN_ID) {
        return errorResponse('درخواست نامعتبر یا دسترسی ادمین ندارید');
    }

    let storedData = null;
    
    if (env.DB) {
        const stored = await env.DB.get(`admin_verification:${telegramId}`);
        if (!stored) {
            return errorResponse('کد تایید منقضی شده یا یافت نشد');
        }
        storedData = JSON.parse(stored);
    } else {
        return errorResponse('دیتابیس در دسترس نیست');
    }

    if (Date.now() > storedData.expiresAt) {
        await env.DB.delete(`admin_verification:${telegramId}`);
        return errorResponse('کد تایید منقضی شده است');
    }

    if (storedData.attempts >= 3) {
        await env.DB.delete(`admin_verification:${telegramId}`);
        return errorResponse('تلاش‌های ناموفق زیاد. لطفا کد جدید درخواست کنید.');
    }

    const submittedHash = await hashCode(code);
    
    if (submittedHash !== storedData.codeHash) {
        storedData.attempts += 1;
        await env.DB.put(`admin_verification:${telegramId}`, JSON.stringify(storedData), { 
            expirationTtl: Math.floor((storedData.expiresAt - Date.now()) / 1000) 
        });
        return errorResponse('کد تایید اشتباه است');
    }

    await env.DB.delete(`admin_verification:${telegramId}`);

    const sessionToken = crypto.randomUUID();
    const sessionData = {
        telegramId,
        isAdmin: true,
        createdAt: Date.now(),
        expiresAt: Date.now() + (2 * 60 * 60 * 1000)
    };
    
    await env.DB.put(`admin_session:${sessionToken}`, JSON.stringify(sessionData), { 
        expirationTtl: 7200 
    });

    return jsonResponse({
        success: true,
        token: sessionToken,
        telegramId,
        isAdmin: true,
        createdAt: sessionData.createdAt
    });
}

async function getAdminSession(env, token) {
    if (!token || !env.DB) return null;
    
    const sessionData = await env.DB.get(`admin_session:${token}`);
    if (!sessionData) return null;
    
    const session = JSON.parse(sessionData);
    if (session.expiresAt < Date.now()) {
        await env.DB.delete(`admin_session:${token}`);
        return null;
    }
    
    if (!session.isAdmin || session.telegramId !== env.ADMIN_ID) {
        return null;
    }
    
    return session;
}

async function handleAddCountry(request, env) {
    const token = request.headers.get('Authorization')?.replace('Bearer ', '');
    const session = await getAdminSession(env, token);
    
    if (!session) {
        return errorResponse('دسترسی غیرمجاز - لطفا وارد پنل مدیریت شوید', 403);
    }

    const body = await request.json();
    const { id, name, city, flagUrl, dns, endpoint, latency } = body;

    if (!id || !name || !city || !flagUrl) {
        return errorResponse('اطلاعات ناقص است');
    }

    const countriesData = await env.DB.get('countries:list');
    const countries = countriesData ? JSON.parse(countriesData) : [];

    const exists = countries.find(c => c.id === id);
    if (exists) {
        return errorResponse('این کشور قبلا ثبت شده است');
    }

    const newCountry = {
        id, 
        name, 
        city, 
        flagUrl, 
        dns: dns || { ipv4: [], ipv6: [] }, 
        endpoint: endpoint || '', 
        latency: latency || '~0ms'
    };

    countries.push(newCountry);

    await env.DB.put('countries:list', JSON.stringify(countries));

    return jsonResponse({
        success: true,
        message: 'کشور با موفقیت اضافه شد',
        country: newCountry
    });
}

async function handleGetAllCountries(request, env) {
    const token = request.headers.get('Authorization')?.replace('Bearer ', '');
    const session = await getAdminSession(env, token);
    
    if (!session) {
        return errorResponse('دسترسی غیرمجاز - لطفا وارد پنل مدیریت شوید', 403);
    }

    const countriesData = await env.DB.get('countries:list');
    const countries = countriesData ? JSON.parse(countriesData) : [];
    
    return jsonResponse({ 
        success: true,
        countries 
    });
}

async function handleDeleteCountry(request, env, countryId) {
    const token = request.headers.get('Authorization')?.replace('Bearer ', '');
    const session = await getAdminSession(env, token);
    
    if (!session) {
        return errorResponse('دسترسی غیرمجاز - لطفا وارد پنل مدیریت شوید', 403);
    }

    const countriesData = await env.DB.get('countries:list');
    const countries = countriesData ? JSON.parse(countriesData) : [];

    const filtered = countries.filter(c => c.id !== countryId);

    if (filtered.length === countries.length) {
        return errorResponse('کشور یافت نشد');
    }

    await env.DB.put('countries:list', JSON.stringify(filtered));

    return jsonResponse({
        success: true,
        message: 'کشور حذف شد'
    });
}

async function handleGetAnnouncements(request, env) {
    const token = request.headers.get('Authorization')?.replace('Bearer ', '');
    const session = await getSession(env, token);
    
    if (!session) {
        return errorResponse('احراز هویت نشده', 401);
    }

    const announcementsData = await env.DB.get('announcements:list');
    const announcements = announcementsData ? JSON.parse(announcementsData) : [];
    
    const sortedAnnouncements = announcements.sort((a, b) => b.createdAt - a.createdAt);
    
    return jsonResponse({ 
        success: true,
        announcements: sortedAnnouncements 
    });
}

async function handlePublishAnnouncement(request, env) {
    const token = request.headers.get('Authorization')?.replace('Bearer ', '');
    const session = await getAdminSession(env, token);
    
    if (!session) {
        return errorResponse('دسترسی غیرمجاز - لطفا وارد پنل مدیریت شوید', 403);
    }

    const body = await request.json();
    const { title, message, type = 'info' } = body;

    if (!title || !message) {
        return errorResponse('عنوان و متن اعلان الزامی است');
    }

    const announcementsData = await env.DB.get('announcements:list');
    const announcements = announcementsData ? JSON.parse(announcementsData) : [];

    const newAnnouncement = {
        id: crypto.randomUUID(),
        title,
        message,
        type,
        createdAt: Date.now()
    };

    announcements.push(newAnnouncement);

    await env.DB.put('announcements:list', JSON.stringify(announcements));

    return jsonResponse({
        success: true,
        message: 'اعلان با موفقیت منتشر شد',
        announcement: newAnnouncement
    });
}

async function handleGetAllAnnouncements(request, env) {
    const token = request.headers.get('Authorization')?.replace('Bearer ', '');
    const session = await getAdminSession(env, token);
    
    if (!session) {
        return errorResponse('دسترسی غیرمجاز - لطفا وارد پنل مدیریت شوید', 403);
    }

    const announcementsData = await env.DB.get('announcements:list');
    const announcements = announcementsData ? JSON.parse(announcementsData) : [];
    
    const sortedAnnouncements = announcements.sort((a, b) => b.createdAt - a.createdAt);
    
    return jsonResponse({ 
        success: true,
        announcements: sortedAnnouncements 
    });
}

async function handleDeleteAnnouncement(request, env, announcementId) {
    const token = request.headers.get('Authorization')?.replace('Bearer ', '');
    const session = await getAdminSession(env, token);
    
    if (!session) {
        return errorResponse('دسترسی غیرمجاز - لطفا وارد پنل مدیریت شوید', 403);
    }

    const announcementsData = await env.DB.get('announcements:list');
    const announcements = announcementsData ? JSON.parse(announcementsData) : [];

    const filtered = announcements.filter(a => a.id !== announcementId);

    if (filtered.length === announcements.length) {
        return errorResponse('اعلان یافت نشد');
    }

    await env.DB.put('announcements:list', JSON.stringify(filtered));

    return jsonResponse({
        success: true,
        message: 'اعلان حذف شد'
    });
}

async function handleSystemStatus(request, env) {
    const token = request.headers.get('Authorization')?.replace('Bearer ', '');
    const session = await getAdminSession(env, token);
    
    if (!session) {
        return errorResponse('دسترسی غیرمجاز - لطفا وارد پنل مدیریت شوید', 403);
    }

    let kvStatus = 'disconnected';
    let kvMessage = 'عدم اتصال';
    
    try {
        await env.DB.put('health_check', 'ok', { expirationTtl: 60 });
        const test = await env.DB.get('health_check');
        if (test === 'ok') {
            kvStatus = 'connected';
            kvMessage = 'متصل و فعال';
        }
    } catch (error) {
        kvMessage = `خطا: ${error.message}`;
    }

    let botStatus = 'disconnected';
    let botMessage = 'توکن تنظیم نشده';
    
    if (env.BOT_TOKEN) {
        try {
            const response = await fetch(`https://api.telegram.org/bot${env.BOT_TOKEN}/getMe`);
            const data = await response.json();
            
            if (data.ok) {
                botStatus = 'connected';
                botMessage = `متصل - ربات: @${data.result.username}`;
            } else {
                botStatus = 'error';
                botMessage = `خطا: ${data.description || 'توکن نامعتبر'}`;
            }
        } catch (error) {
            botStatus = 'error';
            botMessage = `خطا در اتصال: ${error.message}`;
        }
    }

    return jsonResponse({
        success: true,
        kv: {
            status: kvStatus,
            message: kvMessage
        },
        bot: {
            status: botStatus,
            message: botMessage
        },
        timestamp: Date.now()
    });
}
