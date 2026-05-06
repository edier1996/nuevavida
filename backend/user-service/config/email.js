const https = require('https');
const dotenv = require('dotenv');

dotenv.config();

const brevoApiKey = process.env.BREVO_API_KEY;
const smtpFrom = process.env.SMTP_FROM || 'no-reply@nuevavida1327.com';
const senderName = process.env.SENDER_NAME || 'Nueva Vida';

const sendEmailViaBrevoAPI = async (to, subject, htmlContent) => {
  if (!brevoApiKey) {
    throw new Error('BREVO_API_KEY is not configured');
  }

  const payload = {
    to: [{ email: to }],
    sender: { name: senderName, email: smtpFrom },
    subject: subject,
    htmlContent: htmlContent,
  };

  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.brevo.com',
      port: 443,
      path: '/v3/smtp/email',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': brevoApiKey,
      },
      timeout: 10000,
    };

    const req = https.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve({ ok: true, messageId: res.headers['x-message-id'] });
        } else {
          reject(new Error(`Brevo API error: ${res.statusCode} - ${data}`));
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Brevo API request timeout'));
    });

    req.write(JSON.stringify(payload));
    req.end();
  });
};

const sendPasswordResetEmail = async (email, resetToken, resetLink) => {
  const htmlContent = `
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

  return sendEmailViaBrevoAPI(email, 'Recuperar contraseña - Nueva Vida', htmlContent);
};

const sendVerificationEmail = async (email, verificationCode, verificationLink) => {
  const verificationLinkHtml = verificationLink
    ? `
      <p>También puedes verificar tu cuenta con un solo clic:</p>
      <a href="${verificationLink}" style="background-color: #16a34a; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">
        Verificar mi correo
      </a>
      <p>Si el botón no funciona, copia y pega este enlace:</p>
      <p>${verificationLink}</p>
    `
    : '';

  const htmlContent = `
    <h2>Bienvenido a Nueva Vida</h2>
    <p>Tu código de verificación es:</p>
    <h1 style="color: #007bff; font-size: 32px; letter-spacing: 5px;">${verificationCode}</h1>
    ${verificationLinkHtml}
    <p>Este código expira en 15 minutos.</p>
    <p>Si no creaste esta cuenta, ignora este correo.</p>
  `;

  return sendEmailViaBrevoAPI(email, 'Verifica tu email - Nueva Vida', htmlContent);
};

module.exports = {
  sendPasswordResetEmail,
  sendVerificationEmail,
};
