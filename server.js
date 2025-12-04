import express from 'express';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs/promises';
import crypto from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

app.use((req, res, next) => {
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    next();
});

const kvStore = new Map();

async function loadInitialData() {
    try {
        const dataDir = join(__dirname, 'data');
        const files = await fs.readdir(dataDir);
        for (const file of files) {
            if (file.endsWith('.json')) {
                const content = await fs.readFile(join(dataDir, file), 'utf-8');
                const key = file.replace('.json', '');
                kvStore.set(`${key}:data`, JSON.parse(content));
            }
        }
        console.log('Initial data loaded');
    } catch (error) {
        console.log('No initial data found');
    }
}

const KV = {
    async get(key, type = 'text') {
        const value = kvStore.get(key);
        if (value === undefined) return null;
        if (type === 'json') {
            if (typeof value === 'string') {
                try { return JSON.parse(value); } catch { return value; }
            }
            return value;
        }
        return value;
    },
    async put(key, value, options = {}) {
        kvStore.set(key, typeof value === 'string' ? value : JSON.stringify(value));
    },
    async delete(key) {
        kvStore.delete(key);
    }
};

const env = {
    BOT_TOKEN: process.env.BOT_TOKEN,
    ADMIN_ID: process.env.ADMIN_ID || '7240662021',
    DB: KV
};

function generateToken(length = 32) {
    return crypto.randomBytes(length).toString('hex');
}

function generateVerifyCode() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

async function sendTelegramMessage(botToken, chatId, text) {
    if (!botToken) return { ok: false, description: 'Bot token not set' };

    try {
        const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: chatId,
                text: text,
                parse_mode: 'HTML'
            })
        });
        return await response.json();
    } catch (error) {
        console.error('Telegram API error:', error);
        return { ok: false, description: error.message };
    }
}

app.use(express.static('public'));

app.get('/admin', async (req, res) => {
    try {
        const adminPath = join(__dirname, 'public', 'admin.html');
        const content = await fs.readFile(adminPath, 'utf-8');
        res.send(content);
    } catch (error) {
        res.status(404).send('Page not found');
    }
});

app.post('/api/auth/send-code', async (req, res) => {
    try {
        const { telegramId } = req.body;

        if (!telegramId || !/^\d{5,15}$/.test(telegramId)) {
            return res.status(400).json({ 
                success: false, 
                error: 'آیدی عددی تلگرام نامعتبر است' 
            });
        }

        // Check if the user is an admin and if the admin ID is provided
        if (telegramId !== env.ADMIN_ID) {
            return res.status(403).json({ 
                success: false, 
                error: 'شما ادمین نیستید و اجازه دسترسی ندارید.' 
            });
        }

        const code = generateVerifyCode();
        const codeKey = `verify:${telegramId}`;

        await KV.put(codeKey, JSON.stringify({
            code,
            createdAt: Date.now(),
            attempts: 0
        }));

        const botToken = env.BOT_TOKEN;
        if (!botToken) {
            return res.status(500).json({ 
                success: false, 
                error: 'توکن ربات تنظیم نشده است. لطفاً با مدیر تماس بگیرید.' 
            });
        }

        const message = `🔐 <b>کد تایید ادمین</b>\n\n` +
            `کد تایید شما: <code>${code}</code>\n\n` +
            `⏱ این کد تا ۵ دقیقه معتبر است.\n` +
            `⚠️ این کد را در اختیار کسی قرار ندهید.`;

        const result = await sendTelegramMessage(botToken, telegramId, message);

        if (!result.ok) {
            console.error('Telegram error:', result);
            return res.status(400).json({ 
                success: false, 
                error: 'ارسال کد به تلگرام ناموفق بود. آیا ربات را استارت کرده‌اید؟' 
            });
        }

        return res.json({ 
            success: true, 
            message: 'کد تایید به تلگرام شما ارسال شد' 
        });
    } catch (error) {
        console.error('Send code error:', error);
        return res.status(500).json({ 
            success: false, 
            error: 'خطای سرور در ارسال کد' 
        });
    }
});

