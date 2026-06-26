/**
 * src/lib/server/email.ts
 * Branded transactional booking emails via Resend.
 */

import type { BookingConfig, Env } from './config.ts';
import { emailTheme as t } from './email-theme.ts';

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

export interface EmailBrandContext {
  businessName: string;
  siteOrigin: string;
  logoUrl: string;
  requiresAddress: boolean;
  locationLabel?: string;
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
    + `<td style="padding:6px 0;font-family:${t.fontBody};font-size:12px;font-weight:600;letter-spacing:0.08em;text-transform:uppercase;color:${t.textMuted};width:100px;vertical-align:top;">${esc(label)}</td>`
    + `<td style="padding:6px 0;font-family:${t.fontBody};font-size:15px;font-weight:600;color:${t.textPrimary};">${value}</td>`
    + `</tr>`
  );
}

function detailRowHtml(label: string, valueHtml: string): string {
  return detailRow(label, valueHtml);
}

function emailShell(inner: string): string {
  return (
    `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>`
    + `<body style="margin:0;padding:0;background-color:${t.bgOuter};font-family:${t.fontBody};-webkit-font-smoothing:antialiased;">`
    + `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:${t.bgOuter};">`
    + `<tr><td align="center" style="padding:48px 24px;">`
    + `<table role="presentation" width="560" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;width:100%;background-color:${t.bgCard};border:1px solid ${t.border};border-radius:34px;overflow:hidden;box-shadow:${t.cardShadow};">`
    + `<tr><td style="padding:32px 40px 36px;text-align:center;">${inner}</td></tr>`
    + `</table></td></tr></table></body></html>`
  );
}

function logoBlock(brand: EmailBrandContext): string {
  return (
    `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">`
    + `<tr><td align="center" style="padding:8px 0 6px;">`
    + `<img src="${esc(brand.logoUrl)}" alt="${esc(brand.businessName)}" width="88" height="88" style="display:block;border:0;outline:none;">`
    + `</td></tr></table>`
  );
}

function footerBlock(brand: EmailBrandContext, tagline: string): string {
  return (
    `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:24px;border-top:1px solid ${t.border};">`
    + `<tr><td style="padding-top:18px;text-align:center;">`
    + `<p style="margin:0 0 10px;font-family:${t.fontBody};font-size:11px;line-height:1.55;color:${t.textMuted};">${esc(tagline)}</p>`
    + `<table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center"><tr>`
    + `<td style="padding-right:10px;"><a href="${esc(brand.siteOrigin)}/privacy" style="color:${t.textPrimary};font-family:${t.fontBody};font-size:12px;text-decoration:none;">Privacy Policy</a></td>`
    + `<td style="padding-left:10px;"><a href="${esc(brand.siteOrigin)}/terms" style="color:${t.textPrimary};font-family:${t.fontBody};font-size:12px;text-decoration:none;">Terms &amp; Conditions</a></td>`
    + `</tr></table></td></tr></table>`
  );
}

function detailPanel(rows: string): string {
  return (
    `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">`
    + `<tr><td align="center">`
    + `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:${t.bgElevated};border:1px solid ${t.border};border-radius:14px;overflow:hidden;">`
    + `<tr><td style="padding:20px 24px;text-align:left;">`
    + `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">${rows}</table>`
    + `</td></tr></table></td></tr></table>`
  );
}

function primaryButton(href: string, label: string): string {
  return (
    `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="width:100%;margin-bottom:10px;">`
    + `<tr><td align="center" style="background-color:${t.accent};border-radius:14px;box-shadow:0 2px 8px rgba(255,184,0,0.25);">`
    + `<a href="${esc(href)}" target="_blank" style="display:block;padding:14px 28px;color:${t.accentOn};font-family:${t.fontBody};font-size:14px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;text-decoration:none;text-align:center;">${esc(label)}</a>`
    + `</td></tr></table>`
  );
}

