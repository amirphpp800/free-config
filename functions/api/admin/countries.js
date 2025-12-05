export async function onRequestPut(context) {
    try {
        const { user } = context.data;
        if (!user?.isAdmin) {
            return jsonResponse({ error: 'دسترسی غیرمجاز' }, 403);
        }

        const { countries } = await context.request.json();

        if (!Array.isArray(countries)) {
            return jsonResponse({ error: 'فرمت نامعتبر' }, 400);
        }

        // افزودن URL پرچم با کیفیت برای هر کشور
        const countriesWithFlags = countries.map(country => ({
            ...country,
            flag: `https://flagcdn.com/w320/${country.code.toLowerCase()}.png`
        }));

        await context.env.DB.put('countries', JSON.stringify(countriesWithFlags));

        return jsonResponse({ 
            success: true,
            message: 'کشورها با موفقیت به‌روزرسانی شدند'
        });
    } catch (error) {
        return jsonResponse({ error: error.message }, 500);
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