app.post('/api/auth/verify', async (req, res) => {
    try {
        const { telegramId, code } = req.body;

        if (!telegramId || !code) {
            return res.status(400).json({ 
                success: false, 
                error: 'آیدی و کد تایید الزامی است' 
            });
        }

        const codeKey = `verify:${telegramId}`;
        const storedData = await KV.get(codeKey, 'json');

        if (!storedData) {
            return res.status(400).json({ 
                success: false, 
                error: 'کد تایید منقضی شده است. لطفا دوباره درخواست کنید' 
            });
        }

        if (storedData.attempts >= 3) {
            await KV.delete(codeKey);
            return res.status(400).json({ 
                success: false, 
                error: 'تعداد تلاش‌های مجاز تمام شد. لطفا دوباره درخواست کنید' 
            });
        }

        if (storedData.code !== code) {
            storedData.attempts++;
            await KV.put(codeKey, JSON.stringify(storedData));
            return res.status(400).json({ 
                success: false, 
                error: 'کد تایید اشتباه است' 
            });
        }

        await KV.delete(codeKey);

        let user = await KV.get(`user:${telegramId}`, 'json');
        const isNewUser = !user;

        if (isNewUser) {
            user = {
                telegramId,
                createdAt: Date.now(),
                isAdmin: telegramId === env.ADMIN_ID,
                isVip: false,
                configCount: 0
            };
            await KV.put(`user:${telegramId}`, JSON.stringify(user));

            const usersList = await KV.get('users:list', 'json') || [];
            if (!usersList.includes(telegramId)) {
                usersList.push(telegramId);
                await KV.put('users:list', JSON.stringify(usersList));
            }
        } else {
            // Ensure admin status is correctly reflected for existing users
            if (telegramId === env.ADMIN_ID && !user.isAdmin) {
                user.isAdmin = true;
                await KV.put(`user:${telegramId}`, JSON.stringify(user));
            } else if (telegramId !== env.ADMIN_ID && user.isAdmin) {
                user.isAdmin = false; // Remove admin status if they are no longer the admin
                await KV.put(`user:${telegramId}`, JSON.stringify(user));
            }
        }

        const token = generateToken();
        const session = {
            telegramId,
            isAdmin: user.isAdmin,
            isVip: user.isVip,
            createdAt: Date.now(),
            expiresAt: Date.now() + (7 * 24 * 60 * 60 * 1000)
        };

        await KV.put(`session:${token}`, JSON.stringify(session));

        return res.json({ 
            success: true, 
            token,
            user: {
                telegramId: user.telegramId,
                isAdmin: user.isAdmin,
                isVip: user.isVip,
                isNewUser
            },
            message: isNewUser ? 'ثبت نام موفق' : 'ورود موفق'
        });
    } catch (error) {
        console.error('Verify error:', error);
        return res.status(500).json({ 
            success: false, 
            error: 'خطای سرور' 
        });
    }
});

async function verifyToken(authHeader) {
    if (!authHeader) return null;
    const token = authHeader.replace('Bearer ', '');
    const session = await KV.get(`session:${token}`, 'json');
    if (!session) return null;
    if (Date.now() > session.expiresAt) {
        await KV.delete(`session:${token}`);
        return null;
    }
    return session;
}

app.get('/api/auth/me', async (req, res) => {
    const session = await verifyToken(req.get('Authorization'));
    if (!session) {
        return res.status(401).json({ success: false, error: 'لطفا وارد شوید' });
    }
    return res.json({ success: true, user: session });
});

app.post('/api/auth/logout', async (req, res) => {
    const authHeader = req.get('Authorization');
    if (authHeader) {
        const token = authHeader.replace('Bearer ', '');
        await KV.delete(`session:${token}`);
    }
    return res.json({ success: true, message: 'خروج موفق' });
});

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

function flagFromCode(code) {
    if (!code || code.length !== 2) return '';
    const upperCode = code.toUpperCase();
    return String.fromCodePoint(...upperCode.split('').map(c => c.charCodeAt(0) + 127397));
}

