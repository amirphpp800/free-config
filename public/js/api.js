const API = {
    async request(endpoint, options = {}) {
        const url = `${CONFIG.API_BASE}${endpoint}`;
        const token = Storage.get('token');
        
        const headers = {
            'Content-Type': 'application/json',
            ...(token && { 'Authorization': `Bearer ${token}` }),
            ...options.headers
        };

        try {
            const response = await fetch(url, {
                ...options,
                headers
            });

            const data = await response.json();
            
            if (!response.ok) {
                const error = new Error(data.error || 'خطا در برقراری ارتباط');
                if (data.resetTimestamp) error.resetTimestamp = data.resetTimestamp;
                if (data.resetTimer) error.resetTimer = data.resetTimer;
                throw error;
            }
            
            return data;
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    },

    async sendVerificationCode(telegramId) {
        return this.request('/auth/send-code', {
            method: 'POST',
            body: JSON.stringify({ telegramId })
        });
    },

    async verifyCode(telegramId, code) {
        return this.request('/auth/verify', {
            method: 'POST',
            body: JSON.stringify({ telegramId, code })
        });
    },

    async setPassword(password) {
        return this.request('/auth/set-password', {
            method: 'POST',
            body: JSON.stringify({ password })
        });
    },

    async loginWithPassword(telegramId, password) {
        return this.request('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ telegramId, password })
        });
    },

    async getProfile() {
        return this.request('/user/profile');
    },

    async getUsage() {
        return this.request('/user/usage');
    },

    async generateWireGuard(options) {
        return this.request('/generate/wireguard', {
            method: 'POST',
            body: JSON.stringify(options)
        });
    },

    async generateDNS(options) {
        return this.request('/generate/dns', {
            method: 'POST',
            body: JSON.stringify(options)
        });
    },

    async getHistory() {
        return this.request('/user/history');
    },

    async getAnnouncements() {
        return this.request('/announcements');
    },

    async getCountries() {
        return this.request('/countries');
    },

    async adminGetStats() {
        return this.request('/admin/stats');
    },

    async adminGetUsers() {
        return this.request('/admin/users');
    },

    async adminUpdateCountries(countries) {
        return this.request('/admin/countries', {
            method: 'PUT',
            body: JSON.stringify({ countries })
        });
    },

    async adminAddAnnouncement(announcement) {
        return this.request('/admin/announcements', {
            method: 'POST',
            body: JSON.stringify(announcement)
        });
    },

    async adminDeleteAnnouncement(id) {
        return this.request(`/admin/announcements/${id}`, {
            method: 'DELETE'
        });
    },

    async activateProCode(code) {
        return this.request('/user/activate-pro', {
            method: 'POST',
            body: JSON.stringify({ code })
        });
    },

    async adminGetProCodes() {
        return this.request('/admin/pro-codes');
    },

    async adminCreateProCodes(duration, count) {
        return this.request('/admin/pro-codes', {
            method: 'POST',
            body: JSON.stringify({ action: 'create', duration, count })
        });
    },

    async adminDeleteProCode(code) {
        return this.request('/admin/pro-codes', {
            method: 'POST',
            body: JSON.stringify({ action: 'delete', code })
        });
    },

    async adminGetProUsers() {
        return this.request('/admin/pro-users');
    }
};
