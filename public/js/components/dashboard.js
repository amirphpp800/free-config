const Dashboard = {
    state: {
        usage: null,
        announcements: [],
        loading: true,
        resetTimer: null // Add resetTimer to state
    },

    async init() {
        this.state.loading = true;
        try {
            const [announcements, usage] = await Promise.all([
                API.getAnnouncements(),
                API.getUsage().catch(() => null) // Fetch usage data
            ]);
            this.state.announcements = announcements.announcements || [];
            this.state.usage = usage; // Store usage data

            // Start timer if user is limited
            if (usage?.isLimited && usage?.resetTimestamp) {
                this.startResetTimer(usage.resetTimestamp); // Pass resetTimestamp to startResetTimer
            }
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
            <div class="page" style="padding-bottom: 100px;">
                <div class="container">
                    ${this.renderAnnouncements()}
                    ${this.renderUsageStats()}
                    ${await this.renderQuickActions()}
                    ${isAdmin ? this.renderAdminAccess() : ''}
                </div>
            </div>
            ${this.renderBottomNav('home')}
        `;
    },

    renderProStatus() {
        const user = Storage.getUser();
        if (!user) return '';

        if (user.isPro && user.proExpiresAt) {
            const remaining = user.proExpiresAt - Date.now();
            const days = Math.ceil(remaining / (1000 * 60 * 60 * 24));

            return `
                <div class="card animate-slideInUp stagger-1" style="background: linear-gradient(135deg, #00E7F7 0%, #D36BF8 0%, #862DCD 100%); border: none;">
                    <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 12px;">
                        <div style="font-size: 32px;">👑</div>
                        <div>
                            <h3 style="color: white; font-size: 18px; margin-bottom: 4px;">اشتراک پرو فعال</h3>
                            <p style="color: rgba(255,255,255,0.9); font-size: 13px;">دسترسی روزانه ۱۵ تا</p>
                        </div>
                    </div>
                    <div style="background: rgba(255,255,255,0.2); border-radius: 8px; padding: 12px; backdrop-filter: blur(10px);">
                        <div style="color: white; font-size: 13px; margin-bottom: 4px;">زمان باقی‌مانده:</div>
                        <div style="color: white; font-size: 20px; font-weight: 700;">${Utils.toPersianNumber(days)} روز</div>
                    </div>
                </div>
            `;
        }

        return '';
    },

    async activateProCode() {
        const input = document.getElementById('pro-code-input');
        const code = input?.value?.trim();

        if (!code) {
            Toast.show('کد پرو را وارد کنید', 'error');
            return;
        }

        try {
            const result = await API.activateProCode(code);
            Storage.setUser(result.user);
            Toast.show('اشتراک پرو با موفقیت فعال شد!', 'success');
            await this.init();
        } catch (error) {
            Toast.show(error.message, 'error');
        }
    },

    renderAnnouncements() {
        return '';
    },

    // Updated startResetTimer to accept a timestamp
    startResetTimer(resetTimestamp) {
        if (this.state.resetTimer) {
            clearInterval(this.state.resetTimer);
        }

        this.state.resetTimer = setInterval(() => {
            const timerEl = document.getElementById('reset-timer');
            if (timerEl && resetTimestamp) {
                const remaining = resetTimestamp - Date.now();
                if (remaining <= 0) {
                    clearInterval(this.state.resetTimer);
                    this.state.resetTimer = null; // Clear the interval ID
                    location.reload();
                } else {
                    const hours = Math.floor(remaining / (1000 * 60 * 60));
                    const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
                    const seconds = Math.floor((remaining % (1000 * 60)) / 1000);
                    timerEl.textContent = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
                }
            } else if (!timerEl) { // If timer element is not found, clear interval
                clearInterval(this.state.resetTimer);
                this.state.resetTimer = null;
            }
        }, 1000);
    },

    renderUsageStats() {
        const user = Storage.getUser();
        const isAdmin = user?.isAdmin;
        
        if (isAdmin) {
            return `
                <div class="card animate-slideInUp stagger-2">
                    <h3 class="card-title mb-16">مصرف امروز</h3>
                    <div class="mb-16">
                        <div class="usage-info">
                            <span class="usage-label">🔐 WireGuard</span>
                            <span class="usage-value" style="color: var(--accent-green);">نامحدود ✓</span>
                        </div>
                    </div>
                    <div>
                        <div class="usage-info">
                            <span class="usage-label">🌐 DNS</span>
                            <span class="usage-value" style="color: var(--accent-green);">نامحدود ✓</span>
                        </div>
                    </div>
                </div>
            `;
        }

        const usage = this.state.usage || { wireguard: 0, dns: 0, wireguard_dual: 0, limit: 3 };
        const isPro = user?.isPro;
        const limit = isPro ? 15 : (usage.limit || CONFIG.DAILY_LIMITS.wireguard);
        const wgPercent = (usage.wireguard / limit) * 100;
        const dnsPercent = (usage.dns / limit) * 100;
        const isLimited = usage.isLimited || (usage.wireguard >= limit);

        // Ensure timer starts if needed, but only once. The init function should handle this.
        // This part is now handled in init() for better control.

        return `
            <div class="card animate-slideInUp stagger-1">
                <h3 class="card-title mb-16">مصرف امروز</h3>

                ${isLimited && usage.resetTimestamp ? `
                    <div class="limit-warning" style="background: rgba(255, 69, 58, 0.1); border: 1px solid var(--accent-red); border-radius: 12px; padding: 16px; margin-bottom: 16px; text-align: center;">
                        <div style="font-size: 14px; color: var(--accent-red); margin-bottom: 8px;">
                            ⚠️ محدودیت روزانه فعال شد
                        </div>
                        <div style="font-size: 12px; color: var(--text-secondary); margin-bottom: 12px;">
                            زمان باقی‌مانده تا ریست محدودیت:
                        </div>
                        <div id="reset-timer" style="font-size: 28px; font-weight: 700; color: var(--accent-red); font-family: monospace; direction: ltr;">
                            00:00:00
                        </div>
                    </div>
                ` : ''}

                <div class="mb-16">
                    <div class="usage-info">
                        <span class="usage-label">🔐 WireGuard</span>
                        <span class="usage-value">${Utils.toPersianNumber(usage.wireguard)} از ${Utils.toPersianNumber(limit)}</span>
                    </div>
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${Math.min(wgPercent, 100)}%; background: ${wgPercent >= 100 ? 'var(--accent-red)' : 'var(--accent-blue)'}"></div>
                    </div>
                </div>

                <div>
                    <div class="usage-info">
                        <span class="usage-label">🌐 DNS</span>
                        <span class="usage-value">${Utils.toPersianNumber(usage.dns)} از ${Utils.toPersianNumber(limit)}</span>
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

        // MTU configuration for WireGuard
        const MTU_OPTIONS = [1280, 1320, 1360, 1380, 1400, 1420, 1440, 1480, 1500];
        const randomMTU = MTU_OPTIONS[Math.floor(Math.random() * MTU_OPTIONS.length)];

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

            <div class="card tools-featured-card animate-slideInUp stagger-3" onclick="event.preventDefault(); App.navigate('tools')">
                <div class="tools-featured-header">
                    <div class="tools-featured-icon">
                        <img src="/images/tool.webp" alt="ابزارک‌ها">
                    </div>
                    <div class="tools-featured-content">
                        <div class="tools-featured-title">بخش ابزارک‌ها</div>
                        <div class="tools-featured-desc">آموزش نصب و راه‌اندازی</div>
                    </div>
                    <div class="tools-featured-arrow"></div>
                </div>
                <div class="tools-featured-items">
                    <div class="tools-mini-item">📱 اندروید</div>
                    <div class="tools-mini-item">🍎 iOS</div>
                    <div class="tools-mini-item">💻 ویندوز</div>
                    <div class="tools-mini-item">❓ راهنما</div>
                </div>
            </div>

            ${countries.length > 0 ? `
                <div class="card animate-slideInUp stagger-4">
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
                    <button class="nav-item ${active === 'tools' ? 'active' : ''}" onclick="event.preventDefault(); App.navigate('tools')">
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
