const axios = require('axios');
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
    const response = await axios.post(url, payload);
    if (!response.data.ok) {
      throw new Error(`Telegram API error: ${response.data.description}`);
    }
    console.log('Telegram alert sent successfully');
    return response.data;
  } catch (error) {
    console.error('Failed to send telegram alert:', error);
    throw error;
  }
}

module.exports = {
  sendTelegramAlert,
};
