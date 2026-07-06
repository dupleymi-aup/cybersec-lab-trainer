import nodemailer from 'nodemailer';
import { logger } from '@/lib/logger';

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}

function getTransporter() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_PORT === '465',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

function formatDate(date: Date): string {
  return date.toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function renderDeadlineEmail(fullName: string, deadlineTitle: string, dueAt: Date, isOverdue: boolean): string {
  const subject = isOverdue ? 'Просрочен дедлайн' : 'Напоминание о дедлайне';

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 20px; background: #f8fafc; }
        .container { max-width: 500px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
        .header { background: ${isOverdue ? '#ef4444' : '#f59e0b'}; padding: 24px; text-align: center; color: white; }
        .header h1 { margin: 0; font-size: 20px; }
        .content { padding: 24px; }
        .content p { margin: 0 0 12px; color: #334155; line-height: 1.6; }
        .deadline-info { background: #f1f5f9; padding: 16px; border-radius: 8px; margin: 16px 0; }
        .deadline-info strong { color: #0f172a; }
        .cta { display: inline-block; background: #10b981; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; margin-top: 16px; }
        .footer { padding: 16px 24px; background: #f8fafc; text-align: center; color: #94a3b8; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>${subject}</h1>
        </div>
        <div class="content">
          <p>Здравствуйте, <strong>${escapeHtml(fullName)}</strong>!</p>
          ${
            isOverdue
              ? `<p>К сожалению, срок выполнения дедлайна истёк.</p>`
              : `<p>Напоминаем о предстоящем дедлайне.</p>`
          }
          <div class="deadline-info">
            <p><strong>${escapeHtml(deadlineTitle)}</strong></p>
            <p>Срок: ${formatDate(dueAt)}</p>
          </div>
          <p>Пожалуйста, завершите задание как можно скорее.</p>
          <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}" class="cta">Перейти к обучению</a>
        </div>
        <div class="footer">
          CyberSec Lab Trainer — автоматическое уведомление
        </div>
      </div>
    </body>
    </html>
  `;
}

export async function sendOTPRecoveryEmail(to: string, fullName: string, otp: string): Promise<boolean> {
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
    return false;
  }

  const subject = 'CyberSec Lab — Код восстановления пароля';
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 20px; background: #f8fafc; }
        .container { max-width: 500px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
        .header { background: #6366f1; padding: 24px; text-align: center; color: white; }
        .header h1 { margin: 0; font-size: 20px; }
        .content { padding: 24px; }
        .content p { margin: 0 0 12px; color: #334155; line-height: 1.6; }
        .otp-code { background: #f1f5f9; padding: 20px; border-radius: 8px; margin: 16px 0; text-align: center; font-size: 28px; font-weight: bold; letter-spacing: 4px; color: #0f172a; }
        .warning { background: #fef3c7; padding: 12px; border-radius: 8px; margin: 16px 0; color: #92400e; font-size: 14px; }
        .footer { padding: 16px 24px; background: #f8fafc; text-align: center; color: #94a3b8; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Восстановление пароля</h1>
        </div>
        <div class="content">
          <p>Здравствуйте, <strong>${escapeHtml(fullName)}</strong>!</p>
          <p>Вы запросили восстановление пароля. Используйте следующий код:</p>
          <div class="otp-code">${otp}</div>
          <p>Код действителен в течение 10 минут.</p>
          <div class="warning">
            Если вы не запрашивали восстановление пароля, проигнорируйте это письмо.
          </div>
        </div>
        <div class="footer">
          CyberSec Lab Trainer — автоматическое уведомление
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    const transporter = getTransporter();
    await transporter.sendMail({
      from: process.env.SMTP_FROM || 'noreply@cyberseclab.com',
      to,
      subject,
      html,
    });
    return true;
  } catch (e) {
logger.warn('sendOTPRecoveryEmail failed', { error: e });
    return false;
  }
}

export async function sendDeadlineReminderEmail(
  to: string,
  fullName: string,
  deadlineTitle: string,
  dueAt: Date,
  isOverdue: boolean,
): Promise<boolean> {
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
    return false; // email not configured
  }

  const subject = isOverdue
    ? `Просрочен дедлайн: ${deadlineTitle}`
    : `Напоминание: ${deadlineTitle} — ${formatDate(dueAt)}`;

  try {
    const transporter = getTransporter();
    await transporter.sendMail({
      from: process.env.SMTP_FROM || 'noreply@cyberseclab.com',
      to,
      subject,
      html: renderDeadlineEmail(fullName, deadlineTitle, dueAt, isOverdue),
    });
    return true;
  } catch (e) {
logger.warn('sendDeadlineReminderEmail failed', { error: e });
    return false;
  }
}
