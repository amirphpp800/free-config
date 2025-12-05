export async function onRequestPost(context) {
    const { request, env } = context;

    try {
        const { telegramId, password } = await request.json();

        if (!telegramId || !password) {
            return new Response(JSON.stringify({ error: 'اطلاعات ناقص است' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        const userKey = `user:${telegramId}`;
        let user = null;

        if (env.DB) {
            const userData = await env.DB.get(userKey);
            if (userData) {
                user = JSON.parse(userData);
            }
        }

        if (!user) {
            return new Response(JSON.stringify({ error: 'کاربر یافت نشد' }), {
                status: 404,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        if (!user.password) {
            return new Response(JSON.stringify({ error: 'رمز عبور تنظیم نشده است' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        const hashedPassword = await hashPassword(password);
        if (hashedPassword !== user.password) {
            return new Response(JSON.stringify({ error: 'رمز عبور اشتباه است' }), {
                status: 401,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        const token = generateToken(telegramId);

        if (env.DB) {
            await env.DB.put(`token:${token}`, telegramId, { expirationTtl: 86400 * 30 });
        }

        return new Response(JSON.stringify({
            success: true,
            token,
            user: {
                telegramId: user.telegramId,
                createdAt: user.createdAt,
                isAdmin: user.isAdmin
            }
        }), {
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Login error:', error);
        return new Response(JSON.stringify({ error: 'خطا در ورود' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}

function generateToken(telegramId) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let token = '';
    for (let i = 0; i < 64; i++) {
        token += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return `${telegramId}_${token}`;
}

async function hashPassword(password) {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}
