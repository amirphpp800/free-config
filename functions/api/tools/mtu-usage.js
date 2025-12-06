
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

        const today = new Date().toISOString().split('T')[0];
        const usageKey = `mtu-usage:${user.telegramId}:${today}`;
        
        let usage = { singleTestUsed: false, autoTestUsed: false };

        if (env.DB) {
            const usageData = await env.DB.get(usageKey);
            if (usageData) {
                usage = JSON.parse(usageData);
            }
            
            if (!usage.resetTimestamp) {
                const now = Date.now();
                const tomorrow = new Date();
                tomorrow.setDate(tomorrow.getDate() + 1);
                tomorrow.setHours(0, 0, 0, 0);
                usage.resetTimestamp = tomorrow.getTime();
            }
            
            usage.resetTimer = Math.floor((usage.resetTimestamp - Date.now()) / 1000);
        }

        return new Response(JSON.stringify(usage), {
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('MTU usage error:', error);
        return new Response(JSON.stringify({ error: 'خطا در دریافت اطلاعات' }), {
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
