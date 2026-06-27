/**
 * src/lib/server/config.ts
 * Cloudflare Pages Functions environment bindings + per-client config.
 *
 * Every client-specific value (currency, timezone, business identity, email
 * addresses) is read from Pages environment variables so a single template
 * deploy can be reskinned per client without code changes.
 */

export interface Env {
  // ── Bindings ──
  DB: D1Database;

  // ── Secrets (set via `wrangler pages secret put`) ──
  STRIPE_SECRET_KEY: string;
  STRIPE_WEBHOOK_SIGNING_SECRET?: string;
  RESEND_API_KEY?: string;
  TURNSTILE_SECRET_KEY?: string;

  // ── Central payments (somi-payments Connect module) ──
  // When USE_CENTRAL_PAYMENTS === 'true', booking endpoints route Stripe ops
  // through the platform PAYMENTS service binding instead of a per-client key.
  PAYMENTS?: Fetcher;
  USE_CENTRAL_PAYMENTS?: string;
  CLIENT_USER_ID?: string;            // tenant ULID — routing key for somi-payments
  INTERNAL_CALLBACK_SECRET?: string;  // HMAC secret for the booking-upsert callback

  // ── Vars (set via [vars] / Pages dashboard) ──
  CURRENCY?: string;
  TIMEZONE?: string;
  BUSINESS_NAME?: string;
  BUSINESS_NOTIFY_EMAIL?: string;
  REPLY_TO_EMAIL?: string;
  FROM_EMAIL?: string;
  /** When "true", checkout requires a service address and emails include a Where/Address row. */
  BOOKING_REQUIRES_ADDRESS?: string;
  /** Public site origin for email links (no trailing slash). */
  SITE_ORIGIN?: string;
  /** Absolute URL to logo mark for emails. */
  EMAIL_LOGO_URL?: string;
  /** Short location line in email footer (e.g. "Calgary, AB"). */
  EMAIL_LOCATION_LABEL?: string;
  /** Public business phone for email call buttons. */
  BUSINESS_PHONE?: string;
  /** Google Place ID for email footer location link. */
  PLACE_ID?: string;
  /** Call-button label in customer emails (e.g. "Call BEST Therapy"). */
  BUSINESS_CALL_LABEL?: string;
}

export interface BookingConfig {
  /** Stripe + ledger currency, lowercase ISO code (e.g. "usd"). */
  currency: string;
  /** IANA timezone for today/past-day/current-hour calculations. */
  timezone: string;
  /** Public business name used in emails. */
  businessName: string;
  /** Inbox that receives the new-booking notice (null disables it). */
  notifyEmail: string | null;
  /** Reply-To address on outbound email (null omits the header). */
  replyToEmail: string | null;
  /** Verified From address for Resend. */
  fromEmail: string;
  /** When true, address is required at checkout and shown in emails. */
  requiresAddress: boolean;
  /** Public site origin (https://…, no trailing slash). */
  siteOrigin: string;
  /** Logo URL for transactional emails. */
  emailLogoUrl: string;
  /** Optional footer location label. */
  locationLabel?: string;
  /** Public business phone for customer email call button. */
  businessPhone: string | null;
  /** Customer email call-button label. */
  callLabel: string;
  /** Google Place ID for email footer maps link. */
  placeId?: string;
}

/** Resolve per-client config from Pages env vars with sane defaults. */
export function resolveConfig(env: Env): BookingConfig {
  const siteOrigin = (env.SITE_ORIGIN || 'https://treytherapy.com').trim().replace(/\/$/, '');
  return {
    currency: (env.CURRENCY || 'usd').trim().toLowerCase(),
    timezone: (env.TIMEZONE || 'America/Edmonton').trim(),
    businessName: (env.BUSINESS_NAME || 'Our Service').trim(),
    notifyEmail: env.BUSINESS_NOTIFY_EMAIL?.trim() || null,
    replyToEmail: env.REPLY_TO_EMAIL?.trim() || null,
    fromEmail: (env.FROM_EMAIL || 'bookings@send.somi.ceo').trim(),
    requiresAddress: env.BOOKING_REQUIRES_ADDRESS === 'true',
    siteOrigin,
    emailLogoUrl: (env.EMAIL_LOGO_URL || `${siteOrigin}/images/best/logo-wordmark.png`).trim(),
    locationLabel: env.EMAIL_LOCATION_LABEL?.trim() || undefined,
    businessPhone: env.BUSINESS_PHONE?.trim() || null,
    callLabel: (env.BUSINESS_CALL_LABEL || 'Call BEST Therapy').trim(),
    placeId: env.PLACE_ID?.trim() || undefined,
  };
}

