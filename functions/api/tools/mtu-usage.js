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

export async function onRequestGet(context) {
    const { request, env } = context;

    try {
        const user = await getAuthUser(request, env);
        if (!user) {
            return new Response(JSON.stringify({ error: 'احراز هویت نشده' }), {
                status: 401,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                }
            });
        }

        const today = new Date().toISOString().split('T')[0];
        const usageKey = `mtu-usage:${user.telegramId}:${today}`;

        let usage = { singleTestCount: 0, autoTestCount: 0 };
        const limit = user.isPro ? 15 : 1;

        if (env.DB) {
            const usageData = await env.DB.get(usageKey);
            if (usageData) {
                try {
                    const parsed = JSON.parse(usageData);
                    usage.singleTestCount = parsed.singleTestCount || 0;
                    usage.autoTestCount = parsed.autoTestCount || 0;
                    usage.resetTimestamp = parsed.resetTimestamp;
                } catch (e) {
                    console.error('Error parsing usage data:', e);
                }
            }
        }

        if (!usage.resetTimestamp) {
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            tomorrow.setHours(0, 0, 0, 0);
            usage.resetTimestamp = tomorrow.getTime();
        }

        usage.limit = limit;
        usage.singleTestUsed = usage.singleTestCount >= limit;
        usage.autoTestUsed = usage.autoTestCount >= limit;

        return new Response(JSON.stringify(usage), {
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            }
        });

    } catch (error) {
        console.error('MTU usage error:', error);
        return new Response(JSON.stringify({ error: 'خطا در دریافت اطلاعات' }), {
            status: 500,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            }
        });
    }
}