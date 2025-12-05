export async function onRequestPost(context) {
    const { request, env } = context;

    try {
        const { telegramId, code } = await request.json();

        if (!telegramId || !code) {
            return new Response(JSON.stringify({ error: 'اطلاعات ناقص است' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        const codeKey = `code:${telegramId}`;
        let storedCodeData = null;

        if (env.DB) {
            const codeData = await env.DB.get(codeKey);
            if (codeData) {
                storedCodeData = JSON.parse(codeData);
            }
        }

        if (!storedCodeData || storedCodeData.code !== code) {
            return new Response(JSON.stringify({ error: 'کد تایید نامعتبر است' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        if (Date.now() > storedCodeData.expiresAt) {
            return new Response(JSON.stringify({ error: 'کد تایید منقضی شده است' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        if (env.DB) {
            await env.DB.delete(codeKey);
        }

        const userKey = `user:${telegramId}`;
        let user = null;
        let isNewUser = false;

        if (env.DB) {
            const userData = await env.DB.get(userKey);
            if (userData) {
                user = JSON.parse(userData);
            }
        }

        if (!user) {
            isNewUser = true;
            const isAdmin = telegramId === env.ADMIN_ID;
            user = {
                id: telegramId,
                telegramId,
                createdAt: new Date().toISOString(),
                isAdmin,
                password: null
            };

            if (env.DB) {
                await env.DB.put(userKey, JSON.stringify(user));

                const usersListKey = 'users:list';
                let usersList = [];
                const usersListData = await env.DB.get(usersListKey);
                if (usersListData) {
                    usersList = JSON.parse(usersListData);
                }
                if (!usersList.includes(telegramId)) {
                    usersList.push(telegramId);
                    await env.DB.put(usersListKey, JSON.stringify(usersList));
                }
            }
        }

        const token = generateToken(telegramId);

        if (env.DB) {
            await env.DB.put(`token:${token}`, telegramId, { expirationTtl: 86400 * 30 });
        }

        return new Response(JSON.stringify({
            success: true,
            token,
            user: {
                telegramId: user.telegramId,
                createdAt: user.createdAt,
                isAdmin: user.isAdmin
            },
            isNewUser
        }), {
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Verify error:', error);
        return new Response(JSON.stringify({ error: 'خطا در تایید کد' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}

function generateToken(telegramId) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let token = '';
    for (let i = 0; i < 64; i++) {
        token += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return `${telegramId}_${token}`;
}
