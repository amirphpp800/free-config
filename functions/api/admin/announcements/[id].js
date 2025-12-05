export async function onRequestDelete(context) {
    const { request, env, params } = context;

    try {
        const user = await getAuthUser(request, env);
        if (!user || !user.isAdmin) {
            return new Response(JSON.stringify({ error: 'دسترسی غیرمجاز' }), {
                status: 403,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        const { id } = params;

        if (env.DB) {
            let announcements = [];
            const announcementsData = await env.DB.get('announcements');
            if (announcementsData) {
                announcements = JSON.parse(announcementsData);
            }
            announcements = announcements.filter(a => a.id !== id);
            await env.DB.put('announcements', JSON.stringify(announcements));
        }

        return new Response(JSON.stringify({ 
            success: true,
            message: 'اعلان حذف شد'
        }), {
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Admin delete announcement error:', error);
        return new Response(JSON.stringify({ error: 'خطا در حذف اعلان' }), {
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
