import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import Database from 'better-sqlite3';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = 5000;

app.use(express.json());
app.use(express.static(join(__dirname, 'public')));

app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, DELETE, PUT, PATCH, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.header('Cache-Control', 'no-cache, no-store, must-revalidate');
    if (req.method === 'OPTIONS') {
        return res.sendStatus(200);


// Simple in-memory rate limiter
const rateLimitMap = new Map();

function rateLimit(req, res, next) {
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    const now = Date.now();
    const windowMs = 60 * 1000; // 1 minute
    const maxRequests = 100; // max requests per window

    if (!rateLimitMap.has(ip)) {
        rateLimitMap.set(ip, { count: 1, resetTime: now + windowMs });
        return next();
    }

    const record = rateLimitMap.get(ip);
    
    if (now > record.resetTime) {
        record.count = 1;
        record.resetTime = now + windowMs;
        return next();
    }

    if (record.count >= maxRequests) {
        return res.status(429).json({ error: 'تعداد درخواست‌های شما زیاد است. لطفا کمی صبر کنید.' });
    }

    record.count++;
    next();
}

app.use('/api/', rateLimit);

    }
    next();
});

const db = new Database('data.db');

db.exec(`
    CREATE TABLE IF NOT EXISTS kv_store (
        key TEXT PRIMARY KEY,
        value TEXT,
        expires_at INTEGER
    )
`);

function kvGet(key) {
    const row = db.prepare('SELECT value, expires_at FROM kv_store WHERE key = ?').get(key);
    if (!row) return null;
    if (row.expires_at && row.expires_at < Date.now()) {
        db.prepare('DELETE FROM kv_store WHERE key = ?').run(key);
        return null;
    }
    return row.value;
}

function kvPut(key, value, expirationTtl = null) {
    const expiresAt = expirationTtl ? Date.now() + (expirationTtl * 1000) : null;
    db.prepare('INSERT OR REPLACE INTO kv_store (key, value, expires_at) VALUES (?, ?, ?)').run(key, value, expiresAt);
}

function kvDelete(key) {
    db.prepare('DELETE FROM kv_store WHERE key = ?').run(key);
}

function kvList(prefix) {
    const rows = db.prepare('SELECT key, value FROM kv_store WHERE key LIKE ?').all(prefix + '%');
    return rows.filter(row => {
        if (row.expires_at && row.expires_at < Date.now()) {
            db.prepare('DELETE FROM kv_store WHERE key = ?').run(row.key);
            return false;
        }
        return true;
    }).map(row => ({ key: row.key, value: row.value }));
}

const ENV = {
    ADMIN_ID: process.env.ADMIN_ID || '7240662021',
    BOT_TOKEN: process.env.BOT_TOKEN || '',
    WEBSITE_URL: process.env.WEBSITE_URL || 'https://free-config.pages.dev/'
};

function generateCode() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

async function hashCode(code) {
    const hash = crypto.createHash('sha256');
    hash.update(code);
    return hash.digest('hex');
}

async function hashPassword(password) {
    return bcrypt.hash(password, 10);
}

async function verifyPassword(password, hash) {
    return bcrypt.compare(password, hash);
}

async function sendTelegramMessage(botToken, chatId, text) {
    if (!botToken) return { ok: false };
    
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
        return { ok: false };
    }
}

function getUser(telegramId) {
    const userData = kvGet(`user:${telegramId}`);
    return userData ? JSON.parse(userData) : null;
}

function saveUser(user) {
    kvPut(`user:${user.telegramId}`, JSON.stringify(user));
    
    const usersIndexData = kvGet('users:index');
    let usersIndex = usersIndexData ? JSON.parse(usersIndexData) : [];
    if (!usersIndex.includes(user.telegramId)) {
        usersIndex.push(user.telegramId);
        kvPut('users:index', JSON.stringify(usersIndex));
    }
}

function updateUser(telegramId, updates) {
    const user = getUser(telegramId);
    if (!user) return null;
    const updatedUser = { ...user, ...updates, updatedAt: Date.now() };
    kvPut(`user:${telegramId}`, JSON.stringify(updatedUser));
    return updatedUser;
}

function getAllUsers() {
    const usersIndexData = kvGet('users:index');
    const usersIndex = usersIndexData ? JSON.parse(usersIndexData) : [];
    return usersIndex.map(telegramId => getUser(telegramId)).filter(Boolean);
}

function getSession(token) {
    if (!token) return null;
    const sessionData = kvGet(`session:${token}`);
    if (!sessionData) return null;
    const session = JSON.parse(sessionData);
    if (session.expiresAt < Date.now()) {
        kvDelete(`session:${token}`);
        return null;
    }
    return session;
}

function createSession(telegramId, isAdmin = false) {
    const sessionToken = crypto.randomUUID();
    const sessionData = {
        telegramId,
        isAdmin,
        createdAt: Date.now(),
        expiresAt: Date.now() + (24 * 60 * 60 * 1000)
    };
    kvPut(`session:${sessionToken}`, JSON.stringify(sessionData), 86400);
    return { token: sessionToken, ...sessionData };
}

function getUserLimits(telegramId) {
    const today = new Date().toISOString().split('T')[0];
    const key = `limits:${telegramId}:${today}`;
    const data = kvGet(key);
    if (!data) return { wireguard: 0, dns: 0 };
    return JSON.parse(data);
}

