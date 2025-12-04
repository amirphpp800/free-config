let countries = [];
let currentConfig = null;
let currentType = null;
let authToken = localStorage.getItem('authToken');
let currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');
let pendingTelegramId = null;

document.addEventListener('DOMContentLoaded', async () => {
    // ابتدا اطلاعات ذخیره شده را بارگذاری می‌کنیم
    if (currentUser) {
        updateAuthUI(true);
    }
    
    await checkAuth();
    await loadCountries();
    await loadOperators();
    await loadDnsOptions();
    initTabs();
    initToggles();
    initSearch();
});

async function checkAuth() {
    if (!authToken) {
        localStorage.removeItem('currentUser');
        currentUser = null;
        updateAuthUI(false);
        return;
    }
    
    try {
        const response = await fetch('/api/auth/me', {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        
        if (response.ok) {
            const data = await response.json();
            
            if (data.success && data.user) {
                currentUser = data.user;
                localStorage.setItem('currentUser', JSON.stringify(currentUser));
                updateAuthUI(true);
                return;
            }
        }
        
        // فقط در صورت 401 (Unauthorized) session را پاک می‌کنیم
        if (response.status === 401) {
            localStorage.removeItem('authToken');
            localStorage.removeItem('currentUser');
            authToken = null;
            currentUser = null;
            updateAuthUI(false);
        } else {
            // برای خطاهای دیگر، از اطلاعات ذخیره شده استفاده می‌کنیم
            if (currentUser) {
                updateAuthUI(true);
            }
        }
    } catch (error) {
        console.error('Auth check error:', error);
        // در صورت خطای شبکه، از اطلاعات ذخیره شده استفاده می‌کنیم
        if (currentUser) {
            updateAuthUI(true);
        } else {
            updateAuthUI(false);
        }
    }
}

function updateAuthUI(isLoggedIn) {
    const guestButtons = document.getElementById('guest-buttons');
    const userButtons = document.getElementById('user-buttons');
    const adminBtn = document.getElementById('admin-btn');
    const userIdDisplay = document.getElementById('user-id-display');
    
    if (isLoggedIn && currentUser) {
        guestButtons.classList.add('hidden');
        userButtons.classList.remove('hidden');
        userIdDisplay.textContent = currentUser.telegramId;
        
        if (currentUser.isAdmin) {
            adminBtn.classList.remove('hidden');
        } else {
            adminBtn.classList.add('hidden');
        }
    } else {
        guestButtons.classList.remove('hidden');
        userButtons.classList.add('hidden');
    }
}

function showAuthModal() {
    document.getElementById('auth-modal').classList.add('active');
    document.getElementById('auth-step-1').classList.remove('hidden');
    document.getElementById('auth-step-2').classList.add('hidden');
    document.getElementById('telegram-id').value = '';
    document.getElementById('verify-code').value = '';
}

function closeAuthModal() {
    document.getElementById('auth-modal').classList.remove('active');
}

function backToStep1() {
    document.getElementById('auth-step-1').classList.remove('hidden');
    document.getElementById('auth-step-2').classList.add('hidden');
}

async function sendVerifyCode() {
    const telegramId = document.getElementById('telegram-id').value.trim();
    
    if (!telegramId || !/^\d{5,15}$/.test(telegramId)) {
        showToast('لطفا آیدی عددی معتبر وارد کنید', 'error');
        return;
    }
    
    showLoading();
    
    try {
        const response = await fetch('/api/auth/send-code', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ telegramId })
        });
        
        const data = await response.json();
        
        if (data.success) {
            pendingTelegramId = telegramId;
            document.getElementById('auth-step-1').classList.add('hidden');
            document.getElementById('auth-step-2').classList.remove('hidden');
            showToast('کد تایید به تلگرام شما ارسال شد', 'success');
        } else {
            showToast(data.error || 'خطا در ارسال کد', 'error');
        }
    } catch (error) {
        console.error('Send code error:', error);
        showToast('خطا در ارتباط با سرور', 'error');
    } finally {
        hideLoading();
    }
}

async function verifyCode() {
    const code = document.getElementById('verify-code').value.trim();
    
    if (!code || code.length !== 6) {
        showToast('لطفا کد ۶ رقمی را وارد کنید', 'error');
        return;
    }
    
    showLoading();
    
    try {
        const response = await fetch('/api/auth/verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ telegramId: pendingTelegramId, code })
        });
        
        const data = await response.json();
        
        if (data.success) {
            authToken = data.token;
            currentUser = data.user;
            localStorage.setItem('authToken', authToken);
            localStorage.setItem('currentUser', JSON.stringify(currentUser));
            updateAuthUI(true);
            closeAuthModal();
            showToast(data.user.isNewUser ? 'ثبت نام موفق! خوش آمدید' : 'ورود موفق! خوش آمدید', 'success');
        } else {
            showToast(data.error || 'کد تایید اشتباه است', 'error');
        }
    } catch (error) {
        console.error('Verify code error:', error);
        showToast('خطا در ارتباط با سرور', 'error');
    } finally {
        hideLoading();
    }
}

