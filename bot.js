
const BOT_TOKEN = '7811315229:AAGkSHXRm9OTVyYNT-uWq-XyMwkXs3qRoxU';
const ADMIN_ID = '6268968401';
const CHANNEL_ID = '@ROOTLeaker';
const CHANNEL_USERNAME = 'ROOTLeaker';
const WEBSITE_URL = 'https://your-repl-url.replit.dev';

async function sendMessage(chatId, text, replyMarkup = null) {
    const body = {
        chat_id: chatId,
        text: text,
        parse_mode: 'HTML'
    };
    
    if (replyMarkup) {
        body.reply_markup = JSON.stringify(replyMarkup);
    }
    
    try {
        const response = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });
        return await response.json();
    } catch (error) {
        console.error('Send message error:', error);
        return null;
    }
}

async function checkChannelMembership(userId) {
    if (!CHANNEL_ID) return true;
    
    try {
        const response = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/getChatMember`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: CHANNEL_ID,
                user_id: userId
            })
        });
        
        const result = await response.json();
        
        if (!result.ok) return false;
        
        const status = result.result?.status;
        return ['member', 'administrator', 'creator'].includes(status);
    } catch (error) {
        console.error('Check membership error:', error);
        return false;
    }
}

async function answerCallbackQuery(callbackQueryId, text = null) {
    try {
        await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/answerCallbackQuery`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                callback_query_id: callbackQueryId,
                text: text
            })
        });
    } catch (error) {
        console.error('Answer callback error:', error);
    }
}

async function handleUpdate(update) {
    if (update.message) {
        const message = update.message;
        const chatId = message.chat.id;
        const userId = message.from.id;
        const text = message.text || '';
        
        if (text === '/start') {
            if (CHANNEL_ID) {
                const isMember = await checkChannelMembership(userId);
                
                if (!isMember) {
                    const joinMessage = 
                        `👋 <b>سلام خوش آمدید!</b>\n\n` +
                        `⚠️ برای استفاده از خدمات، ابتدا باید در کانال ما عضو شوید.\n\n` +
                        `📢 پس از عضویت، دوباره /start را بزنید.`;
                    
                    const keyboard = {
                        inline_keyboard: [
                            [{ text: '📢 عضویت در کانال', url: `https://t.me/${CHANNEL_USERNAME.replace('@', '')}` }],
                            [{ text: '✅ عضو شدم', callback_data: 'check_join' }]
                        ]
                    };
                    
                    await sendMessage(chatId, joinMessage, keyboard);
                    return;
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
                    [{ text: '🌐 ورود به وب‌سایت', url: WEBSITE_URL }],
                    [{ text: '📢 کانال تلگرام', url: `https://t.me/${CHANNEL_USERNAME.replace('@', '')}` }]
                ]
            };
            
            await sendMessage(chatId, welcomeMessage, keyboard);
        }
        
        if (text === '/id') {
            await sendMessage(
                chatId, 
                `🆔 <b>آیدی عددی شما:</b>\n<code>${userId}</code>\n\n` +
                `از این آیدی برای ورود به سایت استفاده کنید.`
            );
        }
        
        if (text === '/help') {
            const helpMessage = 
                `📚 <b>راهنمای ربات</b>\n\n` +
                `/start - شروع و مشاهده منو\n` +
                `/id - دریافت آیدی عددی تلگرام\n` +
                `/help - نمایش این راهنما\n\n` +
                `🌐 برای استفاده از خدمات به وب‌سایت مراجعه کنید.`;
            
            const keyboard = {
                inline_keyboard: [
                    [{ text: '🌐 ورود به وب‌سایت', url: WEBSITE_URL }],
                    [{ text: '📢 کانال تلگرام', url: `https://t.me/${CHANNEL_USERNAME.replace('@', '')}` }]
                ]
            };
            
            await sendMessage(chatId, helpMessage, keyboard);
        }
    }
    
    if (update.callback_query) {
        const callbackQuery = update.callback_query;
        const chatId = callbackQuery.message.chat.id;
        const userId = callbackQuery.from.id;
        const data = callbackQuery.data;
        
        await answerCallbackQuery(callbackQuery.id);
        
        if (data === 'check_join') {
            if (CHANNEL_ID) {
                const isMember = await checkChannelMembership(userId);
                
                if (!isMember) {
                    await sendMessage(
                        chatId, 
                        '❌ شما هنوز در کانال عضو نشده‌اید!\n\nلطفا ابتدا عضو کانال شوید و سپس دوباره تلاش کنید.'
                    );
                    return;
                }
            }
            
            const welcomeMessage = 
                `✅ <b>عضویت تایید شد!</b>\n\n` +
                `📢 <b>اطلاعیه مهم:</b>\n` +
                `ربات ما به وب‌سایت جدید مهاجرت کرده است!\n\n` +
                `✨ برای دریافت کانفیگ‌ها از لینک زیر استفاده کنید:`;
            
            const keyboard = {
                inline_keyboard: [
                    [{ text: '🌐 ورود به وب‌سایت', url: WEBSITE_URL }],
                    [{ text: '📢 کانال تلگرام', url: `https://t.me/${CHANNEL_USERNAME.replace('@', '')}` }]
                ]
            };
            
            await sendMessage(chatId, welcomeMessage, keyboard);
        }
    }
}

async function setWebhook(webhookUrl) {
    try {
        const response = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/setWebhook`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url: webhookUrl })
        });
        return await response.json();
    } catch (error) {
        console.error('Set webhook error:', error);
        return null;
    }
}

module.exports = { handleUpdate, setWebhook, sendMessage, BOT_TOKEN, ADMIN_ID };