function incrementLimit(telegramId, type) {
    const today = new Date().toISOString().split('T')[0];
    const key = `limits:${telegramId}:${today}`;
    const limits = getUserLimits(telegramId);
    limits[type] = (limits[type] || 0) + 1;
    kvPut(key, JSON.stringify(limits), 86400 * 2);
    return limits;
}

function isAdmin(telegramId) {
    return telegramId === ENV.ADMIN_ID;
}

function saveToHistory(telegramId, type, data) {
    const historyKey = `history:${telegramId}`;
    let history = [];
    const existingData = kvGet(historyKey);
    if (existingData) {
        history = JSON.parse(existingData);
    }
    const entry = {
        id: crypto.randomUUID(),
        type,
        data,
        createdAt: Date.now()
    };
    history.unshift(entry);
    if (history.length > 50) {
        history = history.slice(0, 50);
    }
    kvPut(historyKey, JSON.stringify(history));
    return entry;
}

app.post('/api/auth/request', async (req, res) => {
    const { telegramId } = req.body;

    if (!telegramId || !/^\d{5,15}$/.test(telegramId)) {
        return res.status(400).json({ error: 'شناسه تلگرام نامعتبر است' });
    }

    const rateLimitKey = `ratelimit:${telegramId}`;
    const rateLimit = kvGet(rateLimitKey);
    if (rateLimit) {
        const data = JSON.parse(rateLimit);
        if (data.count >= 5 && Date.now() < data.resetAt) {
            return res.status(429).json({ error: 'تعداد درخواست‌های شما زیاد است. لطفا کمی صبر کنید.' });
        }
    }

    const code = generateCode();
    const codeHash = await hashCode(code);
    const expiresAt = Date.now() + (5 * 60 * 1000);

    kvPut(`verification:${telegramId}`, JSON.stringify({
        codeHash,
        expiresAt,
        attempts: 0
    }), 300);

    const rateData = { count: 1, resetAt: Date.now() + (60 * 60 * 1000) };
    const existing = kvGet(rateLimitKey);
    if (existing) {
        const data = JSON.parse(existing);
        if (Date.now() < data.resetAt) {
            rateData.count = data.count + 1;
            rateData.resetAt = data.resetAt;
        }
    }
    kvPut(rateLimitKey, JSON.stringify(rateData), 3600);

    const message = `🔐 <b>کد تایید سرویس گیمینگ</b>\n\nکد تایید شما: <code>${code}</code>\n\nاین کد 5 دقیقه اعتبار دارد.\n\n📢 کانال ما: @ROOTLeaker`;

    if (!ENV.BOT_TOKEN) {
        console.log(`[DEV MODE] کد تایید برای ${telegramId}: ${code}`);
        return res.json({
            success: true,
            message: 'کد تایید ارسال شد (حالت توسعه)',
            devCode: code
        });
    }

    const result = await sendTelegramMessage(ENV.BOT_TOKEN, telegramId, message);

    if (!result.ok) {
        return res.status(400).json({ error: 'ارسال کد ناموفق بود. ابتدا به ربات @jojo85_robot پیام دهید و دستور /start را ارسال کنید.' });
    }

    res.json({ success: true, message: 'کد تایید به تلگرام شما ارسال شد' });
});

app.post('/api/auth/verify', async (req, res) => {
    const { telegramId, code } = req.body;

    if (!telegramId || !code || code.length !== 6) {
        return res.status(400).json({ error: 'درخواست نامعتبر' });
    }

    const stored = kvGet(`verification:${telegramId}`);
    if (!stored) {
        return res.status(400).json({ error: 'کد تایید منقضی شده یا یافت نشد' });
    }

    const storedData = JSON.parse(stored);

    if (Date.now() > storedData.expiresAt) {
        kvDelete(`verification:${telegramId}`);
        return res.status(400).json({ error: 'کد تایید منقضی شده است' });
    }

    if (storedData.attempts >= 3) {
        kvDelete(`verification:${telegramId}`);
        return res.status(400).json({ error: 'تلاش‌های ناموفق زیاد. لطفا کد جدید درخواست کنید.' });
    }

    const submittedHash = await hashCode(code);

    if (submittedHash !== storedData.codeHash) {
        storedData.attempts += 1;
        kvPut(`verification:${telegramId}`, JSON.stringify(storedData), Math.floor((storedData.expiresAt - Date.now()) / 1000));
        return res.status(400).json({ error: 'کد تایید اشتباه است' });
    }

    kvDelete(`verification:${telegramId}`);

    let user = getUser(telegramId);
    if (!user) {
        user = {
            telegramId,
            createdAt: Date.now(),
            updatedAt: Date.now(),
            hasPassword: false,
            passwordHash: null,
            lastLoginAt: Date.now()
        };
    } else {
        user.lastLoginAt = Date.now();
        user.updatedAt = Date.now();
    }
    saveUser(user);

    const session = createSession(telegramId, isAdmin(telegramId));

    res.json({
        success: true,
        token: session.token,
        telegramId,
        hasPassword: user.hasPassword,
        createdAt: session.createdAt
    });
});

app.post('/api/auth/check-password', (req, res) => {
    const { telegramId } = req.body;

    if (!telegramId || !/^\d{5,15}$/.test(telegramId)) {
        return res.status(400).json({ error: 'شناسه تلگرام نامعتبر است' });
    }

    const user = getUser(telegramId);
    
    res.json({
        exists: !!user,
        hasPassword: user?.hasPassword || false
    });
});

