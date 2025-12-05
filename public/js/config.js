const CONFIG = {
    API_BASE: '/api',
    DAILY_LIMITS: {
        wireguard: 3,
        dns: 3
    },
    COUNTRIES: [],
    OPERATORS: [
        { 
            id: 'irancell', 
            name: 'ایرانسل',
            addresses: ['2.144.0.0/16'],
            addressesV6: ['2a01:5ec0:1000::1/128', '2a01:5ec0:1000::2/128']
        },
        { 
            id: 'mci', 
            name: 'همراه اول',
            addresses: ['5.52.0.0/16'],
            addressesV6: ['2a02:4540::1/128', '2a02:4540::2/128']
        },
        { 
            id: 'tci', 
            name: 'مخابرات',
            addresses: ['2.176.0.0/15', '2.190.0.0/15'],
            addressesV6: ['2a04:2680:13::1/128', '2a04:2680:13::2/128']
        },
        { 
            id: 'rightel', 
            name: 'رایتل',
            addresses: ['37.137.128.0/17', '95.162.0.0/17'],
            addressesV6: ['2a03:ef42::1/128', '2a03:ef42::2/128']
        },
        { 
            id: 'shatel', 
            name: 'شاتل موبایل',
            addresses: ['94.182.0.0/16', '37.148.0.0/18'],
            addressesV6: ['2a0e::1/128', '2a0e::2/128']
        }
    ],
    DNS_SERVERS: [
        { id: 'cloudflare_primary', name: 'Cloudflare 1', ip: '1.1.1.1' },
        { id: 'cloudflare_secondary', name: 'Cloudflare 2', ip: '1.0.0.1' },
        { id: 'google_primary', name: 'Google 1', ip: '8.8.8.8' },
        { id: 'google_secondary', name: 'Google 2', ip: '8.8.4.4' },
        { id: 'quad9', name: 'Quad9', ip: '9.9.9.9' },
        { id: 'radar', name: 'رادار', ip: '10.202.10.10' },
        { id: 'electro', name: 'الکترو', ip: '78.157.42.100' },
        { id: 'opendns_primary', name: 'OpenDNS 1', ip: '208.67.222.222' },
        { id: 'opendns_secondary', name: 'OpenDNS 2', ip: '208.67.220.220' },
        { id: 'shecan_primary', name: 'شکن 1', ip: '185.55.226.26' },
        { id: 'shecan_secondary', name: 'شکن 2', ip: '185.55.225.25' },
        { id: 'irancell', name: 'ایرانسل', ip: '185.51.200.2' }
    ],
};