async function logout() {
    try {
        await fetch('/api/auth/logout', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
    } catch (e) {
        console.error('Logout error:', e);
    }
    
    localStorage.removeItem('authToken');
    localStorage.removeItem('currentUser');
    authToken = null;
    currentUser = null;
    updateAuthUI(false);
    showToast('از حساب کاربری خارج شدید', 'success');
}

async function loadCountries() {
    try {
        const response = await fetch('/api/countries');
        countries = await response.json();
        renderCountries('wg-countries', 'wireguard');
        renderCountries('dns-countries', 'dns');
    } catch (error) {
        console.error('Error loading countries:', error);
        showToast('خطا در بارگذاری کشورها', 'error');
    }
}

async function loadOperators() {
    try {
        const response = await fetch('/api/config/operators');
        const operators = await response.json();
        const select = document.getElementById('wg-operator');
        select.innerHTML = '';
        operators.forEach(op => {
            const option = document.createElement('option');
            option.value = op.id;
            option.textContent = op.title;
            select.appendChild(option);
        });
    } catch (error) {
        console.error('Error loading operators:', error);
    }
}

async function loadDnsOptions() {
    try {
        const response = await fetch('/api/config/dns-options');
        const dnsOptions = await response.json();
        const select = document.getElementById('wg-dns');
        select.innerHTML = '';
        dnsOptions.forEach(dns => {
            const option = document.createElement('option');
            option.value = dns.ip;
            option.textContent = `${dns.name} (${dns.ip})`;
            select.appendChild(option);
        });
    } catch (error) {
        console.error('Error loading DNS options:', error);
    }
}

function renderCountries(containerId, type) {
    const container = document.getElementById(containerId);
    container.innerHTML = '';
    
    countries.forEach(country => {
        const card = document.createElement('div');
        card.className = 'country-card';
        card.onclick = () => generateConfig(country.code, type);
        
        card.innerHTML = `
            <div class="country-flag">${country.flag}</div>
            <div class="country-info">
                <div class="country-name-fa">${country.fa}</div>
                <div class="country-name-en">${country.en}</div>
            </div>
            <div class="country-code">${country.code}</div>
        `;
        
        container.appendChild(card);
    });
}

function filterCountries(searchText, containerId, type) {
    const container = document.getElementById(containerId);
    container.innerHTML = '';
    
    const filtered = countries.filter(country => 
        country.fa.includes(searchText) ||
        country.en.toLowerCase().includes(searchText.toLowerCase()) ||
        country.code.toLowerCase().includes(searchText.toLowerCase())
    );
    
    filtered.forEach(country => {
        const card = document.createElement('div');
        card.className = 'country-card';
        card.onclick = () => generateConfig(country.code, type);
        
        card.innerHTML = `
            <div class="country-flag">${country.flag}</div>
            <div class="country-info">
                <div class="country-name-fa">${country.fa}</div>
                <div class="country-name-en">${country.en}</div>
            </div>
            <div class="country-code">${country.code}</div>
        `;
        
        container.appendChild(card);
    });
}

function initTabs() {
    const navBtns = document.querySelectorAll('.nav-btn');
    
    navBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            navBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            const tab = btn.dataset.tab;
            document.querySelectorAll('.section').forEach(section => {
                section.classList.remove('active');
            });
            document.getElementById(`${tab}-section`).classList.add('active');
        });
    });
}

function initToggles() {
    const toggleBtns = document.querySelectorAll('.toggle-btn');
    
    toggleBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const target = btn.dataset.target;
            const value = btn.dataset.value;
            
            const siblings = btn.parentElement.querySelectorAll('.toggle-btn');
            siblings.forEach(s => s.classList.remove('active'));
            btn.classList.add('active');
            
            document.getElementById(target).value = value;
        });
    });
}

function initSearch() {
    document.getElementById('wg-search').addEventListener('input', (e) => {
        filterCountries(e.target.value, 'wg-countries', 'wireguard');
    });
    
    document.getElementById('dns-search').addEventListener('input', (e) => {
        filterCountries(e.target.value, 'dns-countries', 'dns');
    });
}

