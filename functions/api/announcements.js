export async function onRequestGet(context) {
    const { env } = context;

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
}