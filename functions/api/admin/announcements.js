export async function onRequestPost(context) {
    const { request, env } = context;

    try {
        const user = await getAuthUser(request, env);
        if (!user || !user.isAdmin) {
            return new Response(JSON.stringify({ error: 'دسترسی غیرمجاز' }), {
                status: 403,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        const { text } = await request.json();

        if (!text || !text.trim()) {
            return new Response(JSON.stringify({ error: 'متن اعلان الزامی است' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        const announcement = {
            id: generateId(),
            text: text.trim(),
            createdAt: new Date().toISOString()
        };

        if (env.DB) {
            let announcements = [];
            const announcementsData = await env.DB.get('announcements');
            if (announcementsData) {
                announcements = JSON.parse(announcementsData);
            }
            announcements.unshift(announcement);
            await env.DB.put('announcements', JSON.stringify(announcements));
        }

        return new Response(JSON.stringify({ 
            success: true,
            announcement
        }), {
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Admin announcement error:', error);
        return new Response(JSON.stringify({ error: 'خطا در ذخیره اعلان' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}

function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
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
