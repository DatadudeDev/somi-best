/**
 * functions/api/bookings/confirm-free.ts
 * POST /api/bookings/confirm-free
 *
 * $0 promo path — no Stripe. Validates the promo makes the total $0, re-checks
 * availability, writes the customer + booking to D1, increments promo usage,
 * and fires the confirmation emails.
 */

import type { Env } from '../../../src/lib/server/config.ts';
import { resolveConfig } from '../../../src/lib/server/config.ts';
import { jsonOk, jsonError } from '../../../src/lib/server/http.ts';
import {
  resolveService,
  computePricing,
  checkSlotAvailability,
  normalizeTime,
  writeBooking,
  type AddOnInput,
  type BookingMode,
} from '../../../src/lib/server/booking.ts';
import { getDuration } from '../../../src/lib/booking/constants.ts';
import { verifyTurnstileForContact } from '../../../src/lib/server/turnstile.ts';

interface ConfirmFreeBody {
  name?: string;
  email?: string;
  phone?: string;
  service?: string;
  sizeKey?: string;
  date?: string;
  time?: string;
  addOns?: AddOnInput[];
  notes?: string;
  promoCode?: string;
  frequency?: string;
  serviceAddress?: string;
  mode?: 'individual' | 'business';
  turnstileToken?: string;
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const env = context.env;
    const config = resolveConfig(env);
    const body = await context.request.json() as ConfirmFreeBody;
    const { name, email, phone, service, sizeKey, date, time, promoCode } = body;

    if (!name || !email || !phone || !service || !sizeKey || !date || !time) {
      return jsonError('Missing required fields: name, email, phone, service, sizeKey, date, time');
    }
    if (!promoCode) return jsonError('A promo code is required for free bookings');
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return jsonError('date must be YYYY-MM-DD');

    const ip = context.request.headers.get('CF-Connecting-IP') ?? '';
    const turnstileOk = await verifyTurnstileForContact(
      env,
      body.turnstileToken,
      ip,
      name,
      email,
      phone,
    );
    if (!turnstileOk) {
      return jsonError('Bot verification failed. Please refresh and try again.', 403);
    }

    const mode: BookingMode = body.mode === 'business' ? 'business' : 'individual';
    const resolved = resolveService(service, sizeKey, mode);
    if (!resolved) return jsonError(`Invalid service: ${service}`);

    const priced = await computePricing(
      env.DB, resolved.baseServiceKey, sizeKey, mode, body.addOns ?? [], promoCode,
    );
    if (!priced.ok) return jsonError(priced.error, 400);
    if (priced.pricing.totalCents !== 0) {
      return jsonError('This endpoint is only for $0 promo bookings', 400);
    }

    const normalizedTime = normalizeTime(time);
    const duration = getDuration(resolved.baseServiceKey, sizeKey);

    const slot = await checkSlotAvailability(env.DB, config, date, normalizedTime, duration);
    if (!slot.ok) return jsonError(slot.error, slot.status);

    const result = await writeBooking(env, config, {
      name,
      email,
      phone,
      serviceKey: resolved.serviceKey,
      sizeKey: resolved.sizeKey,
      date,
      time: normalizedTime,
      estimatedHours: duration,
      addOnsJson: JSON.stringify(body.addOns ?? []),
      notes: body.notes ?? null,
      serviceAddress: body.serviceAddress ?? null,
      basePriceCents: priced.pricing.basePriceCents,
      addOnTotalCents: priced.pricing.addOnTotalCents,
      discountPct: priced.pricing.discountPct,
      totalCents: 0,
      promoCodeId: priced.pricing.promoCodeRow?.id ?? null,
      stripePaymentIntentId: null,
      stripeCustomerId: null,
    });

    return jsonOk({ bookingId: result.bookingId, status: 'confirmed', emailWarning: result.emailWarning });
  } catch (err) {
    console.error('[bookings/confirm-free]', err);
    if (err instanceof Error && err.message.includes('time slot was taken')) {
      return jsonError(err.message, 409);
    }
    return jsonError(err instanceof Error ? err.message : 'Internal server error', 500);
  }
};

