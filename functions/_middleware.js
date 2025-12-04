const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

async function verifyToken(token, env) {
    if (!token) return null;
    
    try {
        const sessionData = await env.KV.get(`session:${token}`, 'json');
        if (!sessionData) return null;
        
        if (Date.now() > sessionData.expiresAt) {
            await env.KV.delete(`session:${token}`);
            return null;
        }
        
        return sessionData;
    } catch {
        return null;
    }
}

export async function onRequest(context) {
    const { request, env, next } = context;
    
    if (request.method === 'OPTIONS') {
        return new Response(null, { headers: corsHeaders });
    }
    
    const url = new URL(request.url);
    
    const publicPaths = [
        '/api/auth/login',
        '/api/auth/register',
        '/api/auth/verify',
        '/api/auth/send-code',
        '/api/bot/webhook',
        '/api/countries',
        '/api/announcements',
        '/api/config/operators',
        '/api/config/dns-options',
    ];
    
    const isPublicPath = publicPaths.some(path => url.pathname.startsWith(path));
    
    if (!isPublicPath && url.pathname.startsWith('/api/')) {
        const authHeader = request.headers.get('Authorization');
        const token = authHeader?.replace('Bearer ', '');
        
        const session = await verifyToken(token, env);
        
        if (!session) {
            return new Response(JSON.stringify({ 
                success: false, 
                error: 'لطفا وارد حساب کاربری خود شوید' 
            }), {
                status: 401,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }
        
        if (url.pathname.startsWith('/api/admin/') && !session.isAdmin) {
            return new Response(JSON.stringify({ 
                success: false, 
                error: 'دسترسی غیرمجاز' 
            }), {
                status: 403,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }
        
        context.data = { user: session };
    }
    
    const response = await next();
    
    const newHeaders = new Headers(response.headers);
    Object.entries(corsHeaders).forEach(([key, value]) => {
        newHeaders.set(key, value);
    });
    
    return new Response(response.body, {
        status: response.status,
        headers: newHeaders
    });
}
