
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

        const { code } = await request.json();

        if (!code || !code.trim()) {
            return new Response(JSON.stringify({ error: 'کد پرو الزامی است' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        let codes = [];
        if (env.DB) {
            const codesData = await env.DB.get('pro-codes');
            if (codesData) {
                codes = JSON.parse(codesData);
            }
        }

        const proCode = codes.find(c => c.code === code.trim().toUpperCase());

        if (!proCode) {
            return new Response(JSON.stringify({ error: 'کد پرو نامعتبر است' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        if (proCode.used) {
            return new Response(JSON.stringify({ error: 'این کد قبلاً استفاده شده است' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        proCode.used = true;
        proCode.usedBy = user.telegramId;
        proCode.usedAt = new Date().toISOString();

        const expiresAt = Date.now() + (proCode.duration * 24 * 60 * 60 * 1000);

        user.isPro = true;
        user.proExpiresAt = expiresAt;
        user.proActivatedAt = new Date().toISOString();

        if (env.DB) {
            await env.DB.put('pro-codes', JSON.stringify(codes));
            await env.DB.put(`user:${user.telegramId}`, JSON.stringify(user));
        }

        return new Response(JSON.stringify({ 
            success: true,
            user: {
                telegramId: user.telegramId,
                isPro: user.isPro,
                proExpiresAt: user.proExpiresAt,
                isAdmin: user.isAdmin
            }
        }), {
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Activate pro error:', error);
        return new Response(JSON.stringify({ error: 'خطا در فعال‌سازی کد پرو' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
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

    const user = JSON.parse(userData);
    
    if (user.isPro && user.proExpiresAt && user.proExpiresAt < Date.now()) {
        user.isPro = false;
        await env.DB.put(`user:${user.telegramId}`, JSON.stringify(user));
    }

    return user;
}
