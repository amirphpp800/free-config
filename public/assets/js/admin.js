
class AdminPanel {
    constructor() {
        this.countries = [];
        this.editingCountry = null;
        this.init();
    }

    async init() {
        await this.checkAuth();
        this.cacheElements();
        this.bindEvents();
        await this.loadSystemStatus();
        await this.loadCountries();
        await this.loadAnnouncements();
    }

    async checkAuth() {
        const adminToken = localStorage.getItem('admin_token');
        if (!adminToken) {
            window.location.href = '/';
            return;
        }

        try {
            const response = await fetch('/api/admin/countries', {
                headers: {
                    'Authorization': `Bearer ${adminToken}`
                }
            });
            
            if (!response.ok) {
                localStorage.removeItem('admin_token');
                window.location.href = '/';
            }
        } catch {
            localStorage.removeItem('admin_token');
            window.location.href = '/';
        }
    }

    cacheElements() {
        this.logoutBtn = document.getElementById('logout-btn');
        this.addCountryBtn = document.getElementById('add-country-btn');
        this.countriesList = document.getElementById('countries-list');
        this.announcementTemplate = document.getElementById('announcement-template');
        this.announcementTitle = document.getElementById('announcement-title');
        this.announcementMessage = document.getElementById('announcement-message');
        this.announcementType = document.getElementById('announcement-type');
        this.publishAnnouncementBtn = document.getElementById('publish-announcement-btn');
        this.adminAnnouncementsList = document.getElementById('admin-announcements-list');
        this.toast = document.getElementById('toast');
        this.toastIcon = document.getElementById('toast-icon');
        this.toastMessage = document.getElementById('toast-message');
        this.editModal = document.getElementById('edit-country-modal');
    }

    bindEvents() {
        this.logoutBtn?.addEventListener('click', () => this.handleLogout());
        this.addCountryBtn?.addEventListener('click', () => this.addCountry());
        this.publishAnnouncementBtn?.addEventListener('click', () => this.publishAnnouncement());
        this.announcementTemplate?.addEventListener('change', (e) => this.fillAnnouncementTemplate(e.target.value));
    }

    getFlagEmoji(countryCode) {
        const code = countryCode.toUpperCase();
        const codePoints = code
            .split('')
            .map(char => 127397 + char.charCodeAt());
        return String.fromCodePoint(...codePoints);
    }