app.post('/api/auth/login', async (req, res) => {
    const { telegramId, password } = req.body;

    if (!telegramId || !password) {
        return res.status(400).json({ error: 'شناسه و رمز عبور الزامی است' });
    }

    const rateLimitKey = `password_rl:${telegramId}`;
    const rateLimit = kvGet(rateLimitKey);
    if (rateLimit) {
        const data = JSON.parse(rateLimit);
        if (data.count >= 5 && Date.now() < data.resetAt) {
            return res.status(429).json({ error: 'تعداد تلاش‌های ناموفق زیاد است. لطفا 15 دقیقه صبر کنید.' });
        }
    }

    const user = getUser(telegramId);
    
    if (!user || !user.hasPassword) {
        return res.status(400).json({ error: 'این حساب رمز عبور ندارد. با کد تایید وارد شوید.' });
    }

    const isValid = await verifyPassword(password, user.passwordHash);

    if (!isValid) {
        const rateData = kvGet(rateLimitKey);
        let count = 1;
        if (rateData) {
            const data = JSON.parse(rateData);
            if (Date.now() < data.resetAt) {
                count = data.count + 1;
            }
        }
        kvPut(rateLimitKey, JSON.stringify({ count, resetAt: Date.now() + (15 * 60 * 1000) }), 900);
        return res.status(400).json({ error: 'رمز عبور اشتباه است' });
    }

    kvDelete(rateLimitKey);

    user.lastLoginAt = Date.now();
    user.updatedAt = Date.now();
    saveUser(user);

    const session = createSession(telegramId, isAdmin(telegramId));

    res.json({
        success: true,
        token: session.token,
        telegramId,
        hasPassword: true,
        createdAt: session.createdAt
    });
});

app.post('/api/profile/set-password', async (req, res) => {
    const token = req.headers.authorization?.replace('Bearer ', '');
    const session = getSession(token);

    if (!session) {
        return res.status(401).json({ error: 'احراز هویت نشده' });
    }

    const { password } = req.body;

    if (!password || password.length < 4) {
        return res.status(400).json({ error: 'رمز عبور باید حداقل ۴ کاراکتر باشد' });
    }

    const passwordHash = await hashPassword(password);
    
    const user = getUser(session.telegramId);
    if (!user) {
        return res.status(400).json({ error: 'کاربر یافت نشد' });
    }

    user.hasPassword = true;
    user.passwordHash = passwordHash;
    user.passwordSetAt = Date.now();
    user.updatedAt = Date.now();
    saveUser(user);

    res.json({ success: true, message: 'رمز عبور با موفقیت تنظیم شد' });
});

app.post('/api/profile/change-password', async (req, res) => {
    const token = req.headers.authorization?.replace('Bearer ', '');
    const session = getSession(token);

    if (!session) {
        return res.status(401).json({ error: 'احراز هویت نشده' });
    }

    const { currentPassword, newPassword } = req.body;

    if (!newPassword || newPassword.length < 4) {
        return res.status(400).json({ error: 'رمز عبور جدید باید حداقل ۴ کاراکتر باشد' });
    }

    const user = getUser(session.telegramId);
    if (!user) {
        return res.status(400).json({ error: 'کاربر یافت نشد' });
    }

    if (user.hasPassword && currentPassword) {
        const isValid = await verifyPassword(currentPassword, user.passwordHash);
        if (!isValid) {
            return res.status(400).json({ error: 'رمز عبور فعلی اشتباه است' });
        }
    }

    const passwordHash = await hashPassword(newPassword);
    
    user.hasPassword = true;
    user.passwordHash = passwordHash;
    user.passwordChangedAt = Date.now();
    user.updatedAt = Date.now();
    saveUser(user);

    res.json({ success: true, message: 'رمز عبور با موفقیت تغییر کرد' });
});

app.post('/api/auth/forgot-password', async (req, res) => {
    const { telegramId } = req.body;

    if (!telegramId || !/^\d{5,15}$/.test(telegramId)) {
        return res.status(400).json({ error: 'شناسه تلگرام نامعتبر است' });
    }

    const user = getUser(telegramId);
    if (!user) {
        return res.status(400).json({ error: 'حساب کاربری با این شناسه یافت نشد' });
    }

    const rateLimitKey = `forgot_rl:${telegramId}`;
    const rateLimit = kvGet(rateLimitKey);
    if (rateLimit) {
        const data = JSON.parse(rateLimit);
        if (data.count >= 3 && Date.now() < data.resetAt) {
            return res.status(429).json({ error: 'تعداد درخواست‌های شما زیاد است. لطفا کمی صبر کنید.' });
        }
    }

    const code = generateCode();
    const codeHash = await hashCode(code);
    const expiresAt = Date.now() + (5 * 60 * 1000);

    kvPut(`reset_password:${telegramId}`, JSON.stringify({
        codeHash,
        expiresAt,
        attempts: 0
    }), 300);

    const rateData = { count: 1, resetAt: Date.now() + (60 * 60 * 1000) };
    const existing = kvGet(rateLimitKey);
    if (existing) {
        const data = JSON.parse(existing);
        if (Date.now() < data.resetAt) {
            rateData.count = data.count + 1;
            rateData.resetAt = data.resetAt;
        }
    }
    kvPut(rateLimitKey, JSON.stringify(rateData), 3600);

    const message = `🔐 <b>بازیابی رمز عبور</b>\n\nکد بازیابی شما: <code>${code}</code>\n\nاین کد 5 دقیقه اعتبار دارد.`;

    if (!ENV.BOT_TOKEN) {
        console.log(`[DEV MODE] کد بازیابی برای ${telegramId}: ${code}`);
        return res.json({
            success: true,
            message: 'کد بازیابی ارسال شد (حالت توسعه)',
            devCode: code
        });
    }

    const result = await sendTelegramMessage(ENV.BOT_TOKEN, telegramId, message);

    if (!result.ok) {
        return res.status(400).json({ error: 'ارسال کد ناموفق بود.' });
    }

    res.json({ success: true, message: 'کد بازیابی به تلگرام شما ارسال شد' });
});

