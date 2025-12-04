
function generateVerifyCode() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

async function sendTelegramMessage(botToken, chatId, text) {
    const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
    const body = {
        chat_id: chatId,
        text: text,
        parse_mode: 'HTML'
    };
    
    const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
    });
    
    return response.json();
}

export async function onRequestPost(context) {
    const { request, env } = context;
    
    try {
        const body = await request.json();
        const { telegramId, isAdminPanel } = body;
        
        if (!telegramId || !/^\d{5,15}$/.test(telegramId)) {
            return Response.json({ 
                success: false, 
                error: 'آیدی عددی تلگرام نامعتبر است' 
            }, { status: 400 });
        }
        
        // اگر درخواست از پنل ادمین است، باید بررسی کنیم کاربر ادمین باشد
        if (isAdminPanel) {
            const userKey = `user:${telegramId}`;
            const userDataStr = await env.DB.get(userKey);
            
            if (!userDataStr) {
                return Response.json({ 
                    success: false, 
                    error: 'شما دسترسی به پنل مدیریت ندارید' 
                }, { status: 403 });
            }
            
            const user = JSON.parse(userDataStr);
            if (!user.isAdmin) {
                return Response.json({ 
                    success: false, 
                    error: 'شما دسترسی به پنل مدیریت ندارید' 
                }, { status: 403 });
            }
        }
        
        const code = generateVerifyCode();
        const codeKey = `verify:${telegramId}`;
        
        await env.DB.put(codeKey, JSON.stringify({
            code,
            createdAt: Date.now(),
            attempts: 0
        }), { expirationTtl: 300 });
        
        const botToken = env.BOT_TOKEN;
        if (!botToken) {
            return Response.json({ 
                success: false, 
                error: 'توکن ربات تنظیم نشده است. لطفاً با مدیر تماس بگیرید.' 
            }, { status: 500 });
        }
        
        const message = `🔐 <b>کد تایید حساب کاربری</b>\n\n` +
            `کد تایید شما: <code>${code}</code>\n\n` +
            `⏱ این کد تا ۵ دقیقه معتبر است.\n` +
            `⚠️ این کد را در اختیار کسی قرار ندهید.`;
        
        const result = await sendTelegramMessage(botToken, telegramId, message);
        
        if (!result.ok) {
            console.error('Telegram error:', result);
            return Response.json({ 
                success: false, 
                error: 'ارسال کد به تلگرام ناموفق بود. آیا ربات را استارت کرده‌اید؟' 
            }, { status: 400 });
        }
        
        return Response.json({ 
            success: true, 
            message: 'کد تایید به تلگرام شما ارسال شد' 
        });
    } catch (error) {
        console.error('Send code error:', error);
        return Response.json({ 
            success: false, 
            error: 'خطای سرور در ارسال کد' 
        }, { status: 500 });
    }
}