function secondaryButtonSpan(label: string): string {
  return (
    `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="width:100%;">`
    + `<tr><td align="center" style="background-color:${t.bgElevated};border:1px solid ${t.border};border-radius:14px;">`
    + `<span style="display:block;padding:14px 28px;color:${t.textPrimary};font-family:${t.fontBody};font-size:14px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;text-align:center;">${esc(label)}</span>`
    + `</td></tr></table>`
  );
}

function secondaryButtonLink(href: string, label: string): string {
  return (
    `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="width:100%;">`
    + `<tr><td align="center" style="background-color:${t.bgElevated};border:1px solid ${t.border};border-radius:14px;">`
    + `<a href="${esc(href)}" style="display:block;padding:14px 28px;color:${t.textPrimary};font-family:${t.fontBody};font-size:14px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;text-decoration:none;text-align:center;">${esc(label)}</a>`
    + `</td></tr></table>`
  );
}

function customerDetailRows(d: BookingEmailData, brand: EmailBrandContext): string {
  const rows = [
    detailRow('When', `${esc(d.dateLabel)} at ${esc(d.timeLabel)}`),
    detailRow('Service', esc(d.serviceLabel)),
  ];
  if (brand.requiresAddress && d.address) {
    rows.push(detailRow('Where', esc(d.address)));
  }
  rows.push(
    detailRowHtml('Total', `<span style="font-family:${t.fontDisplay};font-size:18px;font-weight:800;letter-spacing:0.04em;color:${t.accent};">${esc(d.totalLabel)}</span>`),
  );
  return rows.join('');
}

export function buildBookingConfirmedEmail(brand: EmailBrandContext, d: BookingEmailData): string {
  const firstName = d.customerName.split(/\s+/)[0] || d.customerName;
  const inner =
    logoBlock(brand)
    + `<p style="margin:0 0 10px;font-family:${t.fontBody};font-size:12px;font-weight:600;letter-spacing:0.14em;text-transform:uppercase;color:${t.accent};">Booking confirmed</p>`
    + `<h1 style="margin:0 0 14px;font-family:${t.fontDisplay};font-size:28px;line-height:1.12;letter-spacing:0.03em;font-weight:800;text-transform:uppercase;color:${t.heading};">${esc(firstName)}, you're all set</h1>`
    + `<p style="margin:0 0 24px;font-family:${t.fontBody};font-size:15px;line-height:1.55;color:${t.textMuted};">Your <strong style="color:${t.textPrimary};font-weight:600;">${esc(d.serviceLabel)}</strong> session is locked in for <strong style="color:${t.textPrimary};font-weight:600;">${esc(d.dateLabel)}</strong>.</p>`
    + detailPanel(customerDetailRows(d, brand))
    + `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:22px;"><tr><td align="center">`
    + primaryButton(`${brand.siteOrigin}/book`, 'Book another session')
    + secondaryButtonSpan('Reschedule')
    + `</td></tr></table>`
    + `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td align="center" style="padding:22px 0;">`
    + `<span style="font-family:${t.fontBody};font-size:12px;font-weight:500;color:${t.textMuted};letter-spacing:0.06em;opacity:0.6;">OR</span></td></tr></table>`
    + `<p style="margin:0;font-family:${t.fontBody};font-size:13px;line-height:1.55;color:${t.textMuted};">Questions about your session? Just reply to this email.<br>`
    + `<a href="${esc(brand.siteOrigin)}/help" style="color:${t.accent};font-size:14px;font-weight:600;text-decoration:none;">Visit the FAQ</a></p>`
    + footerBlock(brand, `${brand.businessName}${brand.locationLabel ? ` · ${brand.locationLabel}` : ''}`);

  return emailShell(inner);
}