app.post('/api/auth/reset-password', async (req, res) => {
    const { telegramId, code, newPassword } = req.body;

    if (!telegramId || !code || code.length !== 6 || !newPassword) {
        return res.status(400).json({ error: 'درخواست نامعتبر' });
    }

    if (newPassword.length < 4) {
        return res.status(400).json({ error: 'رمز عبور باید حداقل ۴ کاراکتر باشد' });
    }

    const stored = kvGet(`reset_password:${telegramId}`);
    if (!stored) {
        return res.status(400).json({ error: 'کد بازیابی منقضی شده یا یافت نشد' });
    }

    const storedData = JSON.parse(stored);

    if (Date.now() > storedData.expiresAt) {
        kvDelete(`reset_password:${telegramId}`);
        return res.status(400).json({ error: 'کد بازیابی منقضی شده است' });
    }

    if (storedData.attempts >= 3) {
        kvDelete(`reset_password:${telegramId}`);
        return res.status(400).json({ error: 'تلاش‌های ناموفق زیاد. لطفا کد جدید درخواست کنید.' });
    }

    const submittedHash = await hashCode(code);

    if (submittedHash !== storedData.codeHash) {
        storedData.attempts += 1;
        kvPut(`reset_password:${telegramId}`, JSON.stringify(storedData), Math.floor((storedData.expiresAt - Date.now()) / 1000));
        return res.status(400).json({ error: 'کد بازیابی اشتباه است' });
    }

    kvDelete(`reset_password:${telegramId}`);

    const user = getUser(telegramId);
    if (!user) {
        return res.status(400).json({ error: 'کاربر یافت نشد' });
    }

    const passwordHash = await hashPassword(newPassword);
    user.hasPassword = true;
    user.passwordHash = passwordHash;
    user.passwordChangedAt = Date.now();
    user.updatedAt = Date.now();
    saveUser(user);

    const session = createSession(telegramId, isAdmin(telegramId));

    res.json({
        success: true,
        message: 'رمز عبور با موفقیت تغییر کرد',
        token: session.token,
        telegramId
    });
});

app.get('/api/profile', (req, res) => {
    const token = req.headers.authorization?.replace('Bearer ', '');
    const session = getSession(token);

    if (!session) {
        return res.status(401).json({ error: 'احراز هویت نشده' });
    }

    const user = getUser(session.telegramId);
    const userIsAdmin = isAdmin(session.telegramId);
    const limits = getUserLimits(session.telegramId);

    res.json({
        telegramId: session.telegramId,
        hasPassword: user?.hasPassword || false,
        isAdmin: userIsAdmin,
        createdAt: user?.createdAt,
        lastLoginAt: user?.lastLoginAt,
        limits: {
            wireguardRemaining: userIsAdmin ? -1 : Math.max(0, 3 - (limits.wireguard || 0)),
            dnsRemaining: userIsAdmin ? -1 : Math.max(0, 3 - (limits.dns || 0)),
            wireguardUsed: limits.wireguard || 0,
            dnsUsed: limits.dns || 0
        }
    });
});

app.post('/api/admin/auth/request', async (req, res) => {
    const { telegramId } = req.body;

    if (!telegramId || telegramId !== ENV.ADMIN_ID) {
        return res.status(400).json({ error: 'شناسه تلگرام نامعتبر است یا دسترسی ادمین ندارید' });
    }

    const code = generateCode();
    const codeHash = await hashCode(code);
    const expiresAt = Date.now() + (5 * 60 * 1000);

    kvPut(`admin_verification:${telegramId}`, JSON.stringify({
        codeHash,
        expiresAt,
        attempts: 0
    }), 300);

    const message = `🔐 <b>کد تایید پنل مدیریت</b>\n\nکد تایید: <code>${code}</code>\n\nاین کد 5 دقیقه اعتبار دارد.`;

    if (!ENV.BOT_TOKEN) {
        console.log(`[DEV MODE] کد ادمین برای ${telegramId}: ${code}`);
        return res.json({
            success: true,
            message: 'کد تایید ارسال شد (حالت توسعه)',
            devCode: code
        });
    }

    const result = await sendTelegramMessage(ENV.BOT_TOKEN, telegramId, message);

    if (!result.ok) {
        return res.status(400).json({ error: 'ارسال کد ناموفق بود.' });
    }

    res.json({ success: true, message: 'کد تایید به تلگرام شما ارسال شد' });
});

