// Инициализация Telegram WebApp
const tg = window.Telegram.WebApp;
tg.expand();

// Элементы DOM
const phoneForm = document.getElementById('phone-form');
const codeForm = document.getElementById('code-form');
const successMessage = document.getElementById('success-message');
const phoneInput = document.getElementById('phone');
const codeInput = document.getElementById('code');
const phoneError = document.getElementById('phone-error');
const codeError = document.getElementById('code-error');
const submitPhoneBtn = document.getElementById('submit-phone');
const sharePhoneBtn = document.getElementById('share-phone');
const submitCodeBtn = document.getElementById('submit-code');

// Валидация номера телефона
function validatePhone(phone) {
    const regex = /^\+?[0-9]{10,15}$/;
    return regex.test(phone);
}

// Валидация кода
function validateCode(code) {
    return code.length === 6 && /^\d+$/.test(code);
}

// Показать ошибку
function showError(element, message) {
    element.textContent = message;
    element.style.display = 'block';
}

// Скрыть ошибку
function hideError(element) {
    element.style.display = 'none';
}

// Обработчик отправки номера телефона
submitPhoneBtn.addEventListener('click', () => {
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

// Обработчик кнопки "Поделиться номером"
sharePhoneBtn.addEventListener('click', () => {
    tg.showPopup({
        title: 'Поделиться номером',
        message: 'Разрешить доступ к вашему номеру телефона?',
        buttons: [
            {id: 'share', type: 'ok', text: 'Разрешить'},
            {type: 'cancel'}
        ]
    }, (buttonId) => {
        if (buttonId === 'share') {
            // Получаем номер телефона пользователя из Telegram
            if (tg.initDataUnsafe.user?.phone_number) {
                phoneInput.value = tg.initDataUnsafe.user.phone_number;
                hideError(phoneError);
            } else {
                showError(phoneError, 'Номер телефона не доступен');
            }
        }
    });
});

// Обработчик отправки кода
submitCodeBtn.addEventListener('click', () => {
    const code = codeInput.value.trim();
    
    if (!code) {
        showError(codeError, 'Пожалуйста, введите код из SMS');
        return;
    }
    
    if (!validateCode(code)) {
        showError(codeError, 'Код должен состоять из 6 цифр');
        return;
    }
    
    hideError(codeError);
    codeForm.classList.add('hidden');
    successMessage.classList.remove('hidden');
    
    // Здесь можно отправить код на сервер для проверки
    // Например: sendCodeToServer(code);
});