const Utils = {
    formatDate(date) {
        const d = new Date(date);
        return new Intl.DateTimeFormat('fa-IR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        }).format(d);
    },

    formatDateShort(date) {
        const d = new Date(date);
        return new Intl.DateTimeFormat('fa-IR', {
            month: 'short',
            day: 'numeric'
        }).format(d);
    },

    toPersianNumber(num) {
        const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
        return String(num).replace(/\d/g, d => persianDigits[parseInt(d)]);
    },

    generateRandomCode() {
        return Math.floor(10000 + Math.random() * 90000).toString();
    },

    generateRandomKey(length = 44) {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
        let key = '';
        for (let i = 0; i < length - 1; i++) {
            key += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return key + '=';
    },

    generateRandomIP(type = 'ipv4') {
        if (type === 'ipv6') {
            const segments = [];
            for (let i = 0; i < 8; i++) {
                segments.push(Math.floor(Math.random() * 65536).toString(16).padStart(4, '0'));
            }
            return segments.join(':');
        }
        return `10.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 254) + 1}`;
    },

    copyToClipboard(text) {
        if (navigator.clipboard) {
            return navigator.clipboard.writeText(text);
        }
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        return Promise.resolve();
    },

    downloadFile(content, filename, type = 'text/plain') {
        const blob = new Blob([content], { type });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    },

    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },

    validateTelegramId(id) {
        return /^\d{5,15}$/.test(id);
    },

    validateCode(code) {
        return /^\d{5}$/.test(code);
    },

    validatePassword(password) {
        return password && password.length >= 4;
    },

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    },

    getCountryByCode(code) {
        return CONFIG.COUNTRIES.find(c => c.code === code);
    },

    getOperatorById(id) {
        return CONFIG.OPERATORS.find(o => o.id === id);
    },

    getDnsById(id) {
        return CONFIG.DNS_SERVERS.find(d => d.id === id);
    }
};
