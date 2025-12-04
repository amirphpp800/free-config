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

function generateVerifyCode() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

async function sendTelegramMessage(botToken, chatId, text, replyMarkup = null) {
    const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
    const body = {
        chat_id: chatId,
        text: text,
        parse_mode: 'HTML'
    };
    
    if (replyMarkup) {
        body.reply_markup = replyMarkup;
    }
    
    const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
    });
    
    return response.json();
}

export async function onRequestPost(context) {
    const { request, env } = context;
    const url = new URL(request.url);
    const path = url.pathname.replace('/api/auth/', '');
    
    try {
        const body = await request.json();
        
        switch (path) {
            case 'send-code': {
                const { telegramId } = body;
                
                if (!telegramId || !/^\d{5,15}$/.test(telegramId)) {
                    return Response.json({ 
                        success: false, 
                        error: 'آیدی عددی تلگرام نامعتبر است' 
                    }, { status: 400 });
                }
                
                const code = generateVerifyCode();
                const codeKey = `verify:${telegramId}`;
                
                await env.KV.put(codeKey, JSON.stringify({
                    code,
                    createdAt: Date.now(),
                    attempts: 0
                }), { expirationTtl: 300 });
                
                const botToken = env.BOT_TOKEN;
                if (!botToken) {
                    return Response.json({ 
                        success: false, 
                        error: 'توکن ربات تنظیم نشده است' 
                    }, { status: 500 });
                }
                
                const message = `🔐 <b>کد تایید حساب کاربری</b>\n\n` +
                    `کد تایید شما: <code>${code}</code>\n\n` +
                    `⏱ این کد تا ۵ دقیقه معتبر است.\n` +
                    `⚠️ این کد را در اختیار کسی قرار ندهید.`;
                
                const result = await sendTelegramMessage(botToken, telegramId, message);
                
                if (!result.ok) {
                    return Response.json({ 
                        success: false, 
                        error: 'ارسال کد به تلگرام ناموفق بود. آیا ربات را استارت کرده‌اید؟' 
                    }, { status: 400 });
                }
                
                return Response.json({ 
                    success: true, 
                    message: 'کد تایید به تلگرام شما ارسال شد' 
                });
            }
            
            case 'verify':
            case 'register': {
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
            }
            
            case 'logout': {
                const authHeader = request.headers.get('Authorization');
                const token = authHeader?.replace('Bearer ', '');
                
                if (token) {
                    await env.KV.delete(`session:${token}`);
                }
                
                return Response.json({ success: true, message: 'خروج موفق' });
            }
            
            default:
                return Response.json({ 
                    success: false, 
                    error: 'مسیر نامعتبر' 
                }, { status: 404 });
        }
    } catch (error) {
        console.error('Auth error:', error);
        return Response.json({ 
            success: false, 
            error: 'خطای سرور' 
        }, { status: 500 });
    }
}

export async function onRequestGet(context) {
    const { request, data } = context;
    const url = new URL(request.url);
    const path = url.pathname.replace('/api/auth/', '');
    
    if (path === 'me') {
        if (!data?.user) {
            return Response.json({ 
                success: false, 
                error: 'لطفا وارد شوید' 
            }, { status: 401 });
        }
        
        return Response.json({ 
            success: true, 
            user: data.user 
        });
    }
    
    return Response.json({ 
        success: false, 
        error: 'مسیر نامعتبر' 
    }, { status: 404 });
}
