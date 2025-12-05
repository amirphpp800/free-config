const Dashboard = {
    state: {
        usage: null,
        announcements: [],
        loading: true
    },

    async init() {
        this.state.loading = true;
        try {
            const [usageRes, announcementsRes] = await Promise.all([
                API.getUsage().catch(() => ({ wireguard: 0, dns: 0 })),
                API.getAnnouncements().catch(() => ({ announcements: [] }))
            ]);
            this.state.usage = usageRes;
            this.state.announcements = announcementsRes.announcements || [];
        } catch (error) {
            console.error('Dashboard init error:', error);
        } finally {
            this.state.loading = false;
            App.render();
        }
    },

    async render() {
        const user = Storage.getUser();
        const isAdmin = user && user.isAdmin;

        return `
            ${Header.render('داشبورد', false, true)}
            <div class="page" style="padding-bottom: 80px;">
                <div class="container">
                    ${this.renderAnnouncements()}
                    ${this.renderWelcome(user)}
                    ${this.renderUsageStats()}
                    ${await this.renderQuickActions()}
                    ${isAdmin ? this.renderAdminAccess() : ''}
                </div>
            </div>
            ${this.renderBottomNav('home')}
        `;
    },

    renderAnnouncements() {
        if (!this.state.announcements.length) return '';
        
        return this.state.announcements.map(a => `
            <div class="announcement-banner animate-slideInDown">
                <div class="announcement-text">${Utils.escapeHtml(a.text)}</div>
            </div>
        `).join('');
    },

    renderWelcome(user) {
        return `
            <div class="card animate-slideInUp">
                <div style="display: flex; align-items: center; gap: 12px;">
                    <div class="card-icon blue">👤</div>
                    <div>
                        <div class="card-title">سلام ${user?.telegramId ? Utils.toPersianNumber(user.telegramId) : 'کاربر'}</div>
                        <div class="text-secondary" style="font-size: 13px;">
                            ${user?.createdAt ? `عضویت: ${Utils.formatDateShort(user.createdAt)}` : 'خوش آمدید'}
                        </div>
                    </div>
                </div>
            </div>
        `;
    },

    renderUsageStats() {
        const usage = this.state.usage || { wireguard: 0, dns: 0 };
        const wgPercent = (usage.wireguard / CONFIG.DAILY_LIMITS.wireguard) * 100;
        const dnsPercent = (usage.dns / CONFIG.DAILY_LIMITS.dns) * 100;

        return `
            <div class="card animate-slideInUp stagger-1">
                <h3 class="card-title mb-16">مصرف امروز</h3>
                
                <div class="mb-16">
                    <div class="usage-info">
                        <span class="usage-label">🔐 WireGuard</span>
                        <span class="usage-value">${Utils.toPersianNumber(usage.wireguard)} از ${Utils.toPersianNumber(CONFIG.DAILY_LIMITS.wireguard)}</span>
                    </div>
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${Math.min(wgPercent, 100)}%; background: ${wgPercent >= 100 ? 'var(--accent-red)' : 'var(--accent-blue)'}"></div>
                    </div>
                </div>

                <div>
                    <div class="usage-info">
                        <span class="usage-label">🌐 DNS</span>
                        <span class="usage-value">${Utils.toPersianNumber(usage.dns)} از ${Utils.toPersianNumber(CONFIG.DAILY_LIMITS.dns)}</span>
                    </div>
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${Math.min(dnsPercent, 100)}%; background: ${dnsPercent >= 100 ? 'var(--accent-red)' : 'var(--accent-green)'}"></div>
                    </div>
                </div>
            </div>
        `;
    },

    async renderQuickActions() {
        let countries = [];
        try {
            const res = await API.getCountries().catch(() => ({ countries: [] }));
            countries = res.countries || [];
        } catch (e) {
            countries = [];
        }

        return `
            <div class="animate-slideInUp stagger-2">
                <div class="stat-grid">
                    <button class="card quick-action-card" onclick="App.navigate('wireguard')">
                        <img src="/images/wireguard.webp" alt="WireGuard" class="quick-action-img">
                        <div class="card-title">تولید WireGuard</div>
                    </button>
                    <button class="card quick-action-card" onclick="App.navigate('dns')">
                        <img src="/images/dns.webp" alt="DNS" class="quick-action-img">
                        <div class="card-title">تولید DNS</div>
                    </button>
                </div>
            </div>

            ${countries.length > 0 ? `
                <div class="card animate-slideInUp stagger-3">
                    <h3 class="card-title mb-16">کشورهای موجود</h3>
                    <div class="country-grid">
                        ${countries.map(c => `
                            <div class="country-card-mini">
                                <img src="${c.flag}" alt="${c.name}" class="country-flag">
                                <div class="country-name">${c.name}</div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            ` : ''}

            <div class="card animate-slideInUp stagger-4">
                <div class="card-header">
                    <div class="card-title">ابزارک‌ها</div>
                </div>
                <img src="/images/tool.webp" alt="Tools" class="tool-image">
                <p class="text-secondary text-center mb-16" style="font-size: 13px;">ابزارهای کمکی برای تنظیم VPN</p>
                <button class="btn btn-primary" onclick="App.navigate('tools')">
                    🔧 مشاهده ابزارک‌ها
                </button>
            </div>
        `;
    },

    renderAdminAccess() {
        return `
            <div class="card animate-slideInUp stagger-4" style="border-color: var(--accent-purple);">
                <div class="card-header">
                    <div class="card-title" style="color: var(--accent-purple);">پنل مدیریت</div>
                </div>
                <button class="btn btn-primary" style="background: var(--accent-purple);" onclick="App.navigate('admin')">
                    ورود به پنل ادمین
                </button>
            </div>
        `;
    },

    renderBottomNav(active) {
        return `
            <nav class="nav-bottom">
                <div class="nav-items">
                    <button class="nav-item ${active === 'home' ? 'active' : ''}" onclick="App.navigate('dashboard')">
                        <img src="/images/home.webp" alt="خانه" class="nav-item-icon-img">
                        <span class="nav-item-label">خانه</span>
                    </button>
                    <button class="nav-item ${active === 'wireguard' ? 'active' : ''}" onclick="App.navigate('wireguard')">
                        <img src="/images/wireguard.webp" alt="WireGuard" class="nav-item-icon-img">
                        <span class="nav-item-label">WireGuard</span>
                    </button>
                    <button class="nav-item ${active === 'dns' ? 'active' : ''}" onclick="App.navigate('dns')">
                        <img src="/images/dns.webp" alt="DNS" class="nav-item-icon-img">
                        <span class="nav-item-label">DNS</span>
                    </button>
                    <button class="nav-item ${active === 'tools' ? 'active' : ''}" onclick="App.navigate('tools')">
                        <img src="/images/tool.webp" alt="ابزارک‌ها" class="nav-item-icon-img">
                        <span class="nav-item-label">ابزارک‌ها</span>
                    </button>
                    <button class="nav-item ${active === 'history' ? 'active' : ''}" onclick="App.navigate('history')">
                        <img src="/images/history.webp" alt="تاریخچه" class="nav-item-icon-img">
                        <span class="nav-item-label">تاریخچه</span>
                    </button>
                </div>
            </nav>
        `;
    }
};
