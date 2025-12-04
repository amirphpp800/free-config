class AuthManager {
    constructor() {
        this.session = this.loadSession();
        this.onAuthChange = null;
    }

    loadSession() {
        try {
            const data = localStorage.getItem('wg_session');
            if (data) {
                const session = JSON.parse(data);
                if (session.expiresAt > Date.now()) {
                    return session;
                }
                this.clearSession();
            }
        } catch (e) {
            console.error('Failed to load session:', e);
        }
        return null;
    }

    saveSession(session) {
        this.session = session;
        localStorage.setItem('wg_session', JSON.stringify(session));
        if (this.onAuthChange) {
            this.onAuthChange(true, session);
        }
    }

    clearSession() {
        this.session = null;
        localStorage.removeItem('wg_session');
        if (this.onAuthChange) {
            this.onAuthChange(false, null);
        }
    }

    isAuthenticated() {
        return this.session !== null && this.session.expiresAt > Date.now();
    }

    getUser() {
        return this.session ? this.session.user : null;
    }

    getToken() {
        return this.session ? this.session.token : null;
    }

    async requestVerification(telegramId) {
        const response = await fetch('/api/auth/request', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ telegramId })
        });

        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || 'Failed to request verification');
        }

        return data;
    }

    async verifyCode(telegramId, code) {
        const response = await fetch('/api/auth/verify', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ telegramId, code })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Verification failed');
        }

        this.saveSession({
            token: data.token,
            user: {
                telegramId: data.telegramId,
                createdAt: data.createdAt
            },
            expiresAt: Date.now() + (24 * 60 * 60 * 1000)
        });

        return data;
    }

    logout() {
        this.clearSession();
    }
}

const auth = new AuthManager();
export default auth;
