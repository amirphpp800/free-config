const Admin = {
    state: {
        tab: 'stats',
        stats: null,
        users: [],
        countries: [],
        announcements: [],
        loading: true,
        newAnnouncement: ''
    },

    async init() {
        this.state.loading = true;
        try {
            const [statsRes, countriesRes, announcementsRes] = await Promise.all([
                API.adminGetStats().catch(() => ({})),
                API.getCountries().catch(() => ({ countries: CONFIG.COUNTRIES })),
                API.getAnnouncements().catch(() => ({ announcements: [] }))
            ]);
            this.state.stats = statsRes;
            this.state.countries = countriesRes.countries || CONFIG.COUNTRIES;
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
                    <div class="container">
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
            ${Header.render('پنل مدیریت', true, false)}
            <div class="page">
                <div class="container">
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
            <div class="card animate-fadeIn">
                <h3 class="card-title mb-16">مدیریت کشورها</h3>

                ${this.state.countries.map((c, i) => `
                    <div class="list-item">
                        <div style="display: flex; align-items: center; gap: 12px; flex: 1;">
                            <img src="${c.flag}" alt="${c.name}" class="country-flag-admin">
                            <div>
                                <div>${c.name}</div>
                                <div class="text-secondary" style="font-size: 12px;">
                                    IPv4: ${c.ipv4?.length || 0} | IPv6: ${c.ipv6?.length || 0}
                                </div>
                            </div>
                        </div>
                        <div style="display: flex; gap: 8px;">
                            <button class="btn btn-sm btn-secondary" onclick="Admin.editCountry(${i})">
                                ✏️
                            </button>
                            <button class="btn btn-sm btn-danger" onclick="Admin.deleteCountry(${i})">
                                🗑️
                            </button>
                        </div>
                    </div>
                `).join('')}

                <div class="divider"></div>

                <button class="btn btn-primary" onclick="Admin.addCountry()">
                    ➕ افزودن کشور جدید
                </button>
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
                        <button class="btn btn-sm btn-danger" onclick="Admin.deleteAnnouncement('${a.id}')">
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

    addCountry() {
        this.showCountryModal();
    },

    editCountry(index) {
        this.showCountryModal(index);
    },

    showCountryModal(editIndex = null) {
        const country = editIndex !== null ? this.state.countries[editIndex] : null;
        const isEdit = country !== null;

        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal">
                <div class="modal-header">
                    <h3 class="modal-title">${isEdit ? 'ویرایش کشور' : 'افزودن کشور جدید'}</h3>
                    <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">×</button>
                </div>
                <div class="modal-body">
                    <div class="input-group">
                        <label class="input-label">کد کشور (مثال: de)</label>
                        <input type="text" class="input" id="country-code" value="${country?.code || ''}" ${isEdit ? 'disabled' : ''}>
                    </div>
                    <div class="input-group">
                        <label class="input-label">نام کشور به فارسی</label>
                        <input type="text" class="input" id="country-name" value="${country?.name || ''}">
                    </div>
                    <div class="input-group">
                        <label class="input-label">آدرس تصویر پرچم (URL)</label>
                        <input type="text" class="input" id="country-flag" value="${country?.flag || ''}">
                    </div>
                    <div class="input-group">
                        <label class="input-label">آدرس‌های IPv4 (هر خط یک آدرس)</label>
                        <textarea class="input" id="country-ipv4" rows="4" placeholder="192.168.1.1&#10;192.168.1.2">${(country?.ipv4 || []).join('\n')}</textarea>
                        <div class="text-secondary" style="font-size: 12px; margin-top: 4px;">
                            هر کاربر یک آدرس IPv4 دریافت می‌کند
                        </div>
                    </div>
                    <div class="input-group">
                        <label class="input-label">آدرس‌های IPv6 (هر خط یک آدرس)</label>
                        <textarea class="input" id="country-ipv6" rows="4" placeholder="2001:db8::1&#10;2001:db8::2">${(country?.ipv6 || []).join('\n')}</textarea>
                        <div class="text-secondary" style="font-size: 12px; margin-top: 4px;">
                            هر کاربر دو آدرس IPv6 دریافت می‌کند
                        </div>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-secondary" onclick="this.closest('.modal-overlay').remove()">
                        انصراف
                    </button>
                    <button class="btn btn-primary" onclick="Admin.saveCountryFromModal(${editIndex})">
                        ${isEdit ? 'ذخیره تغییرات' : 'افزودن کشور'}
                    </button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    },

    saveCountryFromModal(editIndex) {
        const code = document.getElementById('country-code').value.trim().toLowerCase();
        const name = document.getElementById('country-name').value.trim();
        const flag = `https://flagcdn.com/w320/${code}.png`;
        const ipv4Text = document.getElementById('country-ipv4').value.trim();
        const ipv6Text = document.getElementById('country-ipv6').value.trim();

        if (!code || !name) {
            Toast.show('لطفاً تمام فیلدها را پر کنید', 'error');
            return;
        }

        const ipv4 = ipv4Text.split('\n').map(ip => ip.trim()).filter(ip => ip);
        const ipv6 = ipv6Text.split('\n').map(ip => ip.trim()).filter(ip => ip);

        const countryData = { code, name, flag, ipv4, ipv6 };

        if (editIndex !== null) {
            this.state.countries[editIndex] = countryData;
        } else {
            this.state.countries.push(countryData);
        }

        document.querySelector('.modal-overlay').remove();
        this.saveCountries();
    },

    deleteCountry(index) {
        if (confirm('آیا از حذف این کشور اطمینان دارید؟')) {
            this.state.countries.splice(index, 1);
            this.saveCountries();
        }
    },

    async saveCountries() {
        try {
            await API.adminUpdateCountries(this.state.countries);
            Toast.show('کشورها ذخیره شدند', 'success');
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
    },

    async deleteAnnouncement(id) {
        if (!confirm('آیا از حذف این اعلان اطمینان دارید؟')) return;

        try {
            await API.adminDeleteAnnouncement(id);
            Toast.show('اعلان حذف شد', 'success');
            this.state.announcements = this.state.announcements.filter(a => a.id !== id);
            App.render();
        } catch (error) {
            Toast.show(error.message, 'error');
        }
    }
};