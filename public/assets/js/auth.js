import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { HTTPException } from 'hono/http-exception';
import { logger } from 'hono/logger';
import { Database } from 'sqlite';
import sqlite3 from 'sqlite3';
import { kv } from '@vercel/kv';
import { getTelegramUser } from './utils/telegram';
import { encrypt, decrypt } from './utils/encryption';

const app = new Hono();

// Middleware
app.use(cors());
app.use(logger());

// Enable reading from KV store
const KV_ENABLED = process.env.KV_ENABLED === 'true';

// SQLite Database Setup
let db: Database;
async function initializeDb() {
    db = new Database();
    await db.open({
        filename: './data.db',
        driver: sqlite3.Database
    });
    await db.migrate();
    console.log('Database initialized and migrated.');
}

// --- API Routes ---

// Telegram Web App Initialization
app.post('/api/telegram/init', async (c) => {
    const { telegramId, initialUsername, referrerId } = await c.req.json();

    if (!telegramId || !initialUsername) {
        throw new HTTPException(400, { message: 'telegramId and initialUsername are required.' });
    }

    try {
        const existingUser = await db.get('SELECT * FROM users WHERE telegramId = ?', [telegramId]);

        if (existingUser) {
            return c.json({ message: 'User already exists.', user: existingUser });
        }

        const user = {
            telegramId: telegramId.toString(),
            username: initialUsername,
            createdAt: new Date().toISOString(),
            country: null,
            city: null,
            balance: 0,
            referrerId: referrerId ? referrerId.toString() : null,
            level: 1,
            points: 0,
            usedPoints: 0,
            botEnabled: false,
            // Add default values for new fields
            isPremium: false,
            premiumExpiration: null,
            referralCode: Math.random().toString(36).substring(2, 8).toUpperCase(),
        };

        await db.run(
            'INSERT INTO users (telegramId, username, createdAt, country, city, balance, referrerId, level, points, usedPoints, botEnabled, isPremium, premiumExpiration, referralCode) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [
                user.telegramId,
                user.username,
                user.createdAt,
                user.country,
                user.city,
                user.balance,
                user.referrerId,
                user.level,
                user.points,
                user.usedPoints,
                user.botEnabled,
                user.isPremium,
                user.premiumExpiration,
                user.referralCode
            ]
        );

        // If referrerId is provided, find the referrer and update their referral count
        if (user.referrerId) {
            await db.run('UPDATE users SET referralCount = (referralCount + 1) WHERE telegramId = ?', [user.referrerId]);
        }

        console.log('New user created:', user);
        return c.json({ message: 'User created successfully.', user });

    } catch (error) {
        console.error('Error initializing user:', error);
        throw new HTTPException(500, { message: 'Internal server error.' });
    }
});

// Get User Profile
app.get('/api/user/profile', async (c) => {
    const user = await getTelegramUser(c);
    if (!user) {
        throw new HTTPException(401, { message: 'Unauthorized. Please log in via Telegram.' });
    }

    try {
        const userData = await db.get('SELECT * FROM users WHERE telegramId = ?', [user.id]);
        if (!userData) {
            throw new HTTPException(404, { message: 'User not found.' });
        }

        // Fetch countries from KV if enabled and available
        let countries = [];
        if (KV_ENABLED) {
            try {
                const kvCountries = await kv.get('countries');
                if (kvCountries) {
                    countries = JSON.parse(kvCountries);
                }
            } catch (kvError) {
                console.error('Error fetching countries from KV:', kvError);
                // Fallback to DB if KV fails
                countries = await db.all('SELECT * FROM countries');
            }
        } else {
            // Default to DB if KV is not enabled
            countries = await db.all('SELECT * FROM countries');
        }


        // Ensure countries are loaded correctly
        const countryData = countries.find(country => country.id === userData.country);
        const cityData = countryData ? countryData.cities.find(city => city.id === userData.city) : null;

        return c.json({
            ...userData,
            countryName: countryData ? countryData.name : null,
            cityName: cityData ? cityData.name : null
        });

    } catch (error) {
        console.error('Error fetching user profile:', error);
        if (error instanceof HTTPException) {
            throw error;
        }
        throw new HTTPException(500, { message: 'Internal server error.' });
    }
});

