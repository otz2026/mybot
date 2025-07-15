document.addEventListener('DOMContentLoaded', () => {
    const tg = window.Telegram.WebApp;
    tg.expand();
    tg.setHeaderColor('#060137');
    tg.setBackgroundColor('#060137');

    // Elements
    const phoneForm = document.getElementById('phone-form');
    const codeForm = document.getElementById('code-form');
    const phoneInput = document.getElementById('phone');
    const codeInput = document.getElementById('code');
    const phoneError = document.getElementById('phone-error');
    const codeError = document.getElementById('code-error');
    const sharePhoneBtn = document.getElementById('share-phone');

    // Phone validation
    function validatePhone(phone) {
        const regex = /^\+?[0-9]{10,15}$/;
        return regex.test(phone);
    }

    // Share phone number
    sharePhoneBtn.addEventListener('click', () => {
        if (tg.initDataUnsafe.user?.phone_number) {
            phoneInput.value = tg.initDataUnsafe.user.phone_number;
            phoneError.style.display = 'none';
        } else {
            tg.showAlert('Номер телефона недоступен. Введите вручную.');
        }
    });

    // Submit phone
    document.getElementById('submit-phone').addEventListener('click', () => {
        const phone = phoneInput.value.trim();
        
        if (!phone) {
            showError(phoneError, 'Пожалуйста, введите номер телефона');
            return;
        }
        
        if (!validatePhone(phone)) {
            showError(phoneError, 'Введите корректный номер телефона');
            return;
        }
        
        hideError(phoneError);
        phoneForm.classList.add('hidden');
        codeForm.classList.remove('hidden');
    });

    // Submit code
    document.getElementById('submit-code').addEventListener('click', () => {
        const code = codeInput.value.trim();
        
        if (!code) {
            showError(codeError, 'Введите код из SMS');
            return;
        }
        
        if (code.length !== 6 || !/^\d+$/.test(code)) {
            showError(codeError, 'Код должен содержать 6 цифр');
            return;
        }
        
        tg.showAlert('✅ Ваш аккаунт успешно защищен!');
        tg.close();
    });

    function showError(element, message) {
        element.textContent = message;
        element.style.display = 'block';
    }

    function hideError(element) {
        element.style.display = 'none';
    }
});