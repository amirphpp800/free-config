const COUNTRY_DATA = {
    "EU": { "fa": "اتحادیه اروپا", "en": "European Union" },
    "AF": { "fa": "افغانستان", "en": "Afghanistan" },
    "AL": { "fa": "آلبانی", "en": "Albania" },
    "DZ": { "fa": "الجزایر", "en": "Algeria" },
    "AD": { "fa": "آندورا", "en": "Andorra" },
    "AO": { "fa": "آنگولا", "en": "Angola" },
    "AR": { "fa": "آرژانتین", "en": "Argentina" },
    "AM": { "fa": "ارمنستان", "en": "Armenia" },
    "AU": { "fa": "استرالیا", "en": "Australia" },
    "AT": { "fa": "اتریش", "en": "Austria" },
    "AZ": { "fa": "آذربایجان", "en": "Azerbaijan" },
    "BH": { "fa": "بحرین", "en": "Bahrain" },
    "BD": { "fa": "بنگلادش", "en": "Bangladesh" },
    "BY": { "fa": "بلاروس", "en": "Belarus" },
    "BE": { "fa": "بلژیک", "en": "Belgium" },
    "BR": { "fa": "برزیل", "en": "Brazil" },
    "BG": { "fa": "بلغارستان", "en": "Bulgaria" },
    "CA": { "fa": "کانادا", "en": "Canada" },
    "CL": { "fa": "شیلی", "en": "Chile" },
    "CN": { "fa": "چین", "en": "China" },
    "CO": { "fa": "کلمبیا", "en": "Colombia" },
    "HR": { "fa": "کرواسی", "en": "Croatia" },
    "CY": { "fa": "قبرس", "en": "Cyprus" },
    "CZ": { "fa": "چک", "en": "Czechia" },
    "DK": { "fa": "دانمارک", "en": "Denmark" },
    "EG": { "fa": "مصر", "en": "Egypt" },
    "EE": { "fa": "استونی", "en": "Estonia" },
    "FI": { "fa": "فنلاند", "en": "Finland" },
    "FR": { "fa": "فرانسه", "en": "France" },
    "GE": { "fa": "گرجستان", "en": "Georgia" },
    "DE": { "fa": "آلمان", "en": "Germany" },
    "GR": { "fa": "یونان", "en": "Greece" },
    "HK": { "fa": "هنگ کنگ", "en": "Hong Kong" },
    "HU": { "fa": "مجارستان", "en": "Hungary" },
    "IS": { "fa": "ایسلند", "en": "Iceland" },
    "IN": { "fa": "هند", "en": "India" },
    "ID": { "fa": "اندونزی", "en": "Indonesia" },
    "IR": { "fa": "ایران", "en": "Iran" },
    "IQ": { "fa": "عراق", "en": "Iraq" },
    "IE": { "fa": "ایرلند", "en": "Ireland" },
    "IL": { "fa": "اسرائیل", "en": "Israel" },
    "IT": { "fa": "ایتالیا", "en": "Italy" },
    "JP": { "fa": "ژاپن", "en": "Japan" },
    "JO": { "fa": "اردن", "en": "Jordan" },
    "KZ": { "fa": "قزاقستان", "en": "Kazakhstan" },
    "KW": { "fa": "کویت", "en": "Kuwait" },
    "LV": { "fa": "لتونی", "en": "Latvia" },
    "LB": { "fa": "لبنان", "en": "Lebanon" },
    "LT": { "fa": "لیتوانی", "en": "Lithuania" },
    "LU": { "fa": "لوکزامبورگ", "en": "Luxembourg" },
    "MY": { "fa": "مالزی", "en": "Malaysia" },
    "MX": { "fa": "مکزیک", "en": "Mexico" },
    "MD": { "fa": "مولداوی", "en": "Moldova" },
    "MA": { "fa": "مراکش", "en": "Morocco" },
    "NL": { "fa": "هلند", "en": "Netherlands" },
    "NZ": { "fa": "نیوزیلند", "en": "New Zealand" },
    "NG": { "fa": "نیجریه", "en": "Nigeria" },
    "NO": { "fa": "نروژ", "en": "Norway" },
    "OM": { "fa": "عمان", "en": "Oman" },
    "PK": { "fa": "پاکستان", "en": "Pakistan" },
    "PS": { "fa": "فلسطین", "en": "Palestine" },
    "PE": { "fa": "پرو", "en": "Peru" },
    "PH": { "fa": "فیلیپین", "en": "Philippines" },
    "PL": { "fa": "لهستان", "en": "Poland" },
    "PT": { "fa": "پرتغال", "en": "Portugal" },
    "QA": { "fa": "قطر", "en": "Qatar" },
    "RO": { "fa": "رومانی", "en": "Romania" },
    "RU": { "fa": "روسیه", "en": "Russia" },
    "SA": { "fa": "عربستان", "en": "Saudi Arabia" },
    "RS": { "fa": "صربستان", "en": "Serbia" },
    "SG": { "fa": "سنگاپور", "en": "Singapore" },
    "SK": { "fa": "اسلواکی", "en": "Slovakia" },
    "SI": { "fa": "اسلوونی", "en": "Slovenia" },
    "ZA": { "fa": "آفریقای جنوبی", "en": "South Africa" },
    "KR": { "fa": "کره جنوبی", "en": "South Korea" },
    "ES": { "fa": "اسپانیا", "en": "Spain" },
    "SE": { "fa": "سوئد", "en": "Sweden" },
    "CH": { "fa": "سوئیس", "en": "Switzerland" },
    "SY": { "fa": "سوریه", "en": "Syria" },
    "TW": { "fa": "تایوان", "en": "Taiwan" },
    "TH": { "fa": "تایلند", "en": "Thailand" },
    "TR": { "fa": "ترکیه", "en": "Turkey" },
    "UA": { "fa": "اوکراین", "en": "Ukraine" },
    "AE": { "fa": "امارات", "en": "UAE" },
    "GB": { "fa": "انگلستان", "en": "UK" },
    "US": { "fa": "آمریکا", "en": "USA" },
    "UZ": { "fa": "ازبکستان", "en": "Uzbekistan" },
    "VN": { "fa": "ویتنام", "en": "Vietnam" }
};

