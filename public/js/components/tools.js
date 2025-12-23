const Tools = {
    state: {
        currentTool: null,
        pingResults: [],
        isPinging: false,
        targetHost: '',
        ipInfo: null,
        isLoadingIpInfo: false,
        targetIp: '',
        mtuUsage: null,
        isMtuTesting: false
    },

    toolsList: [
        {
            id: 'ping',
            title: 'تست پینگ',
            description: 'بررسی سرعت و کیفیت اتصال به سرورهای مختلف',
            icon: '/images/tool-icon/ping-tool.webp',
            color: 'white'
        },
        {
            id: 'ip-info',
            title: 'اطلاعات IP',
            description: 'نمایش اطلاعات آی‌پی و موقعیت جغرافیایی',
            icon: '/images/tool-icon/ip-tool.webp',
            color: 'white'
        },
        {
            id: 'mtu-tester',
            title: 'تستر MTU',
            description: 'آزمایش اندازه بهینه بسته‌های شبکه',
            icon: '/images/tool-icon/mtu-tool.webp',
            color: 'white'
        },
        {
            id: 'storage',
            title: 'منبع پنل',
            description: 'دانلود پنل های مختلف برای استفاده شخصی',
            icon: '/images/storage.webp',
            color: 'white'
        }
    ],

    async init() {
        this.state.currentTool = null;
        this.state.pingResults = [];
        this.state.isPinging = false;
        App.render();
    },

    async render() {
        if (this.state.currentTool) {
            return await this.renderToolPage(this.state.currentTool);
        }
        return this.renderToolsList();
    },

    renderToolsList() {
        return `
            ${Header.render('ابزارها', true, false)}
            <div class="page" style="padding-bottom: 100px;">
                <div class="container">
                    <div class="tools-cards-grid">
                        ${this.toolsList.map(tool => this.renderToolCard(tool)).join('')}
                    </div>
                </div>
            </div>
            ${Dashboard.renderBottomNav('tools')}
        `;
    },

    renderToolCard(tool) {
        return `
            <div class="tool-card animate-slideInUp" onclick="(async () => { await Tools.openTool('${tool.id}'); })()">
                <div class="tool-card-icon" style="background: rgba(255, 255, 255, 0.15); backdrop-filter: blur(10px); width: 64px; height: 64px; border-radius: 16px; display: flex; align-items: center; justify-content: center;">
                    <img src="${tool.icon}" alt="${tool.title}" style="width: 60px; height: 60px; object-fit: contain;">
                </div>
                <div class="tool-card-content">
                    <h3 class="tool-card-title">${tool.title}</h3>
                    <p class="tool-card-desc">${tool.description}</p>
                </div>
                <div class="tool-card-arrow">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M15 18l-6-6 6-6"/>
                    </svg>
                </div>
            </div>
        `;
    },

    async openTool(toolId) {
        if (toolId === 'mtu-tester') {
            window.location.href = '/mtu.html';
            return;
        }
        
        this.state.currentTool = toolId;
        if (toolId === 'ping') {
            this.state.pingResults = [];
            this.state.isPinging = false;
        }
        if (toolId === 'ip-info') {
            this.state.ipInfo = null;
            this.state.isLoadingIpInfo = false;
        }
        await App.render();
    },

    goBack() {
        this.state.currentTool = null;
        App.render();
    },

    async renderToolPage(toolId) {
        switch (toolId) {
            case 'ping':
                return this.renderPingPage();
            case 'dns-lookup':
                return this.renderDnsLookupPage();
            case 'ip-info':
                return this.renderIpInfoPage();
            case 'mtu-tester':
                return this.renderMtuTesterPage();
            case 'speed-test':
                return this.renderSpeedTestPage();
            case 'storage':
                return await this.renderStoragePage();
            default:
                return this.renderToolsList();
        }
    },

    renderPingPage() {
        return `
            ${Header.render('تست پینگ', true, false)}
            <div class="page" style="padding-bottom: 80px;">
                <div class="container">
                    <button class="btn btn-secondary mb-16" onclick="Tools.goBack()">
                        → بازگشت به ابزارها
                    </button>
                    ${this.renderPingTester()}
                </div>
            </div>
            ${Dashboard.renderBottomNav('tools')}
        `;
    },

    renderPingTester() {
        return `
            <div class="card animate-slideInUp">
                <h3 class="card-title mb-16">🌐 تست پینگ و بررسی اتصال</h3>
                <p class="text-secondary mb-20" style="font-size: 14px;">
                    سرعت و کیفیت اتصال خود را با سرورهای مختلف بررسی کنید
                </p>

                <div class="ping-input-group mb-20">
                    <input 
                        type="text" 
                        id="ping-host-input" 
                        class="input" 
                        placeholder="مثال: 8.8.8.8"
                        value="${this.state.targetHost}"
                        ${this.state.isPinging ? 'disabled' : ''}
                        pattern="^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$"
                        title="لطفاً یک آدرس IPv4 معتبر وارد کنید"
                    >
                    <button 
                        class="btn btn-primary" 
                        onclick="Tools.startPing()"
                        ${this.state.isPinging ? 'disabled' : ''}
                        style="min-width: 120px;"
                    >
                        ${this.state.isPinging ? '⏳ در حال تست...' : '🚀 شروع تست'}
                    </button>
                </div>

                ${this.state.pingResults.length > 0 ? this.renderPingResults() : this.renderEmptyState()}
            </div>
        `;
    },

    renderEmptyState() {
        return `
            <div style="text-align: center; padding: 40px 20px; color: var(--text-secondary);">
                <div style="font-size: 48px; margin-bottom: 16px;">📡</div>
                <p>آدرس یا دامنه مورد نظر را وارد کنید</p>
                <p style="font-size: 13px; margin-top: 8px;">نتایج تست اینجا نمایش داده می‌شود</p>
            </div>
        `;
    },

    renderPingResults() {
        const results = this.state.pingResults;
        const successCount = results.filter(r => r.success).length;
        const avgTime = results.length > 0 
            ? Math.round(results.reduce((sum, r) => sum + (r.time || 0), 0) / results.length)
            : 0;
        const packetLoss = Math.round(((results.length - successCount) / results.length) * 100);

        return `
            <div class="ping-results">
                <div class="ping-stats mb-20">
                    <div class="stat-card">
                        <div class="stat-label">بسته ارسالی</div>
                        <div class="stat-value">${Utils.toPersianNumber(results.length)}</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-label">موفق</div>
                        <div class="stat-value text-success">${Utils.toPersianNumber(successCount)}</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-label">میانگین زمان</div>
                        <div class="stat-value">${Utils.toPersianNumber(avgTime)}ms</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-label">از دست رفته</div>
                        <div class="stat-value ${packetLoss > 0 ? 'text-danger' : 'text-success'}">
                            ${Utils.toPersianNumber(packetLoss)}%
                        </div>
                    </div>
                </div>

                <div class="ping-log">
                    ${results.map((result, idx) => `
                        <div class="ping-log-item ${result.success ? 'success' : 'failed'}">
                            <span class="ping-seq">#${Utils.toPersianNumber(idx + 1)}</span>
                            <span class="ping-host">${result.host}</span>
                            ${result.success 
                                ? `<span class="ping-time">${Utils.toPersianNumber(result.time)}ms</span>`
                                : `<span class="ping-error">خطا در اتصال</span>`
                            }
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    },

    quickPing(host) {
        document.getElementById('ping-host-input').value = host;
        this.startPing();
    },

    async startPing() {
        const input = document.getElementById('ping-host-input');
        const host = input ? input.value.trim() : this.state.targetHost;

        if (!host) {
            Toast.show('لطفاً آدرس IPv4 را وارد کنید', 'error');
            return;
        }

        const ipv4Regex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
        if (!ipv4Regex.test(host)) {
            Toast.show('لطفاً یک آدرس IPv4 معتبر وارد کنید', 'error');
            return;
        }

        this.state.targetHost = host;
        this.state.isPinging = true;
        this.state.pingResults = [];
        App.render();

        try {
            for (let i = 0; i < 4; i++) {
                const result = await this.simulatePing(host, i);
                this.state.pingResults.push(result);
                App.render();
                await this.sleep(800);
            }
        } catch (error) {
            Toast.show('خطا در انجام تست', 'error');
        } finally {
            this.state.isPinging = false;
            App.render();
        }
    },

    async simulatePing(host, sequence) {
        try {
            const response = await API.request('/ping/simulate', {
                method: 'POST',
                body: JSON.stringify({ host, sequence })
            });

            return {
                host,
                sequence,
                success: response.success,
                time: response.time
            };
        } catch (error) {
            return {
                host,
                sequence,
                success: false,
                time: null
            };
        }
    },

    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    },

    renderDnsLookupPage() {
        return `
            ${Header.render('بررسی DNS', true, false)}
            <div class="page" style="padding-bottom: 80px;">
                <div class="container">
                    <button class="btn btn-secondary mb-16" onclick="Tools.goBack()">
                        → بازگشت به ابزارها
                    </button>
                    <div class="card animate-slideInUp">
                        <div class="card-icon green mb-16" style="margin: 0 auto;">
                            <span style="font-size: 32px;">🔍</span>
                        </div>
                        <h3 class="card-title text-center mb-12">بررسی DNS</h3>
                        <p class="text-secondary text-center mb-20">
                            این ابزار به زودی فعال می‌شود
                        </p>
                        <div class="alert alert-info">
                            <p>🚧 این قابلیت در حال توسعه است و به زودی در دسترس قرار می‌گیرد.</p>
                        </div>
                    </div>
                </div>
            </div>
            ${Dashboard.renderBottomNav('tools')}
        `;
    },

    renderIpInfoPage() {
        return `
            ${Header.render('اطلاعات IP', true, false)}
            <div class="page" style="padding-bottom: 80px;">
                <div class="container">
                    <button class="btn btn-secondary mb-16" onclick="Tools.goBack()">
                        → بازگشت به ابزارها
                    </button>
                    ${this.renderIpInfoTool()}
                </div>
            </div>
            ${Dashboard.renderBottomNav('tools')}
        `;
    },

    renderIpInfoTool() {
        return `
            <div class="card animate-slideInUp">
                <h3 class="card-title mb-16">📍 اطلاعات آی‌پی</h3>
                <p class="text-secondary mb-20" style="font-size: 14px;">
                    آدرس IP را وارد کنید تا اطلاعات کامل آن را مشاهده کنید
                </p>

                <div class="ping-input-group mb-20">
                    <input 
                        type="text" 
                        id="ip-info-input" 
                        class="input" 
                        placeholder="مثال: 8.8.8.8"
                        value="${this.state.targetIp}"
                        ${this.state.isLoadingIpInfo ? 'disabled' : ''}
                    >
                    <button 
                        class="btn btn-primary" 
                        onclick="Tools.lookupIpInfo()"
                        ${this.state.isLoadingIpInfo ? 'disabled' : ''}
                        style="min-width: 120px;"
                    >
                        ${this.state.isLoadingIpInfo ? '⏳ در حال بررسی...' : '🔍 بررسی'}
                    </button>
                </div>

                ${this.state.ipInfo ? this.renderIpInfoResults() : this.renderIpInfoEmptyState()}
            </div>
        `;
    },

    renderIpInfoEmptyState() {
        return `
            <div style="text-align: center; padding: 40px 20px; color: var(--text-secondary);">
                <div style="font-size: 48px; margin-bottom: 16px;">🌍</div>
                <p>آدرس IP مورد نظر را وارد کنید</p>
                <p style="font-size: 13px; margin-top: 8px;">اطلاعات موقعیت جغرافیایی و سایر جزئیات نمایش داده می‌شود</p>
            </div>
        `;
    },

    renderIpInfoResults() {
        const info = this.state.ipInfo;
        if (info.error) {
            return `
                <div class="alert" style="background: rgba(255, 69, 58, 0.1); border: 1px solid var(--accent-red);">
                    <p style="color: var(--accent-red);">خطا: ${info.error}</p>
                </div>
            `;
        }

        return `
            <div class="ip-info-results">
                <div class="ip-info-header mb-20">
                    <div style="text-align: center; padding: 20px; background: var(--bg-tertiary); border-radius: var(--radius-md);">
                        <div style="font-size: 14px; color: var(--text-secondary); margin-bottom: 8px;">آدرس IP</div>
                        <div style="font-size: 24px; font-weight: 700; color: var(--accent-blue); direction: ltr;">${info.ip || '-'}</div>
                    </div>
                </div>

                <div class="ip-info-grid">
                    ${this.renderIpInfoItem('کشور', info.country_name || '-', '🌍')}
                    ${this.renderIpInfoItem('کد کشور', info.country_code2 || '-', '🏳️')}
                    ${this.renderIpInfoItem('ISP', info.isp || '-', '📡')}
                </div>
            </div>
        `;
    },

    renderIpInfoItem(label, value, icon) {
        return `
            <div class="ip-info-item">
                <div class="ip-info-item-icon">${icon}</div>
                <div class="ip-info-item-content">
                    <div class="ip-info-item-label">${label}</div>
                    <div class="ip-info-item-value">${value}</div>
                </div>
            </div>
        `;
    },

    async lookupIpInfo() {
        const input = document.getElementById('ip-info-input');
        const ip = input ? input.value.trim() : this.state.targetIp;

        if (!ip) {
            Toast.show('لطفاً آدرس IP را وارد کنید', 'error');
            return;
        }

        const ipv4Regex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
        if (!ipv4Regex.test(ip)) {
            Toast.show('لطفاً یک آدرس IPv4 معتبر وارد کنید', 'error');
            return;
        }

        this.state.targetIp = ip;
        this.state.isLoadingIpInfo = true;
        this.state.ipInfo = null;
        App.render();

        try {
            const response = await fetch(`https://api.iplocation.net/?ip=${ip}`);
            if (!response.ok) {
                throw new Error('خطا در دریافت اطلاعات');
            }
            const data = await response.json();
            
            if (data.response_code === '200') {
                this.state.ipInfo = data;
            } else {
                this.state.ipInfo = { error: data.response_message || 'خطا در دریافت اطلاعات' };
            }
        } catch (error) {
            this.state.ipInfo = { error: 'خطا در اتصال به سرویس. لطفاً دوباره تلاش کنید.' };
        } finally {
            this.state.isLoadingIpInfo = false;
            App.render();
        }
    },

    renderSpeedTestPage() {
        return `
            ${Header.render('تست سرعت', true, false)}
            <div class="page" style="padding-bottom: 80px;">
                <div class="container">
                    <button class="btn btn-secondary mb-16" onclick="Tools.goBack()">
                        → بازگشت به ابزارها
                    </button>
                    <div class="card animate-slideInUp">
                        <div class="card-icon purple mb-16" style="margin: 0 auto;">
                            <span style="font-size: 32px;">⚡</span>
                        </div>
                        <h3 class="card-title text-center mb-12">تست سرعت</h3>
                        <p class="text-secondary text-center mb-20">
                            این ابزار به زودی فعال می‌شود
                        </p>
                        <div class="alert alert-info">
                            <p>🚧 این قابلیت در حال توسعه است و به زودی در دسترس قرار می‌گیرد.</p>
                        </div>
                    </div>
                </div>
            </div>
            ${Dashboard.renderBottomNav('tools')}
        `;
    },

    renderMtuTesterPage() {
        return `
            ${Header.render('تستر MTU', true, false)}
            <div class="page" style="padding-bottom: 80px;">
                <div class="container">
                    <button class="btn btn-secondary mb-16" onclick="Tools.goBack()">
                        → بازگشت به ابزارها
                    </button>
                    <div id="mtu-iframe-container"></div>
                </div>
            </div>
            ${Dashboard.renderBottomNav('tools')}
            <script>
                (async function() {
                    const container = document.getElementById('mtu-iframe-container');
                    const usage = await Tools.getMtuUsage();
                    
                    if (usage.singleTestUsed && usage.autoTestUsed) {
                        container.innerHTML = \`
                            <div class="card animate-slideInUp">
                                <div style="text-align: center; padding: 40px 20px;">
                                    <div style="font-size: 48px; margin-bottom: 16px;">⏰</div>
                                    <h3 style="color: var(--text-primary); margin-bottom: 12px;">محدودیت روزانه</h3>
                                    <p style="color: var(--text-secondary); margin-bottom: 20px;">
                                        شما امروز از تمام تست‌های MTU استفاده کرده‌اید
                                    </p>
                                    <div class="alert" style="background: rgba(255, 159, 10, 0.1); border: 1px solid var(--accent-orange);">
                                        <p style="color: var(--accent-orange); font-size: 14px;">
                                            🔄 محدودیت در \${Utils.toPersianNumber(Math.ceil(usage.resetTimer / 3600))} ساعت دیگر بازنشانی می‌شود
                                        </p>
                                    </div>
                                </div>
                            </div>
                        \`;
                    } else {
                        container.innerHTML = '<iframe src="/mtu.html" style="width: 100%; height: 800px; border: none; border-radius: 12px;"></iframe>';
                    }
                })();
            </script>
        `;
    },

    async getMtuUsage() {
        try {
            const response = await API.request('/tools/mtu-usage');
            this.state.mtuUsage = response;
            return response;
        } catch (error) {
            console.error('Error fetching MTU usage:', error);
            return { singleTestUsed: false, autoTestUsed: false, resetTimer: 0 };
        }
    },

    async recordMtuTest(testType) {
        try {
            const response = await API.request('/tools/mtu-test', {
                method: 'POST',
                body: JSON.stringify({ testType })
            });
            return response;
        } catch (error) {
            throw error;
        }
    },

    async renderStoragePage() {
        const panels = await this.loadStoragePanels();
        return `
            ${Header.render('منبع پنل', true, false)}
            <div class="page" style="padding-bottom: 100px;">
                <div class="container">
                    <button class="btn btn-secondary mb-16" onclick="Tools.goBack()">
                        → بازگشت به ابزارها
                    </button>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
                        ${panels.map(panel => `
                            <div class="card" style="cursor: pointer;">
                                <div class="card-header">
                                    <div>
                                        <div style="font-size: 24px; margin-bottom: 8px;">${panel.icon}</div>
                                        <h3 class="card-title">${panel.name}</h3>
                                    </div>
                                </div>
                                <p class="text-secondary" style="font-size: 14px; margin-bottom: 12px;">${panel.description}</p>
                                <p style="font-size: 13px; color: var(--accent-blue); margin-bottom: 16px;">
                                    📌 ${panel.usage}
                                </p>
                                <a href="${panel.downloadUrl}" class="btn btn-primary" style="text-decoration: none; color: white;" download>
                                    ⬇️ دانلود
                                </a>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
            ${Dashboard.renderBottomNav('tools')}
        `;
    },

    async loadStoragePanels() {
        try {
            const response = await fetch('/data/storage-panels.json');
            const data = await response.json();
            return data.panels || [];
        } catch (error) {
            console.error('Error loading storage panels:', error);
            return [];
        }
    }
};

window.Tools = Tools;
