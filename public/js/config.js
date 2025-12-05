const CONFIG = {
    API_BASE: '/api',
    DAILY_LIMITS: {
        wireguard: 3,
        dns: 3
    },
    COUNTRIES: [],
    OPERATORS: [
        { id: 'mci', name: 'همراه اول' },
        { id: 'mtn', name: 'ایرانسل' },
        { id: 'rightel', name: 'رایتل' },
        { id: 'shatel', name: 'شاتل' },
        { id: 'other', name: 'سایر' }
    ],
    DNS_SERVERS: [
        { id: 'cloudflare', name: 'Cloudflare', ip: '1.1.1.1' },
        { id: 'google', name: 'Google', ip: '8.8.8.8' },
        { id: 'quad9', name: 'Quad9', ip: '9.9.9.9' },
        { id: 'adguard', name: 'AdGuard', ip: '94.140.14.14' }
    ],
};