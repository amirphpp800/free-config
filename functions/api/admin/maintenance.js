export async function onRequest(context) {
    const { request, env } = context;

    try {
        const authHeader = request.headers.get('Authorization');
        if (!authHeader?.startsWith('Bearer ')) {
            return new Response(JSON.stringify({ error: 'دسترسی غیرمجاز' }), { status: 401 });
        }

        const token = authHeader.slice(7);
        const telegramId = await env.DB.get(`token:${token}`);
        if (!telegramId) return new Response(JSON.stringify({ error: 'دسترسی غیرمجاز' }), { status: 401 });

        const userData = await env.DB.get(`user:${telegramId}`);
        const user = JSON.parse(userData);
        if (!user || !user.isAdmin) return new Response(JSON.stringify({ error: 'دسترسی غیرمجاز' }), { status: 403 });

        if (request.method === 'GET') {
            const maintenance = await env.DB.get('settings:maintenance');
            return new Response(JSON.stringify({ maintenance: maintenance === 'true' }));
        }

        if (request.method === 'POST') {
            const { maintenance } = await request.json();
            await env.DB.put('settings:maintenance', maintenance ? 'true' : 'false');
            return new Response(JSON.stringify({ success: true }));
        }

        return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 });

    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }
}
