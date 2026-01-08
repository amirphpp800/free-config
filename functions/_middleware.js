export async function onRequest(context) {
    const { request, env, next } = context;
    const url = new URL(request.url);

    if (request.method === 'OPTIONS') {
        return new Response(null, {
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, Authorization',
                'Access-Control-Max-Age': '86400',
            }
        });
    }

    // Check Maintenance Mode
    if (env.DB) {
        const maintenance = await env.DB.get('settings:maintenance');
        if (maintenance === 'true' && !url.pathname.startsWith('/api/admin/')) {
            // Check if login is explicitly requested via hash or if already logged in
            // Allow /api/auth/ for verification and login but it will be filtered for non-admins inside
            const isLoginRequest = url.hash === '#login' || url.searchParams.has('login') || url.pathname.startsWith('/api/auth/');
            
            // Check if user is admin to bypass maintenance
            const authHeader = request.headers.get('Authorization');
            let isAdmin = false;
            if (authHeader?.startsWith('Bearer ')) {
                const token = authHeader.slice(7);
                const telegramId = await env.DB.get(`token:${token}`);
                if (telegramId) {
                    const userData = await env.DB.get(`user:${telegramId}`);
                    if (userData) {
                        const user = JSON.parse(userData);
                        if (user.isAdmin) {
                            isAdmin = true;
                        }
                    }
                }
            }

            if (!isAdmin && !isLoginRequest) {
                if (url.pathname.startsWith('/api/')) {
                    // Also block common user API endpoints during maintenance if not admin
                    if (url.pathname.startsWith('/api/user/') || url.pathname.startsWith('/api/generate/')) {
                        return new Response(JSON.stringify({ error: 'سرویس در حال بروزرسانی است' }), {
                            status: 503,
                            headers: { 'Content-Type': 'application/json' }
                        });
                    }
                    return new Response(JSON.stringify({ error: 'سرویس در حال بروزرسانی است' }), {
                        status: 503,
                        headers: { 'Content-Type': 'application/json' }
                    });
                }
                
                // Serve maintenance page if not an API request
                if (!url.pathname.includes('.')) {
                    return new Response(`
                        <!DOCTYPE html>
                        <html lang="fa" dir="rtl">
                        <head>
                            <meta charset="UTF-8">
                            <meta name="viewport" content="width=device-width, initial-scale=1.0">
                            <title>در حال بروزرسانی | RootLeaker</title>
                            <link href="https://fonts.googleapis.com/css2?family=Vazirmatn:wght@100;300;400;500;700;900&display=swap" rel="stylesheet">
                            <style>
                                :root {
                                    --bg-primary: #000000;
                                    --bg-secondary: #1c1c1e;
                                    --text-primary: #ffffff;
                                    --text-secondary: #8e8e93;
                                    --accent-blue: #0a84ff;
                                    --accent-orange: #ff9f0a;
                                    --shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
                                }
                                body { 
                                    font-family: 'Vazirmatn', Tahoma, sans-serif; 
                                    background-color: var(--bg-primary); 
                                    color: var(--text-primary);
                                    display: flex; 
                                    align-items: center; 
                                    justify-content: center; 
                                    height: 100vh; 
                                    margin: 0; 
                                    text-align: center; 
                                    overflow: hidden;
                                }
                                .container { 
                                    background: var(--bg-secondary); 
                                    padding: 48px 32px; 
                                    border-radius: 24px; 
                                    box-shadow: var(--shadow); 
                                    max-width: 440px; 
                                    width: 90%;
                                    border: 1px solid #38383a;
                                    animation: fadeIn 0.6s ease-out;
                                }
                                .icon-container {
                                    margin-bottom: 24px;
                                }
                                .animated-icon {
                                    width: 80px;
                                    height: 80px;
                                    animation: rotate 4s linear infinite;
                                }
                                @keyframes rotate {
                                    from { transform: rotate(0deg); }
                                    to { transform: rotate(360deg); }
                                }
                                h1 { 
                                    color: var(--text-primary); 
                                    margin-bottom: 16px; 
                                    font-size: 24px;
                                    font-weight: 700;
                                }
                                p { 
                                    color: var(--text-secondary); 
                                    line-height: 1.8; 
                                    font-size: 16px;
                                    margin-bottom: 32px;
                                }
                                .admin-link {
                                    font-size: 12px;
                                    color: var(--text-secondary);
                                    text-decoration: none;
                                    opacity: 0.3;
                                    transition: opacity 0.3s;
                                    background: none;
                                    border: none;
                                    cursor: pointer;
                                    font-family: inherit;
                                }
                                .admin-link:hover {
                                    opacity: 1;
                                    color: var(--accent-blue);
                                }
                                @keyframes fadeIn {
                                    from { opacity: 0; transform: translateY(20px); }
                                    to { opacity: 1; transform: translateY(0); }
                                }
                                @keyframes pulse {
                                    0% { transform: scale(1); }
                                    50% { transform: scale(1.1); }
                                    100% { transform: scale(1); }
                                }
                            </style>
                        </head>
                        <body>
                            <div class="container">
                                <div style="position: relative;">
                                    <button onclick="window.location.href='/?login=1#login';" class="admin-link" style="opacity: 0; pointer-events: auto; width: 100%; height: 20px; padding: 0; margin: 0; border: none; background: none; position: absolute; top: -20px; left: 0; cursor: default;">ورود مدیریت</button>
                                </div>
                                <div class="icon-container">
                                    <svg class="animated-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.77 3.77z" stroke="var(--accent-blue)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                    </svg>
                                </div>
                                <h1>در حال بروزرسانی سرویس</h1>
                                <p>ما در حال انجام برخی تغییرات برای بهبود کیفیت خدمات هستیم. لطفاً دقایقی دیگر دوباره به ما سر بزنید.</p>
                            </div>
                        </body>
                        </html>
                    `, {
                        headers: { 'Content-Type': 'text/html' }
                    });
                }
            }

            // Block access for non-admins if maintenance is active and they passed login check
            if (maintenance === 'true' && url.pathname.startsWith('/api/auth/') && !isAdmin) {
                // If it's a login attempt, we need to let them login to check if they are admin
                // But we should block non-admin logins from proceeding to other pages
                // Actually the current middleware structure handles this by re-checking on every request
            }
        }
    }

    if (url.pathname.startsWith('/api/')) {
        const response = await next();
        const newResponse = new Response(response.body, response);
        newResponse.headers.set('Access-Control-Allow-Origin', '*');
        newResponse.headers.set('Content-Type', 'application/json');
        return newResponse;
    }

    return next();
}