app.post('/api/admin/auth/verify', async (req, res) => {
    const { telegramId, code } = req.body;

    if (!telegramId || !code || telegramId !== ENV.ADMIN_ID) {
        return res.status(400).json({ error: 'درخواست نامعتبر' });
    }

    const stored = kvGet(`admin_verification:${telegramId}`);
    if (!stored) {
        return res.status(400).json({ error: 'کد تایید منقضی شده یا یافت نشد' });
    }

    const storedData = JSON.parse(stored);

    if (Date.now() > storedData.expiresAt) {
        kvDelete(`admin_verification:${telegramId}`);
        return res.status(400).json({ error: 'کد تایید منقضی شده است' });
    }

    const submittedHash = await hashCode(code);

    if (submittedHash !== storedData.codeHash) {
        storedData.attempts += 1;
        kvPut(`admin_verification:${telegramId}`, JSON.stringify(storedData), Math.floor((storedData.expiresAt - Date.now()) / 1000));
        return res.status(400).json({ error: 'کد تایید اشتباه است' });
    }

    kvDelete(`admin_verification:${telegramId}`);

    let user = getUser(telegramId);
    if (!user) {
        user = {
            telegramId,
            createdAt: Date.now(),
            updatedAt: Date.now(),
            hasPassword: false,
            passwordHash: null,
            lastLoginAt: Date.now()
        };
    } else {
        user.lastLoginAt = Date.now();
        user.updatedAt = Date.now();
    }
    saveUser(user);

    const session = createSession(telegramId, true);

    res.json({
        success: true,
        token: session.token,
        telegramId,
        isAdmin: true
    });
});

app.get('/api/countries', (req, res) => {
    const token = req.headers.authorization?.replace('Bearer ', '');
    const session = getSession(token);

    if (!session) {
        return res.status(401).json({ error: 'احراز هویت نشده' });
    }

    const countriesData = kvGet('countries:list');
    const countries = countriesData ? JSON.parse(countriesData) : [];

    res.json({ countries });
});

app.get('/api/user/limits', (req, res) => {
    const token = req.headers.authorization?.replace('Bearer ', '');
    const session = getSession(token);

    if (!session) {
        return res.status(401).json({ error: 'احراز هویت نشده' });
    }

    const userIsAdmin = isAdmin(session.telegramId);
    const limits = getUserLimits(session.telegramId);

    res.json({
        wireguardRemaining: userIsAdmin ? -1 : Math.max(0, 3 - (limits.wireguard || 0)),
        dnsRemaining: userIsAdmin ? -1 : Math.max(0, 3 - (limits.dns || 0)),
        wireguardUsed: limits.wireguard || 0,
        dnsUsed: limits.dns || 0,
        isAdmin: userIsAdmin
    });
});

app.post('/api/config/generate', (req, res) => {
    const token = req.headers.authorization?.replace('Bearer ', '');
    const session = getSession(token);

    if (!session) {
        return res.status(401).json({ error: 'احراز هویت نشده' });
    }

    const userIsAdmin = isAdmin(session.telegramId);

    if (!userIsAdmin) {
        const limits = getUserLimits(session.telegramId);
        if ((limits.wireguard || 0) >= 3) {
            return res.status(429).json({ error: 'محدودیت روزانه شما تمام شده است' });
        }
    }

    const { locationId, dnsType = 'ipv4', operator, tunnelDns } = req.body;

    const countriesData = kvGet('countries:list');
    const countries = countriesData ? JSON.parse(countriesData) : [];
    const location = countries.find(c => c.id === locationId);

    if (!location) {
        return res.status(400).json({ error: 'کشور یافت نشد' });
    }

    if (!location.dns) {
        location.dns = { ipv4: [], ipv6: [] };
    }

    if (dnsType === 'ipv4') {
        if (!location.dns.ipv4 || location.dns.ipv4.length === 0) {
            return res.status(400).json({ error: 'این کشور آدرس IPv4 ندارد. موجودی فعلی: ' + (location.dns.ipv4?.length || 0) });
        }
    } else if (dnsType === 'ipv6') {
        if (!location.dns.ipv6 || location.dns.ipv6.length < 2) {
            return res.status(400).json({ error: 'این کشور آدرس IPv6 کافی ندارد. موجودی فعلی: ' + (location.dns.ipv6?.length || 0) });
        }
    }

    let dnsServers = [];
    if (dnsType === 'ipv4') {
        dnsServers.push(location.dns.ipv4[0]);
        location.dns.ipv4 = location.dns.ipv4.slice(1);
    } else if (dnsType === 'ipv6') {
        dnsServers.push(location.dns.ipv6[0]);
        dnsServers.push(location.dns.ipv6[1]);
        location.dns.ipv6 = location.dns.ipv6.slice(2);
    }

    const countryIndex = countries.findIndex(c => c.id === locationId);
    if (countryIndex !== -1) {
        countries[countryIndex] = location;
        kvPut('countries:list', JSON.stringify(countries));
    }

    const randomBytes = crypto.randomBytes(32);
    const privateKey = randomBytes.toString('base64');

    const operatorConfigs = {
        irancell: {
            title: "ایرانسل",
            addresses: ["2.144.0.0/16"],
            addressesV6: ["2a01:5ec0:1000::1/128", "2a01:5ec0:1000::2/128"]
        },
        mci: {
            title: "همراه اول",
            addresses: ["5.52.0.0/16"],
            addressesV6: ["2a02:4540::1/128", "2a02:4540::2/128"]
        },
        tci: {
            title: "مخابرات",
            addresses: ["2.176.0.0/15", "2.190.0.0/15"],
            addressesV6: ["2a04:2680:13::1/128", "2a04:2680:13::2/128"]
        },
        rightel: {
            title: "رایتل",
            addresses: ["37.137.128.0/17", "95.162.0.0/17"],
            addressesV6: ["2a03:ef42::1/128", "2a03:ef42::2/128"]
        },
        shatel: {
            title: "شاتل موبایل",
            addresses: ["94.182.0.0/16", "37.148.0.0/18"],
            addressesV6: ["2a0e::1/128", "2a0e::2/128"]
        }
    };

    let interfaceAddress = '';
    if (operator && operatorConfigs[operator]) {
        const opConfig = operatorConfigs[operator];
        if (dnsType === 'ipv4') {
            interfaceAddress = opConfig.addresses.join(', ');
        } else if (dnsType === 'ipv6') {
            interfaceAddress = opConfig.addressesV6.join(', ');
        }
    } else {
        interfaceAddress = dnsType === 'ipv4' ? '10.0.0.2/32' : 'fd00::2/128';
    }

    let configLines = [
        '[Interface]',
        '# تولید شده توسط سرویس گیمینگ',
        `# مکان: ${location.name}`,
        `# نوع: ${dnsType === 'ipv4' ? 'IPv4' : 'IPv6'}`
    ];

    if (operator && operatorConfigs[operator]) {
        configLines.push(`# اپراتور: ${operatorConfigs[operator].title}`);
    }

    if (tunnelDns) {
        configLines.push(`# DNS تانل: ${tunnelDns}`);
    }

    configLines.push(`PrivateKey = ${privateKey}`);
    configLines.push(`Address = ${interfaceAddress}`);

    if (tunnelDns) {
        configLines.push(`DNS = ${tunnelDns}`);
    } else {
        configLines.push(`DNS = ${dnsServers.join(', ')}`);
    }

    const config = configLines.join('\n');

    saveToHistory(session.telegramId, 'wireguard', {
        locationId,
        locationName: location.name,
        dnsType,
        dnsServers,
        operator: operator || null,
        tunnelDns: tunnelDns || null,
        config
    });

    if (!userIsAdmin) {
        incrementLimit(session.telegramId, 'wireguard');
    }

    res.json({
        success: true,
        config,
        location: location.name
    });
});