// Update User Profile (Country and City)
app.put('/api/user/profile', async (c) => {
    const user = await getTelegramUser(c);
    if (!user) {
        throw new HTTPException(401, { message: 'Unauthorized. Please log in via Telegram.' });
    }

    const { country, city } = await c.req.json();

    if (country === undefined || city === undefined) {
        throw new HTTPException(400, { message: 'Country and city are required.' });
    }

    try {
        // Fetch countries from KV if enabled
        let countries = [];
        if (KV_ENABLED) {
            try {
                const kvCountries = await kv.get('countries');
                if (kvCountries) {
                    countries = JSON.parse(kvCountries);
                } else {
                    // If KV is enabled but 'countries' key is missing, fetch from DB as fallback
                    countries = await db.all('SELECT * FROM countries');
                }
            } catch (kvError) {
                console.error('Error fetching countries from KV:', kvError);
                // Fallback to DB if KV fails
                countries = await db.all('SELECT * FROM countries');
            }
        } else {
            // If KV is not enabled, fetch directly from DB
            countries = await db.all('SELECT * FROM countries');
        }

        const selectedCountry = countries.find(c => c.id === country);
        if (!selectedCountry) {
            throw new HTTPException(404, { message: 'Country not found.' });
        }

        const selectedCity = selectedCountry.cities.find(c => c.id === city);
        if (!selectedCity) {
            throw new HTTPException(404, { message: 'City not found.' });
        }

        await db.run('UPDATE users SET country = ?, city = ? WHERE telegramId = ?', [country, city, user.id]);

        return c.json({ message: 'Profile updated successfully.', country, city });

    } catch (error) {
        console.error('Error updating user profile:', error);
        if (error instanceof HTTPException) {
            throw error;
        }
        throw new HTTPException(500, { message: 'Internal server error.' });
    }
});

// Add Country and City (Admin only)
app.post('/api/admin/countries', async (c) => {
    const user = await getTelegramUser(c);
    // Basic check for admin role - enhance this with proper auth
    if (!user || user.id !== 'YOUR_ADMIN_TELEGRAM_ID') { // Replace with actual admin ID or role check
        throw new HTTPException(403, { message: 'Forbidden. Admin access required.' });
    }

    const { name, cities } = await c.req.json();

    if (!name || !cities || !Array.isArray(cities) || cities.length === 0) {
        throw new HTTPException(400, { message: 'Country name and a non-empty array of cities are required.' });
    }

    try {
        // Prepare data for insertion
        const newCountry = {
            id: Date.now().toString(), // Simple unique ID generation
            name,
            cities: cities.map(city => ({ id: Date.now() + Math.random(), name: city.name })) // Simple unique ID for cities
        };

        // Update KV store
        if (KV_ENABLED) {
            try {
                const existingCountriesJson = await kv.get('countries');
                let allCountries = [];
                if (existingCountriesJson) {
                    allCountries = JSON.parse(existingCountriesJson);
                }
                allCountries.push(newCountry);
                await kv.put('countries', JSON.stringify(allCountries));
                console.log('Country added to KV:', newCountry);
            } catch (kvError) {
                console.error('Error updating countries in KV:', kvError);
                // If KV fails, try to update SQLite as a fallback
                await db.run('INSERT INTO countries (id, name, cities) VALUES (?, ?, ?)', [newCountry.id, newCountry.name, JSON.stringify(newCountry.cities)]);
                console.log('Country added to SQLite as fallback:', newCountry);
            }
        } else {
            // If KV is not enabled, insert directly into SQLite
            await db.run('INSERT INTO countries (id, name, cities) VALUES (?, ?, ?)', [newCountry.id, newCountry.name, JSON.stringify(newCountry.cities)]);
            console.log('Country added to SQLite:', newCountry);
        }

        return c.json({ message: 'Country added successfully.', country: newCountry });

    } catch (error) {
        console.error('Error adding country:', error);
        if (error instanceof HTTPException) {
            throw error;
        }
        throw new HTTPException(500, { message: 'Internal server error.' });
    }
});

// --- Authentication Routes ---

// Login with Telegram
app.post('/api/auth/login', async (c) => {
    const { telegramId, username } = await c.req.json();

    if (!telegramId || !username) {
        throw new HTTPException(400, { message: 'Telegram ID and username are required.' });
    }

    try {
        // Check if user exists, if not, create them
        let user = await db.get('SELECT * FROM users WHERE telegramId = ?', [telegramId]);

        if (!user) {
            console.log('User not found, creating new user...');
            const newUser = {
                telegramId: telegramId.toString(),
                username: username,
                createdAt: new Date().toISOString(),
                country: null,
                city: null,
                balance: 0,
                referrerId: null,
                level: 1,
                points: 0,
                usedPoints: 0,
                botEnabled: false,
                isPremium: false,
                premiumExpiration: null,
                referralCode: Math.random().toString(36).substring(2, 8).toUpperCase(),
            };

            await db.run(
                'INSERT INTO users (telegramId, username, createdAt, country, city, balance, referrerId, level, points, usedPoints, botEnabled, isPremium, premiumExpiration, referralCode) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
                [
                    newUser.telegramId,
                    newUser.username,
                    newUser.createdAt,
                    newUser.country,
                    newUser.city,
                    newUser.balance,
                    newUser.referrerId,
                    newUser.level,
                    newUser.points,
                    newUser.usedPoints,
                    newUser.botEnabled,
                    newUser.isPremium,
                    newUser.premiumExpiration,
                    newUser.referralCode
                ]
            );
            user = newUser; // Assign the newly created user object
            console.log('New user created during login:', newUser);
        } else {
            // Update username if it changed
            if (user.username !== username) {
                await db.run('UPDATE users SET username = ? WHERE telegramId = ?', [username, telegramId]);
                user.username = username; // Update local object
                console.log(`Username updated for telegramId ${telegramId} to ${username}`);
            }
        }

        // Generate a JWT or session token
        const token = encrypt(JSON.stringify({ telegramId: user.telegramId })); // Simple encryption for token

        return c.json({ token, user });

    } catch (error) {
        console.error('Error during Telegram login:', error);
        throw new HTTPException(500, { message: 'Internal server error during login.' });
    }
});

