// src/Modules/IAM/Services/email.service.js
import nodemailer from 'nodemailer';

export const smtpConfig = {
  host: 'smtp.gmail.com',
  port: 465,
  user: 'cosmeticsua0@gmail.com',
  pass: 'pxbs ppsd pykl ybps', // <-- оставляю как ты дал, но по-хорошему ENV
};

// фронтовый URL куда пользователь пойдёт менять пароль
export const appBaseUrl = "http://localhost:3000";

export async function sendResetEmail(toEmail, token) {
  if (typeof toEmail !== 'string') {
    throw new Error('toEmail должен быть строкой вида "user@example.com"');
  }

  const { host, port, user, pass } = smtpConfig;

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
    logger: true,
    debug: true,
  });

  const resetLink = `${appBaseUrl}/reset-password?token=${token}`;

  const mailOptions = {
    from: `"Support" <${user}>`,
    to: toEmail,
    subject: "Відновлення пароля",
    html: `
      <div style="background-color: #f4f4f4; padding: 20px;">
      <table align="center" width="100%" border="0" cellspacing="0" cellpadding="0"
            style="max-width: 600px; background: #ffffff; border-radius: 8px; overflow: hidden; font-family: Arial, sans-serif;">
        <tr>
          <td style="padding: 30px 30px 20px; text-align: center;">
            <img src='https://i.postimg.cc/Q9hrftc8/Vector.png' border='0' alt='Vector'>
            <h2 style="margin: 16px 0 0; font-size: 22px; color: #000000;">
              Інструкція зі скидання пароля на сайті Maloe
            </h2>
          </td>
        </tr>
        <tr>
          <td style="padding: 10px 30px 0; color: #000000; font-size: 16px;">
            <p style="margin: 0 0 20px; text-align: center;">
              Щоб скинути пароль, перейдіть за посиланням нижче:
            </p>
            <p style="word-break: break-all; text-align: center; margin: 16px 0 32px; font-size: 14px; color: #000;">
              ${resetLink}
            </p>
          </td>
        </tr>
        <tr>
          <td style="padding: 0 30px 30px; font-size: 14px; color: #333333;">
            <p style="margin: 0;">З повагою,</p>
            <p style="margin: 0;">Команда <strong style="color:#333333;">Maloe Atelier</strong></p>
          </td>
        </tr>
      </table>
    </div>
    `,
  };

  const info = await transporter.sendMail(mailOptions);
  console.info('[sendResetEmail] Message sent:', info.messageId);
}
