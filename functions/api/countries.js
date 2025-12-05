export async function onRequestGet(context) {
    const { env } = context;

    let countries = [];

    if (env.DB) {
        const countriesData = await env.DB.get('countries');
        if (countriesData) {
            countries = JSON.parse(countriesData);
        } else {
            // اگر دیتا وجود نداشت، مقادیر پیش‌فرض را ذخیره کن
            countries = [
                { code: 'DE', name: 'آلمان', flag: '🇩🇪', ipv4: [], ipv6: [] },
                { code: 'NL', name: 'هلند', flag: '🇳🇱', ipv4: [], ipv6: [] },
                { code: 'US', name: 'آمریکا', flag: '🇺🇸', ipv4: [], ipv6: [] },
                { code: 'UK', name: 'انگلیس', flag: '🇬🇧', ipv4: [], ipv6: [] },
                { code: 'FR', name: 'فرانسه', flag: '🇫🇷', ipv4: [], ipv6: [] }
            ];
            await env.DB.put('countries', JSON.stringify(countries));
        }
    }

    return new Response(JSON.stringify({ countries }), {
        headers: { 'Content-Type': 'application/json' }
    });
}