export async function onRequestGet(context) {
    const { request, env, data } = context;
    const url = new URL(request.url);
    const path = url.pathname.replace('/api/admin/', '');
    
    if (!data?.user?.isAdmin) {
        return Response.json({ 
            success: false, 
            error: 'دسترسی غیرمجاز' 
        }, { status: 403 });
    }
    
    try {
        switch (path) {
            case 'users': {
                const usersList = await env.KV.get('users:list', 'json') || [];
                const users = [];
                
                for (const telegramId of usersList) {
                    const userData = await env.KV.get(`user:${telegramId}`, 'json');
                    if (userData) {
                        users.push(userData);
                    }
                }
                
                return Response.json({ 
                    success: true, 
                    users,
                    total: users.length
                });
            }
            
            case 'stats': {
                const usersList = await env.KV.get('users:list', 'json') || [];
                let totalConfigs = 0;
                let vipCount = 0;
                let adminCount = 0;
                
                for (const telegramId of usersList) {
                    const userData = await env.KV.get(`user:${telegramId}`, 'json');
                    if (userData) {
                        totalConfigs += userData.configCount || 0;
                        if (userData.isVip) vipCount++;
                        if (userData.isAdmin) adminCount++;
                    }
                }
                
                return Response.json({
                    success: true,
                    stats: {
                        totalUsers: usersList.length,
                        vipUsers: vipCount,
                        adminUsers: adminCount,
                        totalConfigs
                    }
                });
            }
            
            case 'settings': {
                const settings = await env.KV.get('settings:global', 'json') || {
                    channelId: '',
                    channelUsername: '',
                    websiteUrl: '',
                    maintenanceMode: false
                };
                
                return Response.json({ success: true, settings });
            }
            
            default:
                return Response.json({ error: 'Not found' }, { status: 404 });
        }
    } catch (error) {
        console.error('Admin GET error:', error);
        return Response.json({ 
            success: false, 
            error: 'خطای سرور' 
        }, { status: 500 });
    }
}

export async function onRequestPost(context) {
    const { request, env, data } = context;
    const url = new URL(request.url);
    const path = url.pathname.replace('/api/admin/', '');
    
    if (!data?.user?.isAdmin) {
        return Response.json({ 
            success: false, 
            error: 'دسترسی غیرمجاز' 
        }, { status: 403 });
    }
    
    try {
        const body = await request.json();
        
        switch (path) {
            case 'user/update': {
                const { telegramId, isVip, isAdmin } = body;
                
                if (!telegramId) {
                    return Response.json({ 
                        success: false, 
                        error: 'آیدی کاربر الزامی است' 
                    }, { status: 400 });
                }
                
                const userKey = `user:${telegramId}`;
                const userData = await env.KV.get(userKey, 'json');
                
                if (!userData) {
                    return Response.json({ 
                        success: false, 
                        error: 'کاربر یافت نشد' 
                    }, { status: 404 });
                }
                
                if (typeof isVip === 'boolean') {
                    userData.isVip = isVip;
                }
                if (typeof isAdmin === 'boolean') {
                    userData.isAdmin = isAdmin;
                }
                
                await env.KV.put(userKey, JSON.stringify(userData));
                
                return Response.json({ 
                    success: true, 
                    message: 'کاربر بروزرسانی شد',
                    user: userData
                });
            }
            
            case 'user/delete': {
                const { telegramId } = body;
                
                if (!telegramId) {
                    return Response.json({ 
                        success: false, 
                        error: 'آیدی کاربر الزامی است' 
                    }, { status: 400 });
                }
                
                await env.KV.delete(`user:${telegramId}`);
                
                const usersList = await env.KV.get('users:list', 'json') || [];
                const newList = usersList.filter(id => id !== telegramId);
                await env.KV.put('users:list', JSON.stringify(newList));
                
                return Response.json({ 
                    success: true, 
                    message: 'کاربر حذف شد' 
                });
            }
            
            case 'settings/update': {
                const { channelId, channelUsername, websiteUrl, maintenanceMode } = body;
                
                const settings = await env.KV.get('settings:global', 'json') || {};
                
                if (channelId !== undefined) settings.channelId = channelId;
                if (channelUsername !== undefined) settings.channelUsername = channelUsername;
                if (websiteUrl !== undefined) settings.websiteUrl = websiteUrl;
                if (maintenanceMode !== undefined) settings.maintenanceMode = maintenanceMode;
                
                await env.KV.put('settings:global', JSON.stringify(settings));
                
                return Response.json({ 
                    success: true, 
                    message: 'تنظیمات ذخیره شد',
                    settings
                });
            }
            
            case 'broadcast': {
                const { message } = body;
                
                if (!message) {
                    return Response.json({ 
                        success: false, 
                        error: 'پیام الزامی است' 
                    }, { status: 400 });
                }
                
                const usersList = await env.KV.get('users:list', 'json') || [];
                const botToken = env.BOT_TOKEN;
                
                if (!botToken) {
                    return Response.json({ 
                        success: false, 
                        error: 'توکن ربات تنظیم نشده است' 
                    }, { status: 500 });
                }
                
                let sent = 0;
                let failed = 0;
                
                for (const telegramId of usersList) {
                    try {
                        const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                chat_id: telegramId,
                                text: message,
                                parse_mode: 'HTML'
                            })
                        });
                        
                        const result = await response.json();
                        if (result.ok) {
                            sent++;
                        } else {
                            failed++;
                        }
                    } catch {
                        failed++;
                    }
                }
                
                return Response.json({ 
                    success: true, 
                    message: `پیام به ${sent} کاربر ارسال شد، ${failed} ناموفق`,
                    sent,
                    failed
                });
            }
            
            default:
                return Response.json({ error: 'Not found' }, { status: 404 });
        }
    } catch (error) {
        console.error('Admin POST error:', error);
        return Response.json({ 
            success: false, 
            error: 'خطای سرور' 
        }, { status: 500 });
    }
}
