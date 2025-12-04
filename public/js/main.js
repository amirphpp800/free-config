let authToken = localStorage.getItem('authToken');
let currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');
let pendingTelegramId = null;

// تشخیص بازگشت به tab و بررسی session
document.addEventListener('visibilitychange', async () => {
    if (!document.hidden) {
        await checkAuth();
    }
});

// بررسی session در هر تغییر focus
window.addEventListener('focus', async () => {
    await checkAuth();
});

document.addEventListener('DOMContentLoaded', async () => {
    // Assuming loadCountries, loadOperators, loadDnsOptions are defined elsewhere or not needed for this snippet's scope
    // await loadCountries();
    // await loadOperators();
    // await loadDnsOptions();
    await checkAuth();
    await loadAnnouncements();
});

async function checkAuth() {
    // اگر اطلاعات localStorage داریم، از آن استفاده کنیم
    if (currentUser && authToken) {
        updateAuthUI(true);
    }

    if (!authToken) {
        updateAuthUI(false);
        return;
    }

    try {
        const response = await fetch('/api/auth/me', {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });

        const data = await response.json();

        if (data.success && data.user) {
            currentUser = data.user;
            localStorage.setItem('currentUser', JSON.stringify(currentUser));
            updateAuthUI(true);
        } else {
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
        }
    } catch (error) {
        console.error('Auth check error:', error);
        // در صورت خطای شبکه، از اطلاعات ذخیره شده استفاده می‌کنیم
        if (currentUser) {
            updateAuthUI(true);
        } else {
            updateAuthUI(false);
        }ز اطلاعات localStorage استفاده کنیم
        if (currentUser) {
            updateAuthUI(true);
        }
    }
}

function updateAuthUI(isLoggedIn) {
    const authButtons = document.getElementById('auth-buttons');
    const userMenu = document.getElementById('user-menu');
    const userDisplay = document.getElementById('user-display');
    const adminBtn = document.getElementById('admin-btn');

    if (isLoggedIn && currentUser) {
        authButtons?.classList.add('hidden');
        userMenu?.classList.remove('hidden');
        if (userDisplay) {
            userDisplay.textContent = currentUser.telegramId;
            // اگر کلیک شد به صفحه پروفایل برود
            userDisplay.style.cursor = 'pointer';
            userDisplay.onclick = () => window.location.href = '/profile.html';
        }


        if (adminBtn && currentUser.isAdmin) {
            adminBtn.classList.remove('hidden');
        }
    } else {
        authButtons?.classList.remove('hidden');
        userMenu?.classList.add('hidden');
    }
}

function goToAdmin() {
    if (currentUser && currentUser.telegramId) {
        window.location.href = `/admin?admin=${currentUser.telegramId}`;
    }
}

async function loadAnnouncements() {
    try {
        const response = await fetch('/api/announcements');
        const data = await response.json();
        if (data.success && data.announcements && data.announcements.length > 0) {
            const latest = data.announcements[0];
            const seenAnnouncements = JSON.parse(localStorage.getItem('seenAnnouncements') || '[]');
            if (!seenAnnouncements.includes(latest.id)) {
                const announcementText = document.getElementById('announcement-text');
                const announcementBar = document.getElementById('announcement-bar');
                if (announcementText && announcementBar) {
                    announcementText.textContent = latest.message;
                    announcementBar.classList.add('active');
                }
            }
        }
    } catch (error) {
        console.error('Error loading announcements:', error);
    }
}

function closeAnnouncement() {
    const bar = document.getElementById('announcement-bar');
    const text = document.getElementById('announcement-text')?.textContent;
    bar?.classList.remove('active');

    const seenAnnouncements = JSON.parse(localStorage.getItem('seenAnnouncements') || '[]');
    seenAnnouncements.push(Date.now().toString());
    localStorage.setItem('seenAnnouncements', JSON.stringify(seenAnnouncements.slice(-10)));
}

function showAuthModal() {
    const modal = document.getElementById('auth-modal');
    const step1 = document.getElementById('auth-step-1');
    const step2 = document.getElementById('auth-step-2');

    modal?.classList.add('active');
    step1?.classList.remove('hidden');
    step2?.classList.add('hidden');
}

function closeAuthModal() {
    document.getElementById('auth-modal')?.classList.remove('active');
}

function backToStep1() {
    document.getElementById('auth-step-1')?.classList.remove('hidden');
    document.getElementById('auth-step-2')?.classList.add('hidden');
}

async function sendVerifyCode() {
    const telegramId = document.getElementById('telegram-id')?.value.trim();

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
            document.getElementById('auth-step-1')?.classList.add('hidden');
            document.getElementById('auth-step-2')?.classList.remove('hidden');
            showToast('کد تایید ارسال شد', 'success');
        } else {
            showToast(data.error || 'خطا در ارسال کد', 'error');
        }
    } catch (error) {
        showToast('خطا در ارتباط با سرور', 'error');
    } finally {
        hideLoading();
    }
}

async function verifyCode() {
    const code = document.getElementById('verify-code')?.value.trim();

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
            closeAuthModal();
            updateAuthUI(true);
            showToast(data.user.isNewUser ? 'ثبت نام موفق! خوش آمدید' : 'ورود موفق! خوش آمدید', 'success');
        } else {
            showToast(data.error || 'کد تایید اشتباه است', 'error');
        }
    } catch (error) {
        showToast('خطا در ارتباط با سرور', 'error');
    } finally {
        hideLoading();
    }
}

async function logout() {
    if (authToken) {
        try {
            await fetch('/api/auth/logout', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${authToken}` }
            });
        } catch (error) {
            console.error('Logout error:', error);
        }
    }

    localStorage.removeItem('authToken');
    localStorage.removeItem('currentUser');
    authToken = null;
    currentUser = null;
    updateAuthUI(false);
    showToast('خارج شدید', 'success');
}

function showLoading() {
    document.getElementById('loading')?.classList.add('active');
}

function hideLoading() {
    document.getElementById('loading')?.classList.remove('active');
}

function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    if (toast) {
        toast.textContent = message;
        toast.className = `toast ${type} active`;
        setTimeout(() => toast.classList.remove('active'), 3000);
    }
}

document.getElementById('auth-modal')?.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal-overlay')) {
        closeAuthModal();
    }
});

document.querySelector('#auth-modal .modal')?.addEventListener('click', (e) => {
    e.stopPropagation();
});

// Removing shadow from cards on hover
const cards = document.querySelectorAll('.card');
cards.forEach(card => {
    card.addEventListener('mouseover', () => {
        card.style.boxShadow = 'none';
    });
    card.addEventListener('mouseout', () => {
        // Revert to original shadow or remove if it was only on hover
        card.style.boxShadow = ''; // Assuming no default shadow or it's handled by CSS
    });
});

// Updating image paths for icons
const iconElements = document.querySelectorAll('.icon'); // Assuming icons have a class 'icon'
iconElements.forEach(icon => {
    const iconType = icon.dataset.icon; // Assuming data-icon attribute stores the type (e.g., 'telegram', 'home')
    if (iconType) {
        icon.src = `/images/${iconType}.png`; // Adjust '.png' if needed, or use a more robust way to get file extension
    }
});