app.get('/api/countries', async (req, res) => {
    try {
        const customCountries = await KV.get('countries:list', 'json') || [];
        const allCountries = Object.entries(COUNTRY_DATA).map(([code, data]) => ({
            code,
            fa: data.fa,
            en: data.en,
            flag: flagFromCode(code)
        }));

        customCountries.forEach(country => {
            if (!allCountries.find(c => c.code === country.code)) {
                allCountries.push({
                    ...country,
                    flag: flagFromCode(country.code)
                });
            }
        });

        return res.json(allCountries);
    } catch (error) {
        console.error('Countries error:', error);
        return res.json(Object.entries(COUNTRY_DATA).map(([code, data]) => ({
            code, fa: data.fa, en: data.en, flag: flagFromCode(code)
        })));
    }
});

app.get('/api/announcements', async (req, res) => {
    try {
        const announcements = await KV.get('announcements:list', 'json') || [];
        return res.json({ success: true, announcements });
    } catch (error) {
        return res.json({ success: true, announcements: [] });
    }
});

const DNS_OPTIONS = [
    { name: "شکن", ip: "178.22.122.100" },
    { name: "403", ip: "10.202.10.202" },
    { name: "رادار", ip: "10.202.10.10" },
    { name: "الکترو", ip: "78.157.42.100" },
    { name: "بگذر", ip: "185.51.200.2" },
    { name: "Cloudflare", ip: "1.1.1.1" },
    { name: "Google", ip: "8.8.8.8" }
];

const OPERATORS = {
    irancell: { title: "ایرانسل", addresses: ["2.144.0.0/16"], addressesV6: ["2a01:5ec0:1000::1/128"] },
    mci: { title: "همراه اول", addresses: ["5.52.0.0/16"], addressesV6: ["2a02:4540::1/128"] },
    tci: { title: "مخابرات", addresses: ["2.176.0.0/15"], addressesV6: ["2a04:2680:13::1/128"] },
    rightel: { title: "رایتل", addresses: ["37.137.128.0/17"], addressesV6: ["2a03:ef42::1/128"] },
    shatel: { title: "شاتل موبایل", addresses: ["94.182.0.0/16"], addressesV6: ["2a0e::1/128"] }
};

const WG_MTUS = [1280, 1320, 1360, 1380, 1400, 1420, 1440, 1480, 1500];

app.get('/api/config/operators', (req, res) => {
    res.json(Object.entries(OPERATORS).map(([id, data]) => ({ id, title: data.title })));
});

app.get('/api/config/dns-options', (req, res) => {
    res.json(DNS_OPTIONS);
});

function randBase64(len = 32) {
    return crypto.randomBytes(len).toString('base64');
}