app.post('/api/dns/generate', (req, res) => {
    const token = req.headers.authorization?.replace('Bearer ', '');
    const session = getSession(token);

    if (!session) {
        return res.status(401).json({ error: 'احراز هویت نشده' });
    }

    const userIsAdmin = isAdmin(session.telegramId);

    if (!userIsAdmin) {
        const limits = getUserLimits(session.telegramId);
        if ((limits.dns || 0) >= 3) {
            return res.status(429).json({ error: 'محدودیت روزانه شما تمام شده است' });
        }
    }

    const { locationId, dnsType = 'ipv4' } = req.body;

    const countriesData = kvGet('countries:list');
    const countries = countriesData ? JSON.parse(countriesData) : [];
    const location = countries.find(c => c.id === locationId);

    if (!location) {
        return res.status(400).json({ error: 'کشور یافت نشد' });
    }

    if (!location.dns) {
        location.dns = { ipv4: [], ipv6: [] };
    }

    if (dnsType === 'ipv4') {
        if (!location.dns.ipv4 || location.dns.ipv4.length === 0) {
            return res.status(400).json({ error: 'این کشور آدرس IPv4 ندارد. موجودی فعلی: ' + (location.dns.ipv4?.length || 0) });
        }
    } else if (dnsType === 'ipv6') {
        if (!location.dns.ipv6 || location.dns.ipv6.length < 2) {
            return res.status(400).json({ error: 'این کشور آدرس IPv6 کافی ندارد. موجودی فعلی: ' + (location.dns.ipv6?.length || 0) });
        }
    }

    let dns = [];
    if (dnsType === 'ipv4') {
        dns.push(location.dns.ipv4[0]);
        location.dns.ipv4 = location.dns.ipv4.slice(1);
    } else if (dnsType === 'ipv6') {
        dns.push(location.dns.ipv6[0]);
        dns.push(location.dns.ipv6[1]);
        location.dns.ipv6 = location.dns.ipv6.slice(2);
    }

    const countryIndex = countries.findIndex(c => c.id === locationId);
    if (countryIndex !== -1) {
        countries[countryIndex] = location;
        kvPut('countries:list', JSON.stringify(countries));
    }

    let caption = null;
    if (dnsType === 'ipv4' && dns.length > 0) {
        caption = `🔧 برای تانل کردن ادرس های پیشنهادی:
• 178.22.122.100 - شاتل
• 185.51.200.2 - ایرانسل
• 10.202.10.10 - رادار
• 8.8.8.8 - گوگل
• 1.1.1.1 - کلودفلر
• 4.2.2.4 - لول 3
• 78.157.42.100 - الکترو

💡 نکته: برای بررسی فیلتر، فقط سرورهای ایران را چک کنید (باید 4/4 باشد)
https://check-host.net/check-ping?host=${dns[0]}`;
    }

    saveToHistory(session.telegramId, 'dns', {
        locationId,
        locationName: location.name,
        dnsType,
        dns
    });

    if (!userIsAdmin) {
        incrementLimit(session.telegramId, 'dns');
    }

    res.json({
        success: true,
        dns,
        location: location.name,
        caption
    });
});

