
function generateToken(length = 32) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let token = '';
    const randomValues = new Uint8Array(length);
    crypto.getRandomValues(randomValues);
    for (let i = 0; i < length; i++) {
        token += chars[randomValues[i] % chars.length];
    }
    return token;
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
        const storedData = await env.KV.get(codeKey, 'json');
        
        if (!storedData) {
            return Response.json({ 
                success: false, 
                error: 'کد تایید منقضی شده است. لطفا دوباره درخواست کنید' 
            }, { status: 400 });
        }
        
        if (storedData.attempts >= 3) {
            await env.KV.delete(codeKey);
            return Response.json({ 
                success: false, 
                error: 'تعداد تلاش‌های مجاز تمام شد. لطفا دوباره درخواست کنید' 
            }, { status: 400 });
        }
        
        if (storedData.code !== code) {
            storedData.attempts++;
            await env.KV.put(codeKey, JSON.stringify(storedData), { expirationTtl: 300 });
            return Response.json({ 
                success: false, 
                error: 'کد تایید اشتباه است' 
            }, { status: 400 });
        }
        
        await env.KV.delete(codeKey);
        
        let user = await env.KV.get(`user:${telegramId}`, 'json');
        const isNewUser = !user;
        
        if (isNewUser) {
            user = {
                telegramId,
                createdAt: Date.now(),
                isAdmin: false,
                isVip: false,
                configCount: 0
            };
            await env.KV.put(`user:${telegramId}`, JSON.stringify(user));
            
            const usersList = await env.KV.get('users:list', 'json') || [];
            usersList.push(telegramId);
            await env.KV.put('users:list', JSON.stringify(usersList));
        }
        
        const token = generateToken();
        const session = {
            telegramId,
            isAdmin: user.isAdmin,
            isVip: user.isVip,
            createdAt: Date.now(),
            expiresAt: Date.now() + (7 * 24 * 60 * 60 * 1000)
        };
        
        await env.KV.put(`session:${token}`, JSON.stringify(session), {
            expirationTtl: 7 * 24 * 60 * 60
        });
        
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
