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

        this.ipVersionModal = document.getElementById('ip-version-modal');
        this.selectIpv4Btn = document.getElementById('select-ipv4-btn');
        this.selectIpv6Btn = document.getElementById('select-ipv6-btn');
        this.cancelIpVersionBtn = document.getElementById('cancel-ip-version-btn');
        this.currentServiceType = null;

        this.loginModal = document.getElementById('login-modal');
        this.loginStep1 = document.getElementById('login-step-1');
        this.loginStep2 = document.getElementById('login-step-2');
        this.telegramIdInput = document.getElementById('telegram-id');
        this.sendCodeBtn = document.getElementById('send-code-btn');
        this.verifyCodeBtn = document.getElementById('verify-code-btn');
        this.codeInputs = document.querySelectorAll('.code-input');
        this.backToStep1Btn = document.getElementById('back-to-step-1');

        this.adminLoginModal = document.getElementById('admin-login-modal');
        this.adminLoginStep1 = document.getElementById('admin-login-step-1');
        this.adminLoginStep2 = document.getElementById('admin-login-step-2');
        this.adminTelegramIdInput = document.getElementById('admin-telegram-id');
        this.adminSendCodeBtn = document.getElementById('admin-send-code-btn');
        this.adminVerifyCodeBtn = document.getElementById('admin-verify-code-btn');
        this.adminCodeInputs = document.querySelectorAll('.admin-code-input');
        this.adminBackToStep1Btn = document.getElementById('admin-back-to-step-1');

        this.tabBtns = document.querySelectorAll('.tab-btn');
        this.wireguardTab = document.getElementById('wireguard-tab');
        this.dnsTab = document.getElementById('dns-tab');
        this.profileTab = document.getElementById('profile-tab');
        this.toolsTab = document.getElementById('tools-tab');
        this.announcementsTab = document.getElementById('announcements-tab');

        this.profileName = document.getElementById('profile-name');
        this.profileId = document.getElementById('profile-id');
        this.profileLimits = document.getElementById('profile-limits');
        this.profileAdminBadge = document.getElementById('profile-admin-badge');
        this.historyList = document.getElementById('history-list');

        this.wireguardLocations = document.getElementById('wireguard-locations');
        this.dnsLocations = document.getElementById('dns-locations');

        this.wireguardSegments = document.querySelectorAll('.segment-btn');
        this.dnsSegments = document.querySelectorAll('.segment-btn-dns');

        this.wireguardOperator = document.getElementById('wireguard-operator');
        this.wireguardTunnelDns = document.getElementById('wireguard-tunnel-dns');
        this.profileBtn = document.getElementById('profile-btn');

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
        this.profileBtn?.addEventListener('click', () => this.switchTab('profile'));
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
                
                // Remove non-numeric characters
                if (!/^\d*$/.test(value)) {
                    e.target.value = value.replace(/\D/g, '');
                    return;
                }
                
                // Move to next input
                if (value.length === 1 && index < this.codeInputs.length - 1) {
                    this.codeInputs[index + 1].focus();
                    this.codeInputs[index + 1].select();
                }
                
                // Auto-verify when complete
                if (this.isCodeComplete()) {
                    this.handleVerifyCode();
                }
            });

            input.addEventListener('keydown', (e) => {
                // Move to previous input on backspace
                if (e.key === 'Backspace') {
                    if (!e.target.value && index > 0) {
                        this.codeInputs[index - 1].focus();
                        this.codeInputs[index - 1].select();
                    }
                }
                
                // Move to next/previous with arrow keys
                if (e.key === 'ArrowRight' && index < this.codeInputs.length - 1) {
                    e.preventDefault();
                    this.codeInputs[index + 1].focus();
                    this.codeInputs[index + 1].select();
                }
                
                if (e.key === 'ArrowLeft' && index > 0) {
                    e.preventDefault();
                    this.codeInputs[index - 1].focus();
                    this.codeInputs[index - 1].select();
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
                
                // Focus on the last filled input or the first empty one
                const nextIndex = Math.min(digits.length, this.codeInputs.length - 1);
                this.codeInputs[nextIndex].focus();
                
                if (digits.length === 6) {
                    this.handleVerifyCode();
                }
            });
            
            // Select all on focus for easier editing
            input.addEventListener('focus', (e) => {
                e.target.select();
            });
        });

        // Admin code inputs
        this.adminLoginModal?.addEventListener('click', (e) => {
            if (e.target === this.adminLoginModal) {
                this.closeAdminLoginModal();
            }
        });

        this.adminSendCodeBtn?.addEventListener('click', () => this.handleAdminSendCode());
        this.adminVerifyCodeBtn?.addEventListener('click', () => this.handleAdminVerifyCode());
        this.adminBackToStep1Btn?.addEventListener('click', () => this.showAdminLoginStep(1));

        this.adminTelegramIdInput?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.handleAdminSendCode();
        });

        this.adminCodeInputs.forEach((input, index) => {
            input.addEventListener('input', (e) => {
                const value = e.target.value;
                
                if (!/^\d*$/.test(value)) {
                    e.target.value = value.replace(/\D/g, '');
                    return;
                }
                
                if (value.length === 1 && index < this.adminCodeInputs.length - 1) {
                    this.adminCodeInputs[index + 1].focus();
                    this.adminCodeInputs[index + 1].select();
                }
                
                if (this.isAdminCodeComplete()) {
                    this.handleAdminVerifyCode();
                }
            });

            input.addEventListener('keydown', (e) => {
                if (e.key === 'Backspace') {
                    if (!e.target.value && index > 0) {
                        this.adminCodeInputs[index - 1].focus();
                        this.adminCodeInputs[index - 1].select();
                    }
                }
                
                if (e.key === 'ArrowRight' && index < this.adminCodeInputs.length - 1) {
                    e.preventDefault();
                    this.adminCodeInputs[index + 1].focus();
                    this.adminCodeInputs[index + 1].select();
                }
                
                if (e.key === 'ArrowLeft' && index > 0) {
                    e.preventDefault();
                    this.adminCodeInputs[index - 1].focus();
                    this.adminCodeInputs[index - 1].select();
                }
            });

            input.addEventListener('paste', (e) => {
                e.preventDefault();
                const paste = (e.clipboardData || window.clipboardData).getData('text');
                const digits = paste.replace(/\D/g, '').slice(0, 6);
                
                digits.split('').forEach((digit, i) => {
                    if (this.adminCodeInputs[i]) {
                        this.adminCodeInputs[i].value = digit;
                    }
                });
                
                const nextIndex = Math.min(digits.length, this.adminCodeInputs.length - 1);
                this.adminCodeInputs[nextIndex].focus();
                
                if (digits.length === 6) {
                    this.handleAdminVerifyCode();
                }
            });
            
            input.addEventListener('focus', (e) => {
                e.target.select();
            });
        });

        this.tabBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const tab = btn.dataset.tab;
                this.switchTab(tab);
            });
        });

        this.ipVersionModal?.addEventListener('click', (e) => {
            if (e.target === this.ipVersionModal) {
                this.closeIpVersionModal();
            }
        });

        this.selectIpv4Btn?.addEventListener('click', () => this.handleIpVersionSelect('ipv4'));
        this.selectIpv6Btn?.addEventListener('click', () => this.handleIpVersionSelect('ipv6'));
        this.cancelIpVersionBtn?.addEventListener('click', () => this.closeIpVersionModal());
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
        this.profileTab?.classList.remove('active');
        this.toolsTab?.classList.remove('active');
        this.announcementsTab?.classList.remove('active');

        if (tab === 'wireguard') {
            this.wireguardTab?.classList.add('active');
        } else if (tab === 'dns') {
            this.dnsTab?.classList.add('active');
        } else if (tab === 'profile') {
            this.profileTab?.classList.add('active');
            this.loadProfile();
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

        const { wireguardRemaining, dnsRemaining, isAdmin } = this.userLimits;
        
        if (isAdmin) {
            this.userLimitsEl.textContent = `WireGuard: نامحدود | DNS: نامحدود`;
        } else {
            this.userLimitsEl.textContent = `WireGuard: ${wireguardRemaining}/3 | DNS: ${dnsRemaining}/3`;
        }
    }

    async loadProfile() {
        const token = auth.getToken();
        const user = auth.getUser();
        
        if (!token || !user) return;

        if (this.profileName && user.telegramId) {
            this.profileName.textContent = `کاربر ${user.telegramId}`;
        }
        if (this.profileId && user.telegramId) {
            this.profileId.textContent = `شناسه: ${user.telegramId}`;
        }

        await this.loadUserLimits();
        
        if (this.userLimits) {
            const { wireguardRemaining, dnsRemaining, isAdmin } = this.userLimits;
            
            if (isAdmin) {
                this.profileLimits.textContent = `محدودیت روزانه: نامحدود`;
                this.profileAdminBadge?.classList.remove('hidden');
            } else {
                this.profileLimits.textContent = `محدودیت روزانه: WireGuard ${wireguardRemaining}/3 | DNS ${dnsRemaining}/3`;
                this.profileAdminBadge?.classList.add('hidden');
            }
        }

        await this.loadHistory();
    }

    async loadHistory() {
        const token = auth.getToken();
        if (!token) return;

        try {
            const response = await fetch('/api/user/history', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            const data = await response.json();
            
            if (response.ok && data.history) {
                this.renderHistory(data.history);
            }
        } catch (error) {
            console.error('Error loading history:', error);
        }
    }

    renderHistory(history) {
        if (!this.historyList) return;

        if (history.length === 0) {
            this.historyList.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">📭</div>
                    <p>هیچ تاریخچه‌ای موجود نیست</p>
                </div>
            `;
            return;
        }

        const html = history.map(item => {
            const date = new Date(item.createdAt);
            const dateStr = date.toLocaleDateString('fa-IR') + ' ' + date.toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' });
            
            const typeIcon = item.type === 'wireguard' ? '🔐' : '🌐';
            const typeLabel = item.type === 'wireguard' ? 'WireGuard' : 'DNS';
            const typeClass = item.type;

            let detailsHtml = '';
            let configHtml = '';
            let actionsHtml = '';

            if (item.data) {
                detailsHtml = `
                    <div class="history-item-details">
                        <span class="history-detail-tag">${item.data.locationName || item.data.locationId}</span>
                        <span class="history-detail-tag">${item.data.dnsType === 'ipv4' ? 'IPv4' : item.data.dnsType === 'ipv6' ? 'IPv6' : 'IPv4 + IPv6'}</span>
                    </div>
                `;

                if (item.type === 'wireguard' && item.data.config) {
                    configHtml = `<div class="history-item-config">${item.data.config}</div>`;
                    actionsHtml = `
                        <div class="history-item-actions">
                            <button class="btn btn-secondary" onclick="app.copyHistoryItem('${item.id}', 'config')">📋 کپی</button>
                            <button class="btn btn-primary" onclick="app.downloadHistoryItem('${item.id}')">⬇️ دانلود</button>
                        </div>
                    `;
                } else if (item.type === 'dns' && item.data.dns) {
                    configHtml = `<div class="history-item-config">${item.data.dns.join('\\n')}</div>`;
                    actionsHtml = `
                        <div class="history-item-actions">
                            <button class="btn btn-secondary" onclick="app.copyHistoryItem('${item.id}', 'dns')">📋 کپی</button>
                        </div>
                    `;
                }
            }

            return `
                <div class="history-item" data-id="${item.id}">
                    <div class="history-item-header">
                        <span class="history-item-type ${typeClass}">${typeIcon} ${typeLabel}</span>
                        <span class="history-item-date">${dateStr}</span>
                    </div>
                    ${detailsHtml}
                    ${configHtml}
                    ${actionsHtml}
                </div>
            `;
        }).join('');

        this.historyList.innerHTML = html;
        
        this.userHistory = history;
    }

    copyHistoryItem(itemId, type) {
        const item = this.userHistory?.find(h => h.id === itemId);
        if (!item) return;

        let textToCopy = '';
        if (type === 'config' && item.data.config) {
            textToCopy = item.data.config;
        } else if (type === 'dns' && item.data.dns) {
            textToCopy = item.data.dns.join('\\n');
        }

        if (textToCopy) {
            navigator.clipboard.writeText(textToCopy).then(() => {
                this.showToast('success', 'کپی شد');
            }).catch(() => {
                this.showToast('error', 'خطا در کپی کردن');
            });
        }
    }

    downloadHistoryItem(itemId) {
        const item = this.userHistory?.find(h => h.id === itemId);
        if (!item || !item.data.config) return;

        const filename = `wireguard-${item.data.locationId || 'config'}.conf`;
        configGenerator.downloadConfig(item.data.config, filename);
        this.showToast('success', 'دانلود شد');
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

        const html = this.countries.map(loc => {
            const ipv4Count = loc.dns?.ipv4?.length || 0;
            const ipv6Count = loc.dns?.ipv6?.length || 0;
            
            return `
                <div class="location-card" data-id="${loc.id}">
                    <div class="location-header">
                        <span class="fi fi-${loc.id.toLowerCase()}" style="font-size: 48px; margin-left: 12px;"></span>
                        <div>
                            <div class="location-name">${loc.name}</div>
                            <div class="location-city">${loc.nameEn || loc.id.toUpperCase()}</div>
                        </div>
                    </div>
                    <div class="location-details">
                        <span class="location-tag ipv4">IPv4</span>
                        <span class="location-tag ipv6">IPv6</span>
                    </div>
                    <div class="location-inventory">
                        <span class="inventory-tag ipv4">موجودی IPv4: <span class="inventory-count">${ipv4Count}</span></span>
                        <span class="inventory-tag ipv6">موجودی IPv6: <span class="inventory-count">${ipv6Count}</span></span>
                    </div>
                </div>
            `;
        }).join('');

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

        this.currentServiceType = 'wireguard';
        this.openIpVersionModal(locationId);
    }

    selectDnsLocation(locationId) {
        this.selectedDnsLocation = locationId;

        this.dnsLocations?.querySelectorAll('.location-card').forEach(card => {
            card.classList.toggle('selected', card.dataset.id === locationId);
        });

        this.currentServiceType = 'dns';
        this.openIpVersionModal(locationId);
    }

    openIpVersionModal(locationId) {
        const location = this.countries.find(c => c.id === locationId);
        if (!location) return;

        const hasIpv4 = location.dns.ipv4 && location.dns.ipv4.length > 0;
        const hasIpv6 = location.dns.ipv6 && location.dns.ipv6.length > 0;

        if (!hasIpv4 && !hasIpv6) {
            this.showToast('error', 'این کشور آدرس DNS ندارد');
            return;
        }

        this.selectIpv4Btn.disabled = !hasIpv4;
        this.selectIpv6Btn.disabled = !hasIpv6;

        const ipv4Title = this.selectIpv4Btn.querySelector('.ip-version-title');
        const ipv6Title = this.selectIpv6Btn.querySelector('.ip-version-title');

        if (hasIpv4) {
            ipv4Title.textContent = 'IPv4';
        } else {
            ipv4Title.textContent = '';
        }

        if (hasIpv6) {
            ipv6Title.textContent = 'IPv6';
        } else {
            ipv6Title.textContent = '';
        }

        this.ipVersionModal?.classList.add('active');
    }

    closeIpVersionModal() {
        this.ipVersionModal?.classList.remove('active');
        this.currentServiceType = null;
    }

    async handleIpVersionSelect(ipVersion) {
        const location = this.countries.find(c => 
            c.id === (this.currentServiceType === 'wireguard' ? this.selectedWireguardLocation : this.selectedDnsLocation)
        );

        if (!location) return;

        const hasIpv4 = location.dns.ipv4 && location.dns.ipv4.length > 0;
        const hasIpv6 = location.dns.ipv6 && location.dns.ipv6.length > 0;

        if (ipVersion === 'ipv4' && !hasIpv4) {
            if (hasIpv6 && confirm('این کشور آدرس IPv4 ندارد. آیا می‌خواهید از IPv6 استفاده کنید؟')) {
                ipVersion = 'ipv6';
            } else {
                this.closeIpVersionModal();
                return;
            }
        } else if (ipVersion === 'ipv6' && !hasIpv6) {
            if (hasIpv4 && confirm('این کشور آدرس IPv6 ندارد. آیا می‌خواهید از IPv4 استفاده کنید؟')) {
                ipVersion = 'ipv4';
            } else {
                this.closeIpVersionModal();
                return;
            }
        }

        this.closeIpVersionModal();

        if (this.currentServiceType === 'wireguard') {
            await this.generateWireguard(ipVersion);
        } else if (this.currentServiceType === 'dns') {
            await this.generateDns(ipVersion);
        }
    }

    async generateWireguard(dnsType) {
        if (!this.selectedWireguardLocation) {
            this.showToast('warning', 'لطفا یک کشور انتخاب کنید');
            return;
        }

        if (this.userLimits && this.userLimits.wireguardRemaining <= 0 && !this.userLimits.isAdmin) {
            this.showToast('error', 'محدودیت روزانه شما تمام شده است');
            return;
        }

        const operator = this.wireguardOperator?.value || '';
        const tunnelDns = this.wireguardTunnelDns?.value || '';

        const token = auth.getToken();
        if (!token) return;

        try {
            const response = await fetch('/api/config/generate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    locationId: this.selectedWireguardLocation,
                    dnsType: dnsType,
                    operator: operator,
                    tunnelDns: tunnelDns
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
            await this.loadCountries();
            this.renderLocations();
            this.showToast('success', 'کانفیگ با موفقیت دریافت شد');

        } catch (error) {
            this.showToast('error', error.message);
        }
    }

    async generateDns(dnsType) {
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
                    dnsType: dnsType
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'خطا در دریافت DNS');
            }

            this.generatedDns = data.dns;

            if (this.dnsServers) {
                let displayText = data.dns.join('\n');
                if (data.caption) {
                    displayText += '\n\n' + data.caption;
                }
                this.dnsServers.textContent = displayText;
            }

            this.dnsOutput?.classList.remove('hidden');
            this.dnsOutput?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

            await this.loadUserLimits();
            await this.loadCountries();
            this.renderLocations();
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
            window.location.href = '/admin.html';
            return;
        }
        
        this.openAdminLoginModal();
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

    openAdminLoginModal() {
        this.adminLoginModal?.classList.add('active');
        this.showAdminLoginStep(1);
        setTimeout(() => this.adminTelegramIdInput?.focus(), 300);
    }

    closeAdminLoginModal() {
        this.adminLoginModal?.classList.remove('active');
        this.resetAdminLoginForm();
    }

    showAdminLoginStep(step) {
        if (step === 1) {
            this.adminLoginStep1?.classList.remove('hidden');
            this.adminLoginStep2?.classList.add('hidden');
            this.adminSendCodeBtn?.classList.remove('hidden');
            this.adminVerifyCodeBtn?.classList.add('hidden');
        } else {
            this.adminLoginStep1?.classList.add('hidden');
            this.adminLoginStep2?.classList.remove('hidden');
            this.adminSendCodeBtn?.classList.add('hidden');
            this.adminVerifyCodeBtn?.classList.add('hidden');
            this.adminCodeInputs[0]?.focus();
        }
    }

    resetAdminLoginForm() {
        if (this.adminTelegramIdInput) this.adminTelegramIdInput.value = '';
        this.adminCodeInputs.forEach(input => input.value = '');
        this.showAdminLoginStep(1);
    }

    isAdminCodeComplete() {
        return Array.from(this.adminCodeInputs).every(input => input.value.length === 1);
    }

    getAdminVerificationCode() {
        return Array.from(this.adminCodeInputs).map(input => input.value).join('');
    }

    async handleAdminSendCode() {
        const telegramId = this.adminTelegramIdInput?.value.trim();
        const adminId = '7240662021';

        if (!telegramId) {
            this.showToast('error', 'لطفا شناسه تلگرام را وارد کنید');
            return;
        }

        if (telegramId !== adminId) {
            this.showToast('error', 'شما دسترسی ادمین ندارید');
            return;
        }

        this.adminSendCodeBtn.disabled = true;
        this.adminSendCodeBtn.innerHTML = '<div class="loading-spinner"></div>';

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

            this.showToast('success', 'کد تایید به تلگرام شما ارسال شد');
            this.showAdminLoginStep(2);
        } catch (error) {
            this.showToast('error', error.message);
        } finally {
            this.adminSendCodeBtn.disabled = false;
            this.adminSendCodeBtn.textContent = 'ارسال کد تایید';
        }
    }

    async handleAdminVerifyCode() {
        const telegramId = this.adminTelegramIdInput?.value.trim();
        const code = this.getAdminVerificationCode();

        if (code.length !== 6) {
            return;
        }

        this.adminVerifyCodeBtn.disabled = true;
        this.adminVerifyCodeBtn.innerHTML = '<div class="loading-spinner"></div>';

        try {
            const response = await fetch('/api/admin/auth/verify', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ telegramId, code })
            });

            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.error || 'کد اشتباه است');
            }

            localStorage.setItem('admin_token', data.token);
            this.showToast('success', 'ورود به پنل مدیریت موفق');
            this.closeAdminLoginModal();
            setTimeout(() => {
                window.location.href = '/admin.html';
            }, 1000);

        } catch (error) {
            this.showToast('error', error.message);
            this.adminCodeInputs.forEach(input => input.value = '');
            this.adminCodeInputs[0]?.focus();
        } finally {
            this.adminVerifyCodeBtn.disabled = false;
            this.adminVerifyCodeBtn.textContent = 'تایید کد';
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