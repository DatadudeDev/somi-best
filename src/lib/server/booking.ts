/**
 * src/lib/server/booking.ts
 * Server-side booking spine: pricing, availability, idempotent D1 writes,
 * promo redemption, transaction ledger, and inline email dispatch.
 *
 * Ported from Saje with everything outside the booking spine removed
 * (rewards/points, quotes, Google Calendar, Inngest, Plivo SMS, telemetry).
 */

import type { Env, BookingConfig } from './config.ts';
import { todayInTimezone, currentHourInTimezone } from './time.ts';
import { isBookableDay, minStartHourForDate } from '../booking/business-hours.ts';
import { sendBookingEmails, type BookingEmailData } from './email.ts';
import {
  SERVICE_DISPLAY_TO_KEY,
  HOME_SIZE_KEY_TO_TYPE,
  getAvailableStartHours,
  getBasePriceForMode,
  calcAddOnTotal,
  BIZ_SERVICE_PREFIX,
} from '../booking/constants.ts';

export type BookingMode = 'residential' | 'business';

export interface AddOnInput {
  id: string;
  quantity?: number;
}

export interface PromoCodeRow {
  id: string;
  code: string;
  type: 'percent_off' | 'fixed_off' | 'free_clean' | 'quote_price';
  value: number;
  max_uses: number | null;
  current_uses: number;
  expires_at: string | null;
  active: 0 | 1;
}

const DEFAULT_CAPACITY_CAP = 8;
const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

// ─── Formatting / parsing ───────────────────────────────────────────────

/** Normalize "8:00 AM" or "8:00" to 24h "HH:MM". */
export function normalizeTime(t: string): string {
  if (/^\d{1,2}:\d{2}$/.test(t)) {
    const [h, m] = t.split(':');
    return `${String(parseInt(h, 10)).padStart(2, '0')}:${m}`;
  }
  const match = t.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (match) {
    let h = parseInt(match[1], 10);
    const m = match[2];
    const period = match[3].toUpperCase();
    if (period === 'PM' && h !== 12) h += 12;
    if (period === 'AM' && h === 12) h = 0;
    return `${String(h).padStart(2, '0')}:${m}`;
  }
  return t;
}

export function timeToHour(t: string): number {
  return parseInt(t.split(':')[0], 10);
}

/** "08:00" -> "8:00 AM". */
export function formatTimeLabel(time24: string): string {
  const [hStr, mStr] = time24.split(':');
  const h = parseInt(hStr, 10);
  const isPM = h >= 12;
  const display = h > 12 ? h - 12 : h === 0 ? 12 : h;
  return `${display}:${mStr ?? '00'} ${isPM ? 'PM' : 'AM'}`;
}

/** "2026-05-13" -> "May 13, 2026". */
export function formatDateLabel(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map((n) => parseInt(n, 10));
  const name = MONTH_NAMES[(m - 1) % 12] ?? '';
  return `${name} ${d}, ${y}`;
}

/** "biz_essential" -> "Business Essential"; "essential" -> "Essential". */
export function serviceLabel(serviceKey: string): string {
  const isBiz = serviceKey.startsWith(BIZ_SERVICE_PREFIX);
  const base = isBiz ? serviceKey.slice(BIZ_SERVICE_PREFIX.length) : serviceKey;
  const titled = base.charAt(0).toUpperCase() + base.slice(1);
  return isBiz ? `Business ${titled}` : titled;
}

export function formatMoney(cents: number, currency: string): string {
  const amount = (cents / 100).toFixed(2);
  return `$${amount} ${currency.toUpperCase()}`;
}

// ─── Service resolution ───────────────────────────────────────────

export interface ResolvedService {
  baseServiceKey: string;
  serviceKey: string;
  homeSizeType: string;
}

/** Resolve display service + size keys to canonical DB keys, or null if invalid. */
export function resolveService(
  service: string,
  homeSize: string,
  mode: BookingMode,
): ResolvedService | null {
  const baseServiceKey = SERVICE_DISPLAY_TO_KEY[service] ?? service.toLowerCase();
  if (!['essential', 'signature', 'deep'].includes(baseServiceKey)) {
    return null;
  }
  const serviceKey = mode === 'business' ? `${BIZ_SERVICE_PREFIX}${baseServiceKey}` : baseServiceKey;
  const homeSizeType = HOME_SIZE_KEY_TO_TYPE[homeSize] ?? homeSize;
  return { baseServiceKey, serviceKey, homeSizeType };
}

// ─── Capacity ─────────────────────────────────────────────────

