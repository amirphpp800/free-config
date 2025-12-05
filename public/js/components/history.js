const History = {
    state: {
        items: [],
        loading: true,
        filter: 'all'
    },

    async init() {
        this.state.loading = true;
        try {
            const result = await API.getHistory();
            this.state.items = result.history || [];
        } catch (error) {
            console.error('History load error:', error);
            this.state.items = [];
        } finally {
            this.state.loading = false;
            App.render();
        }
    },

    render() {
        return `
            ${Header.render('تاریخچه', true, false)}
            <div class="page" style="padding-bottom: 80px;">
                <div class="container">
                    ${this.renderFilters()}
                    ${this.state.loading ? this.renderSkeleton() : this.renderList()}
                </div>
            </div>
            ${Dashboard.renderBottomNav('history')}
        `;
    },

    renderFilters() {
        return `
            <div class="tabs">
                <button class="tab ${this.state.filter === 'all' ? 'active' : ''}" 
                    onclick="History.setFilter('all')">همه</button>
                <button class="tab ${this.state.filter === 'wireguard' ? 'active' : ''}" 
                    onclick="History.setFilter('wireguard')">WireGuard</button>
                <button class="tab ${this.state.filter === 'dns' ? 'active' : ''}" 
                    onclick="History.setFilter('dns')">DNS</button>
            </div>
        `;
    },

    renderSkeleton() {
        return `
            <div class="card">
                <div class="skeleton skeleton-title"></div>
                <div class="skeleton skeleton-text"></div>
                <div class="skeleton skeleton-text" style="width: 60%;"></div>
            </div>
            <div class="card">
                <div class="skeleton skeleton-title"></div>
                <div class="skeleton skeleton-text"></div>
                <div class="skeleton skeleton-text" style="width: 60%;"></div>
            </div>
        `;
    },

    renderList() {
        const filtered = this.getFilteredItems();

        if (!filtered.length) {
            return this.renderEmpty();
        }

        return `
            <div class="animate-fadeIn">
                ${filtered.map((item, index) => this.renderItem(item, index)).join('')}
            </div>
        `;
    },

    renderItem(item, index) {
        const isWireGuard = item.type === 'wireguard';
        const country = Utils.getCountryByCode(item.country) || { flag: '🌍', name: item.country };

        return `
            <div class="card animate-slideInUp stagger-${Math.min(index + 1, 5)}" 
                onclick="History.showDetail('${item.id}')" style="cursor: pointer;">
                <div class="list-item" style="border: none; padding: 0;">
                    <div class="list-item-icon ${isWireGuard ? 'blue' : 'green'}">
                        ${isWireGuard ? '🔐' : '🌐'}
                    </div>
                    <div class="list-item-content">
                        <div class="list-item-title">
                            ${isWireGuard ? 'WireGuard' : 'DNS'} - ${country.flag} ${country.name}
                        </div>
                        <div class="list-item-subtitle">
                            ${Utils.formatDate(item.createdAt)}
                        </div>
                    </div>
                    <div class="list-item-action">
                        <span class="badge ${isWireGuard ? 'badge-blue' : 'badge-green'}">
                            ${item.ipType?.toUpperCase() || 'IPv4'}
                        </span>
                    </div>
                </div>
            </div>
        `;
    },

    renderEmpty() {
        return `
            <div class="empty-state">
                <div class="empty-state-icon">📭</div>
                <h3 class="empty-state-title">تاریخچه‌ای وجود ندارد</h3>
                <p class="empty-state-text">
                    هنوز هیچ کانفیگی تولید نکرده‌اید
                </p>
                <button class="btn btn-primary mt-20" onclick="App.navigate('wireguard')">
                    🔐 تولید اولین کانفیگ
                </button>
            </div>
        `;
    },

    getFilteredItems() {
        if (this.state.filter === 'all') {
            return this.state.items;
        }
        return this.state.items.filter(item => item.type === this.state.filter);
    },

    setFilter(filter) {
        this.state.filter = filter;
        App.render();
    },

    showDetail(id) {
        const item = this.state.items.find(i => i.id === id);
        if (!item) return;

        const country = Utils.getCountryByCode(item.country) || { flag: '🌍', name: item.country };
        const operator = Utils.getOperatorById(item.operator);

        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal">
                <div class="modal-header">
                    <h3 class="modal-title">جزئیات کانفیگ</h3>
                    <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">×</button>
                </div>
                <div class="modal-body">
                    <div class="list-item">
                        <span class="text-secondary">نوع:</span>
                        <span>${item.type === 'wireguard' ? 'WireGuard' : 'DNS'}</span>
                    </div>
                    <div class="list-item">
                        <span class="text-secondary">کشور:</span>
                        <span>${country.flag} ${country.name}</span>
                    </div>
                    <div class="list-item">
                        <span class="text-secondary">نوع IP:</span>
                        <span>${item.ipType?.toUpperCase()}</span>
                    </div>
                    <div class="list-item">
                        <span class="text-secondary">اپراتور:</span>
                        <span>${operator?.name || item.operator}</span>
                    </div>
                    <div class="list-item">
                        <span class="text-secondary">تاریخ:</span>
                        <span>${Utils.formatDate(item.createdAt)}</span>
                    </div>

                    <div class="divider"></div>

                    <h4 style="margin-bottom: 12px;">کانفیگ:</h4>
                    <div class="config-box">${Utils.escapeHtml(item.config)}</div>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-secondary" onclick="this.closest('.modal-overlay').remove()">
                        بستن
                    </button>
                    <button class="btn btn-primary" onclick="History.copyFromModal('${item.id}')">
                        📋 کپی
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        modal.addEventListener('click', (e) => {
            if (e.target === modal) modal.remove();
        });
    },

    copyFromModal(id) {
        const item = this.state.items.find(i => i.id === id);
        if (item?.config) {
            Utils.copyToClipboard(item.config);
            Toast.show('کانفیگ کپی شد', 'success');
        }
    },

    renderCountryCard(item) {
        const typeInfo = item.type === 'wireguard' 
            ? { icon: '🔐', label: 'WireGuard', class: 'blue' }
            : { icon: '🌐', label: 'DNS', class: 'green' };

        return `
            <div class="card animate-fadeIn">
                <div class="card-header">
                    <div style="display: flex; align-items: center; gap: 12px;">
                        <img src="${item.country.flag}" alt="${item.country.name}" class="country-flag-admin">
                        <div>
                            <div class="card-title">${item.country.name}</div>
                            <div style="font-size: 12px; color: var(--text-secondary);">
                                ${Utils.formatDate(item.createdAt)}
                            </div>
                        </div>
                    </div>
                    <span class="badge badge-${typeInfo.class}">${typeInfo.icon} ${typeInfo.label}</span>
                </div>

                <div class="ip-stats-grid">
                    <div class="ip-stat-card">
                        <span class="ip-stat-value">${Utils.toPersianNumber(item.country.ipv4?.length || 0)}</span>
                        <span class="ip-stat-label">IPv4</span>
                    </div>
                    <div class="ip-stat-card">
                        <span class="ip-stat-value">${Utils.toPersianNumber(item.country.ipv6?.length || 0)}</span>
                        <span class="ip-stat-label">IPv6</span>
                    </div>
                </div>

                <div style="margin: 12px 0; padding: 12px; background: var(--bg-tertiary); border-radius: var(--radius-md);">
                    <div style="font-size: 12px; color: var(--text-secondary); margin-bottom: 4px;">آدرس اختصاصی شما:</div>
                    <div style="font-family: monospace; font-size: 14px; font-weight: 600; color: var(--accent-${typeInfo.class}); word-break: break-all;">
                        ${item.ip}
                    </div>
                </div>

                <div style="display: flex; gap: 8px;">
                    <button class="btn btn-sm btn-primary" onclick="History.copyConfig('${item.id}')">
                        📋 کپی
                    </button>
                    ${item.type === 'wireguard' ? `
                        <button class="btn btn-sm btn-secondary" onclick="History.downloadConfig('${item.id}')">
                            ⬇️دانلود
                        </button>
                    ` : `
                        <button class="btn btn-sm btn-secondary" onclick="window.open('https://check-host.net/check-ping?host=${item.ip}', '_blank')">
                            🔍 بررسی فیلتر
                        </button>
                    `}
                    <button class="btn btn-sm btn-danger" onclick="History.deleteItem('${item.id}')">
                        🗑️ حذف
                    </button>
                </div>
            </div>
        `;
    },
};