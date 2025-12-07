
export async function onRequestGet(context) {
    const { request, env } = context;

    try {
        const user = await getAuthUser(request, env);
        if (!user || !user.isAdmin) {
            return new Response(JSON.stringify({ error: 'دسترسی غیرمجاز' }), {
                status: 403,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        let codes = [];
        if (env.DB) {
            const codesData = await env.DB.get('pro-codes');
            if (codesData) {
                codes = JSON.parse(codesData);
            }
        }

        return new Response(JSON.stringify({ codes }), {
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Get pro codes error:', error);
        return new Response(JSON.stringify({ error: 'خطا در دریافت کدها' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}

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

        const { action, code, duration, count } = await request.json();

        if (action === 'create') {
            const numCodes = count || 1;
            const days = duration || 30;
            
            let codes = [];
            if (env.DB) {
                const codesData = await env.DB.get('pro-codes');
                if (codesData) {
                    codes = JSON.parse(codesData);
                }
            }

            const newCodes = [];
            for (let i = 0; i < numCodes; i++) {
                const newCode = {
                    code: generateProCode(),
                    duration: days,
                    used: false,
                    usedBy: null,
                    usedAt: null,
                    createdAt: new Date().toISOString()
                };
                codes.push(newCode);
                newCodes.push(newCode);
            }

            if (env.DB) {
                await env.DB.put('pro-codes', JSON.stringify(codes));
            }

            return new Response(JSON.stringify({ 
                success: true,
                codes: newCodes
            }), {
                headers: { 'Content-Type': 'application/json' }
            });

        } else if (action === 'delete') {
            let codes = [];
            if (env.DB) {
                const codesData = await env.DB.get('pro-codes');
                if (codesData) {
                    codes = JSON.parse(codesData);
                }
            }

            codes = codes.filter(c => c.code !== code);

            if (env.DB) {
                await env.DB.put('pro-codes', JSON.stringify(codes));
            }

            return new Response(JSON.stringify({ success: true }), {
                headers: { 'Content-Type': 'application/json' }
            });
        }

        return new Response(JSON.stringify({ error: 'عملیات نامعتبر' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Pro codes error:', error);
        return new Response(JSON.stringify({ error: 'خطا در پردازش درخواست' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}

function generateProCode() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 16; i++) {
        if (i > 0 && i % 4 === 0) code += '-';
        code += chars[Math.floor(Math.random() * chars.length)];
    }
    return code;
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
