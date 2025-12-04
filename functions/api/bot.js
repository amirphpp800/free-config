async function checkChannelMembership(botToken, channelId, userId) {
    try {
        const response = await fetch(
            `https://api.telegram.org/bot${botToken}/getChatMember`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    chat_id: channelId,
                    user_id: userId
                })
            }
        );
        
        const result = await response.json();
        
        if (!result.ok) {
            return false;
        }
        
        const status = result.result?.status;
        return ['member', 'administrator', 'creator'].includes(status);
    } catch {
        return false;
    }
}

async function sendMessage(botToken, chatId, text, replyMarkup = null) {
    const body = {
        chat_id: chatId,
        text: text,
        parse_mode: 'HTML'
    };
    
    if (replyMarkup) {
        body.reply_markup = replyMarkup;
    }
    
    await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
    });
}

export async function onRequestPost(context) {
    const { request, env } = context;
    
    try {
        const update = await request.json();
        const botToken = env.BOT_TOKEN;
        
        if (!botToken) {
            return new Response('OK');
        }
        
        const settings = await env.KV.get('settings:global', 'json') || {};
        const channelId = settings.channelId || env.CHANNEL_ID;
        const channelUsername = settings.channelUsername || env.CHANNEL_USERNAME || 'Channel';
        const websiteUrl = settings.websiteUrl || env.WEBSITE_URL || 'https://example.com';
        
        if (update.message) {
            const message = update.message;
            const chatId = message.chat.id;
            const userId = message.from.id;
            const text = message.text || '';
            
            if (text === '/start') {
                if (channelId) {
                    const isMember = await checkChannelMembership(botToken, channelId, userId);
                    
                    if (!isMember) {
                        const joinMessage = 
                            `👋 <b>سلام خوش آمدید!</b>\n\n` +
                            `⚠️ برای استفاده از خدمات، ابتدا باید در کانال ما عضو شوید.\n\n` +
                            `📢 پس از عضویت، دوباره /start را بزنید.`;
                        
                        const keyboard = {
                            inline_keyboard: [
                                [{ text: '📢 عضویت در کانال', url: `https://t.me/${channelUsername.replace('@', '')}` }],
                                [{ text: '✅ عضو شدم', callback_data: 'check_join' }]
                            ]
                        };
                        
                        await sendMessage(botToken, chatId, joinMessage, keyboard);
                        return new Response('OK');
                    }
                }
                
                const welcomeMessage = 
                    `🎉 <b>سلام! خوش آمدید</b>\n\n` +
                    `📢 <b>اطلاعیه مهم:</b>\n` +
                    `ربات ما به وب‌سایت جدید مهاجرت کرده است!\n\n` +
                    `✨ برای دریافت کانفیگ‌های WireGuard و DNS از لینک زیر استفاده کنید:\n\n` +
                    `🌐 <b>مزایای وب‌سایت:</b>\n` +
                    `• رابط کاربری زیبا و راحت\n` +
                    `• دسترسی سریع‌تر\n` +
                    `• امکانات بیشتر\n` +
                    `• پشتیبانی از همه دستگاه‌ها`;
                
                const keyboard = {
                    inline_keyboard: [
                        [{ text: '🌐 ورود به وب‌سایت', url: websiteUrl }]
                    ]
                };
                
                await sendMessage(botToken, chatId, welcomeMessage, keyboard);
            }
            
            if (text === '/id') {
                await sendMessage(
                    botToken, 
                    chatId, 
                    `🆔 <b>آیدی عددی شما:</b>\n<code>${userId}</code>\n\n` +
                    `از این آیدی برای ورود به سایت استفاده کنید.`
                );
            }
        }
        
        if (update.callback_query) {
            const callbackQuery = update.callback_query;
            const chatId = callbackQuery.message.chat.id;
            const userId = callbackQuery.from.id;
            const data = callbackQuery.data;
            
            await fetch(`https://api.telegram.org/bot${botToken}/answerCallbackQuery`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ callback_query_id: callbackQuery.id })
            });
            
            if (data === 'check_join') {
                if (channelId) {
                    const isMember = await checkChannelMembership(botToken, channelId, userId);
                    
                    if (!isMember) {
                        await sendMessage(
                            botToken, 
                            chatId, 
                            '❌ شما هنوز در کانال عضو نشده‌اید!\n\nلطفا ابتدا عضو کانال شوید و سپس دوباره تلاش کنید.'
                        );
                        return new Response('OK');
                    }
                }
                
                const welcomeMessage = 
                    `✅ <b>عضویت تایید شد!</b>\n\n` +
                    `📢 <b>اطلاعیه مهم:</b>\n` +
                    `ربات ما به وب‌سایت جدید مهاجرت کرده است!\n\n` +
                    `✨ برای دریافت کانفیگ‌ها از لینک زیر استفاده کنید:`;
                
                const keyboard = {
                    inline_keyboard: [
                        [{ text: '🌐 ورود به وب‌سایت', url: websiteUrl }]
                    ]
                };
                
                await sendMessage(botToken, chatId, welcomeMessage, keyboard);
            }
        }
        
        return new Response('OK');
    } catch (error) {
        console.error('Bot webhook error:', error);
        return new Response('OK');
    }
}
