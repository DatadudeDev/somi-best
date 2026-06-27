/**
 * src/lib/server/booking.ts
 * Server-side booking spine: pricing, availability, idempotent D1 writes,
 * promo redemption, transaction ledger, and inline email dispatch.
 */

import type { Env, BookingConfig } from './config.ts';
import { todayInTimezone, currentHourInTimezone } from './time.ts';
import { isBookableDay, minStartHourForDate } from '../booking/business-hours.ts';
import { sendBookingEmails, type BookingEmailData } from './email.ts';
import {
  SERVICE_DISPLAY_TO_KEY,
  normalizeSizeKey,
  getAvailableStartHours,
  getBasePriceForMode,
  calcAddOnTotal,
  ADDON_PRICES,
  BIZ_SERVICE_PREFIX,
} from '../booking/constants.ts';
import { PKG_DISPLAY_NAME, type Pkg, addOns, frequencyDiscounts, type Frequency } from '../../data/pricing.ts';
import { serializeEmailTheme } from './email-theme.ts';

export type BookingMode = 'individual' | 'business';

export const PROMO_TYPE_COMPLIMENTARY = 'complimentary' as const;

export interface PromoCodeRow {
  id: string;
  code: string;
  type: 'percent_off' | 'fixed_off' | typeof PROMO_TYPE_COMPLIMENTARY | 'quote_price';
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

const TIER_TO_PKG: Record<string, Pkg> = {
  tier1: 'Tier1',
  tier2: 'Tier2',
  tier3: 'Tier3',
  tier4: 'Tier4',
};

const VALID_SERVICE_KEYS = new Set(['tier1', 'tier2', 'tier3', 'tier4']);

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

/** "biz_tier1" -> "Business Foundation"; "tier1" -> "Foundation". */
export function serviceLabel(serviceKey: string): string {
  const isBiz = serviceKey.startsWith(BIZ_SERVICE_PREFIX);
  const base = isBiz ? serviceKey.slice(BIZ_SERVICE_PREFIX.length) : serviceKey;
  const pkg = TIER_TO_PKG[base];
  const label = pkg ? PKG_DISPLAY_NAME[pkg] : base.charAt(0).toUpperCase() + base.slice(1);
  return isBiz ? `Business ${label}` : label;
}

export function formatMoney(cents: number, currency: string): string {
  const amount = (cents / 100).toFixed(2);
  return `$${amount} ${currency.toUpperCase()}`;
}

export const GST_RATE = 0.05;

/** Pre-tax subtotal (cents) → GST-inclusive charge (cents), rounded. */
export function preTaxCentsToChargeCents(preTaxCents: number): number {
  if (preTaxCents <= 0) return 0;
  return Math.round(preTaxCents * (1 + GST_RATE));
}

/** GST-inclusive charge (cents) → pre-tax subtotal (cents), rounded. */
export function chargeCentsToPreTaxCents(chargeCents: number): number {
  if (chargeCents <= 0) return 0;
  return Math.round(chargeCents / (1 + GST_RATE));
}

function addonDisplayLabel(id: string): string {
  return addOns.find((a) => a.id === id)?.label ?? id.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

/** Compact invoice line items for email/PDF relay (Stripe metadata ≤500 chars). */
export function buildInvoiceMetadata(
  p: BookingWritePayload,
  config: BookingConfig,
): Record<string, string> {
  const addOnInputs: AddOnInput[] = JSON.parse(p.addOnsJson || '[]');
  const lines: Array<{ label: string; qty: number; amountCents: number }> = [
    { label: serviceLabel(p.serviceKey), qty: 1, amountCents: p.basePriceCents },
  ];
  for (const a of addOnInputs) {
    const unitCents = Math.round((ADDON_PRICES[a.id] ?? 0) * 100);
    const qty = a.quantity ?? 1;
    if (unitCents > 0) {
      lines.push({ label: addonDisplayLabel(a.id), qty, amountCents: unitCents * qty });
    }
  }

  const subtotalCents = p.basePriceCents + p.addOnTotalCents;
  const discountCents = Math.max(0, subtotalCents - p.totalCents);
  const afterDiscount = Math.max(0, p.totalCents);
  const taxCents = p.totalCents > 0 ? Math.round(afterDiscount * GST_RATE) : 0;
  const grandCents = afterDiscount + taxCents;

  return {
    invLines: JSON.stringify(lines).slice(0, 490),
    invSubCents: String(subtotalCents),
    invDiscCents: String(discountCents),
    invTaxCents: String(taxCents),
    invGrandCents: String(grandCents),
    invTaxPct: '5',
    invCur: config.currency,
  };
}

// ─── Service resolution ───────────────────────────────────────────

export interface ResolvedService {
  baseServiceKey: string;
  serviceKey: string;
  sizeKey: string;
}

/** Resolve display service + size keys to canonical DB keys, or null if invalid. */
export function resolveService(
  service: string,
  sizeKey: string,
  mode: BookingMode,
): ResolvedService | null {
  const baseServiceKey = SERVICE_DISPLAY_TO_KEY[service] ?? service.toLowerCase();
  if (!VALID_SERVICE_KEYS.has(baseServiceKey)) {
    return null;
  }
  const serviceKey = mode === 'business' ? `${BIZ_SERVICE_PREFIX}${baseServiceKey}` : baseServiceKey;
  return { baseServiceKey, serviceKey, sizeKey: normalizeSizeKey(sizeKey) };
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
    return { ok: false, status: 409, error: 'Selected time slot is not available for the chosen service and size' };
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
  /** Pre-tax subtotal after discounts (stored in D1 `bookings.total`). */
  totalCents: number;
  /** GST portion of the Stripe charge. */
  taxCents: number;
  /** GST-inclusive amount charged on Stripe. */
  chargeCents: number;
  promoCodeRow: PromoCodeRow | null;
}

export type PricingOutcome = { ok: true; pricing: Pricing } | { ok: false; error: string };

export interface PricingOptions {
  frequency?: string;
  visitCount?: number;
}

/**
 * Compute booking price entirely server-side from the pricing source of truth.
 * Never trusts a client-supplied total. Applies frequency + optional promo code.
 */
export async function computePricing(
  db: D1Database,
  baseServiceKey: string,
  sizeKey: string,
  mode: BookingMode,
  addOns: AddOnInput[],
  promoCode: string | undefined,
  options: PricingOptions = {},
): Promise<PricingOutcome> {
  const visitCount = Math.max(1, Math.min(options.visitCount ?? 1, 12));
  const freqKey = (options.frequency ?? 'one-time') as Frequency;
  const freqRate = frequencyDiscounts[freqKey]?.discount ?? 0;

  const basePrice = getBasePriceForMode(baseServiceKey, sizeKey, mode);
  const addOnTotal = calcAddOnTotal(addOns);
  const perVisitSubtotal = basePrice + addOnTotal;
  const frequencyDiscountPerVisit = Math.round(perVisitSubtotal * freqRate * 100) / 100;
  const perVisitAfterFreq = perVisitSubtotal - frequencyDiscountPerVisit;
  const subtotalDollars = perVisitAfterFreq * visitCount;

  let promoCodeRow: PromoCodeRow | null = null;
  let promoDiscountDollars = 0;

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
      promoDiscountDollars = Math.round(subtotalDollars * (promoCodeRow.value / 100) * 100) / 100;
    } else if (promoCodeRow.type === 'fixed_off') {
      promoDiscountDollars = promoCodeRow.value / 100;
    } else if (promoCodeRow.type === PROMO_TYPE_COMPLIMENTARY) {
      promoDiscountDollars = subtotalDollars;
    } else if (promoCodeRow.type === 'quote_price') {
      const chargeCents = promoCodeRow.value;
      const preTaxDollars = (chargeCents / 100) / (1 + GST_RATE);
      promoDiscountDollars = Math.max(0, subtotalDollars - preTaxDollars);
    }
    promoDiscountDollars = Math.min(promoDiscountDollars, subtotalDollars);
  }

