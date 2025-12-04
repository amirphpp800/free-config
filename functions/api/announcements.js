
export async function onRequestGet(context) {
    const { env } = context;
    
    try {
        const announcements = await env.KV.get('announcements', 'json') || [];
        
        return Response.json({
            success: true,
            announcements: announcements.filter(a => a.active !== false)
        });
    } catch (error) {
        console.error('Error loading announcements:', error);
        return Response.json({
            success: true,
            announcements: []
        });
    }
}
