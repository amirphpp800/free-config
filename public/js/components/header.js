const Header = {
    render(title, showBack = false, showLogout = false) {
        return `
            <header class="header">
                <div class="header-content">
                    ${showBack ? `
                        <button class="btn btn-icon btn-secondary" onclick="App.navigate('dashboard')">
                            <span>→</span>
                        </button>
                    ` : '<div></div>'}
                    <h1 class="header-title">${title}</h1>
                    <div class="header-actions">
                        ${showLogout ? `
                            <button class="btn btn-icon btn-secondary" onclick="App.logout()">
                                <span>🚪</span>
                            </button>
                        ` : '<div></div>'}
                    </div>
                </div>
            </header>
        `;
    }
};
