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
}

/** Resolve per-client config from Pages env vars with sane defaults. */
export function resolveConfig(env: Env): BookingConfig {
  return {
    currency: (env.CURRENCY || 'usd').trim().toLowerCase(),
    timezone: (env.TIMEZONE || 'America/Denver').trim(),
    businessName: (env.BUSINESS_NAME || 'Our Service').trim(),
    notifyEmail: env.BUSINESS_NOTIFY_EMAIL?.trim() || null,
    replyToEmail: env.REPLY_TO_EMAIL?.trim() || null,
    fromEmail: (env.FROM_EMAIL || 'bookings@send.somi.ceo').trim(),
  };
}