const WG_MTUS = [1280, 1320, 1360, 1380, 1400, 1420, 1440, 1480, 1500];

const DNS_OPTIONS = [
    { ip: "1.1.1.1", name: "Cloudflare" },
    { ip: "1.0.0.1", name: "Cloudflare Secondary" },
    { ip: "8.8.8.8", name: "Google" },
    { ip: "8.8.4.4", name: "Google Secondary" },
    { ip: "9.9.9.9", name: "Quad9" },
    { ip: "208.67.222.222", name: "OpenDNS" },
    { ip: "185.51.200.2", name: "Electro" },
    { ip: "78.157.42.100", name: "403" },
    { ip: "10.202.10.10", name: "Radar" }
];

const OPERATORS = {
    irancell: {
        title: "ایرانسل",
        addresses: ["2.144.0.0/16"],
        addressesV6: ["2a01:5ec0:1000::1/128"]
    },
    mci: {
        title: "همراه اول",
        addresses: ["5.52.0.0/16"],
        addressesV6: ["2a02:4540::1/128"]
    },
    tci: {
        title: "مخابرات",
        addresses: ["2.176.0.0/15"],
        addressesV6: ["2a04:2680:13::1/128"]
    },
    rightel: {
        title: "رایتل",
        addresses: ["37.137.128.0/17"],
        addressesV6: ["2a03:ef42::1/128"]
    },
    shatel: {
        title: "شاتل موبایل",
        addresses: ["94.182.0.0/16"],
        addressesV6: ["2a0e::1/128"]
    }
};

function flagFromCode(code) {
    if (!code || code.length !== 2) return '';
    const upperCode = code.toUpperCase();
    return String.fromCodePoint(...upperCode.split('').map(c => c.charCodeAt(0) + 127397));
}

function randBase64(len = 32) {
    const arr = new Uint8Array(len);
    crypto.getRandomValues(arr);
    return btoa(String.fromCharCode.apply(null, arr));
}

