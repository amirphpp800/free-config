
export async function onRequestGet(context) {
    const { request, env } = context;

    try {
        const user = await getAuthUser(request, env);
        if (!user || !user.isAdmin) {
            return new Response(JSON.stringify({ error: 'دسترسی غیرمجاز' }), {
                status: 403,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        const proUsers = [];

        if (env.DB) {
            const keys = await env.DB.list({ prefix: 'user:' });
            
            for (const key of keys.keys) {
                const userData = await env.DB.get(key.name);
                if (userData) {
                    const u = JSON.parse(userData);
                    if (u.isPro) {
                        proUsers.push({
                            telegramId: u.telegramId,
                            isPro: u.isPro,
                            proExpiresAt: u.proExpiresAt,
                            proActivatedAt: u.proActivatedAt
                        });
                    }
                }
            }
        }

        return new Response(JSON.stringify({ users: proUsers }), {
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Get pro users error:', error);
        return new Response(JSON.stringify({ error: 'خطا در دریافت کاربران' }), {
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
