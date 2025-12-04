import { crypto } from '@peculiar/webcrypto';

function generateToken(length = 32) {
    const array = new Uint8Array(length);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

export async function onRequestPost(context) {
    const { request, env } = context;

    try {
        const body = await request.json();
        const { telegramId, code } = body;

        if (!telegramId || !code) {
            return Response.json({ 
                success: false, 
                error: 'آیدی و کد تایید الزامی است' 
            }, { status: 400 });
        }

        const codeKey = `verify:${telegramId}`;
        const storedDataStr = await env.DB.get(codeKey);

        if (!storedDataStr) {
            return Response.json({ 
                success: false, 
                error: 'کد تایید منقضی شده است. لطفا دوباره درخواست کنید' 
            }, { status: 400 });
        }

        const storedData = JSON.parse(storedDataStr);

        if (storedData.attempts >= 3) {
            await env.DB.delete(codeKey);
            return Response.json({ 
                success: false, 
                error: 'تعداد تلاش‌های مجاز تمام شد. لطفا دوباره درخواست کنید' 
            }, { status: 400 });
        }

        if (storedData.code !== code) {
            storedData.attempts++;
            await env.DB.put(codeKey, JSON.stringify(storedData), { expirationTtl: 300 });
            return Response.json({ 
                success: false, 
                error: 'کد تایید اشتباه است' 
            }, { status: 400 });
        }

        await env.DB.delete(codeKey);

        const adminId = env.ADMIN_ID;
        const isAdmin = adminId && telegramId === adminId;

        let userStr = await env.DB.get(`user:${telegramId}`);
        let user;
        const isNewUser = !userStr;

        if (isNewUser) {
            user = {
                telegramId,
                createdAt: Date.now(),
                isAdmin: isAdmin,
                isVip: false,
                configCount: 0
            };

            await env.DB.put(`user:${telegramId}`, JSON.stringify(user));
        } else {
            user = JSON.parse(userStr);
            // به‌روزرسانی وضعیت ادمین در صورت تغییر ADMIN_ID
            if (user.isAdmin !== isAdmin) {
                user.isAdmin = isAdmin;
                await env.DB.put(`user:${telegramId}`, JSON.stringify(user));
            }
        }

        const token = generateToken();
        const session = {
            telegramId,
            isAdmin: user.isAdmin,
            isVip: user.isVip,
            createdAt: Date.now(),
            expiresAt: Date.now() + (7 * 24 * 60 * 60 * 1000)
        };

        await env.DB.put(`session:${token}`, JSON.stringify(session));

        return Response.json({ 
            success: true, 
            token,
            user: {
                telegramId: user.telegramId,
                isAdmin: user.isAdmin,
                isVip: user.isVip,
                isNewUser
            },
            message: isNewUser ? 'ثبت نام موفق' : 'ورود موفق'
        });
    } catch (error) {
        console.error('Verify error:', error);
        return Response.json({ 
            success: false, 
            error: 'خطای سرور' 
        }, { status: 500 });
    }
}
