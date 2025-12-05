const Header = {
    render(title, showBack = false, showLogout = false) {
        const user = Storage.getUser();
        return `
            <header class="header">
                <div class="header-content">
                    ${showBack ? `
                        <button class="btn btn-icon btn-secondary" onclick="App.navigate('dashboard')">
                            <span>→</span>
                        </button>
                    ` : '<div></div>'}
                    <h1 class="header-title">${title}</h1>
                    <div class="header-actions">
                        ${showLogout ? `
                            <button class="btn btn-icon btn-secondary" onclick="Header.showProfileModal()" title="پروفایل">
                                <span>👤</span>
                            </button>
                            <button class="btn btn-icon btn-secondary" onclick="Header.showAnnouncementsModal()" title="اعلانات">
                                <span>📢</span>
                            </button>
                            <button class="btn btn-icon btn-secondary" onclick="App.logout()" title="خروج">
                                <span>🚪</span>
                            </button>
                        ` : '<div></div>'}
                    </div>
                </div>
            </header>
        `;
    },

    showProfileModal() {
        const user = Storage.getUser();
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal">
                <div class="modal-header">
                    <h3 class="modal-title">👤 پروفایل کاربری</h3>
                    <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">×</button>
                </div>
                <div class="modal-body">
                    <div class="profile-info">
                        <div class="profile-item">
                            <div class="profile-label">شناسه تلگرام</div>
                            <div class="profile-value">${user?.telegramId ? Utils.toPersianNumber(user.telegramId) : '-'}</div>
                        </div>
                        <div class="profile-item">
                            <div class="profile-label">تاریخ عضویت</div>
                            <div class="profile-value">${user?.createdAt ? Utils.formatDateShort(user.createdAt) : '-'}</div>
                        </div>
                        ${user?.isAdmin ? `
                            <div class="profile-item">
                                <div class="badge badge-purple" style="width: 100%; justify-content: center;">مدیر سیستم</div>
                            </div>
                        ` : ''}
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        modal.onclick = (e) => {
            if (e.target === modal) modal.remove();
        };
    },

    async showAnnouncementsModal() {
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal">
                <div class="modal-header">
                    <h3 class="modal-title">📢 اعلانات</h3>
                    <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">×</button>
                </div>
                <div class="modal-body">
                    <div class="loading-indicator">در حال بارگذاری...</div>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        modal.onclick = (e) => {
            if (e.target === modal) modal.remove();
        };

        try {
            const res = await API.getAnnouncements();
            const announcements = res.announcements || [];
            
            const modalBody = modal.querySelector('.modal-body');
            if (announcements.length) {
                modalBody.innerHTML = `
                    <div class="announcements-list">
                        ${announcements.map(a => `
                            <div class="announcement-item">
                                <div class="announcement-text">${Utils.escapeHtml(a.text)}</div>
                                <div class="announcement-date">${Utils.formatDateShort(a.createdAt)}</div>
                            </div>
                        `).join('')}
                    </div>
                `;
            } else {
                modalBody.innerHTML = `
                    <div class="empty-state" style="padding: 30px;">
                        <div class="empty-state-icon">📭</div>
                        <h3 class="empty-state-title">اعلانی وجود ندارد</h3>
                    </div>
                `;
            }
        } catch (error) {
            const modalBody = modal.querySelector('.modal-body');
            modalBody.innerHTML = `
                <div class="text-center text-secondary" style="padding: 20px;">
                    خطا در بارگذاری اعلانات
                </div>
            `;
        }
    }
};
