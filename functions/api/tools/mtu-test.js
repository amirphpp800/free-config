
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

        const { testType } = await request.json();
        
        if (!['single', 'auto'].includes(testType)) {
            return new Response(JSON.stringify({ error: 'نوع تست نامعتبر است' }), {
                status: 400,
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

            const field = testType === 'single' ? 'singleTestUsed' : 'autoTestUsed';
            
            if (usage[field]) {
                const now = Date.now();
                const resetTimer = usage.resetTimestamp ? Math.floor((usage.resetTimestamp - now) / 1000) : 0;
                
                return new Response(JSON.stringify({ 
                    error: `شما امروز از این تست استفاده کرده‌اید`,
                    resetTimer
                }), {
                    status: 429,
                    headers: { 'Content-Type': 'application/json' }
                });
            }

            usage[field] = true;
            
            // Initialize resetTimestamp if not exists
            if (!usage.resetTimestamp) {
                const tomorrow = new Date();
                tomorrow.setDate(tomorrow.getDate() + 1);
                tomorrow.setHours(0, 0, 0, 0);
                usage.resetTimestamp = tomorrow.getTime();
            }

            // Save complete usage object including resetTimestamp
            await env.DB.put(usageKey, JSON.stringify(usage), { expirationTtl: 86400 });
        }

        return new Response(JSON.stringify({ success: true }), {
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('MTU test error:', error);
        return new Response(JSON.stringify({ error: 'خطا در ثبت تست' }), {
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
