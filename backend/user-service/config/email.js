const https = require('https');
const dotenv = require('dotenv');

dotenv.config();

// --- Brevo HTTP API (primary — uses port 443, never blocked) ---
const brevoApiKey = process.env.BREVO_API_KEY || '';
const useBrevoApi = Boolean(brevoApiKey);

const senderEmail =
  process.env.SMTP_FROM ||
  process.env.SENDER_EMAIL ||
  process.env.BREVO_FROM_EMAIL ||
  'no-reply@nuevavida1327.com';

const senderName = process.env.SENDER_NAME || 'Nueva Vida';

// --- Fallback: nodemailer SMTP ---
let transporter = null;
let useSMTP = false;
if (!useBrevoApi) {
  const nodemailer = require('nodemailer');
  const smtpHost = process.env.SMTP_HOST || process.env.NODEMAILER_HOST || '';
  const smtpPort = Number(process.env.SMTP_PORT || process.env.NODEMAILER_PORT || 587);
  const smtpSecure = process.env.SMTP_SECURE === 'true' || smtpPort === 465;
  const smtpUser = process.env.SMTP_USER || process.env.NODEMAILER_EMAIL || '';
  const smtpPassword = process.env.SMTP_PASSWORD || process.env.NODEMAILER_PASSWORD || '';
  if (smtpHost && smtpUser && smtpPassword) {
    transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpSecure,
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 10000,
      auth: { user: smtpUser, pass: smtpPassword },
    });
    useSMTP = true;
  }
}

const sanitizeErrorMessage = (message) => {
  if (!message) return 'Unknown email error';
  return String(message).replace(/(password|pass|token|secret|api.key)=?[^\s]*/gi, '$1=***');
};

const withTimeout = (promise, ms, label) => {
  let timer = null;
  const timeoutPromise = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms);
  });
  return Promise.race([promise, timeoutPromise]).finally(() => {
    if (timer) clearTimeout(timer);
  });
};

const sendViaBrevoApi = ({ to, subject, html }) =>
  new Promise((resolve, reject) => {
    const payload = JSON.stringify({
      sender: { name: senderName, email: senderEmail },
      to: [{ email: to }],
      subject,
      htmlContent: html,
    });

    const options = {
      hostname: 'api.brevo.com',
      path: '/v3/smtp/email',
      method: 'POST',
      headers: {
        'api-key': brevoApiKey,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload),
      },
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve({ messageId: JSON.parse(data || '{}').messageId });
        } else {
          reject(new Error(`Brevo API error ${res.statusCode}: ${data}`));
        }
      });
    });

    req.on('error', reject);
    req.write(payload);
    req.end();
  });

const sendEmail = async ({ to, subject, html }, label) => {
  const timeoutMs = Number(process.env.EMAIL_SEND_TIMEOUT_MS || 15000);

  if (useBrevoApi) {
    return withTimeout(sendViaBrevoApi({ to, subject, html }), timeoutMs, label || 'Brevo API send');
  }

  if (useSMTP) {
    return withTimeout(
      transporter.sendMail({ from: senderEmail, to, subject, html }),
      timeoutMs,
      label || 'SMTP send'
    );
  }

  throw new Error('No email provider configured. Set BREVO_API_KEY or SMTP_* variables.');
};

const getSmtpConfigStatus = () => ({
  provider: useBrevoApi ? 'brevo-api' : useSMTP ? 'smtp' : 'none',
  hasBrevoApiKey: Boolean(brevoApiKey),
  from: senderEmail,
  senderName,
});

const verifySmtpConnection = async () => {
  if (useBrevoApi) {
    // Quick connectivity check against Brevo API
    return new Promise((resolve) => {
      const req = https.request(
        { hostname: 'api.brevo.com', path: '/v3/account', method: 'GET',
          headers: { 'api-key': brevoApiKey } },
        (res) => {
          resolve({ ok: res.statusCode === 200, statusCode: res.statusCode });
          res.resume();
        }
      );
      req.on('error', (err) => resolve({ ok: false, error: sanitizeErrorMessage(err.message) }));
      req.end();
    });
  }

  if (useSMTP && transporter) {
    try {
      await transporter.verify();
      return { ok: true };
    } catch (error) {
      return { ok: false, error: sanitizeErrorMessage(error?.message) };
    }
  }

  return { ok: false, error: 'No email provider configured' };
};

const sendPasswordResetEmail = async (email, resetToken, resetLink) => {
  const html = `
      <h2>Recuperar contraseña</h2>
      <p>Haz clic en el siguiente enlace para recuperar tu contraseña:</p>
      <a href="${resetLink}" style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">
        Recuperar contraseña
      </a>
      <p>O copia y pega este enlace en tu navegador:</p>
      <p>${resetLink}</p>
      <p>Este enlace expira en 1 hora.</p>
      <p>Si no solicitaste recuperar tu contraseña, ignora este correo.</p>
    `;

  return sendEmail(
    {
      to: email,
      subject: 'Recuperar contraseña - Nueva Vida',
      html,
    },
    'Password reset email send'
  );
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

  const html = `
      <h2>Bienvenido a Nueva Vida</h2>
      <p>Tu código de verificación es:</p>
      <h1 style="color: #007bff; font-size: 32px; letter-spacing: 5px;">${verificationCode}</h1>
      ${verificationLinkHtml}
      <p>Este código expira en 15 minutos.</p>
      <p>Si no creaste esta cuenta, ignora este correo.</p>
    `;

  return sendEmail(
    {
      to: email,
      subject: 'Verifica tu email - Nueva Vida',
      html,
    },
    'Verification email send'
  );
};

module.exports = {
  sendPasswordResetEmail,
  sendVerificationEmail,
  getSmtpConfigStatus,
  verifySmtpConnection,
};
