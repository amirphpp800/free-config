function jsonResponse(data, status = 200) {
    return new Response(JSON.stringify(data), {
        status,
        headers: { 'Content-Type': 'application/json' }
    });
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

export async function onRequestGet(context) {
    const { request, env } = context;
    
    try {
        const user = await getAuthUser(request, env);
        if (!user?.isAdmin) {
            return jsonResponse({ error: 'دسترسی غیرمجاز' }, 403);
        }

        let countries = [];
        if (env.DB) {
            const countriesData = await env.DB.get('countries');
            if (countriesData) {
                countries = JSON.parse(countriesData);
            }
        }

        return jsonResponse({ countries });
    } catch (error) {
        console.error('Get countries error:', error);
        return jsonResponse({ error: error.message }, 500);
    }
}

export async function onRequestPut(context) {
    const { request, env } = context;
    
    try {
        const user = await getAuthUser(request, env);
        if (!user?.isAdmin) {
            return jsonResponse({ error: 'دسترسی غیرمجاز' }, 403);
        }

        const { countries } = await request.json();

        if (!Array.isArray(countries)) {
            return jsonResponse({ error: 'فرمت نامعتبر' }, 400);
        }

        const countriesWithFlags = countries.map(country => ({
            ...country,
            flag: `https://flagcdn.com/w320/${country.code.toLowerCase()}.png`,
            ipv4: removeDuplicates(country.ipv4 || []),
            ipv6: removeDuplicates(country.ipv6 || [])
        }));

        await env.DB.put('countries', JSON.stringify(countriesWithFlags));

        return jsonResponse({ 
            success: true,
            message: 'کشورها با موفقیت به‌روزرسانی شدند',
            countries: countriesWithFlags
        });
    } catch (error) {
        console.error('Update countries error:', error);
        return jsonResponse({ error: error.message }, 500);
    }
}

export async function onRequestPost(context) {
    const { request, env } = context;
    
    try {
        const user = await getAuthUser(request, env);
        if (!user?.isAdmin) {
            return jsonResponse({ error: 'دسترسی غیرمجاز' }, 403);
        }

        const { action, countryCode, addresses, addressType } = await request.json();

        let countries = [];
        if (env.DB) {
            const countriesData = await env.DB.get('countries');
            if (countriesData) {
                countries = JSON.parse(countriesData);
            }
        }

        if (action === 'addAddresses') {
            const countryIndex = countries.findIndex(c => c.code === countryCode);
            if (countryIndex === -1) {
                return jsonResponse({ error: 'کشور یافت نشد' }, 404);
            }

            const existingAddresses = countries[countryIndex][addressType] || [];
            const newAddresses = addresses.filter(addr => !existingAddresses.includes(addr));
            countries[countryIndex][addressType] = [...existingAddresses, ...newAddresses];
            
            await env.DB.put('countries', JSON.stringify(countries));
            return jsonResponse({ 
                success: true, 
                message: `${newAddresses.length} آدرس جدید اضافه شد`,
                addedCount: newAddresses.length,
                duplicatesRemoved: addresses.length - newAddresses.length
            });
        }

        if (action === 'removeAddresses') {
            const countryIndex = countries.findIndex(c => c.code === countryCode);
            if (countryIndex === -1) {
                return jsonResponse({ error: 'کشور یافت نشد' }, 404);
            }

            countries[countryIndex][addressType] = (countries[countryIndex][addressType] || [])
                .filter(addr => !addresses.includes(addr));
            
            await env.DB.put('countries', JSON.stringify(countries));
            return jsonResponse({ 
                success: true, 
                message: `${addresses.length} آدرس حذف شد`
            });
        }

        if (action === 'deleteCountry') {
            countries = countries.filter(c => c.code !== countryCode);
            await env.DB.put('countries', JSON.stringify(countries));
            return jsonResponse({ 
                success: true, 
                message: 'کشور با موفقیت حذف شد'
            });
        }

        return jsonResponse({ error: 'عملیات نامعتبر' }, 400);
    } catch (error) {
        console.error('Country action error:', error);
        return jsonResponse({ error: error.message }, 500);
    }
}

function removeDuplicates(arr) {
    return [...new Set(arr.filter(item => item && item.trim()))];
}
