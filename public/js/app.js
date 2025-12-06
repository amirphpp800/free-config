const App = {
    currentPage: 'auth',

    async init() {
        if (Storage.isLoggedIn()) {
            const savedPage = Storage.getCurrentPage();
            const validPages = ['dashboard', 'wireguard', 'dns', 'tools', 'history', 'admin'];
            this.currentPage = validPages.includes(savedPage) ? savedPage : 'dashboard';
            
            switch (this.currentPage) {
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
                    await Dashboard.init();
            }
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
        Storage.setCurrentPage(page);

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
        this.showConfirmModal(
            'خروج از حساب',
            'آیا می‌خواهید از حساب کاربری خود خارج شوید؟',
            () => {
                Storage.logout();
                Auth.reset();
                this.currentPage = 'auth';
                this.render();
                Toast.show('با موفقیت خارج شدید', 'success');
            }
        );
    },

    showConfirmModal(title, message, onConfirm) {
        const existing = document.querySelector('.modal-overlay');
        if (existing) existing.remove();

        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal">
                <div class="modal-header">
                    <h3 class="modal-title">⚠️ ${title}</h3>
                    <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">×</button>
                </div>
                <div class="modal-body">
                    <p class="confirm-message">${message}</p>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-danger" onclick="this.closest('.modal-overlay').remove()">انصراف</button>
                    <button class="btn btn-success" id="confirm-action-btn">تأیید</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);

        modal.onclick = (e) => {
            if (e.target === modal) modal.remove();
        };

        document.getElementById('confirm-action-btn').onclick = () => {
            modal.remove();
            onConfirm();
        };
    }
};

document.addEventListener('DOMContentLoaded', () => {
    App.init();
});
