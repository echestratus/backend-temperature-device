const twilio = require('twilio');
require('dotenv').config();

const accountSid = process.env.TWILIO_SID;
const authToken = process.env.TWILIO_AUTH;
const client = new twilio(accountSid, authToken);

const sendWhatsAppAlert = async(toNumber, message) => {
  try {
    const messageInstance = await client.messages.create({
      from: 'whatsapp:+14155238886', // Twilio Sandbox WhatsApp number
      to: `whatsapp:${toNumber}`, // Your verified WhatsApp number
      body: message,
    });
    console.log('WhatsApp alert sent:', messageInstance.sid);
  } catch (error) {
    console.error('Error sending WhatsApp alert:', error);
  }
}

module.exports = {
    sendWhatsAppAlert
}