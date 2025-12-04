import auth from './auth.js';
import configGenerator from './config.js';

class App {
    constructor() {
        this.selectedWireguardLocation = null;
        this.selectedDnsLocation = null;
        this.wireguardDnsType = 'both';
        this.dnsDnsType = 'both';
        this.generatedWireguardConfig = null;
        this.generatedDns = null;
        this.countries = [];
        this.userLimits = null;

        this.init();
    }

    async init() {
        this.cacheElements();
        this.bindEvents();
        await this.loadCountries();
        this.renderLocations();
        this.updateAuthState();

        auth.onAuthChange = async (isAuth, session) => {
            await this.updateAuthState();
        };
    }

    cacheElements() {
        this.authSection = document.getElementById('auth-section');
        this.mainContent = document.getElementById('main-content');
        this.userBar = document.getElementById('user-bar');
        this.userName = document.getElementById('user-name');
        this.userId = document.getElementById('user-id');
        this.userLimitsEl = document.getElementById('user-limits');
        this.adminPanelBtn = document.getElementById('admin-panel-btn');
        this.logoutBtn = document.getElementById('logout-btn');
        this.loginBtn = document.getElementById('login-btn');

        this.loginModal = document.getElementById('login-modal');
        this.loginStep1 = document.getElementById('login-step-1');
        this.loginStep2 = document.getElementById('login-step-2');
        this.telegramIdInput = document.getElementById('telegram-id');
        this.sendCodeBtn = document.getElementById('send-code-btn');
        this.verifyCodeBtn = document.getElementById('verify-code-btn');
        this.codeInputs = document.querySelectorAll('.code-input');
        this.backToStep1Btn = document.getElementById('back-to-step-1');

        this.tabBtns = document.querySelectorAll('.tab-btn');
        this.wireguardTab = document.getElementById('wireguard-tab');
        this.dnsTab = document.getElementById('dns-tab');
        this.toolsTab = document.getElementById('tools-tab');
        this.announcementsTab = document.getElementById('announcements-tab');

        this.wireguardLocations = document.getElementById('wireguard-locations');
        this.dnsLocations = document.getElementById('dns-locations');

        this.wireguardSegments = document.querySelectorAll('.segment-btn');
        this.dnsSegments = document.querySelectorAll('.segment-btn-dns');

        this.wireguardDnsSelect = document.getElementById('wireguard-dns-select');
        this.wireguardOperatorSelect = document.getElementById('wireguard-operator-select');

        this.generateWireguardBtn = document.getElementById('generate-wireguard-btn');
        this.generateDnsBtn = document.getElementById('generate-dns-btn');

        this.wireguardOutput = document.getElementById('wireguard-output');
        this.wireguardConfig = document.getElementById('wireguard-config');
        this.copyWireguardBtn = document.getElementById('copy-wireguard-btn');
        this.downloadWireguardBtn = document.getElementById('download-wireguard-btn');

        this.dnsOutput = document.getElementById('dns-output');
        this.dnsServers = document.getElementById('dns-servers');
        this.copyDnsBtn = document.getElementById('copy-dns-btn');

        this.adminPanel = document.getElementById('admin-panel');
        this.closeAdminBtn = document.getElementById('close-admin-btn');
        this.addCountryBtn = document.getElementById('add-country-btn');
        this.countriesList = document.getElementById('countries-list');
        
        this.announcementsList = document.getElementById('announcements-list');
        this.announcementTemplate = document.getElementById('announcement-template');
        this.announcementTitle = document.getElementById('announcement-title');
        this.announcementMessage = document.getElementById('announcement-message');
        this.announcementType = document.getElementById('announcement-type');
        this.publishAnnouncementBtn = document.getElementById('publish-announcement-btn');
        this.adminAnnouncementsList = document.getElementById('admin-announcements-list');

        this.toast = document.getElementById('toast');
        this.toastIcon = document.getElementById('toast-icon');
        this.toastMessage = document.getElementById('toast-message');
    }