/** Daily capacity cap from the settings table (defaults to 8). */
export async function getCapacityCap(db: D1Database): Promise<number> {
  try {
    const row = await db
      .prepare(`SELECT capacity_cap FROM settings WHERE id = 'global' LIMIT 1`)
      .first<{ capacity_cap: number }>();
    return row?.capacity_cap ?? DEFAULT_CAPACITY_CAP;
  } catch (err) {
    console.warn('[booking] settings.capacity_cap read failed — using default:', err);
    return DEFAULT_CAPACITY_CAP;
  }
}

// ─── Availability ─────────────────────────────────────────────

export type SlotCheck = { ok: true } | { ok: false; status: number; error: string };

/**
 * Validate that `date`/`time` is a bookable slot: weekday, not past, not a
 * passed hour today, not blocked, under the capacity cap, a valid start hour
 * for the service duration, and not already taken.
 */
export async function checkSlotAvailability(
  db: D1Database,
  config: BookingConfig,
  date: string,
  normalizedTime: string,
  duration: number,
): Promise<SlotCheck> {
  if (!isBookableDay(date)) {
    return { ok: false, status: 409, error: 'Selected date is not available for booking' };
  }

  const today = todayInTimezone(config.timezone);
  if (date < today) return { ok: false, status: 409, error: 'Selected date is in the past' };

  const startHour = timeToHour(normalizedTime);
  const minHour = minStartHourForDate(date, today, currentHourInTimezone(config.timezone));
  if (date === today && startHour < minHour) {
    return { ok: false, status: 409, error: 'Selected time slot has already passed' };
  }

  const blocked = await db
    .prepare(`SELECT id FROM blocked_dates WHERE date = ? LIMIT 1`)
    .bind(date)
    .first<{ id: string }>();
  if (blocked) return { ok: false, status: 409, error: 'Selected date is not available for booking' };

  const capacity = await getCapacityCap(db);
  const countRow = await db
    .prepare(`SELECT COUNT(*) AS cnt FROM bookings WHERE date = ? AND status = 'confirmed'`)
    .bind(date)
    .first<{ cnt: number }>();
  if ((countRow?.cnt ?? 0) >= capacity) {
    return { ok: false, status: 409, error: 'No availability remaining for selected date' };
  }

  if (!getAvailableStartHours(duration).includes(startHour)) {
    return { ok: false, status: 409, error: 'Selected time slot is not available for the chosen service/home size' };
  }

  const slotTaken = await db
    .prepare(`SELECT id FROM bookings WHERE date = ? AND time = ? AND status = 'confirmed' LIMIT 1`)
    .bind(date, normalizedTime)
    .first<{ id: string }>();
  if (slotTaken) return { ok: false, status: 409, error: 'Selected time slot is already booked' };

  return { ok: true };
}

// ─── Pricing ────────────────────────────────────────────────

export interface Pricing {
  basePriceCents: number;
  addOnTotalCents: number;
  discountPct: number;
  discountAmountCents: number;
  totalCents: number;
  promoCodeRow: PromoCodeRow | null;
}

export type PricingOutcome = { ok: true; pricing: Pricing } | { ok: false; error: string };

/**
 * Compute booking price entirely server-side from the pricing source of truth.
 * Never trusts a client-supplied total. Applies an optional promo code.
 */
export async function computePricing(
  db: D1Database,
  baseServiceKey: string,
  homeSize: string,
  mode: BookingMode,
  addOns: AddOnInput[],
  promoCode: string | undefined,
): Promise<PricingOutcome> {
  const basePrice = getBasePriceForMode(baseServiceKey, homeSize, mode);
  const addOnTotal = calcAddOnTotal(addOns);
  const subtotalDollars = basePrice + addOnTotal;

  let promoCodeRow: PromoCodeRow | null = null;
  let discountDollars = 0;

  if (promoCode) {
    promoCodeRow = await db
      .prepare(
        `SELECT * FROM promo_codes
         WHERE code = ? COLLATE NOCASE AND active = 1
           AND (expires_at IS NULL OR expires_at > strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
           AND (max_uses IS NULL OR current_uses < max_uses)
         LIMIT 1`,
      )
      .bind(promoCode.trim().toUpperCase())
      .first<PromoCodeRow>();

    if (!promoCodeRow) {
      return { ok: false, error: 'Promo code is invalid or expired' };
    }

    if (promoCodeRow.type === 'percent_off') {
      discountDollars = Math.round(subtotalDollars * (promoCodeRow.value / 100) * 100) / 100;
    } else if (promoCodeRow.type === 'fixed_off') {
      discountDollars = promoCodeRow.value / 100;
    } else if (promoCodeRow.type === 'free_clean') {
      discountDollars = subtotalDollars;
    } else if (promoCodeRow.type === 'quote_price') {
      discountDollars = Math.max(0, subtotalDollars - promoCodeRow.value / 100);
    }
    discountDollars = Math.min(discountDollars, subtotalDollars);
  }

  const totalDollars = Math.max(0, subtotalDollars - discountDollars);
  const discountPct = subtotalDollars > 0 ? (discountDollars / subtotalDollars) * 100 : 0;

  return {
    ok: true,
    pricing: {
      basePriceCents: Math.round(basePrice * 100),
      addOnTotalCents: Math.round(addOnTotal * 100),
      discountPct: Math.round(discountPct),
      discountAmountCents: Math.round(discountDollars * 100),
      totalCents: Math.round(totalDollars * 100),
      promoCodeRow,
    },
  };
}