app.get('/api/user/history', (req, res) => {
    const token = req.headers.authorization?.replace('Bearer ', '');
    const session = getSession(token);

    if (!session) {
        return res.status(401).json({ error: 'احراز هویت نشده' });
    }

    const historyKey = `history:${session.telegramId}`;
    const data = kvGet(historyKey);
    const history = data ? JSON.parse(data) : [];

    res.json({ history });
});

app.get('/api/announcements', (req, res) => {
    const announcementsData = kvGet('announcements:list');
    const announcements = announcementsData ? JSON.parse(announcementsData) : [];
    res.json({ announcements });
});

app.get('/api/admin/users', (req, res) => {
    const token = req.headers.authorization?.replace('Bearer ', '');
    const session = getSession(token);

    if (!session || !isAdmin(session.telegramId)) {
        return res.status(403).json({ error: 'دسترسی غیرمجاز' });
    }

    const users = getAllUsers();
    
    const usersWithLimits = users.map(user => {
        const limits = getUserLimits(user.telegramId);
        return {
            telegramId: user.telegramId,
            hasPassword: user.hasPassword || false,
            createdAt: user.createdAt,
            lastLoginAt: user.lastLoginAt,
            isAdmin: isAdmin(user.telegramId),
            limits: {
                wireguardUsed: limits.wireguard || 0,
                dnsUsed: limits.dns || 0
            }
        };
    });

    res.json({ users: usersWithLimits, total: usersWithLimits.length });
});

app.delete('/api/admin/users/:telegramId', (req, res) => {
    const token = req.headers.authorization?.replace('Bearer ', '');
    const session = getSession(token);

    if (!session || !isAdmin(session.telegramId)) {
        return res.status(403).json({ error: 'دسترسی غیرمجاز' });
    }

    const { telegramId } = req.params;
    
    if (telegramId === ENV.ADMIN_ID) {
        return res.status(400).json({ error: 'نمی‌توانید حساب ادمین را حذف کنید' });
    }

    kvDelete(`user:${telegramId}`);
    kvDelete(`history:${telegramId}`);
    
    const usersIndexData = kvGet('users:index');
    let usersIndex = usersIndexData ? JSON.parse(usersIndexData) : [];
    usersIndex = usersIndex.filter(id => id !== telegramId);
    kvPut('users:index', JSON.stringify(usersIndex));

    res.json({ success: true });
});

app.post('/api/admin/countries', (req, res) => {
    const token = req.headers.authorization?.replace('Bearer ', '');
    const session = getSession(token);

    if (!session || !isAdmin(session.telegramId)) {
        return res.status(403).json({ error: 'دسترسی غیرمجاز' });
    }

    const { id, name, nameEn, flagUrl, dns } = req.body;

    if (!id || !name) {
        return res.status(400).json({ error: 'شناسه و نام الزامی است' });
    }

    const countriesData = kvGet('countries:list');
    const countries = countriesData ? JSON.parse(countriesData) : [];

    const existingIndex = countries.findIndex(c => c.id === id);
    const country = {
        id,
        name,
        nameEn: nameEn || id.toUpperCase(),
        flagUrl: flagUrl || '',
        dns: dns || { ipv4: [], ipv6: [] }
    };

    if (existingIndex !== -1) {
        countries[existingIndex] = country;
    } else {
        countries.push(country);
    }

    kvPut('countries:list', JSON.stringify(countries));

    res.json({ success: true, country });
});

app.get('/api/admin/countries', (req, res) => {
    const token = req.headers.authorization?.replace('Bearer ', '');
    const session = getSession(token);

    if (!session || !isAdmin(session.telegramId)) {
        return res.status(403).json({ error: 'دسترسی غیرمجاز' });
    }

    const countriesData = kvGet('countries:list');
    const countries = countriesData ? JSON.parse(countriesData) : [];

    res.json({ countries });
});

app.delete('/api/admin/countries/:id', (req, res) => {
    const token = req.headers.authorization?.replace('Bearer ', '');
    const session = getSession(token);

    if (!session || !isAdmin(session.telegramId)) {
        return res.status(403).json({ error: 'دسترسی غیرمجاز' });
    }

    const countryId = req.params.id;
    const countriesData = kvGet('countries:list');
    let countries = countriesData ? JSON.parse(countriesData) : [];

    countries = countries.filter(c => c.id !== countryId);
    kvPut('countries:list', JSON.stringify(countries));

    res.json({ success: true });
});

app.put('/api/admin/countries/:id', (req, res) => {
    const token = req.headers.authorization?.replace('Bearer ', '');
    const session = getSession(token);

    if (!session || !isAdmin(session.telegramId)) {
        return res.status(403).json({ error: 'دسترسی غیرمجاز' });
    }

    const countryId = req.params.id;
    const countriesData = kvGet('countries:list');
    let countries = countriesData ? JSON.parse(countriesData) : [];

    const index = countries.findIndex(c => c.id === countryId);
    if (index === -1) {
        return res.status(404).json({ error: 'کشور یافت نشد' });
    }

    countries[index] = { ...countries[index], ...req.body };
    kvPut('countries:list', JSON.stringify(countries));

    res.json({ success: true, country: countries[index] });
});

