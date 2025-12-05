export async function onRequestPost(context) {
    const { request, env } = context;

    try {
        const { telegramId } = await request.json();

        if (!telegramId || !/^\d{5,15}$/.test(telegramId)) {
            return new Response(JSON.stringify({ error: 'شناسه تلگرام نامعتبر است' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        const userKey = `user:${telegramId}`;
        let user = null;
        
        if (env.DB) {
            const userData = await env.DB.get(userKey);
            if (userData) {
                user = JSON.parse(userData);
            }
        }

        if (user?.password) {
            return new Response(JSON.stringify({ 
                hasPassword: true,
                message: 'شما قبلاً رمز عبور تنظیم کرده‌اید'
            }), {
                headers: { 'Content-Type': 'application/json' }
            });
        }

        const code = Math.floor(10000 + Math.random() * 90000).toString();
        const codeKey = `code:${telegramId}`;
        
        if (env.DB) {
            await env.DB.put(codeKey, JSON.stringify({
                code,
                createdAt: Date.now(),
                expiresAt: Date.now() + 5 * 60 * 1000
            }), { expirationTtl: 300 });
        }

        const isDevelopment = !env.BOT_TOKEN;

        if (env.BOT_TOKEN) {
            try {
                const telegramResponse = await fetch(`https://api.telegram.org/bot${env.BOT_TOKEN}/sendMessage`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        chat_id: telegramId,
                        text: `🔐 کد تایید شما:\n\n<code>${code}</code>\n\nاین کد تا ۵ دقیقه معتبر است.`,
                        parse_mode: 'HTML'
                    })
                });

                const result = await telegramResponse.json();
                if (!result.ok) {
                    console.error('Telegram API error:', result);
                    return new Response(JSON.stringify({ 
                        error: 'خطا در ارسال کد به تلگرام. لطفاً مطمئن شوید که ربات را استارت کرده‌اید.'
                    }), {
                        status: 400,
                        headers: { 'Content-Type': 'application/json' }
                    });
                }
            } catch (e) {
                console.error('Telegram send error:', e);
                return new Response(JSON.stringify({ 
                    error: 'خطا در ارتباط با تلگرام'
                }), {
                    status: 500,
                    headers: { 'Content-Type': 'application/json' }
                });
            }
        }

        return new Response(JSON.stringify({ 
            success: true,
            message: isDevelopment 
                ? `حالت توسعه: کد تایید شما ${code} است`
                : 'کد تایید به تلگرام شما ارسال شد',
            hasPassword: false,
            devMode: isDevelopment,
            devCode: isDevelopment ? code : undefined
        }), {
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Send code error:', error);
        return new Response(JSON.stringify({ error: 'خطا در ارسال کد' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
