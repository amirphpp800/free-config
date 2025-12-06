const Auth = {
    state: {
        step: 'phone',
        telegramId: '',
        code: '',
        password: '',
        hasPassword: false,
        loading: false,
        showPassword: false
    },

    render() {
        return `
            <div class="page auth-page">
                <div class="auth-pattern"></div>
                <div class="container">
                    <div class="text-center mb-20" style="padding-top: 40px;">
                        <img src="/images/logo.jpg" alt="Logo" class="auth-logo">
                        <h1 style="font-size: 24px; margin-bottom: 8px;">سرویس کانفیگ رایگان</h1>
                        <p class="text-secondary">WireGuard & DNS Generator</p>
                    </div>

                    <div class="card">
                        ${this.renderStep()}
                    </div>

                </div>
            </div>
        `;
    },

    renderStep() {
        switch (this.state.step) {
            case 'phone':
                return this.renderPhoneStep();
            case 'code':
                return this.renderCodeStep();
            case 'password':
                return this.renderPasswordStep();
            case 'login':
                return this.renderLoginStep();
            default:
                return this.renderPhoneStep();
        }
    },

    renderPhoneStep() {
        return `
            <h2 style="font-size: 17px; margin-bottom: 16px;">ورود با تلگرام</h2>
            <div class="input-group">
                <label class="input-label">شناسه تلگرام (Telegram ID)</label>
                <input 
                    type="text" 
                    class="input" 
                    placeholder="مثال: 123456789"
                    value="${this.state.telegramId}"
                    onchange="Auth.state.telegramId = this.value"
                    oninput="Auth.state.telegramId = this.value"
                    inputmode="numeric"
                    pattern="[0-9]*"
                >
            </div>
            <p class="text-secondary mb-16" style="font-size: 13px;">
                برای آیدی عددی و کد تایید وارد 
                <a href="https://t.me/jojo85_robot" target="_blank">این ربات</a>
                شوید
            </p>
            <button 
                class="btn btn-primary ${this.state.loading ? 'disabled' : ''}"
                onclick="Auth.sendCode()"
                ${this.state.loading ? 'disabled' : ''}
            >
                ${this.state.loading ? '⏳ در حال ارسال...' : '📱 ارسال کد تایید'}
            </button>
        `;
    },

    renderCodeStep() {
        const codeDigits = this.state.code.split('');
        return `
            <h2 style="font-size: 17px; margin-bottom: 8px;">کد تایید</h2>
            <p class="text-secondary mb-16">کد ۵ رقمی ارسال شده به تلگرام را وارد کنید</p>
            <div class="input-group">
                <div class="otp-container" dir="ltr">
                    ${[0,1,2,3,4].map(i => `
                        <input 
                            type="text" 
                            class="otp-input" 
                            id="otp-${i}"
                            maxlength="1"
                            value="${codeDigits[i] || ''}"
                            oninput="Auth.handleOTPInput(${i}, this)"
                            onkeydown="Auth.handleOTPKeydown(${i}, event)"
                            onpaste="Auth.handleOTPPaste(event)"
                            inputmode="numeric"
                            pattern="[0-9]*"
                            ${i === 0 ? 'autofocus' : ''}
                        >
                    `).join('')}
                </div>
            </div>
            <button 
                class="btn btn-primary ${this.state.loading ? 'disabled' : ''}"
                onclick="Auth.verifyCode()"
                ${this.state.loading ? 'disabled' : ''}
            >
                ${this.state.loading ? '⏳ در حال بررسی...' : '✓ تایید کد'}
            </button>
            <button class="btn btn-secondary mt-12" onclick="Auth.goBack()">
                بازگشت
            </button>
        `;
    },

    renderPasswordStep() {
        return `
            <h2 style="font-size: 17px; margin-bottom: 8px;">تنظیم رمز عبور</h2>
            <p class="text-secondary mb-16">می‌توانید یک رمز عبور برای ورود سریع‌تر تنظیم کنید (اختیاری)</p>
            <div class="input-group">
                <div class="password-input-wrapper">
                    <input 
                        type="${this.state.showPassword ? 'text' : 'password'}" 
                        class="input password-input" 
                        placeholder="رمز عبور (حداقل ۴ کاراکتر)"
                        value="${this.state.password}"
                        onchange="Auth.state.password = this.value"
                        oninput="Auth.state.password = this.value"
                    >
                    <button type="button" class="password-toggle" onclick="Auth.togglePassword()">
                        ${this.state.showPassword ? '🙈' : '👁️'}
                    </button>
                </div>
            </div>
            <button 
                class="btn btn-primary ${this.state.loading ? 'disabled' : ''}"
                onclick="Auth.setPassword()"
                ${this.state.loading ? 'disabled' : ''}
            >
                ${this.state.loading ? '⏳ در حال ذخیره...' : '💾 ذخیره رمز عبور'}
            </button>
            <button class="btn btn-secondary mt-12" onclick="Auth.skipPassword()">
                رد کردن
            </button>
        `;
    },

    renderLoginStep() {
        return `
            <h2 style="font-size: 17px; margin-bottom: 16px;">ورود با رمز عبور</h2>
            <div class="input-group">
                <label class="input-label">شناسه تلگرام</label>
                <input 
                    type="text" 
                    class="input" 
                    value="${this.state.telegramId}"
                    onchange="Auth.state.telegramId = this.value"
                    oninput="Auth.state.telegramId = this.value"
                    inputmode="numeric"
                >
            </div>
            <div class="input-group">
                <label class="input-label">رمز عبور</label>
                <div class="password-input-wrapper">
                    <input 
                        type="${this.state.showPassword ? 'text' : 'password'}" 
                        class="input password-input" 
                        placeholder="رمز عبور خود را وارد کنید"
                        value="${this.state.password}"
                        onchange="Auth.state.password = this.value"
                        oninput="Auth.state.password = this.value"
                    >
                    <button type="button" class="password-toggle" onclick="Auth.togglePassword()">
                        ${this.state.showPassword ? '🙈' : '👁️'}
                    </button>
                </div>
            </div>
            <button 
                class="btn btn-primary ${this.state.loading ? 'disabled' : ''}"
                onclick="Auth.loginWithPassword()"
                ${this.state.loading ? 'disabled' : ''}
            >
                ${this.state.loading ? '⏳ در حال ورود...' : '🔓 ورود'}
            </button>
            <button class="btn btn-secondary mt-12" onclick="Auth.switchToCode()">
                ورود با کد تایید
            </button>
        `;
    },

    handleCodeInput(input) {
        this.state.code = input.value.replace(/\D/g, '');
        input.value = this.state.code;
        
        if (this.state.code.length === 5) {
            this.verifyCode();
        }
    },

    handleOTPInput(index, input) {
        const value = input.value.replace(/\D/g, '').slice(0, 1);
        input.value = value;
        
        let code = '';
        for (let i = 0; i < 5; i++) {
            const otpInput = document.getElementById(`otp-${i}`);
            if (otpInput) {
                code += otpInput.value || '';
            }
        }
        this.state.code = code;
        
        if (value && index < 4) {
            const nextInput = document.getElementById(`otp-${index + 1}`);
            if (nextInput) nextInput.focus();
        }
        
        if (this.state.code.length === 5) {
            this.verifyCode();
        }
    },

    handleOTPKeydown(index, event) {
        if (event.key === 'Backspace' && !event.target.value && index > 0) {
            const prevInput = document.getElementById(`otp-${index - 1}`);
            if (prevInput) {
                prevInput.focus();
                prevInput.value = '';
                let code = '';
                for (let i = 0; i < 5; i++) {
                    const otpInput = document.getElementById(`otp-${i}`);
                    if (otpInput) {
                        code += otpInput.value || '';
                    }
                }
                this.state.code = code;
            }
        }
    },

    handleOTPPaste(event) {
        event.preventDefault();
        const pastedData = (event.clipboardData || window.clipboardData).getData('text');
        const digits = pastedData.replace(/\D/g, '').slice(0, 5);
        
        this.state.code = digits;
        
        for (let i = 0; i < 5; i++) {
            const input = document.getElementById(`otp-${i}`);
            if (input) {
                input.value = digits[i] || '';
            }
        }
        
        if (digits.length === 5) {
            this.verifyCode();
        } else if (digits.length > 0) {
            const nextInput = document.getElementById(`otp-${digits.length}`);
            if (nextInput) nextInput.focus();
        }
    },

    togglePassword() {
        this.state.showPassword = !this.state.showPassword;
        App.render();
    },

    async sendCode() {
        if (!Utils.validateTelegramId(this.state.telegramId)) {
            Toast.show('شناسه تلگرام نامعتبر است', 'error');
            return;
        }

        this.state.loading = true;
        App.render();

        try {
            const result = await API.sendVerificationCode(this.state.telegramId);
            
            if (result.hasPassword) {
                this.state.hasPassword = true;
                this.state.step = 'login';
                Toast.show('شما قبلاً رمز عبور تنظیم کرده‌اید', 'info');
            } else {
                this.state.step = 'code';
                if (result.devMode && result.devCode) {
                    this.state.code = result.devCode;
                    Toast.show(`حالت توسعه: کد ${result.devCode}`, 'warning');
                } else {
                    Toast.show('کد تایید به تلگرام ارسال شد', 'success');
                }
            }
        } catch (error) {
            Toast.show(error.message, 'error');
        } finally {
            this.state.loading = false;
            App.render();
        }
    },

    async verifyCode() {
        if (!Utils.validateCode(this.state.code)) {
            Toast.show('کد تایید باید ۵ رقم باشد', 'error');
            return;
        }

        this.state.loading = true;
        App.render();

        try {
            const result = await API.verifyCode(this.state.telegramId, this.state.code);
            
            Storage.setToken(result.token);
            Storage.setUser(result.user);

            if (result.isNewUser) {
                this.state.step = 'password';
                Toast.show('خوش آمدید! حساب شما ایجاد شد', 'success');
            } else {
                App.navigate('dashboard');
                Toast.show('با موفقیت وارد شدید', 'success');
            }
        } catch (error) {
            Toast.show(error.message, 'error');
        } finally {
            this.state.loading = false;
            App.render();
        }
    },

    async setPassword() {
        if (!Utils.validatePassword(this.state.password)) {
            Toast.show('رمز عبور باید حداقل ۴ کاراکتر باشد', 'error');
            return;
        }

        this.state.loading = true;
        App.render();

        try {
            await API.setPassword(this.state.password);
            Toast.show('رمز عبور ذخیره شد', 'success');
            App.navigate('dashboard');
        } catch (error) {
            Toast.show(error.message, 'error');
        } finally {
            this.state.loading = false;
            App.render();
        }
    },

    skipPassword() {
        App.navigate('dashboard');
    },

    async loginWithPassword() {
        if (!Utils.validateTelegramId(this.state.telegramId)) {
            Toast.show('شناسه تلگرام نامعتبر است', 'error');
            return;
        }

        if (!this.state.password) {
            Toast.show('رمز عبور را وارد کنید', 'error');
            return;
        }

        this.state.loading = true;
        App.render();

        try {
            const result = await API.loginWithPassword(this.state.telegramId, this.state.password);
            
            Storage.setToken(result.token);
            Storage.setUser(result.user);
            
            App.navigate('dashboard');
            Toast.show('با موفقیت وارد شدید', 'success');
        } catch (error) {
            Toast.show(error.message, 'error');
        } finally {
            this.state.loading = false;
            App.render();
        }
    },

    switchToCode() {
        this.state.step = 'phone';
        this.state.password = '';
        App.render();
    },

    goBack() {
        this.state.step = 'phone';
        this.state.code = '';
        App.render();
    },

    reset() {
        this.state = {
            step: 'phone',
            telegramId: '',
            code: '',
            password: '',
            hasPassword: false,
            loading: false
        };
    }
};
