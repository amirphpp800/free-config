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

    async checkPasswordStatus(telegramId) {
        const response = await fetch('/api/auth/check-password', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ telegramId })
        });

        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || 'Failed to check password status');
        }

        return data;
    }

    async loginWithPassword(telegramId, password) {
        const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ telegramId, password })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Login failed');
        }

        this.saveSession({
            token: data.token,
            user: {
                telegramId: data.telegramId,
                hasPassword: data.hasPassword,
                createdAt: data.createdAt
            },
            expiresAt: Date.now() + (24 * 60 * 60 * 1000)
        });

        return data;
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
                hasPassword: data.hasPassword,
                createdAt: data.createdAt
            },
            expiresAt: Date.now() + (24 * 60 * 60 * 1000)
        });

        return data;
    }

    async setPassword(password) {
        const response = await fetch('/api/profile/set-password', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.getToken()}`
            },
            body: JSON.stringify({ password })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Failed to set password');
        }

        if (this.session) {
            this.session.user.hasPassword = true;
            this.saveSession(this.session);
        }

        return data;
    }

    async changePassword(currentPassword, newPassword) {
        const response = await fetch('/api/profile/change-password', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.getToken()}`
            },
            body: JSON.stringify({ currentPassword, newPassword })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Failed to change password');
        }

        return data;
    }

    async requestPasswordReset(telegramId) {
        const response = await fetch('/api/auth/forgot-password', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ telegramId })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Failed to request password reset');
        }

        return data;
    }

    async resetPassword(telegramId, code, newPassword) {
        const response = await fetch('/api/auth/reset-password', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ telegramId, code, newPassword })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Failed to reset password');
        }

        this.saveSession({
            token: data.token,
            user: {
                telegramId: data.telegramId,
                hasPassword: true,
                createdAt: Date.now()
            },
            expiresAt: Date.now() + (24 * 60 * 60 * 1000)
        });

        return data;
    }

    async getProfile() {
        const response = await fetch('/api/profile', {
            headers: {
                'Authorization': `Bearer ${this.getToken()}`
            }
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Failed to get profile');
        }

        return data;
    }

    logout() {
        this.clearSession();
    }
}

const auth = new AuthManager();
export default auth;
