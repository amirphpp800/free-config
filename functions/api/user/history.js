export async function onRequestGet(context) {
    const { request, env } = context;

    try {
        const user = await getAuthUser(request, env);
        if (!user) {
            return new Response(JSON.stringify({ error: 'احراز هویت نشده' }), {
                status: 401,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        const historyKey = `history:${user.telegramId}`;
        let history = [];

        if (env.DB) {
            const historyData = await env.DB.get(historyKey);
            if (historyData) {
                history = JSON.parse(historyData);
            }
        }

        history.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        return new Response(JSON.stringify({ history }), {
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('History error:', error);
        return new Response(JSON.stringify({ error: 'خطا در دریافت تاریخچه' }), {
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
