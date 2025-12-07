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
        
        let proSection = '';
        if (user?.isPro && user?.proExpiresAt) {
            const remaining = user.proExpiresAt - Date.now();
            const days = Math.ceil(remaining / (1000 * 60 * 60 * 24));
            proSection = `
                <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 12px; padding: 16px; margin-top: 16px;">
                    <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 10px;">
                        <span style="font-size: 24px;">👑</span>
                        <div>
                            <div style="color: white; font-weight: 600; font-size: 15px;">اشتراک پرو فعال</div>
                            <div style="color: rgba(255,255,255,0.8); font-size: 12px;">دسترسی نامحدود</div>
                        </div>
                    </div>
                    <div style="background: rgba(255,255,255,0.2); border-radius: 8px; padding: 10px; text-align: center;">
                        <div style="color: white; font-size: 12px; margin-bottom: 4px;">زمان باقی‌مانده:</div>
                        <div style="color: white; font-size: 18px; font-weight: 700;">${Utils.toPersianNumber(days)} روز</div>
                    </div>
                </div>
            `;
        } else {
            proSection = `
                <div style="background: var(--bg-tertiary); border-radius: 12px; padding: 16px; margin-top: 16px; border: 1px solid var(--border-color);">
                    <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 12px;">
                        <span style="font-size: 24px;">👑</span>
                        <div>
                            <div style="color: var(--text-primary); font-weight: 600; font-size: 15px;">اشتراک پرو</div>
                            <div style="color: var(--text-secondary); font-size: 12px;">محدودیت روزانه را حذف کنید</div>
                        </div>
                    </div>
                    <input type="text" class="input" id="profile-pro-code" placeholder="کد پرو را وارد کنید" style="text-transform: uppercase; margin-bottom: 12px;">
                    <button class="btn btn-primary" style="width: 100%;" onclick="Header.activateProCode()">
                        فعال‌سازی اشتراک پرو
                    </button>
                </div>
            `;
        }
        
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
                    ${proSection}
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        modal.onclick = (e) => {
            if (e.target === modal) modal.remove();
        };
    },
    
    async activateProCode() {
        const input = document.getElementById('profile-pro-code');
        const code = input?.value?.trim();

        if (!code) {
            Toast.show('کد پرو را وارد کنید', 'error');
            return;
        }

        try {
            const result = await API.activateProCode(code);
            Storage.setUser(result.user);
            Toast.show('اشتراک پرو با موفقیت فعال شد!', 'success');
            document.querySelector('.modal-overlay')?.remove();
            App.render();
        } catch (error) {
            Toast.show(error.message, 'error');
        }
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
