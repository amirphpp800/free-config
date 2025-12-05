const Storage = {
    prefix: 'wg_dns_',

    set(key, value) {
        try {
            const serialized = JSON.stringify(value);
            localStorage.setItem(this.prefix + key, serialized);
        } catch (error) {
            console.error('Storage set error:', error);
        }
    },

    get(key, defaultValue = null) {
        try {
            const item = localStorage.getItem(this.prefix + key);
            return item ? JSON.parse(item) : defaultValue;
        } catch (error) {
            console.error('Storage get error:', error);
            return defaultValue;
        }
    },

    remove(key) {
        try {
            localStorage.removeItem(this.prefix + key);
        } catch (error) {
            console.error('Storage remove error:', error);
        }
    },

    clear() {
        try {
            Object.keys(localStorage)
                .filter(key => key.startsWith(this.prefix))
                .forEach(key => localStorage.removeItem(key));
        } catch (error) {
            console.error('Storage clear error:', error);
        }
    },

    isLoggedIn() {
        return !!this.get('token');
    },

    getUser() {
        return this.get('user');
    },

    setUser(user) {
        this.set('user', user);
    },

    setToken(token) {
        this.set('token', token);
    },

    logout() {
        this.remove('token');
        this.remove('user');
    }
};