async function generateConfig(countryCode, type) {
    showLoading();
    currentType = type;
    
    const headers = { 'Content-Type': 'application/json' };
    if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
    }
    
    try {
        let response;
        
        if (type === 'wireguard') {
            const ipVersion = document.getElementById('wg-ip-version').value;
            const operator = document.getElementById('wg-operator').value;
            const dns = document.getElementById('wg-dns').value;
            
            if (!operator || !dns) {
                showToast('لطفا DNS و اپراتور را انتخاب کنید', 'error');
                hideLoading();
                return;
            }
            
            response = await fetch('/api/config/generate-wireguard', {
                method: 'POST',
                headers,
                body: JSON.stringify({ country: countryCode, operator, dns, ipVersion })
            });
        } else {
            const ipVersion = document.getElementById('dns-ip-version').value;
            
            response = await fetch('/api/config/generate-dns', {
                method: 'POST',
                headers,
                body: JSON.stringify({ country: countryCode, ipVersion })
            });
        }
        
        const data = await response.json();
        
        if (data.success) {
            currentConfig = data;
            showResult(data, type);
            showToast('کانفیگ با موفقیت تولید شد', 'success');
        } else {
            showToast(data.error || 'خطا در تولید کانفیگ', 'error');
        }
    } catch (error) {
        console.error('Error generating config:', error);
        showToast('خطا در ارتباط با سرور', 'error');
    } finally {
        hideLoading();
    }
}

function showResult(data, type) {
    const modal = document.getElementById('modal');
    const title = document.getElementById('modal-title');
    const info = document.getElementById('result-info');
    const content = document.getElementById('config-content');
    
    if (type === 'wireguard') {
        title.innerHTML = `<i class="fas fa-network-wired" style="color: var(--secondary);"></i> کانفیگ WireGuard`;
        let badges = `
            <div class="badge"><i class="fas fa-flag"></i> ${data.flag} ${data.country}</div>
            <div class="badge"><i class="fas fa-server"></i> DNS: ${data.dns}</div>
            <div class="badge"><i class="fas fa-ruler"></i> MTU: ${data.mtu}</div>
            <div class="badge"><i class="fas fa-network-wired"></i> ${data.ipVersion.toUpperCase()}</div>
        `;
        if (data.operator) {
            badges += `<div class="badge"><i class="fas fa-mobile-alt"></i> ${data.operator}</div>`;
        }
        info.innerHTML = badges;
        content.textContent = data.config;
    } else {
        title.innerHTML = `<i class="fas fa-globe" style="color: var(--secondary);"></i> DNS ${data.country}`;
        info.innerHTML = `
            <div class="badge"><i class="fas fa-flag"></i> ${data.flag} ${data.country}</div>
            <div class="badge"><i class="fas fa-network-wired"></i> ${data.ipVersion.toUpperCase()}</div>
            <div class="badge"><i class="fas fa-clock"></i> ${data.generated}</div>
        `;
        content.textContent = `# DNS Configuration for ${data.country} (${data.countryEn}) ${data.flag}\n\nDNS Primary:   ${data.dns.primary}\nDNS Secondary: ${data.dns.secondary}\n\n# IP Version: ${data.ipVersion.toUpperCase()}\n# Generated: ${data.generated}`;
    }
    
    modal.classList.add('active');
}

function closeModal() {
    document.getElementById('modal').classList.remove('active');
}

function copyConfig() {
    const content = document.getElementById('config-content').textContent;
    navigator.clipboard.writeText(content).then(() => {
        showToast('کپی شد!', 'success');
    }).catch(() => {
        showToast('خطا در کپی', 'error');
    });
}

function downloadConfig() {
    if (!currentConfig) return;
    
    let content, filename;
    
    if (currentType === 'wireguard') {
        content = currentConfig.config;
        filename = `wireguard-${currentConfig.countryCode || 'config'}.conf`;
    } else {
        content = `DNS Primary: ${currentConfig.dns.primary}\nDNS Secondary: ${currentConfig.dns.secondary}`;
        filename = `dns-${currentConfig.countryCode || 'config'}.txt`;
    }
    
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    showToast('دانلود شد!', 'success');
}

function showLoading() {
    document.getElementById('loading').classList.add('active');
}

function hideLoading() {
    document.getElementById('loading').classList.remove('active');
}

function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = `toast ${type} active`;
    
    setTimeout(() => {
        toast.classList.remove('active');
    }, 3000);
}

document.getElementById('modal').addEventListener('click', (e) => {
    if (e.target.id === 'modal') {
        closeModal();
    }
});

document.getElementById('auth-modal').addEventListener('click', (e) => {
    if (e.target.id === 'auth-modal') {
        closeAuthModal();
    }
});

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        closeModal();
        closeAuthModal();
    }
});
