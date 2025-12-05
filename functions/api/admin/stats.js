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

        const today = new Date().toISOString().split('T')[0];
        
        let totalUsers = 0;
        let todayUsers = 0;
        let todayWireGuard = 0;
        let todayDNS = 0;
        let totalWireGuard = 0;
        let totalDNS = 0;

        if (env.DB) {
            const usersListData = await env.DB.get('users:list');
            if (usersListData) {
                const usersList = JSON.parse(usersListData);
                totalUsers = usersList.length;

                for (const telegramId of usersList) {
                    const userData = await env.DB.get(`user:${telegramId}`);
                    if (userData) {
                        const userInfo = JSON.parse(userData);
                        if (userInfo.createdAt?.startsWith(today)) {
                            todayUsers++;
                        }
                    }
                }
            }

            const todayStatsData = await env.DB.get(`stats:${today}`);
            if (todayStatsData) {
                const todayStats = JSON.parse(todayStatsData);
                todayWireGuard = todayStats.wireguard || 0;
                todayDNS = todayStats.dns || 0;
            }

            const totalStatsData = await env.DB.get('stats:total');
            if (totalStatsData) {
                const totalStats = JSON.parse(totalStatsData);
                totalWireGuard = totalStats.wireguard || 0;
                totalDNS = totalStats.dns || 0;
            }
        }

        return new Response(JSON.stringify({
            totalUsers,
            todayUsers,
            todayWireGuard,
            todayDNS,
            totalWireGuard,
            totalDNS
        }), {
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Admin stats error:', error);
        return new Response(JSON.stringify({ error: 'خطا در دریافت آمار' }), {
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