  const totalDollars = Math.max(0, subtotalDollars - promoDiscountDollars);
  const catalogSubtotal = perVisitSubtotal * visitCount;
  const totalDiscountDollars = Math.max(0, catalogSubtotal - totalDollars);
  const discountPct = catalogSubtotal > 0 ? (totalDiscountDollars / catalogSubtotal) * 100 : 0;
  const totalCents = Math.round(totalDollars * 100);
  const chargeCents = promoCodeRow?.type === 'quote_price'
    ? promoCodeRow.value
    : preTaxCentsToChargeCents(totalCents);
  const taxCents = Math.max(0, chargeCents - totalCents);

  return {
    ok: true,
    pricing: {
      basePriceCents: Math.round(basePrice * 100),
      addOnTotalCents: Math.round(addOnTotal * 100),
      discountPct: Math.round(discountPct),
      discountAmountCents: Math.round(totalDiscountDollars * 100),
      totalCents,
      taxCents,
      chargeCents,
      promoCodeRow,
    },
  };
}

// ─── Booking write (idempotent) ────────────────────────────────────

export interface AddOnInput {
  id: string;
  quantity?: number;
}

export interface BookingWritePayload {
  name: string;
  email: string;
  phone: string;
  serviceKey: string;
  sizeKey: string;
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
         (id, customer_id, service, size_key, date, time, estimated_hours, add_ons, notes,
          base_price, add_on_total, discount_pct, total, status, stripe_payment_intent_id,
          promo_code_id, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'confirmed', ?, ?, ?, ?)`,
    )
    .bind(
      bookingId,
      customerId,
      payload.serviceKey,
      payload.sizeKey,
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

  if (payload.promoCodeId) {
    await db
      .prepare(`UPDATE promo_codes SET current_uses = current_uses + 1 WHERE id = ?`)
      .bind(payload.promoCodeId)
      .run();
  }

  const emailData: BookingEmailData = {
    customerName: payload.name,
    customerEmail: email,
    customerPhone: e164Phone,
    serviceLabel: serviceLabel(payload.serviceKey),
    dateLabel: formatDateLabel(payload.date),
    timeLabel: formatTimeLabel(payload.time),
    address: payload.serviceAddress,
    totalLabel: payload.totalCents > 0
      ? formatMoney(preTaxCentsToChargeCents(payload.totalCents), config.currency)
      : 'FREE',
    bookingId,
    calendarDate: payload.date,
    calendarTime: payload.time,
    calendarHours: payload.estimatedHours,
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
    sizeKey: p.sizeKey,
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

/**
 * Email-contract metadata keys the central somi-payments webhook needs to render
 * booking-confirmation emails. Merged into the PaymentIntent metadata alongside
 * buildIntentMetadata so buildBookingEmailPayload (somi-payments) recognizes the
 * charge as a booking instead of skipping the email.
 */
export function buildEmailMetadata(
  p: BookingWritePayload,
  config: BookingConfig,
): Record<string, string> {
  const afterDiscount = Math.max(0, p.totalCents);
  const taxCents = p.totalCents > 0 ? Math.round(afterDiscount * GST_RATE) : 0;
  const grandCents = afterDiscount + taxCents;

  return {
    svcLabel: serviceLabel(p.serviceKey),
    dateLabel: formatDateLabel(p.date),
    timeLabel: formatTimeLabel(p.time),
    totalLabel: p.totalCents > 0 ? formatMoney(grandCents, config.currency) : 'FREE',
    bizName: config.businessName,
    bizFrom: config.fromEmail,
    bizReplyTo: config.replyToEmail ?? '',
    bizNotify: config.notifyEmail ?? '',
    bizSiteOrigin: config.siteOrigin,
    bizLogoUrl: config.emailLogoUrl,
    bizLocationLabel: config.locationLabel ?? '',
    bizRequiresAddress: config.requiresAddress ? 'true' : 'false',
    calDate: p.date,
    calTime: p.time,
    calHours: String(p.estimatedHours),
    calTz: config.timezone,
    bizEmailTheme: serializeEmailTheme(),
    bizPhone: config.businessPhone ?? '',
    bizCallLabel: config.callLabel,
    bizPlaceId: config.placeId ?? '',
    ...buildInvoiceMetadata(p, config),
  };
}

/** Reconstruct a booking payload from PaymentIntent metadata. */
export function extractBookingFromMetadata(
  metadata: Record<string, string>,
  paymentIntentId: string,
  stripeCustomerId: string,
): BookingWritePayload | null {
  const { name, email, phone, service, sizeKey, date, time } = metadata;
  if (!name || !email || !phone || !service || !sizeKey || !date || !time) {
    return null;
  }
  return {
    name,
    email,
    phone,
    serviceKey: service,
    sizeKey: normalizeSizeKey(sizeKey),
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
