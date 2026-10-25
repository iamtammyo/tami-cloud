import fs from 'node:fs';
import nodemailer from 'nodemailer';
import { config } from './config.js';

export interface Notification {
  subject: string;
  body: string;
  screenshots?: string[];
}

export async function sendNotification(n: Notification): Promise<void> {
  const results = await Promise.allSettled([sendNtfy(n), sendTelegram(n), sendEmail(n)]);
  const attempted = results.filter((r) => r.status !== 'fulfilled' || r.value !== 'skipped');
  if (attempted.length === 0) {
    console.warn('[notify] No notification channel configured (set TELEGRAM_* or SMTP_* env vars). Message was:');
    console.warn(`  ${n.subject}\n  ${n.body}`);
    return;
  }
  for (const r of results) {
    if (r.status === 'rejected') console.error('[notify] channel failed:', r.reason);
  }
}

async function sendNtfy(n: Notification): Promise<'sent' | 'skipped'> {
  const { ntfyTopic, ntfyServer } = config.notify;
  if (!ntfyTopic) return 'skipped';

  const urgent = n.subject.includes('SLOTS AVAILABLE');
  const res = await fetch(`${ntfyServer}/${ntfyTopic}`, {
    method: 'POST',
    headers: {
      Title: n.subject.replace(/[^\x20-\x7E]/g, '').trim(),
      // "urgent" bypasses phone Do-Not-Disturb in the ntfy app.
      Priority: urgent ? 'urgent' : 'default',
      Tags: urgent ? 'tada,rotating_light' : 'information_source',
    },
    body: n.body,
  });
  if (!res.ok) throw new Error(`ntfy publish failed: ${res.status} ${await res.text()}`);

  const shot = (n.screenshots || []).find((p) => fs.existsSync(p));
  if (shot) {
    await fetch(`${ntfyServer}/${ntfyTopic}`, {
      method: 'PUT',
      headers: { Filename: 'screenshot.png' },
      body: fs.readFileSync(shot),
    }).catch((e) => console.error('[notify] ntfy screenshot failed:', e));
  }
  console.log('[notify] ntfy push sent');
  return 'sent';
}

async function sendTelegram(n: Notification): Promise<'sent' | 'skipped'> {
  const { telegramBotToken: token, telegramChatId: chatId } = config.notify;
  if (!token || !chatId) return 'skipped';

  const text = `*${escapeMd(n.subject)}*\n\n${escapeMd(n.body)}`;
  const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'MarkdownV2' }),
  });
  if (!res.ok) throw new Error(`Telegram sendMessage failed: ${res.status} ${await res.text()}`);

  for (const shot of n.screenshots || []) {
    if (!fs.existsSync(shot)) continue;
    const form = new FormData();
    form.append('chat_id', chatId);
    form.append('photo', new Blob([fs.readFileSync(shot)], { type: 'image/png' }), 'screenshot.png');
    await fetch(`https://api.telegram.org/bot${token}/sendPhoto`, { method: 'POST', body: form }).catch((e) =>
      console.error('[notify] telegram photo failed:', e),
    );
  }
  console.log('[notify] telegram sent');
  return 'sent';
}

async function sendEmail(n: Notification): Promise<'sent' | 'skipped'> {
  const { smtpHost, smtpPort, smtpUser, smtpPass, emailTo } = config.notify;
  if (!smtpUser || !smtpPass || !emailTo) return 'skipped';

  const transporter = nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: smtpPort === 465,
    auth: { user: smtpUser, pass: smtpPass },
  });
  await transporter.sendMail({
    from: `"Appointment Monitor" <${smtpUser}>`,
    to: emailTo,
    subject: n.subject,
    text: n.body,
    attachments: (n.screenshots || [])
      .filter((p) => fs.existsSync(p))
      .map((p) => ({ path: p })),
  });
  console.log('[notify] email sent');
  return 'sent';
}

function escapeMd(s: string): string {
  return s.replace(/[_*[\]()~`>#+\-=|{}.!\\]/g, '\\$&');
}
