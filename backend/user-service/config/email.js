const nodemailer = require('nodemailer');
const dotenv = require('dotenv');

dotenv.config();

// Support both Gmail and generic SMTP
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: process.env.SMTP_PORT || 587,
  secure: process.env.SMTP_SECURE === 'true' || false, // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
});

const sendPasswordResetEmail = async (email, resetToken, resetLink) => {
  const mailOptions = {
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to: email,
    subject: 'Recuperar contraseña - Nueva Vida',
    html: `
      <h2>Recuperar contraseña</h2>
      <p>Haz clic en el siguiente enlace para recuperar tu contraseña:</p>
      <a href="${resetLink}" style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">
        Recuperar contraseña
      </a>
      <p>O copia y pega este enlace en tu navegador:</p>
      <p>${resetLink}</p>
      <p>Este enlace expira en 1 hora.</p>
      <p>Si no solicitaste recuperar tu contraseña, ignora este correo.</p>
    `,
  };

  return transporter.sendMail(mailOptions);
};

const sendVerificationEmail = async (email, verificationCode) => {
  const mailOptions = {
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to: email,
    subject: 'Verifica tu email - Nueva Vida',
    html: `
      <h2>Bienvenido a Nueva Vida</h2>
      <p>Tu código de verificación es:</p>
      <h1 style="color: #007bff; font-size: 32px; letter-spacing: 5px;">${verificationCode}</h1>
      <p>Este código expira en 15 minutos.</p>
      <p>Si no creaste esta cuenta, ignora este correo.</p>
    `,
  };

  return transporter.sendMail(mailOptions);
};

module.exports = { sendPasswordResetEmail, sendVerificationEmail };
