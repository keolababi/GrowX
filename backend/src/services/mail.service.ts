import nodemailer from 'nodemailer';
import { env } from '../config/env.js';

const transporter = nodemailer.createTransport({
  host: env.SMTP_HOST,
  port: env.SMTP_PORT,
  secure: env.SMTP_PORT === 465,
  auth: {
    user: env.SMTP_USER,
    pass: env.SMTP_PASSWORD,
  },
});

export async function sendPasswordResetCode(to: string, code: string): Promise<void> {
  await transporter.sendMail({
    from: env.MAIL_FROM ?? `GrowX <${env.SMTP_USER}>`,
    to,
    subject: 'GrowX нууц үг сэргээх код',
    text: `Таны GrowX нууц үг сэргээх код: ${code}\n\nКод 10 минутын хугацаанд хүчинтэй. Хэрэв та энэ хүсэлтийг гаргаагүй бол уг имэйлийг үл тооно уу.`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:520px;margin:auto;color:#172023">
        <h2>GrowX нууц үг сэргээх</h2>
        <p>Таны 6 оронтой баталгаажуулах код:</p>
        <p style="font-size:32px;font-weight:700;letter-spacing:8px;color:#65a30d">${code}</p>
        <p>Код 10 минутын хугацаанд хүчинтэй.</p>
        <p style="color:#64748b;font-size:13px">Хэрэв та энэ хүсэлтийг гаргаагүй бол уг имэйлийг үл тооно уу.</p>
      </div>
    `,
  });
}