    bindEvents() {
        this.loginBtn?.addEventListener('click', () => this.openLoginModal());
        this.logoutBtn?.addEventListener('click', () => this.handleLogout());
        this.adminPanelBtn?.addEventListener('click', () => this.openAdminPanelWithAuth());
        this.closeAdminBtn?.addEventListener('click', () => this.closeAdminPanel());

        this.loginModal?.addEventListener('click', (e) => {
            if (e.target === this.loginModal) {
                this.closeLoginModal();
            }
        });

        this.sendCodeBtn?.addEventListener('click', () => this.handleSendCode());
        this.verifyCodeBtn?.addEventListener('click', () => this.handleVerifyCode());
        this.backToStep1Btn?.addEventListener('click', () => this.showLoginStep(1));

        this.telegramIdInput?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.handleSendCode();
        });

        this.codeInputs.forEach((input, index) => {
            input.addEventListener('input', (e) => {
                const value = e.target.value;
                if (value.length === 1 && index < this.codeInputs.length - 1) {
                    this.codeInputs[index + 1].focus();
                }
                if (this.isCodeComplete()) {
                    this.handleVerifyCode();
                }
            });

            input.addEventListener('keydown', (e) => {
                if (e.key === 'Backspace' && !e.target.value && index > 0) {
                    this.codeInputs[index - 1].focus();
                }
            });

            input.addEventListener('paste', (e) => {
                e.preventDefault();
                const paste = (e.clipboardData || window.clipboardData).getData('text');
                const digits = paste.replace(/\D/g, '').slice(0, 6);
                digits.split('').forEach((digit, i) => {
                    if (this.codeInputs[i]) {
                        this.codeInputs[i].value = digit;
                    }
                });
                if (digits.length === 6) {
                    this.handleVerifyCode();
                }
            });
        });

        this.tabBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const tab = btn.dataset.tab;
                this.switchTab(tab);
            });
        });

        this.wireguardSegments.forEach(btn => {
            btn.addEventListener('click', () => {
                this.wireguardSegments.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.wireguardDnsType = btn.dataset.type;
            });
        });

        this.dnsSegments.forEach(btn => {
            btn.addEventListener('click', () => {
                this.dnsSegments.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.dnsDnsType = btn.dataset.type;
            });
        });

        this.generateWireguardBtn?.addEventListener('click', () => this.generateWireguard());
        this.generateDnsBtn?.addEventListener('click', () => this.generateDns());
        this.copyWireguardBtn?.addEventListener('click', () => this.copyWireguard());
        this.downloadWireguardBtn?.addEventListener('click', () => this.downloadWireguard());
        this.copyDnsBtn?.addEventListener('click', () => this.copyDns());

        this.addCountryBtn?.addEventListener('click', () => this.addCountry());
        this.publishAnnouncementBtn?.addEventListener('click', () => this.publishAnnouncement());
        
        this.announcementTemplate?.addEventListener('change', (e) => this.fillAnnouncementTemplate(e.target.value));
    }

    switchTab(tab) {
        this.tabBtns.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === tab);
        });

        this.wireguardTab?.classList.remove('active');
        this.dnsTab?.classList.remove('active');
        this.toolsTab?.classList.remove('active');
        this.announcementsTab?.classList.remove('active');

        if (tab === 'wireguard') {
            this.wireguardTab?.classList.add('active');
        } else if (tab === 'dns') {
            this.dnsTab?.classList.add('active');
        } else if (tab === 'tools') {
            this.toolsTab?.classList.add('active');
            this.updateToolsStats();
        } else if (tab === 'announcements') {
            this.announcementsTab?.classList.add('active');
            this.loadAnnouncements();
        }
    }

    updateToolsStats() {
        if (this.userLimits) {
            const wireguardUsage = document.getElementById('wireguard-usage');
            const dnsUsage = document.getElementById('dns-usage');
            
            if (wireguardUsage) {
                wireguardUsage.textContent = `${this.userLimits.wireguardUsed || 0}/3`;
            }
            if (dnsUsage) {
                dnsUsage.textContent = `${this.userLimits.dnsUsed || 0}/3`;
            }
        }
    }

    showInstallGuide() {
        this.showToast('info', 'راهنمای نصب به زودی اضافه خواهد شد');
    }

    async updateAuthState() {
        const isAuth = auth.isAuthenticated();
        const user = auth.getUser();

        if (isAuth && user) {
            this.authSection?.classList.add('hidden');
            this.mainContent?.classList.remove('hidden');
            this.userBar?.classList.remove('hidden');

            // Apply changes: Use "کاربر" + telegramId and display telegramId directly for userId
            if (this.userName && user.telegramId) {
                this.userName.textContent = `کاربر ${user.telegramId}`;
            }

            if (this.userId && user.telegramId) {
                this.userId.textContent = `${user.telegramId}`;
            }

            const adminId = '7240662021';
            if (user.telegramId === adminId) {
                this.adminPanelBtn?.classList.remove('hidden');
            }

            await this.loadUserLimits();
        } else {
            this.authSection?.classList.remove('hidden');
            this.mainContent?.classList.add('hidden');
            this.userBar?.classList.add('hidden');
            this.adminPanelBtn?.classList.add('hidden');
        }
    }

    async loadUserLimits() {
        const token = auth.getToken();
        if (!token) return;

        try {
            const response = await fetch('/api/user/limits', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            const data = await response.json();
            if (response.ok) {
                this.userLimits = data;
                this.updateLimitsDisplay();
            }
        } catch (error) {
            console.error('Error loading limits:', error);
        }
    }

    updateLimitsDisplay() {
        if (!this.userLimitsEl || !this.userLimits) return;

        const { wireguardRemaining, dnsRemaining } = this.userLimits;
        this.userLimitsEl.textContent = `WireGuard: ${wireguardRemaining}/3 | DNS: ${dnsRemaining}/3`;
    }

    async loadCountries() {
        const token = auth.getToken();
        if (!token) return;

        try {
            const response = await fetch('/api/countries', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            const data = await response.json();
            if (response.ok) {
                this.countries = data.countries || [];
            }
        } catch (error) {
            console.error('Error loading countries:', error);
            this.countries = [];
        }
    }

    renderLocations() {
        if (!this.wireguardLocations || !this.dnsLocations) return;

        const html = this.countries.map(loc => `
            <div class="location-card" data-id="${loc.id}">
                <div class="location-header">
                    <img src="${loc.flagUrl}" alt="${loc.name}" class="location-flag">
                    <div>
                        <div class="location-name">${loc.name}</div>
                        <div class="location-city">${loc.city}</div>
                    </div>
                </div>
                <div class="location-details">
                    <span class="location-tag ipv4">IPv4</span>
                    <span class="location-tag ipv6">IPv6</span>
                    <span class="location-tag">${loc.latency}</span>
                </div>
            </div>
        `).join('');

        this.wireguardLocations.innerHTML = html;
        this.dnsLocations.innerHTML = html;

        this.wireguardLocations.querySelectorAll('.location-card').forEach(card => {
            card.addEventListener('click', () => {
                this.selectWireguardLocation(card.dataset.id);
            });
        });

        this.dnsLocations.querySelectorAll('.location-card').forEach(card => {
            card.addEventListener('click', () => {
                this.selectDnsLocation(card.dataset.id);
            });
        });
    }

    selectWireguardLocation(locationId) {
        this.selectedWireguardLocation = locationId;

        this.wireguardLocations?.querySelectorAll('.location-card').forEach(card => {
            card.classList.toggle('selected', card.dataset.id === locationId);
        });
    }

    selectDnsLocation(locationId) {
        this.selectedDnsLocation = locationId;

        this.dnsLocations?.querySelectorAll('.location-card').forEach(card => {
            card.classList.toggle('selected', card.dataset.id === locationId);
        });
    }

    async generateWireguard() {
        if (!this.selectedWireguardLocation) {
            this.showToast('warning', 'لطفا یک کشور انتخاب کنید');
            return;
        }

        if (this.userLimits && this.userLimits.wireguardRemaining <= 0) {
            this.showToast('error', 'محدودیت روزانه شما تمام شده است');
            return;
        }

        const token = auth.getToken();
        if (!token) return;

        const selectedDns = this.wireguardDnsSelect?.value || '1.1.1.1';
        const selectedOperator = this.wireguardOperatorSelect?.value || 'irancell';

        try {
            const response = await fetch('/api/config/generate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    locationId: this.selectedWireguardLocation,
                    dnsType: this.wireguardDnsType,
                    primaryDns: selectedDns,
                    operator: selectedOperator
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'خطا در دریافت کانفیگ');
            }

            this.generatedWireguardConfig = data.config;

            if (this.wireguardConfig) {
                this.wireguardConfig.textContent = data.config;
            }

            this.wireguardOutput?.classList.remove('hidden');
            this.wireguardOutput?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

            await this.loadUserLimits();
            this.showToast('success', 'کانفیگ با موفقیت دریافت شد');

        } catch (error) {
            this.showToast('error', error.message);
        }
    }

    async generateDns() {
        if (!this.selectedDnsLocation) {
            this.showToast('warning', 'لطفا یک کشور انتخاب کنید');
            return;
        }

        if (this.userLimits && this.userLimits.dnsRemaining <= 0) {
            this.showToast('error', 'محدودیت روزانه شما تمام شده است');
            return;
        }

        const token = auth.getToken();
        if (!token) return;

        try {
            const response = await fetch('/api/dns/generate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    locationId: this.selectedDnsLocation,
                    dnsType: this.dnsDnsType
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'خطا در دریافت DNS');
            }

            this.generatedDns = data.dns;

            if (this.dnsServers) {
                this.dnsServers.textContent = data.dns.join('\n');
            }

            this.dnsOutput?.classList.remove('hidden');
            this.dnsOutput?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

            await this.loadUserLimits();
            this.showToast('success', 'DNS با موفقیت دریافت شد');

        } catch (error) {
            this.showToast('error', error.message);
        }
    }

    async copyWireguard() {
        if (!this.generatedWireguardConfig) return;

        try {
            await configGenerator.copyToClipboard(this.generatedWireguardConfig);
            this.showToast('success', 'کانفیگ کپی شد');
        } catch (error) {
            this.showToast('error', 'خطا در کپی کردن');
        }
    }

    downloadWireguard() {
        if (!this.generatedWireguardConfig) return;

        const location = this.countries.find(c => c.id === this.selectedWireguardLocation);
        const filename = `wireguard-${location?.id || 'config'}.conf`;
        configGenerator.downloadConfig(this.generatedWireguardConfig, filename);
        this.showToast('success', 'کانفیگ دانلود شد');
    }

    async copyDns() {
        if (!this.generatedDns) return;

        try {
            await configGenerator.copyToClipboard(this.generatedDns.join('\n'));
            this.showToast('success', 'DNS کپی شد');
        } catch (error) {
            this.showToast('error', 'خطا در کپی کردن');
        }
    }

    async openAdminPanelWithAuth() {
        const adminToken = localStorage.getItem('admin_token');
        
        if (adminToken && await this.verifyAdminToken(adminToken)) {
            this.openAdminPanel();
            return;
        }
        
        const adminId = '7240662021';
        const telegramId = prompt('لطفا شناسه تلگرام ادمین را وارد کنید:');
        
        if (telegramId !== adminId) {
            this.showToast('error', 'شما دسترسی ادمین ندارید');
            return;
        }
        
        try {
            const response = await fetch('/api/admin/auth/request', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ telegramId })
            });

            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.error || 'خطا در ارسال کد');
            }

            const code = prompt('کد 6 رقمی ارسال شده به تلگرام را وارد کنید:');
            
            if (!code || code.length !== 6) {
                this.showToast('error', 'کد نامعتبر است');
                return;
            }

            const verifyResponse = await fetch('/api/admin/auth/verify', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ telegramId, code })
            });

            const verifyData = await verifyResponse.json();
            
            if (!verifyResponse.ok) {
                throw new Error(verifyData.error || 'کد اشتباه است');
            }

            localStorage.setItem('admin_token', verifyData.token);
            this.showToast('success', 'ورود به پنل مدیریت موفق');
            this.openAdminPanel();

        } catch (error) {
            this.showToast('error', error.message);
        }
    }

    async verifyAdminToken(token) {
        try {
            const response = await fetch('/api/admin/countries', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            return response.ok;
        } catch {
            return false;
        }
    }

    async openAdminPanel() {
        this.adminPanel?.classList.remove('hidden');
        await this.loadAdminCountries();
    }

    closeAdminPanel() {
        this.adminPanel?.classList.add('hidden');
    }

    async loadAdminCountries() {
        const adminToken = localStorage.getItem('admin_token');
        if (!adminToken) return;

        try {
            const response = await fetch('/api/admin/countries', {
                headers: {
                    'Authorization': `Bearer ${adminToken}`
                }
            });

            const data = await response.json();
            if (response.ok) {
                this.countries = data.countries || [];
                this.renderCountriesList();
            }
        } catch (error) {
            console.error('Error loading countries:', error);
        }
    }

    renderCountriesList() {
        if (!this.countriesList) return;

        const html = this.countries.map(country => `
            <div class="country-item">
                <div class="country-info">
                    <img src="${country.flagUrl}" alt="${country.name}" class="country-flag-small">
                    <div>
                        <div class="location-name">${country.name}</div>
                        <div class="location-city">${country.city}</div>
                    </div>
                </div>
                <button class="btn btn-ghost" onclick="app.deleteCountry('${country.id}')">حذف</button>
            </div>
        `).join('');

        this.countriesList.innerHTML = html || '<p style="color: var(--text-secondary)">هیچ کشوری ثبت نشده است</p>';
    }

    async addCountry() {
        const id = document.getElementById('admin-country-id')?.value.trim();
        const name = document.getElementById('admin-country-name')?.value.trim();
        const city = document.getElementById('admin-city-name')?.value.trim();
        const flagUrl = document.getElementById('admin-flag-url')?.value.trim();
        const dnsIpv4 = document.getElementById('admin-dns-ipv4')?.value.trim();
        const dnsIpv6 = document.getElementById('admin-dns-ipv6')?.value.trim();
        const endpoint = document.getElementById('admin-endpoint')?.value.trim();
        const latency = document.getElementById('admin-latency')?.value.trim();

        if (!id || !name || !city || !flagUrl) {
            this.showToast('error', 'لطفا تمام فیلدهای الزامی را پر کنید');
            return;
        }

        const adminToken = localStorage.getItem('admin_token');
        if (!adminToken) {
            this.showToast('error', 'لطفا ابتدا وارد پنل مدیریت شوید');
            return;
        }

        try {
            const response = await fetch('/api/admin/countries', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${adminToken}`
                },
                body: JSON.stringify({
                    id, name, city, flagUrl,
                    dns: {
                        ipv4: dnsIpv4.split(',').map(s => s.trim()).filter(Boolean),
                        ipv6: dnsIpv6.split(',').map(s => s.trim()).filter(Boolean)
                    },
                    endpoint,
                    latency
                })
            });

            const data = await response.json();

            if (!response.ok) {
                if (response.status === 403) {
                    localStorage.removeItem('admin_token');
                    this.showToast('error', 'نشست شما منقضی شده. لطفا دوباره وارد شوید');
                    this.closeAdminPanel();
                    return;
                }
                throw new Error(data.error || 'خطا در افزودن کشور');
            }

            this.showToast('success', 'کشور با موفقیت اضافه شد');
            await this.loadCountries();
            this.renderLocations();
            await this.loadAdminCountries();

            document.querySelectorAll('#admin-panel input').forEach(input => input.value = '');

        } catch (error) {
            this.showToast('error', error.message);
        }
    }

    async deleteCountry(id) {
        if (!confirm('آیا مطمئن هستید؟')) return;

        const adminToken = localStorage.getItem('admin_token');
        if (!adminToken) {
            this.showToast('error', 'لطفا ابتدا وارد پنل مدیریت شوید');
            return;
        }

        try {
            const response = await fetch(`/api/admin/countries/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${adminToken}`
                }
            });

            const data = await response.json();

            if (!response.ok) {
                if (response.status === 403) {
                    localStorage.removeItem('admin_token');
                    this.showToast('error', 'نشست شما منقضی شده. لطفا دوباره وارد شوید');
                    this.closeAdminPanel();
                    return;
                }
                throw new Error(data.error || 'خطا در حذف کشور');
            }

            this.showToast('success', 'کشور حذف شد');
            await this.loadCountries();
            this.renderLocations();
            await this.loadAdminCountries();

        } catch (error) {
            this.showToast('error', error.message);
        }
    }

    openLoginModal() {
        this.loginModal?.classList.add('active');
        this.showLoginStep(1);
        setTimeout(() => this.telegramIdInput?.focus(), 300);
    }

    closeLoginModal() {
        this.loginModal?.classList.remove('active');
        this.resetLoginForm();
    }

    showLoginStep(step) {
        if (step === 1) {
            this.loginStep1?.classList.remove('hidden');
            this.loginStep2?.classList.add('hidden');
            this.sendCodeBtn?.classList.remove('hidden');
            this.verifyCodeBtn?.classList.add('hidden');
        } else {
            this.loginStep1?.classList.add('hidden');
            this.loginStep2?.classList.remove('hidden');
            this.sendCodeBtn?.classList.add('hidden');
            this.verifyCodeBtn?.classList.add('hidden');
            this.codeInputs[0]?.focus();
        }
    }

    resetLoginForm() {
        if (this.telegramIdInput) this.telegramIdInput.value = '';
        this.codeInputs.forEach(input => input.value = '');
        this.showLoginStep(1);
    }

    isCodeComplete() {
        return Array.from(this.codeInputs).every(input => input.value.length === 1);
    }

    getVerificationCode() {
        return Array.from(this.codeInputs).map(input => input.value).join('');
    }

    async handleSendCode() {
        const telegramId = this.telegramIdInput?.value.trim();

        if (!telegramId || !/^\d{5,15}$/.test(telegramId)) {
            this.showToast('error', 'لطفا شناسه تلگرام معتبر وارد کنید');
            return;
        }

        this.sendCodeBtn.disabled = true;
        this.sendCodeBtn.innerHTML = '<div class="loading-spinner"></div>';

        try {
            await auth.requestVerification(telegramId);
            this.showToast('success', 'کد تایید به تلگرام شما ارسال شد');
            this.showLoginStep(2);
        } catch (error) {
            this.showToast('error', error.message);
        } finally {
            this.sendCodeBtn.disabled = false;
            this.sendCodeBtn.textContent = 'ارسال کد تایید';
        }
    }

    async handleVerifyCode() {
        const telegramId = this.telegramIdInput?.value.trim();
        const code = this.getVerificationCode();

        if (code.length !== 6) {
            return;
        }

        this.verifyCodeBtn.disabled = true;
        this.verifyCodeBtn.innerHTML = '<div class="loading-spinner"></div>';

        try {
            await auth.verifyCode(telegramId, code);
            this.showToast('success', 'ورود موفقیت‌آمیز');
            this.closeLoginModal();
        } catch (error) {
            this.showToast('error', error.message);
            this.codeInputs.forEach(input => input.value = '');
            this.codeInputs[0]?.focus();
        } finally {
            this.verifyCodeBtn.disabled = false;
            this.verifyCodeBtn.textContent = 'تایید کد';
        }
    }

    handleLogout() {
        auth.logout();
        this.showToast('success', 'با موفقیت خارج شدید');
        this.selectedWireguardLocation = null;
        this.selectedDnsLocation = null;
        this.generatedWireguardConfig = null;
        this.generatedDns = null;
        this.wireguardOutput?.classList.add('hidden');
        this.dnsOutput?.classList.add('hidden');
        this.closeAdminPanel();
    }

    fillAnnouncementTemplate(templateType) {
        if (!templateType) return;

        const templates = {
            maintenance: {
                title: '🔧 تعمیرات سرور',
                message: 'کاربران عزیز، به اطلاع می‌رساند که سرورها در تاریخ [تاریخ] از ساعت [ساعت] به مدت [مدت] به دلیل تعمیرات برنامه‌ریزی شده خاموش خواهند بود.\n\nاز صبر و شکیبایی شما سپاسگزاریم.',
                type: 'warning'
            },
            update: {
                title: '🆕 به‌روزرسانی سرویس',
                message: 'نسخه جدید سرویس منتشر شد!\n\nامکانات جدید:\n- [ویژگی ۱]\n- [ویژگی ۲]\n- [ویژگی ۳]\n\nبرای استفاده از آخرین امکانات، لطفا از آخرین نسخه استفاده کنید.',
                type: 'success'
            },
            new_feature: {
                title: '✨ ویژگی جدید اضافه شد',
                message: 'کاربران گرامی،\n\nیک ویژگی جدید به سرویس اضافه شد: [نام ویژگی]\n\n[توضیحات ویژگی]\n\nامیدواریم از این قابلیت جدید لذت ببرید!',
                type: 'info'
            },
            warning: {
                title: '⚠️ هشدار مهم',
                message: 'توجه! توجه!\n\n[متن هشدار]\n\nلطفا این موضوع را جدی بگیرید و اقدامات لازم را انجام دهید.',
                type: 'error'
            },
            info: {
                title: 'ℹ️ اطلاعیه عمومی',
                message: 'کاربران عزیز،\n\n[متن اطلاعیه]\n\nبا تشکر از همراهی شما',
                type: 'info'
            }
        };

        const template = templates[templateType];
        if (template) {
            this.announcementTitle.value = template.title;
            this.announcementMessage.value = template.message;
            this.announcementType.value = template.type;
        }
    }

    async loadAnnouncements() {
        const token = auth.getToken();
        if (!token) return;

        try {
            const response = await fetch('/api/announcements', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            const data = await response.json();
            if (response.ok) {
                this.renderAnnouncements(data.announcements || []);
            }
        } catch (error) {
            console.error('Error loading announcements:', error);
        }
    }

    renderAnnouncements(announcements) {
        if (!this.announcementsList) return;

        if (announcements.length === 0) {
            this.announcementsList.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">📭</div>
                    <p>هیچ اعلانی موجود نیست</p>
                </div>
            `;
            return;
        }

        const html = announcements.map(ann => {
            const date = new Date(ann.createdAt);
            const formattedDate = new Intl.DateTimeFormat('fa-IR', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            }).format(date);

            return `
                <div class="announcement-card type-${ann.type}">
                    <div class="announcement-header">
                        <div>
                            <div class="announcement-title">${ann.title}</div>
                            <span class="announcement-badge type-${ann.type}">${this.getTypeLabel(ann.type)}</span>
                        </div>
                        <div class="announcement-date">${formattedDate}</div>
                    </div>
                    <div class="announcement-message">${ann.message}</div>
                </div>
            `;
        }).join('');

        this.announcementsList.innerHTML = html;
    }

    async renderAdminAnnouncements(announcements) {
        if (!this.adminAnnouncementsList) return;

        if (announcements.length === 0) {
            this.adminAnnouncementsList.innerHTML = '<p style="color: var(--text-secondary)">هیچ اعلانی منتشر نشده است</p>';
            return;
        }

        const html = announcements.map(ann => {
            const date = new Date(ann.createdAt);
            const formattedDate = new Intl.DateTimeFormat('fa-IR', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            }).format(date);

            return `
                <div class="announcement-card type-${ann.type}">
                    <div class="announcement-header">
                        <div>
                            <div class="announcement-title">${ann.title}</div>
                            <span class="announcement-badge type-${ann.type}">${this.getTypeLabel(ann.type)}</span>
                        </div>
                        <div class="announcement-date">${formattedDate}</div>
                    </div>
                    <div class="announcement-message">${ann.message}</div>
                    <div class="announcement-actions">
                        <button class="btn btn-ghost" onclick="app.deleteAnnouncement('${ann.id}')">حذف</button>
                    </div>
                </div>
            `;
        }).join('');

        this.adminAnnouncementsList.innerHTML = html;
    }

    getTypeLabel(type) {
        const labels = {
            info: 'اطلاعیه',
            warning: 'هشدار',
            success: 'خبر خوش',
            error: 'مهم'
        };
        return labels[type] || 'اطلاعیه';
    }

    async publishAnnouncement() {
        const title = this.announcementTitle?.value.trim();
        const message = this.announcementMessage?.value.trim();
        const type = this.announcementType?.value || 'info';

        if (!title || !message) {
            this.showToast('error', 'لطفا عنوان و متن اعلان را وارد کنید');
            return;
        }

        const adminToken = localStorage.getItem('admin_token');
        if (!adminToken) {
            this.showToast('error', 'لطفا ابتدا وارد پنل مدیریت شوید');
            return;
        }

        try {
            const response = await fetch('/api/admin/announcements', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${adminToken}`
                },
                body: JSON.stringify({ title, message, type })
            });

            const data = await response.json();

            if (!response.ok) {
                if (response.status === 403) {
                    localStorage.removeItem('admin_token');
                    this.showToast('error', 'نشست شما منقضی شده. لطفا دوباره وارد شوید');
                    this.closeAdminPanel();
                    return;
                }
                throw new Error(data.error || 'خطا در انتشار اعلان');
            }

            this.showToast('success', 'اعلان با موفقیت منتشر شد');
            
            this.announcementTitle.value = '';
            this.announcementMessage.value = '';
            this.announcementType.value = 'info';
            this.announcementTemplate.value = '';
            
            await this.loadAdminAnnouncements();

        } catch (error) {
            this.showToast('error', error.message);
        }
    }

    async loadAdminAnnouncements() {
        const adminToken = localStorage.getItem('admin_token');
        if (!adminToken) return;

        try {
            const response = await fetch('/api/admin/announcements', {
                headers: {
                    'Authorization': `Bearer ${adminToken}`
                }
            });

            const data = await response.json();
            if (response.ok) {
                this.renderAdminAnnouncements(data.announcements || []);
            }
        } catch (error) {
            console.error('Error loading admin announcements:', error);
        }
    }

    async deleteAnnouncement(id) {
        if (!confirm('آیا مطمئن هستید که می‌خواهید این اعلان را حذف کنید؟')) return;

        const adminToken = localStorage.getItem('admin_token');
        if (!adminToken) {
            this.showToast('error', 'لطفا ابتدا وارد پنل مدیریت شوید');
            return;
        }

        try {
            const response = await fetch(`/api/admin/announcements/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${adminToken}`
                }
            });

            const data = await response.json();

            if (!response.ok) {
                if (response.status === 403) {
                    localStorage.removeItem('admin_token');
                    this.showToast('error', 'نشست شما منقضی شده. لطفا دوباره وارد شوید');
                    this.closeAdminPanel();
                    return;
                }
                throw new Error(data.error || 'خطا در حذف اعلان');
            }

            this.showToast('success', 'اعلان حذف شد');
            await this.loadAdminAnnouncements();

        } catch (error) {
            this.showToast('error', error.message);
        }
    }

    async openAdminPanel() {
        this.adminPanel?.classList.remove('hidden');
        await this.loadSystemStatus();
        await this.loadAdminCountries();
        await this.loadAdminAnnouncements();
    }

    async loadSystemStatus() {
        const adminToken = localStorage.getItem('admin_token');
        if (!adminToken) return;

        const kvBadge = document.getElementById('kv-status-badge');
        const kvMessage = document.getElementById('kv-status-message');
        const botBadge = document.getElementById('bot-status-badge');
        const botMessage = document.getElementById('bot-status-message');

        try {
            const response = await fetch('/api/admin/system-status', {
                headers: {
                    'Authorization': `Bearer ${adminToken}`
                }
            });

            const data = await response.json();
            
            if (response.ok) {
                if (kvBadge && kvMessage) {
                    kvBadge.className = `status-badge status-${data.kv.status}`;
                    kvBadge.textContent = data.kv.status === 'connected' ? '✓ متصل' : '✕ قطع';
                    kvMessage.textContent = data.kv.message;
                }

                if (botBadge && botMessage) {
                    botBadge.className = `status-badge status-${data.bot.status}`;
                    if (data.bot.status === 'connected') {
                        botBadge.textContent = '✓ فعال';
                    } else if (data.bot.status === 'error') {
                        botBadge.textContent = '⚠ خطا';
                    } else {
                        botBadge.textContent = '✕ غیرفعال';
                    }
                    botMessage.textContent = data.bot.message;
                }
            }
        } catch (error) {
            console.error('Error loading system status:', error);
            if (kvBadge) {
                kvBadge.className = 'status-badge status-error';
                kvBadge.textContent = '⚠ خطا';
            }
            if (kvMessage) {
                kvMessage.textContent = 'خطا در دریافت اطلاعات';
            }
        }
    }

    showToast(type, message) {
        const icons = {
            success: '✓',
            error: '✕',
            warning: '⚠',
            info: 'ℹ'
        };

        if (this.toastIcon) this.toastIcon.textContent = icons[type] || icons.info;
        if (this.toastMessage) this.toastMessage.textContent = message;

        this.toast?.classList.add('show');

        setTimeout(() => {
            this.toast?.classList.remove('show');
        }, 3000);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.app = new App();
});