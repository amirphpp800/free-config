
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
        const usageKey = `usage:${user.telegramId}:${today}`;
        
        let usage = { wireguard: 0, dns: 0, limit: 3 };

        if (env.DB) {
            const usageData = await env.DB.get(usageKey);
            if (usageData) {
                usage = JSON.parse(usageData);
            }
            
            // Initialize resetTimestamp if not exists
            if (!usage.resetTimestamp) {
                usage.resetTimestamp = Date.now() + (24 * 60 * 60 * 1000);
                await env.DB.put(usageKey, JSON.stringify(usage), { expirationTtl: 86400 });
            }
        }

        // Add limit field
        usage.limit = 3;
        
        // Check if user is limited
        const isLimited = !user.isAdmin && (usage.wireguard >= 3 || usage.dns >= 3);
        usage.isLimited = isLimited;

        return new Response(JSON.stringify(usage), {
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Usage error:', error);
        return new Response(JSON.stringify({ error: 'خطا در دریافت مصرف' }), {
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