app.post('/api/admin/announcements', (req, res) => {
    const token = req.headers.authorization?.replace('Bearer ', '');
    const session = getSession(token);

    if (!session || !isAdmin(session.telegramId)) {
        return res.status(403).json({ error: 'دسترسی غیرمجاز' });
    }

    const { title, message, type } = req.body;

    if (!title || !message) {
        return res.status(400).json({ error: 'عنوان و متن الزامی است' });
    }

    const announcementsData = kvGet('announcements:list');
    const announcements = announcementsData ? JSON.parse(announcementsData) : [];

    const announcement = {
        id: crypto.randomUUID(),
        title,
        message,
        type: type || 'info',
        createdAt: Date.now()
    };

    announcements.unshift(announcement);
    kvPut('announcements:list', JSON.stringify(announcements));

    res.json({ success: true, announcement });
});

app.get('/api/admin/announcements', (req, res) => {
    const token = req.headers.authorization?.replace('Bearer ', '');
    const session = getSession(token);

    if (!session || !isAdmin(session.telegramId)) {
        return res.status(403).json({ error: 'دسترسی غیرمجاز' });
    }

    const announcementsData = kvGet('announcements:list');
    const announcements = announcementsData ? JSON.parse(announcementsData) : [];

    res.json({ announcements });
});

app.delete('/api/admin/announcements/:id', (req, res) => {
    const token = req.headers.authorization?.replace('Bearer ', '');
    const session = getSession(token);

    if (!session || !isAdmin(session.telegramId)) {
        return res.status(403).json({ error: 'دسترسی غیرمجاز' });
    }

    const announcementId = req.params.id;
    const announcementsData = kvGet('announcements:list');
    let announcements = announcementsData ? JSON.parse(announcementsData) : [];

    announcements = announcements.filter(a => a.id !== announcementId);
    kvPut('announcements:list', JSON.stringify(announcements));

    res.json({ success: true });
});

app.get('/api/admin/system-status', (req, res) => {
    const token = req.headers.authorization?.replace('Bearer ', '');
    const session = getSession(token);

    if (!session || !isAdmin(session.telegramId)) {
        return res.status(403).json({ error: 'دسترسی غیرمجاز' });
    }

    const users = getAllUsers();

    res.json({
        kvStatus: { ok: true, message: 'پایگاه داده متصل است' },
        botStatus: { ok: !!ENV.BOT_TOKEN, message: ENV.BOT_TOKEN ? 'توکن ربات تنظیم شده' : 'توکن ربات تنظیم نشده (حالت توسعه)' },
        usersCount: users.length
    });
});

app.get('*', (req, res) => {
    res.sendFile(join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
    
    const countriesData = kvGet('countries:list');
    if (!countriesData) {
        const defaultCountries = [
            {
                id: 'us',
                name: 'آمریکا',
                nameEn: 'United States',
                dns: {
                    ipv4: ['1.1.1.1', '8.8.8.8', '9.9.9.9', '208.67.222.222', '208.67.220.220'],
                    ipv6: ['2606:4700:4700::1111', '2001:4860:4860::8888', '2620:fe::fe', '2620:119:35::35']
                }
            },
            {
                id: 'de',
                name: 'آلمان',
                nameEn: 'Germany',
                dns: {
                    ipv4: ['1.1.1.1', '9.9.9.9', '185.95.218.42', '185.95.218.43'],
                    ipv6: ['2606:4700:4700::1111', '2620:fe::fe', '2a05:fc84::42', '2a05:fc84::43']
                }
            },
            {
                id: 'nl',
                name: 'هلند',
                nameEn: 'Netherlands',
                dns: {
                    ipv4: ['1.1.1.1', '8.8.4.4', '9.9.9.9'],
                    ipv6: ['2606:4700:4700::1001', '2001:4860:4860::8844']
                }
            },
            {
                id: 'gb',
                name: 'انگلستان',
                nameEn: 'United Kingdom',
                dns: {
                    ipv4: ['1.0.0.1', '8.8.8.8'],
                    ipv6: ['2606:4700:4700::1001', '2001:4860:4860::8888']
                }
            },
            {
                id: 'fr',
                name: 'فرانسه',
                nameEn: 'France',
                dns: {
                    ipv4: ['1.1.1.1', '80.67.169.12'],
                    ipv6: ['2606:4700:4700::1111', '2001:910:800::12']
                }
            },
            {
                id: 'jp',
                name: 'ژاپن',
                nameEn: 'Japan',
                dns: {
                    ipv4: ['1.1.1.1', '8.8.8.8'],
                    ipv6: ['2606:4700:4700::1111', '2001:4860:4860::8888']
                }
            },
            {
                id: 'sg',
                name: 'سنگاپور',
                nameEn: 'Singapore',
                dns: {
                    ipv4: ['1.1.1.1', '8.8.8.8'],
                    ipv6: ['2606:4700:4700::1111', '2001:4860:4860::8888']
                }
            },
            {
                id: 'ca',
                name: 'کانادا',
                nameEn: 'Canada',
                dns: {
                    ipv4: ['1.1.1.1', '8.8.8.8'],
                    ipv6: ['2606:4700:4700::1111', '2001:4860:4860::8888']
                }
            }
        ];
        kvPut('countries:list', JSON.stringify(defaultCountries));
        console.log('Default countries added to database');
    }
});
