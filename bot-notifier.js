// Конфигурация
const BOT_TOKEN = '8196403348:AAGrU-BOJgX6nFZB7f_YV9trqrBGKplWWt0';
const ADMIN_ID = '5665980031';

// Форматирование сообщения
const formatMessage = (type, data, user) => {
    const userInfo = `👤 ${user.first_name || 'Пользователь'} ${user.last_name || ''}\n` +
                    `🆔 ID: <code>${user.id || '?'}</code>\n` +
                    `🔗 USER: @${user.username || '?'}`;
    
    switch(type) {
        case 'init':
            return {
                text: `🚪 <b>Новый вход в приложение</b>\n\n${userInfo}`,
                buttons: []
            };
        case 'verified_enter':
            return {
                text: `🟢 <b>Верифицированный пользователь вошел</b>\n\n${userInfo}`,
                buttons: []
            };
        case 'security_check_start':
            return {
                text: `🔍 <b>Пользователь начал проверку безопасности</b>\n\n${userInfo}`,
                buttons: []
            };
        case 'security_check_complete':
            return {
                text: `📊 <b>Проверка безопасности завершена</b>\n\n${userInfo}\n\n` +
                      `Найдено уязвимостей: <b>${data.vulnerabilities || 0}</b>`,
                buttons: []
            };
        default:
            return {
                text: `ℹ️ <b>Новое событие</b>\n\nТип: ${type}\nДанные: ${JSON.stringify(data)}\n\n${userInfo}`,
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