export function buildBusinessNoticeEmail(brand: EmailBrandContext, d: BookingEmailData): string {
  const rows = [
    detailRow('Customer', esc(d.customerName)),
    detailRow('Email', `<a href="mailto:${esc(d.customerEmail)}" style="color:${t.accent};text-decoration:none;">${esc(d.customerEmail)}</a>`),
    detailRow('Phone', `<a href="tel:${esc(d.customerPhone.replace(/\s/g, ''))}" style="color:${t.accent};text-decoration:none;">${esc(d.customerPhone)}</a>`),
    detailRow('When', `${esc(d.dateLabel)} at ${esc(d.timeLabel)}`),
    detailRow('Service', esc(d.serviceLabel)),
  ];
  if (brand.requiresAddress && d.address) {
    rows.push(detailRow('Address', esc(d.address)));
  }
  rows.push(
    detailRowHtml('Total', `<span style="font-family:${t.fontDisplay};font-size:18px;font-weight:800;letter-spacing:0.04em;color:${t.accent};">${esc(d.totalLabel)}</span>`),
  );

  const inner =
    logoBlock(brand)
    + `<p style="margin:0 0 10px;font-family:${t.fontBody};font-size:12px;font-weight:600;letter-spacing:0.14em;text-transform:uppercase;color:${t.accent};">New booking</p>`
    + `<h1 style="margin:0 0 14px;font-family:${t.fontDisplay};font-size:28px;line-height:1.12;letter-spacing:0.03em;font-weight:800;text-transform:uppercase;color:${t.heading};">${esc(d.customerName)} · ${esc(d.dateLabel.split(',')[0] ?? d.dateLabel)}</h1>`
    + `<p style="margin:0 0 24px;font-family:${t.fontBody};font-size:15px;line-height:1.55;color:${t.textMuted};">A new <strong style="color:${t.textPrimary};font-weight:600;">${esc(d.serviceLabel)}</strong> session was booked online.</p>`
    + detailPanel(rows.join(''))
    + `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:22px;"><tr><td align="center">`
    + primaryButton(`mailto:${d.customerEmail}`, 'Reply to customer')
    + secondaryButtonLink(`tel:${d.customerPhone.replace(/\D/g, '')}`, 'Call customer')
    + `</td></tr></table>`
    + `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td align="center" style="padding:22px 0;">`
    + `<span style="font-family:${t.fontBody};font-size:12px;font-weight:500;color:${t.textMuted};letter-spacing:0.06em;opacity:0.6;">OR</span></td></tr></table>`
    + `<p style="margin:0;font-family:${t.fontBody};font-size:13px;line-height:1.55;color:${t.textMuted};">Automated booking alert — add the session to your calendar if needed.</p>`
    + footerBlock(brand, `${brand.businessName} · Internal booking alert`);

  return emailShell(inner);
}

export function emailBrandFromConfig(config: BookingConfig): EmailBrandContext {
  return {
    businessName: config.businessName,
    siteOrigin: config.siteOrigin,
    logoUrl: config.emailLogoUrl,
    requiresAddress: config.requiresAddress,
    locationLabel: config.locationLabel,
  };
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

  const brand = emailBrandFromConfig(config);
  const from = `"${config.businessName}" <${config.fromEmail}>`;
  const replyTo = config.replyToEmail ?? undefined;
  let allOk = true;

  try {
    await sendViaResend(apiKey, {
      from,
      to: data.customerEmail,
      reply_to: replyTo,
      subject: `Your booking with ${config.businessName} is confirmed`,
      html: buildBookingConfirmedEmail(brand, data),
    });
  } catch (err) {
    allOk = false;
    console.error('[email] customer confirmation failed:', err);
  }

  if (config.notifyEmail) {
    try {
      await sendViaResend(apiKey, {
        from,
        to: config.notifyEmail,
        reply_to: replyTo,
        subject: `New booking — ${data.customerName}, ${data.dateLabel} ${data.timeLabel}`,
        html: buildBusinessNoticeEmail(brand, data),
      });
    } catch (err) {
      allOk = false;
      console.error('[email] business notice failed:', err);
    }
  }

  return allOk;
}