function pickRandom(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

app.post('/api/config/generate-wireguard', async (req, res) => {
    try {
        const { country, operator, dns, ipVersion } = req.body;

        if (!country) {
            return res.status(400).json({ success: false, error: 'کشور انتخاب نشده است' });
        }

        const countryCode = country.toUpperCase();
        const countryData = COUNTRY_DATA[countryCode];

        if (!countryData) {
            return res.status(400).json({ success: false, error: 'کشور نامعتبر است' });
        }

        const countryAddresses = await KV.get(`country:${countryCode}:addresses`, 'json') || {};

        const privateKey = randBase64(32);
        const publicKey = randBase64(32);
        const presharedKey = randBase64(32);
        const mtu = pickRandom(WG_MTUS);
        const selectedDns = dns || pickRandom(DNS_OPTIONS).ip;

        let address, allowedIPs, endpoint;
        const port = 51820 + Math.floor(Math.random() * 100);

        if (ipVersion === 'ipv6') {
            if (countryAddresses.ipv6 && countryAddresses.ipv6.length > 0) {
                address = pickRandom(countryAddresses.ipv6);
            } else {
                address = `fd00:${countryCode.charCodeAt(0).toString(16)}${countryCode.charCodeAt(1).toString(16)}::${Math.floor(Math.random() * 65535).toString(16)}/128`;
            }
            allowedIPs = "::/0, 0.0.0.0/0";
            endpoint = `wg-${countryCode.toLowerCase()}.ipv6.example.com:${port}`;
        } else {
            if (countryAddresses.ipv4 && countryAddresses.ipv4.length > 0) {
                address = pickRandom(countryAddresses.ipv4);
            } else {
                const octet2 = countryCode.charCodeAt(0);
                const octet3 = countryCode.charCodeAt(1);
                address = `10.${octet2 % 256}.${octet3 % 256}.${Math.floor(Math.random() * 254) + 1}/32`;
            }
            allowedIPs = "0.0.0.0/0, ::/0";
            endpoint = `wg-${countryCode.toLowerCase()}.example.com:${port}`;
        }

        let operatorInfo = '';
        if (operator && OPERATORS[operator]) {
            operatorInfo = `\n# Operator: ${OPERATORS[operator].title}`;
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

        return res.json({
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
    } catch (error) {
        console.error('Config error:', error);
        return res.status(500).json({ success: false, error: 'خطای سرور' });
    }
});

app.post('/api/config/generate-dns', async (req, res) => {
    try {
        const { country, ipVersion } = req.body;

        if (!country) {
            return res.status(400).json({ success: false, error: 'کشور انتخاب نشده است' });
        }

        const countryCode = country.toUpperCase();
        const countryData = COUNTRY_DATA[countryCode];

        if (!countryData) {
            return res.status(400).json({ success: false, error: 'کشور نامعتبر است' });
        }

        const countryDns = await KV.get(`country:${countryCode}:dns`, 'json') || {};

        let dnsConfig;
        if (ipVersion === 'ipv6') {
            if (countryDns.ipv6) {
                dnsConfig = countryDns.ipv6;
            } else {
                const octet1 = countryCode.charCodeAt(0);
                const octet2 = countryCode.charCodeAt(1);
                dnsConfig = {
                    primary: `2001:${octet1.toString(16)}${octet2.toString(16)}:4860::8888`,
                    secondary: `2001:${octet1.toString(16)}${octet2.toString(16)}:4860::8844`
                };
            }
        } else {
            if (countryDns.ipv4) {
                dnsConfig = countryDns.ipv4;
            } else {
                const octet1 = countryCode.charCodeAt(0);
                const octet2 = countryCode.charCodeAt(1);
                dnsConfig = {
                    primary: `${octet1 % 200 + 50}.${octet2 % 200 + 50}.${Math.floor(Math.random() * 200) + 50}.${Math.floor(Math.random() * 254) + 1}`,
                    secondary: `${octet1 % 200 + 50}.${octet2 % 200 + 50}.${Math.floor(Math.random() * 200) + 50}.${Math.floor(Math.random() * 254) + 1}`
                };
            }
        }

        return res.json({
            success: true,
            country: countryData.fa,
            countryEn: countryData.en,
            countryCode,
            flag: flagFromCode(country),
            dns: dnsConfig,
            ipVersion: ipVersion || 'ipv4',
            generated: new Date().toLocaleString('fa-IR')
        });
    } catch (error) {
        console.error('DNS config error:', error);
        return res.status(500).json({ success: false, error: 'خطای سرور' });
    }
});

async function adminAuth(req, res, next) {
    const session = await verifyToken(req.get('Authorization'));
    if (!session || !session.isAdmin) {
        return res.status(403).json({ success: false, error: 'دسترسی غیرمجاز' });
    }
    req.user = session;
    next();
}

app.get('/api/admin/stats', adminAuth, async (req, res) => {
    try {
        const usersList = await KV.get('users:list', 'json') || [];
        const countries = await KV.get('countries:list', 'json') || [];
        let totalConfigs = 0, vipCount = 0, adminCount = 0;

        for (const telegramId of usersList) {
            const userData = await KV.get(`user:${telegramId}`, 'json');
            if (userData) {
                totalConfigs += userData.configCount || 0;
                if (userData.isVip) vipCount++;
                if (userData.isAdmin) adminCount++;
            }
        }

        return res.json({
            success: true,
            stats: {
                totalUsers: usersList.length,
                vipUsers: vipCount,
                adminUsers: adminCount,
                totalConfigs,
                totalCountries: countries.length,
                kvConnected: true,
                botTokenConfigured: !!env.BOT_TOKEN
            }
        });
    } catch (error) {
        return res.status(500).json({ success: false, error: 'خطای سرور' });
    }
});

app.get('/api/admin/users', adminAuth, async (req, res) => {
    try {
        const usersList = await KV.get('users:list', 'json') || [];
        const users = [];

        for (const telegramId of usersList) {
            const userData = await KV.get(`user:${telegramId}`, 'json');
            if (userData) users.push(userData);
        }

        return res.json({ success: true, users, total: users.length });
    } catch (error) {
        return res.status(500).json({ success: false, error: 'خطای سرور' });
    }
});

app.get('/api/admin/countries', adminAuth, async (req, res) => {
    try {
        const countries = await KV.get('countries:list', 'json') || [];
        return res.json({ success: true, countries });
    } catch (error) {
        return res.status(500).json({ success: false, error: 'خطای سرور' });
    }
});

app.get('/api/admin/settings', adminAuth, async (req, res) => {
    try {
        const settings = await KV.get('settings:global', 'json') || {
            channelId: '',
            channelUsername: '',
            websiteUrl: '',
            maintenanceMode: false
        };
        return res.json({ success: true, settings });
    } catch (error) {
        return res.status(500).json({ success: false, error: 'خطای سرور' });
    }
});

app.post('/api/admin/country/add', adminAuth, async (req, res) => {
    try {
        const { code, fa, en, ipv4Addresses, ipv6Addresses, dnsIpv4Primary, dnsIpv4Secondary, dnsIpv6Primary, dnsIpv6Secondary } = req.body;

        if (!code || !fa || !en) {
            return res.status(400).json({ success: false, error: 'کد کشور، نام فارسی و انگلیسی الزامی است' });
        }

        const countries = await KV.get('countries:list', 'json') || [];
        const countryCode = code.toUpperCase();

        const existingIndex = countries.findIndex(c => c.code === countryCode);

        const countryData = { code: countryCode, fa, en };

        if (existingIndex >= 0) {
            countries[existingIndex] = countryData;
        } else {
            countries.push(countryData);
        }

        await KV.put('countries:list', JSON.stringify(countries));

        if (ipv4Addresses || ipv6Addresses) {
            const addresses = {
                ipv4: ipv4Addresses ? ipv4Addresses.split('\n').map(a => a.trim()).filter(a => a) : [],
                ipv6: ipv6Addresses ? ipv6Addresses.split('\n').map(a => a.trim()).filter(a => a) : []
            };
            await KV.put(`country:${countryCode}:addresses`, JSON.stringify(addresses));
        }

        if (dnsIpv4Primary || dnsIpv6Primary) {
            const dns = {
                ipv4: dnsIpv4Primary ? { primary: dnsIpv4Primary, secondary: dnsIpv4Secondary || '' } : null,
                ipv6: dnsIpv6Primary ? { primary: dnsIpv6Primary, secondary: dnsIpv6Secondary || '' } : null
            };
            await KV.put(`country:${countryCode}:dns`, JSON.stringify(dns));
        }

        return res.json({ success: true, message: 'کشور ذخیره شد' });
    } catch (error) {
        console.error('Add country error:', error);
        return res.status(500).json({ success: false, error: 'خطای سرور' });
    }
});

app.post('/api/admin/country/delete', adminAuth, async (req, res) => {
    try {
        const { code } = req.body;
        if (!code) {
            return res.status(400).json({ success: false, error: 'کد کشور الزامی است' });
        }

        const countries = await KV.get('countries:list', 'json') || [];
        const newCountries = countries.filter(c => c.code !== code.toUpperCase());
        await KV.put('countries:list', JSON.stringify(newCountries));

        await KV.delete(`country:${code.toUpperCase()}:addresses`);
        await KV.delete(`country:${code.toUpperCase()}:dns`);

        return res.json({ success: true, message: 'کشور حذف شد' });
    } catch (error) {
        return res.status(500).json({ success: false, error: 'خطای سرور' });
    }
});

app.get('/api/admin/country/:code/addresses', adminAuth, async (req, res) => {
    try {
        const code = req.params.code.toUpperCase();
        const addresses = await KV.get(`country:${code}:addresses`, 'json') || { ipv4: [], ipv6: [] };
        const dns = await KV.get(`country:${code}:dns`, 'json') || { ipv4: null, ipv6: null };
        return res.json({ success: true, addresses, dns });
    } catch (error) {
        return res.status(500).json({ success: false, error: 'خطای سرور' });
    }
});

app.post('/api/admin/user/update', adminAuth, async (req, res) => {
    try {
        const { telegramId, isVip, isAdmin } = req.body;
        if (!telegramId) {
            return res.status(400).json({ success: false, error: 'آیدی کاربر الزامی است' });
        }

        const userData = await KV.get(`user:${telegramId}`, 'json');
        if (!userData) {
            return res.status(404).json({ success: false, error: 'کاربر یافت نشد' });
        }

        if (typeof isVip === 'boolean') userData.isVip = isVip;
        if (typeof isAdmin === 'boolean') userData.isAdmin = isAdmin;

        await KV.put(`user:${telegramId}`, JSON.stringify(userData));
        return res.json({ success: true, message: 'کاربر بروزرسانی شد', user: userData });
    } catch (error) {
        return res.status(500).json({ success: false, error: 'خطای سرور' });
    }
});

app.post('/api/admin/user/delete', adminAuth, async (req, res) => {
    try {
        const { telegramId } = req.body;
        if (!telegramId) {
            return res.status(400).json({ success: false, error: 'آیدی کاربر الزامی است' });
        }

        await KV.delete(`user:${telegramId}`);
        const usersList = await KV.get('users:list', 'json') || [];
        const newList = usersList.filter(id => id !== telegramId);
        await KV.put('users:list', JSON.stringify(newList));

        return res.json({ success: true, message: 'کاربر حذف شد' });
    } catch (error) {
        return res.status(500).json({ success: false, error: 'خطای سرور' });
    }
});

app.post('/api/admin/settings/update', adminAuth, async (req, res) => {
    try {
        const { channelId, channelUsername, websiteUrl, maintenanceMode } = req.body;
        const settings = await KV.get('settings:global', 'json') || {};

        if (channelId !== undefined) settings.channelId = channelId;
        if (channelUsername !== undefined) settings.channelUsername = channelUsername;
        if (websiteUrl !== undefined) settings.websiteUrl = websiteUrl;
        if (maintenanceMode !== undefined) settings.maintenanceMode = maintenanceMode;

        await KV.put('settings:global', JSON.stringify(settings));
        return res.json({ success: true, message: 'تنظیمات ذخیره شد', settings });
    } catch (error) {
        return res.status(500).json({ success: false, error: 'خطای سرور' });
    }
});

app.post('/api/admin/broadcast', adminAuth, async (req, res) => {
    try {
        const { message } = req.body;
        if (!message) {
            return res.status(400).json({ success: false, error: 'پیام الزامی است' });
        }

        const usersList = await KV.get('users:list', 'json') || [];
        const botToken = env.BOT_TOKEN;

        if (!botToken) {
            return res.status(500).json({ success: false, error: 'توکن ربات تنظیم نشده است' });
        }

        let sent = 0, failed = 0;

        for (const telegramId of usersList) {
            const result = await sendTelegramMessage(botToken, telegramId, message);
            if (result.ok) sent++; else failed++;
        }

        return res.json({ 
            success: true, 
            message: `پیام به ${sent} کاربر ارسال شد، ${failed} ناموفق`,
            sent,
            failed
        });
    } catch (error) {
        return res.status(500).json({ success: false, error: 'خطای سرور' });
    }
});

app.get('*', async (req, res) => {
    try {
        const filePath = join(__dirname, 'public', req.path);
        const stat = await fs.stat(filePath);
        if (stat.isFile()) {
            return res.sendFile(filePath);
        }

        const indexPath = join(__dirname, 'public', 'index.html');
        const content = await fs.readFile(indexPath, 'utf-8');
        res.send(content);
    } catch (error) {
        const indexPath = join(__dirname, 'public', 'index.html');
        try {
            const content = await fs.readFile(indexPath, 'utf-8');
            res.send(content);
        } catch {
            res.status(404).send('Page not found');
        }
    }
});

await loadInitialData();

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
});
