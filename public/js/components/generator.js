const Generator = {
    state: {
        type: 'wireguard',
        country: 'de',
        ipType: 'ipv4',
        operator: 'mci',
        dns: 'cloudflare',
        loading: false,
        result: null,
        countries: []
    },

    async init(type) {
        this.state.type = type;
        this.state.result = null;
        this.state.country = '';
        try {
            const res = await API.getCountries().catch(() => ({ countries: [] }));
            this.state.countries = res.countries || [];
            if (this.state.countries.length > 0) {
                this.state.country = this.state.countries[0].code;
            }
        } catch (e) {
            this.state.countries = [];
        }
        App.render();
    },

    canGenerate() {
        const selectedCountry = this.state.countries.find(c => c.code === this.state.country);
        if (!selectedCountry) return false;
        return this.getCountryAvailability(selectedCountry, this.state.ipType);
    },



    selectCountry(code) {
        this.state.country = code;
        App.render();
    },

    render() {
        const isWireGuard = this.state.type === 'wireguard';
        
        return `
            ${Header.render(isWireGuard ? 'تولید WireGuard' : 'تولید DNS', true, false)}
            <div class="page" style="padding-bottom: 80px;">
                <div class="container">
                    ${this.state.result ? this.renderResult() : this.renderForm()}
                </div>
            </div>
            ${Dashboard.renderBottomNav(this.state.type)}
        `;
    },

    getCountryAvailability(country, ipType) {
        if (ipType === 'ipv4') {
            return country.ipv4 && country.ipv4.length > 0;
        } else if (ipType === 'ipv6') {
            return country.ipv6 && country.ipv6.length > 0;
        } else if (ipType === 'ipv4_ipv6') {
            return country.ipv4 && country.ipv4.length > 0 && country.ipv6 && country.ipv6.length > 0;
        }
        return false;
    },

    renderForm() {
        const isWireGuard = this.state.type === 'wireguard';
        const countries = this.state.countries.length ? this.state.countries : CONFIG.COUNTRIES;

        return `
            <div class="card animate-slideInUp">
                <h3 class="card-title mb-16">
                    ${isWireGuard ? 'تنظیمات WireGuard' : 'تنظیمات DNS'}
                </h3>

                <div class="input-group">
                    <label class="input-label">انتخاب کشور</label>
                    ${countries.length ? `
                        <div class="country-grid">
                            ${countries.map(c => {
                                const isAvailable = this.getCountryAvailability(c, this.state.ipType);
                                return `
                                    <div class="country-card ${this.state.country === c.code ? 'active' : ''} ${!isAvailable ? 'disabled' : ''}" 
                                        onclick="${isAvailable ? `Generator.selectCountry('${c.code}')` : ''}"
                                        style="${!isAvailable ? 'opacity: 0.5; cursor: not-allowed;' : ''}">
                                        <img src="${c.flag}" alt="${c.name}" class="country-flag">
                                        <div class="country-name">${c.name}</div>
                                        ${!isAvailable ? '<div style="font-size: 10px; color: var(--accent-red); margin-top: 4px;">موجود نیست</div>' : ''}
                                    </div>
                                `;
                            }).join('')}
                        </div>
                    ` : `
                        <div class="empty-state" style="padding: 20px;">
                            <p class="text-secondary">هیچ کشوری موجود نیست. لطفاً از پنل ادمین کشورها را اضافه کنید.</p>
                        </div>
                    `}
                </div>

                <div class="input-group">
                    <label class="input-label">نوع IP</label>
                    <div class="radio-group">
                        ${isWireGuard ? `
                            <div class="radio-option">
                                <input type="radio" name="ipType" id="ipv4" value="ipv4" 
                                    ${this.state.ipType === 'ipv4' ? 'checked' : ''}
                                    onchange="Generator.state.ipType = 'ipv4'; App.render();">
                                <label for="ipv4">IPv4</label>
                            </div>
                            <div class="radio-option">
                                <input type="radio" name="ipType" id="ipv4_ipv6" value="ipv4_ipv6"
                                    ${this.state.ipType === 'ipv4_ipv6' ? 'checked' : ''}
                                    onchange="Generator.state.ipType = 'ipv4_ipv6'; App.render();">
                                <label for="ipv4_ipv6">IPv4+IPv6</label>
                            </div>
                        ` : `
                            <div class="radio-option">
                                <input type="radio" name="ipType" id="ipv4" value="ipv4" 
                                    ${this.state.ipType === 'ipv4' ? 'checked' : ''}
                                    onchange="Generator.state.ipType = 'ipv4'; App.render();">
                                <label for="ipv4">IPv4</label>
                            </div>
                            <div class="radio-option">
                                <input type="radio" name="ipType" id="ipv6" value="ipv6"
                                    ${this.state.ipType === 'ipv6' ? 'checked' : ''}
                                    onchange="Generator.state.ipType = 'ipv6'; App.render();">
                                <label for="ipv6">IPv6</label>
                            </div>
                        `}
                    </div>
                </div>

                ${isWireGuard ? `
                    <div class="input-group">
                        <label class="input-label">اپراتور</label>
                        <select class="select" onchange="Generator.state.operator = this.value">
                            ${CONFIG.OPERATORS.map(o => `
                                <option value="${o.id}" ${this.state.operator === o.id ? 'selected' : ''}>
                                    ${o.name}
                                </option>
                            `).join('')}
                        </select>
                    </div>

                    <div class="input-group">
                        <label class="input-label">DNS سرور</label>
                        <select class="select" onchange="Generator.state.dns = this.value">
                            ${CONFIG.DNS_SERVERS.map(d => `
                                <option value="${d.id}" ${this.state.dns === d.id ? 'selected' : ''}>
                                    ${d.name} (${d.ip})
                                </option>
                            `).join('')}
                        </select>
                    </div>
                ` : ''}

                <button 
                    class="btn btn-primary ${this.state.loading || !this.state.country || !this.canGenerate() ? 'disabled' : ''}"
                    onclick="Generator.generate()"
                    ${this.state.loading || !this.state.country || !this.canGenerate() ? 'disabled' : ''}
                >
                    ${this.state.loading ? '⏳ در حال تولید...' : `✨ تولید ${isWireGuard ? 'کانفیگ' : 'DNS'}`}
                </button>
            </div>
        `;
    },

    renderResult() {
        return '';
    },

    showResultModal() {
        const result = this.state.result;
        const isWireGuard = this.state.type === 'wireguard';
        const isDNS = !isWireGuard;
        
        // استخراج IP از کانفیگ
        let ip = '';
        if (isDNS) {
            // برای DNS، IP در خط اول است
            ip = result.config.split('\n')[0] || '';
        } else {
            // برای WireGuard، IP در خط Endpoint است
            const endpointLine = result.config.split('\n').find(line => line.includes('Endpoint'));
            if (endpointLine) {
                ip = endpointLine.split('=')[1]?.trim().split(':')[0] || '';
            }
        }

        // محاسبه موجودی باقیمانده
        const selectedCountry = this.state.countries.find(c => c.code === this.state.country);
        let remainingIPs = 0;
        if (selectedCountry) {
            if (this.state.ipType === 'ipv4') {
                remainingIPs = selectedCountry.ipv4?.length || 0;
            } else if (this.state.ipType === 'ipv6') {
                remainingIPs = selectedCountry.ipv6?.length || 0;
            } else {
                remainingIPs = Math.min(selectedCountry.ipv4?.length || 0, (selectedCountry.ipv6?.length || 0) / 2);
            }
        }

        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal">
                <div class="modal-header">
                    <h3 class="modal-title">✅ ${isWireGuard ? 'کانفیگ WireGuard' : 'آدرس DNS'} تولید شد</h3>
                    <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">×</button>
                </div>
                <div class="modal-body">
                    <div class="card" style="margin-bottom: 16px; background: rgba(48, 209, 88, 0.1); border-color: var(--accent-green);">
                        <h4 style="font-size: 14px; margin-bottom: 8px; color: var(--text-secondary);">🌐 آدرس اختصاصی شما:</h4>
                        <div style="font-family: monospace; font-size: 16px; font-weight: 600; color: var(--accent-green); word-break: break-all;">
                            ${ip}
                        </div>
                    </div>

                    <div class="card" style="margin-bottom: 16px; background: rgba(10, 132, 255, 0.1); border-color: var(--accent-blue);">
                        <h4 style="font-size: 14px; margin-bottom: 8px; color: var(--text-secondary);">📊 موجودی باقی‌مانده ${result.country?.name}:</h4>
                        <div style="font-size: 20px; font-weight: 700; color: var(--accent-blue);">
                            ${remainingIPs} عدد
                        </div>
                    </div>

                    ${isDNS ? `
                        <div class="card" style="margin-bottom: 16px;">
                            <h4 style="font-size: 14px; margin-bottom: 12px; font-weight: 600;">🔧 DNS های پیشنهادی برای تانل کردن</h4>
                            <div style="font-size: 13px; line-height: 1.8; font-family: monospace;">
                                • 178.22.122.100 - شاتل<br>
                                • 185.51.200.2 - ایرانسل<br>
                                • 10.202.10.10 - رادار<br>
                                • 8.8.8.8 - گوگل<br>
                                • 1.1.1.1 - کلودفلر<br>
                                • 4.2.2.4 - لول 3<br>
                                • 78.157.42.100 - الکترو
                            </div>
                        </div>

                        <div class="alert alert-info" style="margin-bottom: 16px;">
                            <strong>💡 نکته:</strong> برای بررسی فیلتر، فقط سرورهای ایران را چک کنید (باید 4/4 باشد)<br>
                            <a href="https://check-host.net/check-ping?host=${ip}" target="_blank" style="color: var(--accent-blue); text-decoration: underline;">
                                https://check-host.net/check-ping?host=${ip}
                            </a>
                        </div>
                    ` : ''}

                    <div class="config-box" style="max-height: 200px;">${Utils.escapeHtml(result.config)}</div>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-primary" onclick="Generator.copyConfig(); this.textContent = '✓ کپی شد'">
                        📋 کپی کانفیگ
                    </button>
                    <button class="btn btn-secondary" onclick="Generator.downloadConfig()">
                        ⬇️ دانلود
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        modal.onclick = (e) => {
            if (e.target === modal) modal.remove();
        };
    },

    async generate() {
        this.state.loading = true;
        App.render();

        try {
            const options = {
                country: this.state.country,
                ipType: this.state.ipType,
                operator: this.state.operator,
                dns: this.state.dns
            };

            let result;
            if (this.state.type === 'wireguard') {
                result = await API.generateWireGuard(options);
            } else {
                result = await API.generateDNS(options);
            }

            this.state.result = result;
            this.state.loading = false;
            App.render();
            
            // نمایش مودال نتیجه
            setTimeout(() => {
                this.showResultModal();
            }, 100);
            
            Toast.show('کانفیگ با موفقیت تولید شد', 'success');
        } catch (error) {
            Toast.show(error.message, 'error');
            this.state.loading = false;
            App.render();
        }
    },

    copyConfig() {
        if (this.state.result?.config) {
            Utils.copyToClipboard(this.state.result.config);
            Toast.show('کانفیگ کپی شد', 'success');
        }
    },

    downloadConfig() {
        if (this.state.result?.config) {
            const filename = this.state.type === 'wireguard' 
                ? `wireguard-${this.state.country}.conf`
                : `dns-${this.state.country}.txt`;
            Utils.downloadFile(this.state.result.config, filename);
            Toast.show('دانلود شروع شد', 'success');
        }
    },

    reset() {
        this.state.result = null;
        App.render();
    }
};
