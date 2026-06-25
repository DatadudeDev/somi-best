/**
 * src/lib/server/email.ts
 * Inline transactional email via the Resend REST API.
 *
 * Adapted (not copied) from Saje, which fanned out async through
 * Inngest → Resend + Plivo. Here both messages are sent inline, right after the
 * booking is written. Sends are best-effort: a failure never fails the booking
 * because the payment already succeeded.
 */

import type { BookingConfig, Env } from './config.ts';

export interface BookingEmailData {
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  serviceLabel: string;
  dateLabel: string;
  timeLabel: string;
  address: string | null;
  totalLabel: string;
  bookingId: string;
}

function esc(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function detailRow(label: string, value: string): string {
  return (
    `<tr>`
    + `<td style="padding:6px 0;color:#737373;font-size:13px;">${esc(label)}</td>`
    + `<td style="padding:6px 0;color:#2b2b2b;font-size:14px;text-align:right;font-weight:500;">${esc(value)}</td>`
    + `</tr>`
  );
}

function shell(businessName: string, inner: string): string {
  return (
    `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>`
    + `<body style="margin:0;padding:0;background:#f5f0e8;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">`
    + `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f5f0e8;padding:32px 0;"><tr><td align="center">`
    + `<table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background:#ffffff;border-radius:10px;overflow:hidden;border:1px solid #e8e2d8;">`
    + `<tr><td style="padding:24px 32px;border-bottom:1px solid #e8e2d8;font-size:16px;font-weight:600;color:#2b2b2b;">${esc(businessName)}</td></tr>`
    + `<tr><td style="padding:32px;">${inner}</td></tr>`
    + `</table></td></tr></table></body></html>`
  );
}

/** Customer-facing booking confirmation. */
export function buildBookingConfirmedEmail(businessName: string, d: BookingEmailData): string {
  const rows = [
    detailRow('When', `${d.dateLabel} at ${d.timeLabel}`),
    detailRow('Service', d.serviceLabel),
    d.address ? detailRow('Where', d.address) : '',
    detailRow('Total', d.totalLabel),
  ].join('');

  const inner =
    `<p style="margin:0 0 8px;font-size:12px;letter-spacing:0.08em;text-transform:uppercase;color:#8a9a7b;">Booking confirmed</p>`
    + `<h1 style="margin:0 0 16px;font-size:22px;line-height:1.3;color:#2b2b2b;">${esc(d.customerName)}, you're all set for ${esc(d.dateLabel)}</h1>`
    + `<p style="margin:0 0 20px;font-size:15px;line-height:1.6;color:#555;">Your ${esc(d.serviceLabel)} booking is scheduled. We're looking forward to it — a summary is below.</p>`
    + `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid #e8e2d8;border-bottom:1px solid #e8e2d8;margin:0 0 20px;">${rows}</table>`
    + `<p style="margin:0;font-size:13px;line-height:1.6;color:#999;">Questions? Just reply to this email.</p>`;

  return shell(businessName, inner);
}

/** Internal new-booking notice to the business inbox. */
export function buildBusinessNoticeEmail(businessName: string, d: BookingEmailData): string {
  const rows = [
    detailRow('Customer', d.customerName),
    detailRow('Email', d.customerEmail),
    detailRow('Phone', d.customerPhone),
    detailRow('Service', d.serviceLabel),
    detailRow('When', `${d.dateLabel} at ${d.timeLabel}`),
    d.address ? detailRow('Address', d.address) : '',
    detailRow('Total', d.totalLabel),
    detailRow('Booking', d.bookingId),
  ].join('');

  const inner =
    `<p style="margin:0 0 8px;font-size:12px;letter-spacing:0.08em;text-transform:uppercase;color:#8a9a7b;">New booking</p>`
    + `<h1 style="margin:0 0 16px;font-size:20px;line-height:1.3;color:#2b2b2b;">${esc(d.customerName)} — ${esc(d.dateLabel)} at ${esc(d.timeLabel)}</h1>`
    + `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid #e8e2d8;border-bottom:1px solid #e8e2d8;">${rows}</table>`;

  return shell(businessName, inner);
}

interface ResendPayload {
  from: string;
  to: string;
  subject: string;
  html: string;
  reply_to?: string;
}

async function sendViaResend(apiKey: string, payload: ResendPayload): Promise<void> {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    throw new Error(`Resend ${res.status}: ${detail.slice(0, 200)}`);
  }
}

/**
 * Send the customer confirmation and the business new-booking notice.
 * Best-effort: returns true only if every attempted send succeeded. Never
 * throws — the caller still returns booking success on failure.
 */
export async function sendBookingEmails(
  env: Env,
  config: BookingConfig,
  data: BookingEmailData,
): Promise<boolean> {
  const apiKey = env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn('[email] RESEND_API_KEY not set — skipping booking emails');
    return false;
  }

  const from = `"${config.businessName}" <${config.fromEmail}>`;
  const replyTo = config.replyToEmail ?? undefined;
  let allOk = true;

  // 1. Customer confirmation
  try {
    await sendViaResend(apiKey, {
      from,
      to: data.customerEmail,
      reply_to: replyTo,
      subject: `Your booking with ${config.businessName} is confirmed`,
      html: buildBookingConfirmedEmail(config.businessName, data),
    });
  } catch (err) {
    allOk = false;
    console.error('[email] customer confirmation failed:', err);
  }

  // 2. Business new-booking notice
  if (config.notifyEmail) {
    try {
      await sendViaResend(apiKey, {
        from,
        to: config.notifyEmail,
        reply_to: replyTo,
        subject: `New booking — ${data.customerName}, ${data.dateLabel} ${data.timeLabel}`,
        html: buildBusinessNoticeEmail(config.businessName, data),
      });
    } catch (err) {
      allOk = false;
      console.error('[email] business notice failed:', err);
    }
  }

  return allOk;
}

