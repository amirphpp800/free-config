
const Tools = {
    state: {
        activeModal: null
    },

    async init() {
        App.render();
    },

    render() {
        return `
            ${Header.render('ابزارک‌های کمکی', true, false)}
            <div class="page" style="padding-bottom: 80px;">
                <div class="container">
                    ${this.renderToolsGrid()}
                </div>
            </div>
            ${Dashboard.renderBottomNav('tools')}
            ${this.state.activeModal ? this.renderModal() : ''}
        `;
    },

    renderToolsGrid() {
        return `
            <div class="card animate-slideInUp">
                <h3 class="card-title mb-16">ابزارهای تنظیم VPN</h3>
                <p class="text-secondary mb-20" style="font-size: 14px;">
                    ابزارهای کمکی برای تنظیم و استفاده بهتر از کانفیگ‌های VPN
                </p>

                <div class="tools-grid">
                    <button class="tool-item" onclick="Tools.openModal('wireguard-android')">
                        <div class="tool-icon">📱</div>
                        <div class="tool-content">
                            <div class="tool-title">آموزش WireGuard اندروید</div>
                            <div class="tool-desc">نصب و راه‌اندازی در اندروید</div>
                        </div>
                        <div class="tool-arrow">←</div>
                    </button>

                    <button class="tool-item" onclick="Tools.openModal('wireguard-ios')">
                        <div class="tool-icon">🍎</div>
                        <div class="tool-content">
                            <div class="tool-title">آموزش WireGuard iOS</div>
                            <div class="tool-desc">نصب و راه‌اندازی در آیفون</div>
                        </div>
                        <div class="tool-arrow">←</div>
                    </button>

                    <button class="tool-item" onclick="Tools.openModal('wireguard-windows')">
                        <div class="tool-icon">💻</div>
                        <div class="tool-content">
                            <div class="tool-title">آموزش WireGuard ویندوز</div>
                            <div class="tool-desc">نصب و راه‌اندازی در ویندوز</div>
                        </div>
                        <div class="tool-arrow">←</div>
                    </button>

                    <button class="tool-item" onclick="Tools.openModal('dns-android')">
                        <div class="tool-icon">🌐</div>
                        <div class="tool-content">
                            <div class="tool-title">تنظیم DNS اندروید</div>
                            <div class="tool-desc">تغییر DNS در اندروید</div>
                        </div>
                        <div class="tool-arrow">←</div>
                    </button>

                    <button class="tool-item" onclick="Tools.openModal('dns-ios')">
                        <div class="tool-icon">🔧</div>
                        <div class="tool-content">
                            <div class="tool-title">تنظیم DNS iOS</div>
                            <div class="tool-desc">تغییر DNS در آیفون</div>
                        </div>
                        <div class="tool-arrow">←</div>
                    </button>

                    <button class="tool-item" onclick="Tools.openModal('troubleshooting')">
                        <div class="tool-icon">🔍</div>
                        <div class="tool-content">
                            <div class="tool-title">رفع مشکلات رایج</div>
                            <div class="tool-desc">حل مشکلات اتصال</div>
                        </div>
                        <div class="tool-arrow">←</div>
                    </button>

                    <button class="tool-item" onclick="Tools.openModal('speed-test')">
                        <div class="tool-icon">⚡</div>
                        <div class="tool-content">
                            <div class="tool-title">تست سرعت</div>
                            <div class="tool-desc">بررسی سرعت اتصال</div>
                        </div>
                        <div class="tool-arrow">←</div>
                    </button>

                    <button class="tool-item" onclick="Tools.openModal('faq')">
                        <div class="tool-icon">❓</div>
                        <div class="tool-content">
                            <div class="tool-title">سوالات متداول</div>
                            <div class="tool-desc">پاسخ به سوالات رایج</div>
                        </div>
                        <div class="tool-arrow">←</div>
                    </button>
                </div>
            </div>
        `;
    },

    openModal(type) {
        this.state.activeModal = type;
        App.render();
    },

    closeModal() {
        this.state.activeModal = null;
        App.render();
    },

    renderModal() {
        const modalContent = this.getModalContent(this.state.activeModal);
        
        return `
            <div class="modal-overlay" onclick="if(event.target === this) Tools.closeModal()">
                <div class="modal">
                    <div class="modal-header">
                        <h3 class="modal-title">${modalContent.title}</h3>
                        <button class="modal-close" onclick="Tools.closeModal()">×</button>
                    </div>
                    <div class="modal-body">
                        ${modalContent.content}
                    </div>
                </div>
            </div>
        `;
    },

    getModalContent(type) {
        const contents = {
            'wireguard-android': {
                title: '📱 آموزش WireGuard اندروید',
                content: `
                    <div class="tutorial-steps">
                        <div class="tutorial-step">
                            <div class="step-number">۱</div>
                            <div class="step-content">
                                <h4>نصب برنامه</h4>
                                <p>برنامه WireGuard را از گوگل پلی یا سایت رسمی دانلود و نصب کنید.</p>
                                <a href="https://play.google.com/store/apps/details?id=com.wireguard.android" 
                                   target="_blank" class="btn btn-sm btn-primary mt-8">
                                    دانلود از گوگل پلی
                                </a>
                            </div>
                        </div>
                        <div class="tutorial-step">
                            <div class="step-number">۲</div>
                            <div class="step-content">
                                <h4>افزودن کانفیگ</h4>
                                <p>روی دکمه + کلیک کنید و گزینه "Import from file or archive" را انتخاب کنید.</p>
                            </div>
                        </div>
                        <div class="tutorial-step">
                            <div class="step-number">۳</div>
                            <div class="step-content">
                                <h4>فعال‌سازی</h4>
                                <p>فایل .conf دانلود شده را انتخاب کنید و سوئیچ را روشن کنید.</p>
                            </div>
                        </div>
                    </div>
                `
            },
            'wireguard-ios': {
                title: '🍎 آموزش WireGuard iOS',
                content: `
                    <div class="tutorial-steps">
                        <div class="tutorial-step">
                            <div class="step-number">۱</div>
                            <div class="step-content">
                                <h4>نصب برنامه</h4>
                                <p>برنامه WireGuard را از App Store دانلود کنید.</p>
                                <a href="https://apps.apple.com/us/app/wireguard/id1441195209" 
                                   target="_blank" class="btn btn-sm btn-primary mt-8">
                                    دانلود از App Store
                                </a>
                            </div>
                        </div>
                        <div class="tutorial-step">
                            <div class="step-number">۲</div>
                            <div class="step-content">
                                <h4>اضافه کردن تانل</h4>
                                <p>روی Add a tunnel کلیک کنید و Create from file or archive را انتخاب کنید.</p>
                            </div>
                        </div>
                        <div class="tutorial-step">
                            <div class="step-number">۳</div>
                            <div class="step-content">
                                <h4>اتصال</h4>
                                <p>فایل کانفیگ را انتخاب و سوئیچ را فعال کنید.</p>
                            </div>
                        </div>
                    </div>
                `
            },
            'wireguard-windows': {
                title: '💻 آموزش WireGuard ویندوز',
                content: `
                    <div class="tutorial-steps">
                        <div class="tutorial-step">
                            <div class="step-number">۱</div>
                            <div class="step-content">
                                <h4>دانلود و نصب</h4>
                                <p>نسخه ویندوز WireGuard را دانلود و نصب کنید.</p>
                                <a href="https://www.wireguard.com/install/" 
                                   target="_blank" class="btn btn-sm btn-primary mt-8">
                                    دانلود WireGuard
                                </a>
                            </div>
                        </div>
                        <div class="tutorial-step">
                            <div class="step-number">۲</div>
                            <div class="step-content">
                                <h4>Import تانل</h4>
                                <p>روی Import tunnel(s) from file کلیک کنید و فایل .conf را انتخاب کنید.</p>
                            </div>
                        </div>
                        <div class="tutorial-step">
                            <div class="step-number">۳</div>
                            <div class="step-content">
                                <h4>فعال‌سازی</h4>
                                <p>روی Activate کلیک کنید تا VPN متصل شود.</p>
                            </div>
                        </div>
                    </div>
                `
            },
            'dns-android': {
                title: '🌐 تنظیم DNS اندروید',
                content: `
                    <div class="tutorial-steps">
                        <div class="tutorial-step">
                            <div class="step-number">۱</div>
                            <div class="step-content">
                                <h4>ورود به تنظیمات</h4>
                                <p>به Settings > Network & Internet > Private DNS بروید.</p>
                            </div>
                        </div>
                        <div class="tutorial-step">
                            <div class="step-number">۲</div>
                            <div class="step-content">
                                <h4>انتخاب حالت دستی</h4>
                                <p>گزینه Private DNS provider hostname را انتخاب کنید.</p>
                            </div>
                        </div>
                        <div class="tutorial-step">
                            <div class="step-number">۳</div>
                            <div class="step-content">
                                <h4>وارد کردن DNS</h4>
                                <p>DNS دریافت شده را وارد کنید و ذخیره کنید.</p>
                            </div>
                        </div>
                    </div>
                `
            },
            'dns-ios': {
                title: '🔧 تنظیم DNS iOS',
                content: `
                    <div class="tutorial-steps">
                        <div class="tutorial-step">
                            <div class="step-number">۱</div>
                            <div class="step-content">
                                <h4>ورود به Wi-Fi</h4>
                                <p>به Settings > Wi-Fi بروید و روی شبکه متصل کلیک کنید.</p>
                            </div>
                        </div>
                        <div class="tutorial-step">
                            <div class="step-number">۲</div>
                            <div class="step-content">
                                <h4>تنظیم DNS</h4>
                                <p>روی Configure DNS کلیک کنید و Manual را انتخاب کنید.</p>
                            </div>
                        </div>
                        <div class="tutorial-step">
                            <div class="step-number">۳</div>
                            <div class="step-content">
                                <h4>افزودن سرور</h4>
                                <p>DNS سرور دریافتی را اضافه کنید و ذخیره کنید.</p>
                            </div>
                        </div>
                    </div>
                `
            },
            'troubleshooting': {
                title: '🔍 رفع مشکلات رایج',
                content: `
                    <div class="faq-list">
                        <div class="faq-item">
                            <h4>VPN وصل نمی‌شود</h4>
                            <p>• اتصال اینترنت خود را بررسی کنید<br>
                               • کانفیگ جدید دریافت کنید<br>
                               • برنامه را به‌روز کنید</p>
                        </div>
                        <div class="faq-item">
                            <h4>سرعت پایین است</h4>
                            <p>• کشور دیگری را امتحان کنید<br>
                               • از IPv6 استفاده کنید<br>
                               • DNS را تغییر دهید</p>
                        </div>
                        <div class="faq-item">
                            <h4>قطع و وصل می‌شود</h4>
                            <p>• اپراتور دیگری انتخاب کنید<br>
                               • تنظیمات برنامه را ریست کنید<br>
                               • کانفیگ جدید بگیرید</p>
                        </div>
                    </div>
                `
            },
            'speed-test': {
                title: '⚡ تست سرعت',
                content: `
                    <div class="speed-test-content">
                        <p class="mb-16">برای تست سرعت اتصال VPN خود می‌توانید از سایت‌های زیر استفاده کنید:</p>
                        <div class="link-list">
                            <a href="https://fast.com" target="_blank" class="link-item">
                                <span>⚡ Fast.com</span>
                                <span class="link-arrow">←</span>
                            </a>
                            <a href="https://www.speedtest.net" target="_blank" class="link-item">
                                <span>📊 Speedtest.net</span>
                                <span class="link-arrow">←</span>
                            </a>
                            <a href="https://speed.cloudflare.com" target="_blank" class="link-item">
                                <span>☁️ Cloudflare Speed</span>
                                <span class="link-arrow">←</span>
                            </a>
                        </div>
                        <div class="alert alert-info mt-16">
                            💡 برای دقت بیشتر، تست را چند بار تکرار کنید.
                        </div>
                    </div>
                `
            },
            'faq': {
                title: '❓ سوالات متداول',
                content: `
                    <div class="faq-list">
                        <div class="faq-item">
                            <h4>چند کانفیگ در روز می‌توانم بگیرم؟</h4>
                            <p>روزانه ${Utils.toPersianNumber(CONFIG.DAILY_LIMITS.wireguard)} کانفیگ WireGuard و ${Utils.toPersianNumber(CONFIG.DAILY_LIMITS.dns)} DNS می‌توانید دریافت کنید.</p>
                        </div>
                        <div class="faq-item">
                            <h4>تفاوت IPv4 و IPv6 چیست؟</h4>
                            <p>IPv6 معمولاً سریع‌تر و پایدارتر است اما همه اپراتورها آن را پشتیبانی نمی‌کنند.</p>
                        </div>
                        <div class="faq-item">
                            <h4>کدام اپراتور بهتر است؟</h4>
                            <p>بسته به منطقه شما متفاوت است. همه اپراتورها را امتحان کنید.</p>
                        </div>
                        <div class="faq-item">
                            <h4>آیا استفاده رایگان است؟</h4>
                            <p>بله، این سرویس کاملاً رایگان و بدون محدودیت است.</p>
                        </div>
                    </div>
                `
            }
        };

        return contents[type] || { title: 'اطلاعات', content: '<p>محتوایی یافت نشد</p>' };
    }
};
