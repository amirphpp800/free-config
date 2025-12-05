const App = {
    currentPage: 'auth',

    async init() {
        if (Storage.isLoggedIn()) {
            this.currentPage = 'dashboard';
            await Dashboard.init();
        } else {
            this.currentPage = 'auth';
        }
        this.hideLoading();
        this.render();
    },

    hideLoading() {
        const loading = document.getElementById('loading-screen');
        if (loading) {
            loading.style.opacity = '0';
            setTimeout(() => loading.remove(), 300);
        }
    },

    async render() {
        const app = document.getElementById('app');
        let content = '';

        switch (this.currentPage) {
            case 'auth':
                content = Auth.render();
                break;
            case 'dashboard':
                content = await Dashboard.render();
                break;
            case 'wireguard':
                content = Generator.render();
                break;
            case 'dns':
                content = Generator.render();
                break;
            case 'tools':
                content = Tools.render();
                break;
            case 'history':
                content = History.render();
                break;
            case 'admin':
                content = Admin.render();
                break;
            default:
                content = Auth.render();
        }

        app.innerHTML = content;
    },

    async navigate(page) {
        this.currentPage = page;

        switch (page) {
            case 'dashboard':
                await Dashboard.init();
                break;
            case 'wireguard':
                await Generator.init('wireguard');
                break;
            case 'dns':
                await Generator.init('dns');
                break;
            case 'tools':
                await Tools.init();
                break;
            case 'history':
                await History.init();
                break;
            case 'admin':
                await Admin.init();
                break;
            default:
                this.render();
        }
    },

    logout() {
        if (confirm('آیا می‌خواهید خارج شوید؟')) {
            Storage.logout();
            Auth.reset();
            this.currentPage = 'auth';
            this.render();
            Toast.show('با موفقیت خارج شدید', 'success');
        }
    }
};

document.addEventListener('DOMContentLoaded', () => {
    App.init();
});
