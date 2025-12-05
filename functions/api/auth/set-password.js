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

        const { password } = await request.json();

        if (!password || password.length < 4) {
            return new Response(JSON.stringify({ error: 'رمز عبور باید حداقل ۴ کاراکتر باشد' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        const userKey = `user:${user.telegramId}`;
        user.password = await hashPassword(password);

        if (env.DB) {
            await env.DB.put(userKey, JSON.stringify(user));
        }

        return new Response(JSON.stringify({ 
            success: true,
            message: 'رمز عبور ذخیره شد'
        }), {
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Set password error:', error);
        return new Response(JSON.stringify({ error: 'خطا در ذخیره رمز عبور' }), {
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

    return JSON.parse(userData);
}

async function hashPassword(password) {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}