// ─── Booking write (idempotent) ────────────────────────────────────

export interface BookingWritePayload {
  name: string;
  email: string;
  phone: string;
  serviceKey: string;
  homeSizeType: string;
  date: string;
  time: string; // normalized HH:MM
  estimatedHours: number;
  addOnsJson: string;
  notes: string | null;
  serviceAddress: string | null;
  basePriceCents: number;
  addOnTotalCents: number;
  discountPct: number;
  totalCents: number;
  promoCodeId: string | null;
  stripePaymentIntentId: string | null;
  stripeCustomerId: string | null;
}

export interface ConfirmResult {
  bookingId: string;
  customerId: string;
  isNew: boolean;
  emailWarning: boolean;
}

function toE164(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  return digits.length === 10 ? `+1${digits}` : `+${digits}`;
}

/**
 * Create the customer + booking records for a completed (or $0) booking.
 * Idempotent on stripe_payment_intent_id: a second call (e.g. the Stripe
 * webhook after confirm-payment) returns the existing booking without
 * re-inserting. Emails are sent best-effort and never fail the booking.
 */
export async function writeBooking(
  env: Env,
  config: BookingConfig,
  payload: BookingWritePayload,
): Promise<ConfirmResult> {
  const db = env.DB;

  // Idempotent guard — paid bookings are keyed on the payment intent.
  if (payload.stripePaymentIntentId) {
    const existing = await db
      .prepare(`SELECT id, customer_id FROM bookings WHERE stripe_payment_intent_id = ? LIMIT 1`)
      .bind(payload.stripePaymentIntentId)
      .first<{ id: string; customer_id: string }>();
    if (existing) {
      return { bookingId: existing.id, customerId: existing.customer_id, isNew: false, emailWarning: false };
    }
  }

  const { ulid } = await import('ulid');
  const now = new Date().toISOString();
  const e164Phone = toE164(payload.phone);
  const email = payload.email.toLowerCase();

  // Find or create the customer (match on email, then phone).
  let customer = await db
    .prepare(`SELECT id, stripe_customer_id FROM customers WHERE email = ? LIMIT 1`)
    .bind(email)
    .first<{ id: string; stripe_customer_id: string | null }>();
  if (!customer) {
    customer = await db
      .prepare(`SELECT id, stripe_customer_id FROM customers WHERE phone = ? LIMIT 1`)
      .bind(e164Phone)
      .first<{ id: string; stripe_customer_id: string | null }>();
  }

  let customerId: string;
  if (!customer) {
    customerId = ulid();
    await db
      .prepare(
        `INSERT INTO customers (id, name, email, phone, address, stripe_customer_id, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .bind(customerId, payload.name, email, e164Phone, payload.serviceAddress, payload.stripeCustomerId, now, now)
      .run();
  } else {
    customerId = customer.id;
    await db
      .prepare(
        `UPDATE customers
         SET address = COALESCE(?, address),
             stripe_customer_id = COALESCE(stripe_customer_id, ?),
             updated_at = ?
         WHERE id = ?`,
      )
      .bind(payload.serviceAddress, payload.stripeCustomerId, now, customerId)
      .run();
  }

  // Re-check the slot to guard against a race during payment.
  const slotTaken = await db
    .prepare(`SELECT id FROM bookings WHERE date = ? AND time = ? AND status = 'confirmed' LIMIT 1`)
    .bind(payload.date, payload.time)
    .first<{ id: string }>();
  if (slotTaken) {
    throw new Error('This time slot was taken by another booking while your payment was processing.');
  }

  const bookingId = ulid();
  await db
    .prepare(
      `INSERT INTO bookings
         (id, customer_id, service, home_size, date, time, estimated_hours, add_ons, notes,
          base_price, add_on_total, discount_pct, total, status, stripe_payment_intent_id,
          promo_code_id, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'confirmed', ?, ?, ?, ?)`,
    )
    .bind(
      bookingId,
      customerId,
      payload.serviceKey,
      payload.homeSizeType,
      payload.date,
      payload.time,
      payload.estimatedHours,
      payload.addOnsJson,
      payload.notes,
      payload.basePriceCents,
      payload.addOnTotalCents,
      payload.discountPct,
      payload.totalCents,
      payload.stripePaymentIntentId,
      payload.promoCodeId,
      now,
      now,
    )
    .run();

  // Ledger row — only for actual charges.
  if (payload.totalCents > 0 && payload.stripePaymentIntentId) {
    await db
      .prepare(
        `INSERT INTO transactions
           (id, customer_id, booking_id, type, amount, currency, stripe_payment_intent_id, description, status, created_at)
         VALUES (?, ?, ?, 'charge', ?, ?, ?, ?, 'succeeded', ?)`,
      )
      .bind(
        ulid(),
        customerId,
        bookingId,
        payload.totalCents,
        config.currency,
        payload.stripePaymentIntentId,
        `Booking ${bookingId} — ${serviceLabel(payload.serviceKey)}`,
        now,
      )
      .run();
  }

  // Increment promo usage.
  if (payload.promoCodeId) {
    await db
      .prepare(`UPDATE promo_codes SET current_uses = current_uses + 1 WHERE id = ?`)
      .bind(payload.promoCodeId)
      .run();
  }

  // Inline emails — best effort.
  const emailData: BookingEmailData = {
    customerName: payload.name,
    customerEmail: email,
    customerPhone: e164Phone,
    serviceLabel: serviceLabel(payload.serviceKey),
    dateLabel: formatDateLabel(payload.date),
    timeLabel: formatTimeLabel(payload.time),
    address: payload.serviceAddress,
    totalLabel: payload.totalCents > 0 ? formatMoney(payload.totalCents, config.currency) : 'FREE',
    bookingId,
  };
  const emailsOk = await sendBookingEmails(env, config, emailData);

  return { bookingId, customerId, isNew: true, emailWarning: !emailsOk };
}

// ─── Stripe metadata bridge ────────────────────────────────────────

/** Booking metadata keys stored on the Stripe PaymentIntent. */
export function buildIntentMetadata(p: BookingWritePayload): Record<string, string> {
  return {
    name: p.name,
    email: p.email.toLowerCase(),
    phone: p.phone,
    service: p.serviceKey,
    homeSize: p.homeSizeType,
    date: p.date,
    time: p.time,
    addOns: p.addOnsJson.slice(0, 490),
    notes: (p.notes ?? '').slice(0, 490),
    serviceAddress: (p.serviceAddress ?? '').slice(0, 490),
    estimatedHours: String(p.estimatedHours),
    basePriceCents: String(p.basePriceCents),
    addOnTotalCents: String(p.addOnTotalCents),
    discountPct: String(p.discountPct),
    totalCents: String(p.totalCents),
    promoCodeId: p.promoCodeId ?? '',
  };
}

/** Reconstruct a booking payload from PaymentIntent metadata. */
export function extractBookingFromMetadata(
  metadata: Record<string, string>,
  paymentIntentId: string,
  stripeCustomerId: string,
): BookingWritePayload | null {
  const { name, email, phone, service, homeSize, date, time } = metadata;
  if (!name || !email || !phone || !service || !homeSize || !date || !time) {
    return null;
  }
  return {
    name,
    email,
    phone,
    serviceKey: service,
    homeSizeType: homeSize,
    date,
    time,
    estimatedHours: parseFloat(metadata.estimatedHours || '3'),
    addOnsJson: metadata.addOns || '[]',
    notes: metadata.notes || null,
    serviceAddress: metadata.serviceAddress || null,
    basePriceCents: parseInt(metadata.basePriceCents || '0', 10),
    addOnTotalCents: parseInt(metadata.addOnTotalCents || '0', 10),
    discountPct: parseFloat(metadata.discountPct || '0'),
    totalCents: parseInt(metadata.totalCents || '0', 10),
    promoCodeId: metadata.promoCodeId || null,
    stripePaymentIntentId: paymentIntentId,
    stripeCustomerId: stripeCustomerId || null,
  };
}

