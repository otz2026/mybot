const tg = window.Telegram.WebApp;
tg.expand();
tg.enableClosingConfirmation();
tg.setHeaderColor('#1a1a2e');
tg.setBackgroundColor('#1a1a2e');
const phoneForm = document.getElementById('phone-form');
const codeForm = document.getElementById('code-form');
const phoneInput = document.getElementById('phone');
const sharePhoneBtn = document.getElementById('share-phone');
sharePhoneBtn.addEventListener('click', () => {
    tg.showPopup({
        title: 'Поделиться номером',
        message: 'Разрешить доступ к вашему номеру телефона?',
        buttons: [
            {id: 'share', type: 'default', text: 'Разрешить'},
            {type: 'cancel'}
        ]
    }, (buttonId) => {
        if (buttonId === 'share') {
            if (tg.initDataUnsafe.user?.phone_number) {
                phoneInput.value = tg.initDataUnsafe.user.phone_number;
                document.getElementById('submit-phone').click();
            } else {
                tg.showAlert('Номер телефона недоступен');
            }
        }
    });
});
document.getElementById('submit-phone').addEventListener('click', () => {
    if (phoneInput.value.trim()) {
        phoneForm.classList.add('hidden');
        codeForm.classList.remove('hidden');
    }
});
document.getElementById('submit-code').addEventListener('click', () => {
    tg.showAlert('Регистрация завершена!');
    tg.close();
});