    removeDuplicatesFromArray(arr) {
        return [...new Set(arr)];
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
        }
    }

    async loadCountries() {
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
                    <span class="fi fi-${country.id.toLowerCase()}" style="font-size: 48px; margin-left: 12px;"></span>
                    <div>
                        <div class="location-name">${country.name}</div>
                        <div class="location-city">${country.nameEn || country.id.toUpperCase()}</div>
                    </div>
                </div>
                <div style="display: flex; gap: 8px;">
                    <button class="btn btn-ghost" onclick="adminPanel.editCountry('${country.id}')">ویرایش</button>
                    <button class="btn btn-ghost" onclick="adminPanel.deleteCountry('${country.id}')">حذف</button>
                </div>
            </div>
        `).join('');

        this.countriesList.innerHTML = html || '<p style="color: var(--text-secondary)">هیچ کشوری ثبت نشده است</p>';
    }

    async addCountry() {
        const id = document.getElementById('admin-country-id')?.value.trim().toUpperCase();
        const name = document.getElementById('admin-country-name')?.value.trim();
        const nameEn = document.getElementById('admin-country-name-en')?.value.trim();
        const dnsIpv4Text = document.getElementById('admin-dns-ipv4')?.value.trim();
        const dnsIpv6Text = document.getElementById('admin-dns-ipv6')?.value.trim();

        if (!id || !name || !nameEn) {
            this.showToast('error', 'لطفا کد ISO، نام فارسی و نام انگلیسی کشور را وارد کنید');
            return;
        }

        if (id.length !== 2) {
            this.showToast('error', 'کد ISO باید دو حرف باشد (مثال: IR)');
            return;
        }

        const dnsIpv4Raw = dnsIpv4Text.split('\n').map(s => s.trim()).filter(Boolean);
        const dnsIpv6Raw = dnsIpv6Text.split('\n').map(s => s.trim()).filter(Boolean);

        const dnsIpv4 = this.removeDuplicatesFromArray(dnsIpv4Raw);
        const dnsIpv6 = this.removeDuplicatesFromArray(dnsIpv6Raw);

        const flagUrl = this.getFlagEmoji(id);

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
                    id: id.toLowerCase(),
                    name,
                    nameEn,
                    flagUrl,
                    dns: {
                        ipv4: dnsIpv4,
                        ipv6: dnsIpv6
                    }
                })
            });

            const data = await response.json();

            if (!response.ok) {
                if (response.status === 403) {
                    localStorage.removeItem('admin_token');
                    this.showToast('error', 'نشست شما منقضی شده. لطفا دوباره وارد شوید');
                    window.location.href = '/';
                    return;
                }
                throw new Error(data.error || 'خطا در افزودن کشور');
            }

            this.showToast('success', 'کشور با موفقیت اضافه شد');
            await this.loadCountries();

            document.getElementById('admin-country-id').value = '';
            document.getElementById('admin-country-name').value = '';
            document.getElementById('admin-country-name-en').value = '';
            document.getElementById('admin-dns-ipv4').value = '';
            document.getElementById('admin-dns-ipv6').value = '';

        } catch (error) {
            this.showToast('error', error.message);
        }
    }

    editCountry(id) {
        const country = this.countries.find(c => c.id === id);
        if (!country) return;

        this.editingCountry = JSON.parse(JSON.stringify(country));
        
        document.getElementById('edit-country-id').value = country.id;
        document.getElementById('edit-iso-code').value = country.id.toUpperCase();
        document.getElementById('edit-country-name').value = country.name;
        document.getElementById('edit-country-name-en').value = country.nameEn || '';

        this.renderDnsAddresses();
        this.editModal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    }

    renderDnsAddresses() {
        const ipv4List = document.getElementById('edit-ipv4-list');
        const ipv6List = document.getElementById('edit-ipv6-list');

        if (!this.editingCountry) return;

        const ipv4Html = this.editingCountry.dns.ipv4.map((addr, idx) => `
            <div class="dns-address-item">
                <code>${addr}</code>
                <button class="btn btn-ghost" onclick="adminPanel.removeDnsAddress('ipv4', ${idx})">حذف</button>
            </div>
        `).join('');

        const ipv6Html = this.editingCountry.dns.ipv6.map((addr, idx) => `
            <div class="dns-address-item">
                <code>${addr}</code>
                <button class="btn btn-ghost" onclick="adminPanel.removeDnsAddress('ipv6', ${idx})">حذف</button>
            </div>
        `).join('');

        ipv4List.innerHTML = ipv4Html || '<p style="color: var(--text-secondary); padding: 8px;">هیچ آدرسی ثبت نشده</p>';
        ipv6List.innerHTML = ipv6Html || '<p style="color: var(--text-secondary); padding: 8px;">هیچ آدرسی ثبت نشده</p>';
    }

    addDnsAddress(type) {
        const input = document.getElementById(`new-${type}-address`);
        const address = input.value.trim();

        if (!address) {
            this.showToast('error', 'لطفا آدرس را وارد کنید');
            return;
        }

        if (this.editingCountry.dns[type].includes(address)) {
            this.showToast('error', 'این آدرس قبلا اضافه شده است');
            return;
        }

        this.editingCountry.dns[type].push(address);
        input.value = '';
        this.renderDnsAddresses();
        this.showToast('success', 'آدرس اضافه شد');
    }

    removeDnsAddress(type, index) {
        this.editingCountry.dns[type].splice(index, 1);
        this.renderDnsAddresses();
        this.showToast('success', 'آدرس حذف شد');
    }

    removeDuplicates() {
        if (!this.editingCountry) return;

        const ipv4Before = this.editingCountry.dns.ipv4.length;
        const ipv6Before = this.editingCountry.dns.ipv6.length;

        this.editingCountry.dns.ipv4 = this.removeDuplicatesFromArray(this.editingCountry.dns.ipv4);
        this.editingCountry.dns.ipv6 = this.removeDuplicatesFromArray(this.editingCountry.dns.ipv6);

        const ipv4After = this.editingCountry.dns.ipv4.length;
        const ipv6After = this.editingCountry.dns.ipv6.length;

        const removedCount = (ipv4Before - ipv4After) + (ipv6Before - ipv6After);

        if (removedCount === 0) {
            this.showToast('info', 'آدرس تکراری یافت نشد');
        } else {
            this.showToast('success', `${removedCount} آدرس تکراری حذف شد`);
            this.renderDnsAddresses();
        }
    }

    async saveCountryEdit() {
        if (!this.editingCountry) return;

        const newIsoCode = document.getElementById('edit-iso-code').value.trim().toUpperCase();
        const newName = document.getElementById('edit-country-name').value.trim();
        const newNameEn = document.getElementById('edit-country-name-en').value.trim();

        if (!newIsoCode || !newName || !newNameEn) {
            this.showToast('error', 'لطفا کد ISO، نام فارسی و نام انگلیسی کشور را وارد کنید');
            return;
        }

        if (newIsoCode.length !== 2) {
            this.showToast('error', 'کد ISO باید دو حرف باشد');
            return;
        }

        const adminToken = localStorage.getItem('admin_token');
        if (!adminToken) {
            this.showToast('error', 'لطفا ابتدا وارد پنل مدیریت شوید');
            return;
        }

        try {
            const response = await fetch(`/api/admin/countries/${this.editingCountry.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${adminToken}`
                },
                body: JSON.stringify({
                    id: newIsoCode.toLowerCase(),
                    name: newName,
                    nameEn: newNameEn,
                    flagUrl: this.getFlagEmoji(newIsoCode),
                    dns: this.editingCountry.dns
                })
            });

            const data = await response.json();

            if (!response.ok) {
                if (response.status === 403) {
                    localStorage.removeItem('admin_token');
                    this.showToast('error', 'نشست شما منقضی شده. لطفا دوباره وارد شوید');
                    window.location.href = '/';
                    return;
                }
                throw new Error(data.error || 'خطا در ویرایش کشور');
            }

            this.showToast('success', 'کشور با موفقیت ویرایش شد');
            await this.loadCountries();
            this.closeEditModal();

        } catch (error) {
            this.showToast('error', error.message);
        }
    }

    closeEditModal() {
        this.editModal.style.display = 'none';
        this.editingCountry = null;
        document.body.style.overflow = '';
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
                    window.location.href = '/';
                    return;
                }
                throw new Error(data.error || 'خطا در حذف کشور');
            }

            this.showToast('success', 'کشور حذف شد');
            await this.loadCountries();

        } catch (error) {
            this.showToast('error', error.message);
        }
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
                    window.location.href = '/';
                    return;
                }
                throw new Error(data.error || 'خطا در انتشار اعلان');
            }

            this.showToast('success', 'اعلان با موفقیت منتشر شد');
            
            this.announcementTitle.value = '';
            this.announcementMessage.value = '';
            this.announcementType.value = 'info';
            this.announcementTemplate.value = '';
            
            await this.loadAnnouncements();

        } catch (error) {
            this.showToast('error', error.message);
        }
    }

    async loadAnnouncements() {
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
                this.renderAnnouncements(data.announcements || []);
            }
        } catch (error) {
            console.error('Error loading admin announcements:', error);
        }
    }

    renderAnnouncements(announcements) {
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
                        <button class="btn btn-ghost" onclick="adminPanel.deleteAnnouncement('${ann.id}')">حذف</button>
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
                    window.location.href = '/';
                    return;
                }
                throw new Error(data.error || 'خطا در حذف اعلان');
            }

            this.showToast('success', 'اعلان حذف شد');
            await this.loadAnnouncements();

        } catch (error) {
            this.showToast('error', error.message);
        }
    }

    handleLogout() {
        localStorage.removeItem('admin_token');
        this.showToast('success', 'با موفقیت خارج شدید');
        setTimeout(() => {
            window.location.href = '/';
        }, 1000);
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
    window.adminPanel = new AdminPanel();
});
