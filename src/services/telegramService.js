const fetch = require('node-fetch');
require('dotenv').config();

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

if (!TELEGRAM_BOT_TOKEN) {
  console.warn('Telegram bot token is not set in environment variables');
}

const sendTelegramAlert = async(chatId, message) => {
  if (!chatId) {
    throw new Error('Chat ID is required for Telegram alert');
  }

  const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
  const payload = {
    chat_id: chatId,
    text: message,
  };

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify(payload),
    });

    const data = await response.json();
    if (!data.ok) {
      throw new Error(`Telegram API error: ${data.description}`);
    }
    console.log('Telegram alert sent successfully');
    return data;
  } catch (error) {
    console.error('Failed to send telegram alert:', error);
    throw error;
  }
}

module.exports = {
  sendTelegramAlert,
};
