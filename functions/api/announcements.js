export async function onRequestGet(context) {
    const { env } = context;

    try {
        let announcements = [];

        if (env.DB) {
            const announcementsData = await env.DB.get('announcements');
            if (announcementsData) {
                announcements = JSON.parse(announcementsData);
            }
        }

        return new Response(JSON.stringify({ announcements }), {
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Announcements error:', error);
        return new Response(JSON.stringify({ announcements: [] }), {
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
