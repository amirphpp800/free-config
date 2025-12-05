const Admin = {
    state: {
        tab: 'stats',
        stats: null,
        users: [],
        countries: [],
        announcements: [],
        loading: true,
        newAnnouncement: '',
        selectedCountry: null,
        selectedAddresses: []
    },

    async init() {
        this.state.loading = true;
        try {
            const [statsRes, countriesRes, announcementsRes] = await Promise.all([
                API.adminGetStats().catch(() => ({})),
                API.getCountries().catch(() => ({ countries: [] })),
                API.getAnnouncements().catch(() => ({ announcements: [] }))
            ]);
            this.state.stats = statsRes;
            this.state.countries = countriesRes.countries || [];
            this.state.announcements = announcementsRes.announcements || [];
        } catch (error) {
            console.error('Admin init error:', error);
        } finally {
            this.state.loading = false;
            App.render();
        }
    },

    render() {
        const user = Storage.getUser();
        if (!user?.isAdmin) {
            return `
                <div class="page">
                    <div class="container-wide">
                        <div class="empty-state">
                            <div class="empty-state-icon">🚫</div>
                            <h3 class="empty-state-title">دسترسی محدود</h3>
                            <p class="empty-state-text">شما مجوز دسترسی به این بخش را ندارید</p>
                            <button class="btn btn-primary mt-20" onclick="App.navigate('dashboard')">
                                بازگشت به داشبورد
                            </button>
                        </div>
                    </div>
                </div>
            `;
        }

        return `
            ${Header.render('پنل مدیریت', true, true)}
            <div class="page page-fullscreen">
                <div class="container-wide">
                    ${this.renderTabs()}
                    ${this.renderContent()}
                </div>
            </div>
        `;
    },

    renderTabs() {
        return `
            <div class="tabs">
                <button class="tab ${this.state.tab === 'stats' ? 'active' : ''}" 
                    onclick="Admin.setTab('stats')">آمار</button>
                <button class="tab ${this.state.tab === 'countries' ? 'active' : ''}" 
                    onclick="Admin.setTab('countries')">کشورها</button>
                <button class="tab ${this.state.tab === 'announcements' ? 'active' : ''}" 
                    onclick="Admin.setTab('announcements')">اعلانات</button>
            </div>
        `;
    },

    renderContent() {
        if (this.state.loading) {
            return `
                <div class="card">
                    <div class="skeleton skeleton-title"></div>
                    <div class="skeleton skeleton-text"></div>
                    <div class="skeleton skeleton-button mt-16"></div>
                </div>
            `;
        }

        switch (this.state.tab) {
            case 'stats': return this.renderStats();
            case 'countries': return this.renderCountries();
            case 'announcements': return this.renderAnnouncements();
            default: return this.renderStats();
        }
    },

    renderStats() {
        const stats = this.state.stats || {};
        return `
            <div class="stat-grid animate-fadeIn">
                <div class="stat-card">
                    <div class="stat-value">${Utils.toPersianNumber(stats.totalUsers || 0)}</div>
                    <div class="stat-label">کل کاربران</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">${Utils.toPersianNumber(stats.todayUsers || 0)}</div>
                    <div class="stat-label">کاربران امروز</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">${Utils.toPersianNumber(stats.totalWireGuard || 0)}</div>
                    <div class="stat-label">کل WireGuard</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">${Utils.toPersianNumber(stats.totalDNS || 0)}</div>
                    <div class="stat-label">کل DNS</div>
                </div>
            </div>

            <div class="card animate-slideInUp">
                <h3 class="card-title mb-12">آمار امروز</h3>
                <div class="list-item">
                    <span>WireGuard تولید شده:</span>
                    <span class="badge badge-blue">${Utils.toPersianNumber(stats.todayWireGuard || 0)}</span>
                </div>
                <div class="list-item">
                    <span>DNS تولید شده:</span>
                    <span class="badge badge-green">${Utils.toPersianNumber(stats.todayDNS || 0)}</span>
                </div>
            </div>
        `;
    },

    renderCountries() {
        return `
            <div class="countries-header">
                <h3 class="section-title">مدیریت کشورها</h3>
                <button class="btn btn-primary btn-sm" onclick="Admin.showAddCountryModal()">
                    ➕ افزودن کشور
                </button>
            </div>

            <div class="countries-grid animate-fadeIn">
                ${this.state.countries.length ? this.state.countries.map((c, i) => `
                    <div class="country-admin-card">
                        <div class="country-admin-header">
                            <img src="${c.flag || `https://flagcdn.com/w320/${c.code.toLowerCase()}.png`}" 
                                 alt="${c.name}" class="country-admin-flag"
                                 onerror="this.src='https://via.placeholder.com/80x60?text=${c.code}'">
                            <div class="country-admin-info">
                                <h4 class="country-admin-name">${c.name}</h4>
                                <span class="country-admin-code">${c.code.toUpperCase()}</span>
                            </div>
                        </div>
                        <div class="country-admin-stats">
                            <div class="country-stat">
                                <span class="country-stat-value">${Utils.toPersianNumber(c.ipv4?.length || 0)}</span>
                                <span class="country-stat-label">IPv4</span>
                            </div>
                            <div class="country-stat">
                                <span class="country-stat-value">${Utils.toPersianNumber(c.ipv6?.length || 0)}</span>
                                <span class="country-stat-label">IPv6</span>
                            </div>
                        </div>
                        <div class="country-admin-actions">
                            <button class="btn btn-sm btn-secondary" onclick="Admin.showEditCountryModal(${i})" title="ویرایش">
                                ✏️ ویرایش
                            </button>
                            <button class="btn btn-sm btn-secondary" onclick="Admin.showAddAddressModal(${i})" title="افزودن آدرس">
                                ➕ آدرس
                            </button>
                            <button class="btn btn-sm btn-secondary" onclick="Admin.showManageAddressesModal(${i})" title="مدیریت آدرس‌ها">
                                📋 مدیریت
                            </button>
                            <button class="btn btn-sm btn-danger" onclick="Admin.confirmDeleteCountry(${i})" title="حذف">
                                🗑️
                            </button>
                        </div>
                    </div>
                `).join('') : `
                    <div class="empty-state">
                        <div class="empty-state-icon">🌍</div>
                        <h3 class="empty-state-title">هیچ کشوری وجود ندارد</h3>
                        <p class="empty-state-text">برای شروع، یک کشور اضافه کنید</p>
                    </div>
                `}
            </div>
        `;
    },

    renderAnnouncements() {
        return `
            <div class="card animate-fadeIn">
                <h3 class="card-title mb-16">اعلانات فعال</h3>

                ${this.state.announcements.length ? this.state.announcements.map(a => `
                    <div class="list-item">
                        <div style="flex: 1;">
                            <div>${Utils.escapeHtml(a.text)}</div>
                            <div class="text-secondary" style="font-size: 12px;">${Utils.formatDateShort(a.createdAt)}</div>
                        </div>
                        <button class="btn btn-sm btn-danger" onclick="Admin.confirmDeleteAnnouncement('${a.id}')">
                            🗑️
                        </button>
                    </div>
                `).join('') : '<p class="text-secondary text-center">اعلانی وجود ندارد</p>'}

                <div class="divider"></div>

                <div class="input-group">
                    <label class="input-label">اعلان جدید</label>
                    <textarea 
                        class="input" 
                        rows="3" 
                        placeholder="متن اعلان..."
                        onchange="Admin.state.newAnnouncement = this.value"
                        oninput="Admin.state.newAnnouncement = this.value"
                    >${this.state.newAnnouncement}</textarea>
                </div>

                <button class="btn btn-primary" onclick="Admin.addAnnouncement()">
                    ➕ افزودن اعلان
                </button>
            </div>
        `;
    },

    setTab(tab) {
        this.state.tab = tab;
        App.render();
    },

    showModal(content, options = {}) {
        const existing = document.querySelector('.modal-overlay');
        if (existing) existing.remove();

        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal ${options.wide ? 'modal-wide' : ''}">
                ${content}
            </div>
        `;
        document.body.appendChild(modal);
        
        if (!options.preventClose) {
            modal.onclick = (e) => {
                if (e.target === modal) modal.remove();
            };
        }
        
        return modal;
    },

    closeModal() {
        const modal = document.querySelector('.modal-overlay');
        if (modal) modal.remove();
    },

    showAddCountryModal() {
        this.showModal(`
            <div class="modal-header">
                <h3 class="modal-title">➕ افزودن کشور جدید</h3>
                <button class="modal-close" onclick="Admin.closeModal()">×</button>
            </div>
            <div class="modal-body">
                <div class="input-group">
                    <label class="input-label">کد کشور (مثال: de, us, ir)</label>
                    <input type="text" class="input" id="country-code" placeholder="de" maxlength="3">
                    <div class="text-secondary" style="font-size: 12px; margin-top: 4px;">
                        پرچم کشور به صورت خودکار از flagcdn.com دریافت می‌شود
                    </div>
                </div>
                <div class="input-group">
                    <label class="input-label">نام کشور به فارسی</label>
                    <input type="text" class="input" id="country-name" placeholder="آلمان">
                </div>
                <div class="input-group">
                    <label class="input-label">آدرس‌های IPv4 (هر خط یک آدرس)</label>
                    <textarea class="input" id="country-ipv4" rows="4" placeholder="192.168.1.1&#10;192.168.1.2"></textarea>
                </div>
                <div class="input-group">
                    <label class="input-label">آدرس‌های IPv6 (هر خط یک آدرس)</label>
                    <textarea class="input" id="country-ipv6" rows="4" placeholder="2001:db8::1&#10;2001:db8::2"></textarea>
                </div>
            </div>
            <div class="modal-footer">
                <button class="btn btn-secondary" onclick="Admin.closeModal()">انصراف</button>
                <button class="btn btn-primary" onclick="Admin.saveNewCountry()">افزودن کشور</button>
            </div>
        `);
    },

    showEditCountryModal(index) {
        const country = this.state.countries[index];
        if (!country) return;

        this.showModal(`
            <div class="modal-header">
                <h3 class="modal-title">✏️ ویرایش کشور ${country.name}</h3>
                <button class="modal-close" onclick="Admin.closeModal()">×</button>
            </div>
            <div class="modal-body">
                <div class="country-preview">
                    <img src="${country.flag || `https://flagcdn.com/w320/${country.code.toLowerCase()}.png`}" 
                         alt="${country.name}" class="country-preview-flag">
                </div>
                <div class="input-group">
                    <label class="input-label">کد کشور</label>
                    <input type="text" class="input" id="edit-country-code" value="${country.code}" maxlength="3">
                </div>
                <div class="input-group">
                    <label class="input-label">نام کشور به فارسی</label>
                    <input type="text" class="input" id="edit-country-name" value="${country.name}">
                </div>
            </div>
            <div class="modal-footer">
                <button class="btn btn-secondary" onclick="Admin.closeModal()">انصراف</button>
                <button class="btn btn-primary" onclick="Admin.saveEditCountry(${index})">ذخیره تغییرات</button>
            </div>
        `);
    },

    showAddAddressModal(index) {
        const country = this.state.countries[index];
        if (!country) return;

        this.showModal(`
            <div class="modal-header">
                <h3 class="modal-title">➕ افزودن آدرس به ${country.name}</h3>
                <button class="modal-close" onclick="Admin.closeModal()">×</button>
            </div>
            <div class="modal-body">
                <div class="input-group">
                    <label class="input-label">نوع آدرس</label>
                    <div class="radio-group">
                        <div class="radio-option">
                            <input type="radio" name="addressType" id="type-ipv4" value="ipv4" checked>
                            <label for="type-ipv4">IPv4</label>
                        </div>
                        <div class="radio-option">
                            <input type="radio" name="addressType" id="type-ipv6" value="ipv6">
                            <label for="type-ipv6">IPv6</label>
                        </div>
                    </div>
                </div>
                <div class="input-group">
                    <label class="input-label">آدرس‌ها (هر خط یک آدرس)</label>
                    <textarea class="input" id="new-addresses" rows="6" placeholder="آدرس‌های جدید را وارد کنید..."></textarea>
                    <div class="text-secondary" style="font-size: 12px; margin-top: 4px;">
                        آدرس‌های تکراری به صورت خودکار حذف می‌شوند
                    </div>
                </div>
            </div>
            <div class="modal-footer">
                <button class="btn btn-secondary" onclick="Admin.closeModal()">انصراف</button>
                <button class="btn btn-primary" onclick="Admin.addAddressesToCountry('${country.code}')">افزودن آدرس‌ها</button>
            </div>
        `);
    },

    showManageAddressesModal(index) {
        const country = this.state.countries[index];
        if (!country) return;

        this.state.selectedCountry = country;
        this.state.selectedAddresses = [];

        this.showModal(`
            <div class="modal-header">
                <h3 class="modal-title">📋 مدیریت آدرس‌های ${country.name}</h3>
                <button class="modal-close" onclick="Admin.closeModal()">×</button>
            </div>
            <div class="modal-body">
                <div class="address-tabs">
                    <button class="address-tab active" onclick="Admin.switchAddressTab('ipv4', ${index})">
                        IPv4 (${country.ipv4?.length || 0})
                    </button>
                    <button class="address-tab" onclick="Admin.switchAddressTab('ipv6', ${index})">
                        IPv6 (${country.ipv6?.length || 0})
                    </button>
                </div>
                <div id="address-list-container">
                    ${this.renderAddressList(country.ipv4 || [], 'ipv4')}
                </div>
                <div class="address-actions mt-16">
                    <button class="btn btn-sm btn-secondary" onclick="Admin.selectAllAddresses()">انتخاب همه</button>
                    <button class="btn btn-sm btn-secondary" onclick="Admin.deselectAllAddresses()">لغو انتخاب</button>
                    <button class="btn btn-sm btn-danger" onclick="Admin.deleteSelectedAddresses('${country.code}')" id="delete-selected-btn" disabled>
                        🗑️ حذف انتخاب شده‌ها (<span id="selected-count">0</span>)
                    </button>
                </div>
            </div>
            <div class="modal-footer">
                <button class="btn btn-secondary" onclick="Admin.closeModal()">بستن</button>
            </div>
        `, { wide: true });
    },

    renderAddressList(addresses, type) {
        if (!addresses.length) {
            return '<p class="text-secondary text-center" style="padding: 20px;">هیچ آدرسی وجود ندارد</p>';
        }

        return `
            <div class="address-list" data-type="${type}">
                ${addresses.map((addr, i) => `
                    <div class="address-item">
                        <label class="address-checkbox">
                            <input type="checkbox" value="${addr}" onchange="Admin.toggleAddressSelection('${addr}')">
                            <span class="address-text">${addr}</span>
                        </label>
                        <button class="btn-icon-small btn-danger" onclick="Admin.deleteSingleAddress('${this.state.selectedCountry?.code}', '${type}', '${addr}')">
                            ×
                        </button>
                    </div>
                `).join('')}
            </div>
        `;
    },

    switchAddressTab(type, index) {
        const country = this.state.countries[index];
        const tabs = document.querySelectorAll('.address-tab');
        tabs.forEach(tab => tab.classList.remove('active'));
        event.target.classList.add('active');
        
        this.state.selectedAddresses = [];
        this.updateSelectedCount();
        
        const container = document.getElementById('address-list-container');
        container.innerHTML = this.renderAddressList(country[type] || [], type);
    },

    toggleAddressSelection(addr) {
        const index = this.state.selectedAddresses.indexOf(addr);
        if (index > -1) {
            this.state.selectedAddresses.splice(index, 1);
        } else {
            this.state.selectedAddresses.push(addr);
        }
        this.updateSelectedCount();
    },

    selectAllAddresses() {
        const checkboxes = document.querySelectorAll('.address-list input[type="checkbox"]');
        this.state.selectedAddresses = [];
        checkboxes.forEach(cb => {
            cb.checked = true;
            this.state.selectedAddresses.push(cb.value);
        });
        this.updateSelectedCount();
    },

    deselectAllAddresses() {
        const checkboxes = document.querySelectorAll('.address-list input[type="checkbox"]');
        checkboxes.forEach(cb => cb.checked = false);
        this.state.selectedAddresses = [];
        this.updateSelectedCount();
    },

    updateSelectedCount() {
        const countEl = document.getElementById('selected-count');
        const btn = document.getElementById('delete-selected-btn');
        if (countEl) countEl.textContent = this.state.selectedAddresses.length;
        if (btn) btn.disabled = this.state.selectedAddresses.length === 0;
    },

    async saveNewCountry() {
        const code = document.getElementById('country-code').value.trim().toLowerCase();
        const name = document.getElementById('country-name').value.trim();
        const ipv4Text = document.getElementById('country-ipv4').value.trim();
        const ipv6Text = document.getElementById('country-ipv6').value.trim();

        if (!code || !name) {
            Toast.show('لطفاً کد و نام کشور را وارد کنید', 'error');
            return;
        }

        if (this.state.countries.find(c => c.code === code)) {
            Toast.show('این کد کشور قبلاً وجود دارد', 'error');
            return;
        }

        const ipv4 = [...new Set(ipv4Text.split('\n').map(ip => ip.trim()).filter(ip => ip))];
        const ipv6 = [...new Set(ipv6Text.split('\n').map(ip => ip.trim()).filter(ip => ip))];

        const newCountry = {
            code,
            name,
            flag: `https://flagcdn.com/w320/${code}.png`,
            ipv4,
            ipv6
        };

        this.state.countries.push(newCountry);
        await this.saveCountries();
        this.closeModal();
        Toast.show('کشور با موفقیت اضافه شد', 'success');
    },

    async saveEditCountry(index) {
        const code = document.getElementById('edit-country-code').value.trim().toLowerCase();
        const name = document.getElementById('edit-country-name').value.trim();

        if (!code || !name) {
            Toast.show('لطفاً کد و نام کشور را وارد کنید', 'error');
            return;
        }

        const oldCode = this.state.countries[index].code;
        if (code !== oldCode && this.state.countries.find(c => c.code === code)) {
            Toast.show('این کد کشور قبلاً وجود دارد', 'error');
            return;
        }

        this.state.countries[index].code = code;
        this.state.countries[index].name = name;
        this.state.countries[index].flag = `https://flagcdn.com/w320/${code}.png`;

        await this.saveCountries();
        this.closeModal();
        Toast.show('کشور با موفقیت ویرایش شد', 'success');
    },

    async addAddressesToCountry(countryCode) {
        const addressType = document.querySelector('input[name="addressType"]:checked').value;
        const addressesText = document.getElementById('new-addresses').value.trim();

        if (!addressesText) {
            Toast.show('لطفاً آدرس‌ها را وارد کنید', 'error');
            return;
        }

        const addresses = addressesText.split('\n').map(a => a.trim()).filter(a => a);

        try {
            const res = await API.request('/admin/countries', {
                method: 'POST',
                body: JSON.stringify({
                    action: 'addAddresses',
                    countryCode,
                    addresses,
                    addressType
                })
            });

            this.closeModal();
            Toast.show(`${res.addedCount} آدرس اضافه شد${res.duplicatesRemoved > 0 ? ` (${res.duplicatesRemoved} تکراری حذف شد)` : ''}`, 'success');
            await this.init();
        } catch (error) {
            Toast.show(error.message, 'error');
        }
    },

    async deleteSingleAddress(countryCode, addressType, address) {
        try {
            await API.request('/admin/countries', {
                method: 'POST',
                body: JSON.stringify({
                    action: 'removeAddresses',
                    countryCode,
                    addresses: [address],
                    addressType
                })
            });

            Toast.show('آدرس حذف شد', 'success');
            await this.init();
            
            const countryIndex = this.state.countries.findIndex(c => c.code === countryCode);
            if (countryIndex > -1) {
                this.showManageAddressesModal(countryIndex);
            }
        } catch (error) {
            Toast.show(error.message, 'error');
        }
    },

    async deleteSelectedAddresses(countryCode) {
        if (!this.state.selectedAddresses.length) return;

        const addressType = document.querySelector('.address-list')?.dataset.type || 'ipv4';

        this.showConfirmModal(
            'حذف آدرس‌ها',
            `آیا از حذف ${this.state.selectedAddresses.length} آدرس اطمینان دارید؟`,
            async () => {
                try {
                    await API.request('/admin/countries', {
                        method: 'POST',
                        body: JSON.stringify({
                            action: 'removeAddresses',
                            countryCode,
                            addresses: this.state.selectedAddresses,
                            addressType
                        })
                    });

                    Toast.show('آدرس‌ها حذف شدند', 'success');
                    this.state.selectedAddresses = [];
                    await this.init();
                    this.closeModal();
                } catch (error) {
                    Toast.show(error.message, 'error');
                }
            }
        );
    },

    confirmDeleteCountry(index) {
        const country = this.state.countries[index];
        this.showConfirmModal(
            'حذف کشور',
            `آیا از حذف کشور "${country.name}" و تمام آدرس‌های آن اطمینان دارید؟`,
            async () => {
                try {
                    await API.request('/admin/countries', {
                        method: 'POST',
                        body: JSON.stringify({
                            action: 'deleteCountry',
                            countryCode: country.code
                        })
                    });

                    Toast.show('کشور حذف شد', 'success');
                    await this.init();
                } catch (error) {
                    Toast.show(error.message, 'error');
                }
            }
        );
    },

    confirmDeleteAnnouncement(id) {
        this.showConfirmModal(
            'حذف اعلان',
            'آیا از حذف این اعلان اطمینان دارید؟',
            async () => {
                try {
                    await API.adminDeleteAnnouncement(id);
                    Toast.show('اعلان حذف شد', 'success');
                    this.state.announcements = this.state.announcements.filter(a => a.id !== id);
                    App.render();
                } catch (error) {
                    Toast.show(error.message, 'error');
                }
            }
        );
    },

    showConfirmModal(title, message, onConfirm) {
        this.showModal(`
            <div class="modal-header">
                <h3 class="modal-title">⚠️ ${title}</h3>
                <button class="modal-close" onclick="Admin.closeModal()">×</button>
            </div>
            <div class="modal-body">
                <p class="confirm-message">${message}</p>
            </div>
            <div class="modal-footer">
                <button class="btn btn-secondary" onclick="Admin.closeModal()">انصراف</button>
                <button class="btn btn-danger" id="confirm-btn">تأیید و حذف</button>
            </div>
        `);

        document.getElementById('confirm-btn').onclick = () => {
            this.closeModal();
            onConfirm();
        };
    },

    async saveCountries() {
        try {
            await API.adminUpdateCountries(this.state.countries);
            App.render();
        } catch (error) {
            Toast.show(error.message, 'error');
        }
    },

    async addAnnouncement() {
        if (!this.state.newAnnouncement.trim()) {
            Toast.show('متن اعلان را وارد کنید', 'error');
            return;
        }

        try {
            await API.adminAddAnnouncement({ text: this.state.newAnnouncement });
            Toast.show('اعلان اضافه شد', 'success');
            this.state.newAnnouncement = '';
            await this.init();
        } catch (error) {
            Toast.show(error.message, 'error');
        }
    }
};