function pickRandom(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

export async function onRequestGet(context) {
    const url = new URL(context.request.url);
    const path = url.pathname.replace('/api/config/', '').replace('/api/', '');
    
    switch (path) {
        case 'countries':
            const countries = Object.entries(COUNTRY_DATA).map(([code, data]) => ({
                code,
                fa: data.fa,
                en: data.en,
                flag: flagFromCode(code)
            }));
            return Response.json(countries);
        
        case 'operators':
            const operators = Object.entries(OPERATORS).map(([key, data]) => ({
                id: key,
                title: data.title
            }));
            return Response.json(operators);
        
        case 'dns-options':
            return Response.json(DNS_OPTIONS);
        
        default:
            return Response.json({ error: 'Not found' }, { status: 404 });
    }
}

export async function onRequestPost(context) {
    const { request, env, data } = context;
    const url = new URL(request.url);
    const path = url.pathname.replace('/api/config/', '');
    
    try {
        const body = await request.json();
        
        switch (path) {
            case 'generate-wireguard': {
                const { country, operator, dns, ipVersion } = body;
                
                if (!country) {
                    return Response.json({ 
                        success: false, 
                        error: 'کشور انتخاب نشده است' 
                    }, { status: 400 });
                }
                
                const countryCode = country.toUpperCase();
                const countryData = COUNTRY_DATA[countryCode];
                
                if (!countryData) {
                    return Response.json({ 
                        success: false, 
                        error: 'کشور نامعتبر است' 
                    }, { status: 400 });
                }
                
                const privateKey = randBase64(32);
                const publicKey = randBase64(32);
                const presharedKey = randBase64(32);
                const mtu = pickRandom(WG_MTUS);
                const selectedDns = dns || pickRandom(DNS_OPTIONS).ip;
                
                let address, allowedIPs, endpoint;
                const port = 51820 + Math.floor(Math.random() * 100);
                
                if (ipVersion === 'ipv6') {
                    address = `fd00:${countryCode.charCodeAt(0).toString(16)}${countryCode.charCodeAt(1).toString(16)}::${Math.floor(Math.random() * 65535).toString(16)}/128`;
                    allowedIPs = "::/0, 0.0.0.0/0";
                    endpoint = `wg-${countryCode.toLowerCase()}.ipv6.example.com:${port}`;
                } else {
                    const octet2 = countryCode.charCodeAt(0);
                    const octet3 = countryCode.charCodeAt(1);
                    address = `10.${octet2 % 256}.${octet3 % 256}.${Math.floor(Math.random() * 254) + 1}/32`;
                    allowedIPs = "0.0.0.0/0, ::/0";
                    endpoint = `wg-${countryCode.toLowerCase()}.example.com:${port}`;
                }
                
                let operatorInfo = '';
                if (operator && OPERATORS[operator]) {
                    const opData = OPERATORS[operator];
                    operatorInfo = `\n# Operator: ${opData.title}`;
                }
                
                const config = `[Interface]
PrivateKey = ${privateKey}
Address = ${address}
DNS = ${selectedDns}
MTU = ${mtu}

[Peer]
PublicKey = ${publicKey}
PresharedKey = ${presharedKey}
AllowedIPs = ${allowedIPs}
Endpoint = ${endpoint}
PersistentKeepalive = 25

# ===================================
# Country: ${countryData.fa} (${countryData.en}) ${flagFromCode(country)}${operatorInfo}
# IP Version: ${ipVersion === 'ipv6' ? 'IPv6' : 'IPv4'}
# Generated: ${new Date().toLocaleString('fa-IR')}
# ===================================`;

                if (data?.user) {
                    const userKey = `user:${data.user.telegramId}`;
                    const userData = await env.KV.get(userKey, 'json');
                    if (userData) {
                        userData.configCount = (userData.configCount || 0) + 1;
                        userData.lastConfig = Date.now();
                        await env.KV.put(userKey, JSON.stringify(userData));
                    }
                }

                return Response.json({
                    success: true,
                    config,
                    country: countryData.fa,
                    countryEn: countryData.en,
                    countryCode,
                    flag: flagFromCode(country),
                    dns: selectedDns,
                    mtu,
                    ipVersion: ipVersion || 'ipv4',
                    endpoint,
                    operator: operator ? OPERATORS[operator]?.title : null
                });
            }
            
            case 'generate-dns': {
                const { country, ipVersion } = body;
                
                if (!country) {
                    return Response.json({ 
                        success: false, 
                        error: 'کشور انتخاب نشده است' 
                    }, { status: 400 });
                }
                
                const countryCode = country.toUpperCase();
                const countryData = COUNTRY_DATA[countryCode];
                
                if (!countryData) {
                    return Response.json({ 
                        success: false, 
                        error: 'کشور نامعتبر است' 
                    }, { status: 400 });
                }
                
                const octet1 = countryCode.charCodeAt(0);
                const octet2 = countryCode.charCodeAt(1);
                
                let dnsConfig;
                if (ipVersion === 'ipv6') {
                    dnsConfig = {
                        primary: `2001:${octet1.toString(16)}${octet2.toString(16)}:4860::8888`,
                        secondary: `2001:${octet1.toString(16)}${octet2.toString(16)}:4860::8844`
                    };
                } else {
                    dnsConfig = {
                        primary: `${octet1 % 200 + 50}.${octet2 % 200 + 50}.${Math.floor(Math.random() * 200) + 50}.${Math.floor(Math.random() * 254) + 1}`,
                        secondary: `${octet1 % 200 + 50}.${octet2 % 200 + 50}.${Math.floor(Math.random() * 200) + 50}.${Math.floor(Math.random() * 254) + 1}`
                    };
                }
                
                return Response.json({
                    success: true,
                    country: countryData.fa,
                    countryEn: countryData.en,
                    countryCode,
                    flag: flagFromCode(country),
                    dns: dnsConfig,
                    ipVersion: ipVersion || 'ipv4',
                    generated: new Date().toLocaleString('fa-IR')
                });
            }
            
            default:
                return Response.json({ error: 'Not found' }, { status: 404 });
        }
    } catch (error) {
        console.error('Config error:', error);
        return Response.json({ 
            success: false, 
            error: 'خطای سرور' 
        }, { status: 500 });
    }
}
