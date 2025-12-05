export async function onRequestGet(context) {
    const { env } = context;

    let announcements = [];

    if (env.DB) {
        const announcementsData = await env.DB.get('announcements');
        if (announcementsData) {
            announcements = JSON.parse(announcementsData);
        } else {
            // اگر دیتا وجود نداشت، مقادیر پیش‌فرض را ذخیره کن
            announcements = [
                {
                    id: '1',
                    title: '🎉 خوش آمدید',
                    content: 'به سرویس کانفیگ رایگان خوش آمدید! هر روز 3 کانفیگ رایگان دریافت کنید.',
                    createdAt: new Date().toISOString()
                }
            ];
            await env.DB.put('announcements', JSON.stringify(announcements));
        }
    }

    return new Response(JSON.stringify({ announcements }), {
        headers: { 'Content-Type': 'application/json' }
    });
}