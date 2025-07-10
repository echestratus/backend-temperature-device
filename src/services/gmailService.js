const nodemailer = require('nodemailer');
require('dotenv').config();

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER, // Your Gmail address
    pass: process.env.GMAIL_APP_PASSWORD, // Your Gmail app password (recommended) or normal password (less secure)
  },
});

const sendEmailAlert = async (toEmail, subject, text) => {
  try {
    const mailOptions = {
      from: process.env.GMAIL_USER,
      to: toEmail,
      subject: subject,
      text: text,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Email alert sent:', info.response);
  } catch (error) {
    console.error('Error sending email alert:', error.message);
  }
};

module.exports = {
  sendEmailAlert,
};
