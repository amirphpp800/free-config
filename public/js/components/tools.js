const Tools = {
    state: {
        pingResults: [],
        isPinging: false,
        targetHost: ''
    },

    async init() {
        App.render();
    },

    render() {
        return `
            ${Header.render('تست پینگ', true, false)}
            <div class="page" style="padding-bottom: 80px;">
                <div class="container">
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

    async startPing() {
        const input = document.getElementById('ping-host-input');
        const host = input ? input.value.trim() : this.state.targetHost;

        if (!host) {
            Toast.show('لطفاً آدرس IPv4 را وارد کنید', 'error');
            return;
        }

        // اعتبارسنجی IPv4
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
            // ارسال 4 پینگ
            for (let i = 0; i < 4; i++) {
                const result = await this.simulatePing(host, i);
                this.state.pingResults.push(result);
                App.render();
                await this.sleep(800); // تاخیر بین پینگ‌ها
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
            // دریافت یا ایجاد seed برای این هاست از KV
            const response = await API.request('/ping/simulate', {
                method: 'POST',
                body: JSON.JSON.stringify({ host, sequence })
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
    }
};