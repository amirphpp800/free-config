export async function onRequestGet(context) {
    const { env } = context;

    try {
        let countries = [];

        if (env.DB) {
            const countriesData = await env.DB.get('countries');
            if (countriesData) {
                countries = JSON.parse(countriesData);
            }
        }

        return new Response(JSON.stringify({ countries }), {
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Countries error:', error);
        return new Response(JSON.stringify({ countries: [] }), {
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
