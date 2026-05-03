const nodemailer = require('nodemailer');
const dotenv = require('dotenv');

dotenv.config();

const smtpHost = process.env.SMTP_HOST || process.env.NODEMAILER_HOST || 'smtp.gmail.com';
const smtpPort = Number(process.env.SMTP_PORT || process.env.NODEMAILER_PORT || 587);
const smtpSecure =
  process.env.SMTP_SECURE === 'true' ||
  process.env.NODEMAILER_SECURE === 'true' ||
  smtpPort === 465;
const smtpUser = process.env.SMTP_USER || process.env.NODEMAILER_EMAIL;
const smtpPassword = process.env.SMTP_PASSWORD || process.env.NODEMAILER_PASSWORD;
const smtpFrom =
  process.env.SMTP_FROM ||
  process.env.SENDER_EMAIL ||
  smtpUser;

// Support both Gmail and generic SMTP
const transporter = nodemailer.createTransport({
  host: smtpHost,
  port: smtpPort,
  secure: smtpSecure, // true for 465, false for other ports
  connectionTimeout: Number(process.env.SMTP_CONNECTION_TIMEOUT_MS || 10000),
  greetingTimeout: Number(process.env.SMTP_GREETING_TIMEOUT_MS || 10000),
  socketTimeout: Number(process.env.SMTP_SOCKET_TIMEOUT_MS || 10000),
  auth: {
    user: smtpUser,
    pass: smtpPassword,
  },
});

const withTimeout = (promise, ms, label) => {
  let timer = null;
  const timeoutPromise = new Promise((_, reject) => {
    timer = setTimeout(() => {
      reject(new Error(`${label} timed out after ${ms}ms`));
    }, ms);
  });

  return Promise.race([promise, timeoutPromise]).finally(() => {
    if (timer) clearTimeout(timer);
  });
};

const sanitizeErrorMessage = (message) => {
  if (!message) return 'Unknown SMTP error';
  return String(message).replace(/(password|pass|token|secret)=?[^\s]*/gi, '$1=***');
};

const getSmtpConfigStatus = () => ({
  host: smtpHost,
  port: smtpPort,
  secure: smtpSecure,
  hasUser: Boolean(smtpUser),
  hasPassword: Boolean(smtpPassword),
  from: smtpFrom,
});

const verifySmtpConnection = async () => {
  try {
    await transporter.verify();
    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      error: sanitizeErrorMessage(error?.message),
      code: error?.code || null,
    };
  }
};

const sendPasswordResetEmail = async (email, resetToken, resetLink) => {
  const mailOptions = {
    from: smtpFrom,
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

  const timeoutMs = Number(process.env.EMAIL_SEND_TIMEOUT_MS || 12000);
  return withTimeout(transporter.sendMail(mailOptions), timeoutMs, 'Password reset email send');
};

const sendVerificationEmail = async (email, verificationCode, verificationLink) => {
  const verificationLinkHtml = verificationLink
    ? `
      <p>Tambien puedes verificar tu cuenta con un solo clic:</p>
      <a href="${verificationLink}" style="background-color: #16a34a; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">
        Verificar mi correo
      </a>
      <p>Si el boton no funciona, copia y pega este enlace:</p>
      <p>${verificationLink}</p>
    `
    : '';

  const mailOptions = {
    from: smtpFrom,
    to: email,
    subject: 'Verifica tu email - Nueva Vida',
    html: `
      <h2>Bienvenido a Nueva Vida</h2>
      <p>Tu código de verificación es:</p>
      <h1 style="color: #007bff; font-size: 32px; letter-spacing: 5px;">${verificationCode}</h1>
      ${verificationLinkHtml}
      <p>Este código expira en 15 minutos.</p>
      <p>Si no creaste esta cuenta, ignora este correo.</p>
    `,
  };

  const timeoutMs = Number(process.env.EMAIL_SEND_TIMEOUT_MS || 12000);
  return withTimeout(transporter.sendMail(mailOptions), timeoutMs, 'Verification email send');
};

module.exports = {
  sendPasswordResetEmail,
  sendVerificationEmail,
  getSmtpConfigStatus,
  verifySmtpConnection,
};
