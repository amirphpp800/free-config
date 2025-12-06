
export async function onRequest(context) {
    const { request, env } = context;

    if (request.method !== 'POST') {
        return new Response(JSON.stringify({ error: 'Method not allowed' }), {
            status: 405,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    try {
        const { host, sequence } = await request.json();

        if (!host) {
            return new Response(JSON.stringify({ error: 'Host is required' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // ساخت کلید یکتا برای هر هاست
        const hostKey = `ping_seed:${host}`;
        
        let seedData;
        if (env.DB) {
            const cached = await env.DB.get(hostKey);
            if (cached) {
                seedData = JSON.parse(cached);
            } else {
                // ایجاد seed جدید برای این هاست
                seedData = {
                    baseTime: 20 + Math.random() * 80, // بین 20 تا 100ms
                    variance: 5 + Math.random() * 15, // واریانس بین 5 تا 20ms
                    packetLossChance: Math.random() * 0.1, // احتمال از دست رفتن بسته تا 10%
                    createdAt: Date.now()
                };
                
                // ذخیره در KV با انقضای 24 ساعته
                await env.DB.put(hostKey, JSON.stringify(seedData), { 
                    expirationTtl: 86400 
                });
            }
        } else {
            // اگر KV در دسترس نبود، seed موقت ایجاد کن
            seedData = {
                baseTime: 20 + Math.random() * 80,
                variance: 5 + Math.random() * 15,
                packetLossChance: Math.random() * 0.1,
                createdAt: Date.now()
            };
        }

        // شبیه‌سازی packet loss
        const isLost = Math.random() < seedData.packetLossChance;
        
        if (isLost) {
            return new Response(JSON.stringify({
                success: false,
                time: null
            }), {
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // محاسبه زمان با استفاده از seed
        const sequenceVariance = (sequence % 2 === 0 ? 1 : -1) * (Math.random() * 5);
        const time = Math.round(
            seedData.baseTime + 
            (Math.random() - 0.5) * seedData.variance * 2 + 
            sequenceVariance
        );

        return new Response(JSON.stringify({
            success: true,
            time: Math.max(1, time) // حداقل 1ms
        }), {
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        return new Response(JSON.stringify({ 
            error: 'خطا در شبیه‌سازی پینگ',
            success: false,
            time: null
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
