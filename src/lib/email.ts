import nodemailer from 'nodemailer';
import { logger } from '@/lib/logger';
import { DEFAULT_APP_URL } from '@/lib/constants';

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

function formatDate(date: Date, locale = 'en-US'): string {
  return date.toLocaleDateString(locale, {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function renderDeadlineEmail(
  fullName: string,
  deadlineTitle: string,
  dueAt: Date,
  isOverdue: boolean,
  locale = 'en-US',
): string {
  const subject = isOverdue ? 'Deadline Overdue' : 'Deadline Reminder';

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
          <p>Hello, <strong>${escapeHtml(fullName)}</strong>!</p>
          ${
            isOverdue
              ? `<p>Unfortunately, the deadline has passed.</p>`
              : `<p>This is a reminder about an upcoming deadline.</p>`
          }
          <div class="deadline-info">
            <p><strong>${escapeHtml(deadlineTitle)}</strong></p>
            <p>Due: ${formatDate(dueAt, locale)}</p>
          </div>
          <p>Please complete the assignment as soon as possible.</p>
          <a href="${process.env.NEXT_PUBLIC_APP_URL || DEFAULT_APP_URL}" class="cta">Go to Learning</a>
        </div>
        <div class="footer">
          CyberSec Lab Trainer — automated notification
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

  const subject = 'CyberSec Lab — Password Recovery Code';
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
          <h1>Password Recovery</h1>
        </div>
        <div class="content">
          <p>Hello, <strong>${escapeHtml(fullName)}</strong>!</p>
          <p>You requested a password recovery. Use the following code:</p>
          <div class="otp-code">${otp}</div>
          <p>The code is valid for 10 minutes.</p>
          <div class="warning">
            If you did not request a password recovery, please ignore this email.
          </div>
        </div>
        <div class="footer">
          CyberSec Lab Trainer — automated notification
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

export async function sendReportEmail(
  to: string,
  reportType: string,
  filename: string,
  pdfBlob: Blob,
): Promise<boolean> {
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
    return false; // email not configured
  }

  const subject = `CyberSec Lab — Report: ${reportType}`;
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
        .footer { padding: 16px 24px; background: #f8fafc; text-align: center; color: #94a3b8; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Scheduled Report: ${reportType}</h1>
        </div>
        <div class="content">
          <p>Your scheduled report <strong>${reportType}</strong> is ready.</p>
          <p>The PDF report (${filename}) is attached to this email.</p>
        </div>
        <div class="footer">
          CyberSec Lab Trainer — automated notification
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
      attachments: [{ filename, content: Buffer.from(await pdfBlob.arrayBuffer()) }],
    });
    return true;
  } catch (e) {
    logger.warn('sendReportEmail failed', { error: e });
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
    ? `Deadline Overdue: ${deadlineTitle}`
    : `Reminder: ${deadlineTitle} — ${formatDate(dueAt)}`;

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