// Login with Password
app.post('/api/auth/login-password', async (c) => {
    const { telegramId, password } = await c.req.json();

    if (!telegramId || !password) {
        throw new HTTPException(400, { message: 'Telegram ID and password are required.' });
    }

    try {
        const user = await db.get('SELECT * FROM users WHERE telegramId = ?', [telegramId]);

        if (!user) {
            throw new HTTPException(404, { message: 'User not found.' });
        }

        // Decrypt stored password and compare
        const decryptedPassword = decrypt(user.passwordHash); // Assuming passwordHash stores the encrypted password

        if (decryptedPassword !== password) {
            throw new HTTPException(401, { message: 'Invalid password.' });
        }

        // Generate a JWT or session token for password login
        const token = encrypt(JSON.stringify({ telegramId: user.telegramId, method: 'password' }));

        return c.json({ token, user });

    } catch (error) {
        console.error('Error during password login:', error);
        if (error instanceof HTTPException) {
            throw error;
        }
        throw new HTTPException(500, { message: 'Internal server error during password login.' });
    }
});


// Set Password
app.post('/api/auth/set-password', async (c) => {
    const user = await getTelegramUser(c);
    if (!user) {
        throw new HTTPException(401, { message: 'Unauthorized. Please log in via Telegram.' });
    }

    const { password } = await c.req.json();

    if (!password) {
        throw new HTTPException(400, { message: 'Password is required.' });
    }

    try {
        const encryptedPassword = encrypt(password); // Encrypt the password before storing

        await db.run('UPDATE users SET passwordHash = ? WHERE telegramId = ?', [encryptedPassword, user.id]);

        return c.json({ message: 'Password set successfully.' });

    } catch (error) {
        console.error('Error setting password:', error);
        if (error instanceof HTTPException) {
            throw error;
        }
        throw new HTTPException(500, { message: 'Internal server error.' });
    }
});

// --- KV Operations (if enabled) ---

// Add/Update countries in KV
app.post('/api/kv/countries', async (c) => {
    if (!KV_ENABLED) {
        throw new HTTPException(400, { message: 'KV store is not enabled.' });
    }

    const { countries } = await c.req.json();

    if (!countries || !Array.isArray(countries)) {
        throw new HTTPException(400, { message: 'Invalid countries data. Expected an array.' });
    }

    try {
        await kv.put('countries', JSON.stringify(countries));
        console.log('Countries updated in KV:', countries);
        return c.json({ message: 'Countries updated successfully in KV.' });
    } catch (error) {
        console.error('Error updating countries in KV:', error);
        throw new HTTPException(500, { message: 'Internal server error updating KV.' });
    }
});

// Get countries from KV
app.get('/api/kv/countries', async (c) => {
    if (!KV_ENABLED) {
        throw new HTTPException(400, { message: 'KV store is not enabled.' });
    }

    try {
        const countriesJson = await kv.get('countries');
        if (!countriesJson) {
            return c.json({ countries: [] });
        }
        const countries = JSON.parse(countriesJson);
        return c.json({ countries });
    } catch (error) {
        console.error('Error fetching countries from KV:', error);
        throw new HTTPException(500, { message: 'Internal server error fetching KV.' });
    }
});

// --- Other Routes ---

// Health check
app.get('/', (c) => {
    return c.text('Server is running!');
});

// Catch-all for 404
app.notFound((c) => {
    return c.text('Not Found', 404);
});

// Start the server
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

console.log(`Starting server on port ${PORT}...`);

initializeDb().then(() => {
    serve({
        fetch: app.fetch,
        port: PORT,
    });
    console.log(`Server started on http://localhost:${PORT}`);
}).catch(err => {
    console.error('Failed to initialize database or start server:', err);
    process.exit(1);
});
