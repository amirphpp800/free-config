const Generator = {
    state: {
        type: 'wireguard',
        country: 'de',
        countryIPv4: '',
        countryIPv6: '',
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
        this.state.countryIPv4 = '';
        this.state.countryIPv6 = '';
        try {
            const res = await API.getCountries().catch(() => ({ countries: [] }));
            this.state.countries = res.countries || [];
            if (this.state.countries.length > 0) {
                this.state.country = this.state.countries[0].code;
                this.state.countryIPv4 = this.state.countries[0].code;
                this.state.countryIPv6 = this.state.countries[0].code;
            }
        } catch (e) {
            this.state.countries = [];
        }
        App.render();
    },

    canGenerate() {
        const isWireGuard = this.state.type === 'wireguard';

        if (isWireGuard && this.state.ipType === 'ipv4_ipv6') {
            if (!this.state.countryIPv4 || !this.state.countryIPv6) return false;

            const countryIPv4 = this.state.countries.find(c => c.code === this.state.countryIPv4);
            const countryIPv6 = this.state.countries.find(c => c.code === this.state.countryIPv6);

            if (!countryIPv4 || !countryIPv6) return false;

            return (countryIPv4.ipv4 && countryIPv4.ipv4.length > 0) &&
                   (countryIPv6.ipv6 && countryIPv6.ipv6.length > 0);
        }

        if (!this.state.country) return false;

        const selectedCountry = this.state.countries.find(c => c.code === this.state.country);
        if (!selectedCountry) return false;
        return this.getCountryAvailability(selectedCountry, this.state.ipType);
    },



    selectCountry(code) {
        this.state.country = code;
        App.render();
    },

    selectCountryIPv4(code) {
        this.state.countryIPv4 = code;
        App.render();
    },

    selectCountryIPv6(code) {
        this.state.countryIPv6 = code;
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

                ${isWireGuard && this.state.ipType === 'ipv4_ipv6' ? `
                    <div class="input-group">
                        <label class="input-label">انتخاب کشور برای IPv4</label>
                        ${countries.length ? `
                            <div class="country-grid">
                                ${countries.map(c => {
                                    const hasIPv4 = c.ipv4 && c.ipv4.length > 0;
                                    const ipv4Count = c.ipv4?.length || 0;
                                    return `
                                        <div class="country-card ${this.state.countryIPv4 === c.code ? 'active' : ''} ${!hasIPv4 ? 'disabled' : ''}"
                                            onclick="${hasIPv4 ? `Generator.selectCountryIPv4('${c.code}')` : ''}"
                                            style="${!hasIPv4 ? 'opacity: 0.5; cursor: not-allowed;' : ''}">
                                            <img src="${c.flag}" alt="${c.name}" class="country-flag">
                                            <div class="country-name">${c.name}</div>
                                            <div class="inventory-badge">
                                                <span class="inv-item ${ipv4Count > 0 ? 'available' : 'empty'}">v4: ${ipv4Count}</span>
                                            </div>
                                        </div>
                                    `;
                                }).join('')}
                            </div>
                        ` : ''}
                    </div>

                    <div class="input-group">
                        <label class="input-label">انتخاب کشور برای IPv6</label>
                        ${countries.length ? `
                            <div class="country-grid">
                                ${countries.map(c => {
                                    const hasIPv6 = c.ipv6 && c.ipv6.length > 0;
                                    const ipv6Count = c.ipv6?.length || 0;
                                    return `
                                        <div class="country-card ${this.state.countryIPv6 === c.code ? 'active' : ''} ${!hasIPv6 ? 'disabled' : ''}"
                                            onclick="${hasIPv6 ? `Generator.selectCountryIPv6('${c.code}')` : ''}"
                                            style="${!hasIPv6 ? 'opacity: 0.5; cursor: not-allowed;' : ''}">
                                            <img src="${c.flag}" alt="${c.name}" class="country-flag">
                                            <div class="country-name">${c.name}</div>
                                            <div class="inventory-badge">
                                                <span class="inv-item ${ipv6Count > 0 ? 'available' : 'empty'}">v6: ${ipv6Count}</span>
                                            </div>
                                        </div>
                                    `;
                                }).join('')}
                            </div>
                        ` : ''}
                    </div>
                ` : `
                    <div class="input-group">
                        <label class="input-label">انتخاب کشور</label>
                        ${countries.length ? `
                            <div class="country-grid">
                                ${countries.map(c => {
                                    const isAvailable = this.getCountryAvailability(c, this.state.ipType);
                                    const ipv4Count = c.ipv4?.length || 0;
                                    const ipv6Count = c.ipv6?.length || 0;
                                    return `
                                        <div class="country-card ${this.state.country === c.code ? 'active' : ''} ${!isAvailable ? 'disabled' : ''}"
                                            onclick="${isAvailable ? `Generator.selectCountry('${c.code}')` : ''}"
                                            style="${!isAvailable ? 'opacity: 0.5; cursor: not-allowed;' : ''}">
                                            <img src="${c.flag}" alt="${c.name}" class="country-flag">
                                            <div class="country-name">${c.name}</div>
                                            <div class="inventory-badge">
                                                <span class="inv-item ${ipv4Count > 0 ? 'available' : 'empty'}">v4: ${ipv4Count}</span>
                                                <span class="inv-item ${ipv6Count > 0 ? 'available' : 'empty'}">v6: ${ipv6Count}</span>
                                            </div>
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
                `}

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
                    ${this.state.loading 
                        ? (isWireGuard ? '⏳ در حال تولید...' : '🔍 در حال یافتن بهترین سرور...') 
                        : (isWireGuard ? '✨ تولید کانفیگ' : '🌐 دریافت سرور')
                    }
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

        let ip = '';
        if (isDNS) {
            ip = result.config || result.dns || '';
        } else {
            ip = result.consumedIPv4 || result.consumedIPv6 || '';
            if (!ip) {
                const addressLine = result.config.split('\n').find(line => line.includes('Address'));
                if (addressLine) {
                    ip = addressLine.split('=')[1]?.trim().split('/')[0] || '';
                }
            }
        }

        let inventoryHtml = '';
        const inv = result.inventory;

        if (isWireGuard && inv) {
            if (this.state.ipType === 'ipv4_ipv6' && inv.ipv4Country && inv.ipv6Country) {
                inventoryHtml = `
                    <div class="card" style="margin-bottom: 16px; background: rgba(10, 132, 255, 0.1); border-color: var(--accent-blue);">
                        <h4 style="font-size: 14px; margin-bottom: 8px; color: var(--text-secondary);">📊 موجودی باقی‌مانده:</h4>
                        <div style="font-size: 14px; font-weight: 600; color: var(--accent-blue); line-height: 1.8;">
                            <img src="${inv.ipv4Country.flag}" style="width: 20px; height: 14px; vertical-align: middle; margin-left: 4px;"> ${inv.ipv4Country.name}: ${inv.ipv4Country.remaining} IPv4<br>
                            <img src="${inv.ipv6Country.flag}" style="width: 20px; height: 14px; vertical-align: middle; margin-left: 4px;"> ${inv.ipv6Country.name}: ${inv.ipv6Country.remaining} IPv6
                        </div>
                    </div>
                `;
            } else if (inv.country) {
                const remainingCount = this.state.ipType === 'ipv4' ? inv.country.remainingIPv4 : inv.country.remainingIPv6;
                const ipTypeLabel = this.state.ipType === 'ipv4' ? 'IPv4' : 'IPv6';
                inventoryHtml = `
                    <div class="card" style="margin-bottom: 16px; background: rgba(10, 132, 255, 0.1); border-color: var(--accent-blue);">
                        <h4 style="font-size: 14px; margin-bottom: 8px; color: var(--text-secondary);">📊 موجودی باقی‌مانده ${inv.country.name}:</h4>
                        <div style="font-size: 20px; font-weight: 700; color: var(--accent-blue);">
                            ${remainingCount} ${ipTypeLabel}
                        </div>
                    </div>
                `;
            }
        }

        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal">
                <div class="modal-header">
                    <h3 class="modal-title">✅ ${isWireGuard ? 'کانفیگ WireGuard' : 'آدرس DNS'} تولید شد</h3>
                    <button class="modal-close" onclick="Generator.closeResultModal(this)">×</button>
                </div>
                <div class="modal-body">
                    <div class="card" style="margin-bottom: 16px; padding: 12px; background: rgba(48, 209, 88, 0.1); border-color: var(--accent-green); cursor: pointer;" onclick="Generator.copyIP('${ip}', this)">
                        <h4 style="font-size: 13px; margin-bottom: 6px; color: var(--text-secondary);">🌐 آدرس${ip.includes('\n') ? 'های' : ''} اختصاصی شما (کلیک کنید):</h4>
                        <div style="font-family: monospace; font-size: 15px; font-weight: 600; color: var(--accent-green); word-break: break-all; white-space: pre-line;">
                            ${ip}
                        </div>
                    </div>

                    ${inventoryHtml}

                    ${isDNS ? `
                        <div class="card" style="margin-bottom: 16px; padding: 12px; cursor: pointer;" onclick="Generator.copyDNSList(this)">
                            <h4 style="font-size: 14px; margin-bottom: 12px; font-weight: 600;">🔧 DNS های پیشنهادی برای تانل کردن (کلیک کنید)</h4>
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
                    ` : ''}

                    ${isWireGuard ? `<div class="config-box" style="max-height: 200px;">${Utils.escapeHtml(result.config)}</div>` : ''}
                </div>
                <div class="modal-footer">
                    ${isDNS && this.state.ipType === 'ipv4' ? `
                        <button class="btn btn-primary" onclick="window.open('https://check-host.net/check-ping?host=${ip}', '_blank')">
                            🔍 بررسی فیلتر
                        </button>
                    ` : ''}
                    ${isWireGuard ? `
                        <button class="btn btn-primary" onclick="Generator.copyConfig(); this.textContent = '✓ کپی شد'">
                            📋 کپی کانفیگ
                        </button>
                        <button class="btn btn-secondary" onclick="Generator.downloadConfig()">
                            ⬇️دانلود
                        </button>
                    ` : ''}
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        modal.onclick = (e) => {
            if (e.target === modal) {
                modal.remove();
                location.reload();
            }
        };
    },

    closeResultModal(button) {
        const modal = button.closest('.modal-overlay');
        if (modal) {
            modal.remove();
            location.reload();
        }
    },

    copyIP(ip, element) {
        Utils.copyToClipboard(ip);
        const originalBg = element.style.background;
        element.style.background = 'rgba(48, 209, 88, 0.3)';
        setTimeout(() => {
            element.style.background = originalBg;
        }, 300);
        Toast.show('آدرس کپی شد', 'success');
    },

    copyDNSList(element) {
        const dnsList = `178.22.122.100
185.51.200.2
10.202.10.10
8.8.8.8
1.1.1.1
4.2.2.4
78.157.42.100`;
        Utils.copyToClipboard(dnsList);
        const originalBg = element.style.background;
        element.style.background = 'rgba(48, 209, 88, 0.3)';
        setTimeout(() => {
            element.style.background = originalBg;
        }, 300);
        Toast.show('لیست DNS کپی شد', 'success');
    },

    showLimitModal(resetTimer, resetTimestamp) {
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.id = 'limit-modal';

        const updateTimer = () => {
            const timerEl = document.getElementById('limit-timer');
            if (timerEl && resetTimestamp) {
                const remaining = resetTimestamp - Date.now();
                if (remaining <= 0) {
                    modal.remove();
                    location.reload();
                } else {
                    const hours = Math.floor(remaining / (1000 * 60 * 60));
                    const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
                    const seconds = Math.floor((remaining % (1000 * 60)) / 1000);
                    timerEl.textContent = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
                }
            }
        };

        modal.innerHTML = `
            <div class="modal">
                <div class="modal-header">
                    <h3 class="modal-title">⚠️ محدودیت روزانه</h3>
                    <button class="modal-close" onclick="document.getElementById('limit-modal').remove()">×</button>
                </div>
                <div class="modal-body" style="text-align: center;">
                    <div style="font-size: 48px; margin-bottom: 16px;">⏰</div>
                    <div style="font-size: 16px; color: var(--accent-red); margin-bottom: 16px;">
                        شما به محدودیت روزانه رسیدید
                    </div>
                    <div style="font-size: 14px; color: var(--text-secondary); margin-bottom: 16px;">
                        زمان باقی‌مانده تا ریست محدودیت:
                    </div>
                    <div id="limit-timer" style="font-size: 36px; font-weight: 700; color: var(--accent-blue); font-family: monospace; direction: ltr; background: rgba(10, 132, 255, 0.1); padding: 16px; border-radius: 12px;">
                        00:00:00
                    </div>
                    <div style="margin-top: 16px; font-size: 13px; color: var(--text-secondary);">
                        بعد از ۲۴ ساعت می‌توانید ۳ کانفیگ جدید دریافت کنید
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-secondary" onclick="document.getElementById('limit-modal').remove()">
                        بستن
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        modal.onclick = (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        };

        updateTimer();
        setInterval(updateTimer, 1000);
    },

    async generate() {
        this.state.loading = true;
        App.render();

        try {
            const isWireGuard = this.state.type === 'wireguard';
            const options = {
                country: this.state.country,
                ipType: this.state.ipType,
                operator: this.state.operator,
                dns: this.state.dns
            };

            if (isWireGuard && this.state.ipType === 'ipv4_ipv6') {
                options.countryIPv4 = this.state.countryIPv4;
                options.countryIPv6 = this.state.countryIPv6;
            }

            let result;
            if (this.state.type === 'wireguard') {
                const response = await API.request('/generate/wireguard', {
                    method: 'POST',
                    body: JSON.stringify(options)
                });

                if (response.error) {
                    throw new Error(response.error);
                }

                this.state.result = response;
                this.state.loading = false;

                // Update usage
                const usage = await API.request('/user/usage');
                if (usage && !usage.error) {
                    Dashboard.state.usage = usage;
                }

                // Update country inventory
                const countries = await API.request('/countries');
                if (countries && !countries.error) {
                    Dashboard.state.countries = countries;
                }

                this.showResultModal();
                App.render();
            } else {
                const response = await API.request('/generate/dns', {
                    method: 'POST',
                    body: JSON.stringify(options)
                });

                if (response.error) {
                    throw new Error(response.error);
                }

                this.state.result = response;
                this.state.loading = false;

                // Update usage
                const usage = await API.request('/user/usage');
                if (usage && !usage.error) {
                    Dashboard.state.usage = usage;
                }

                // Update country inventory
                if (response.inventory && response.inventory.country) {
                    const countries = await API.request('/countries');
                    if (countries && !countries.error) {
                        Dashboard.state.countries = countries;
                    }
                }

                // Show result modal
                this.showResultModal();

                App.render();
            }
        } catch (error) {
            this.state.loading = false;
            App.render();

            if (error.resetTimestamp || error.resetTimer) {
                this.showLimitModal(error.resetTimer, error.resetTimestamp);
            } else {
                Toast.show(error.message, 'error');
            }
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
                ? `${this.state.country.toLowerCase()}.conf`
                : `${this.state.country.toLowerCase()}.txt`;
            Utils.downloadFile(this.state.result.config, filename);
            Toast.show('دانلود شروع شد', 'success');
        }
    },

    reset() {
        this.state.result = null;
        App.render();
    }
};
