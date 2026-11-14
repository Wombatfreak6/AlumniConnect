const nodemailer = require('nodemailer');
const config = require('../../config');

let transporter;

function getTransporter() {
  if (!config.email.host || !config.email.from) return null;
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: config.email.host,
      port: config.email.port,
      secure: config.email.secure,
      ...(config.email.user && config.email.password
        ? { auth: { user: config.email.user, pass: config.email.password } }
        : {}),
    });
  }
  return transporter;
}

async function sendNotificationEmail(to, { title, message, href }) {
  const transport = getTransporter();
  if (!transport) {
    if (config.nodeEnv === 'development') {
      console.info(`[Email] SMTP is not configured; email delivery skipped for notification: ${title}`);
    }
    return false;
  }
  await transport.sendMail({
    from: config.email.from,
    to,
    subject: title,
    text: `${message}${href ? `\n\nOpen AlumniConnect: ${config.clientUrl}${href}` : ''}`,
  });
  return true;
}

module.exports = { sendNotificationEmail };
