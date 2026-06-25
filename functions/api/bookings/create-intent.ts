/**
 * functions/api/bookings/create-intent.ts
 * POST /api/bookings/create-intent
 *
 * Payment-first step 1. Validates inputs, checks availability, prices the
 * booking SERVER-SIDE (never trusting a client total), then either:
 *   - returns { isFree: true } for a $0 promo booking (no Stripe, no D1), or
 *   - creates a Stripe customer + PaymentIntent with all booking details in
 *     metadata and returns { clientSecret, paymentIntentId, ... }.
 *
 * No D1 write happens here — the customer + booking are only written once
 * payment succeeds (confirm-payment / stripe webhook).
 */

import type { Env } from '../../../src/lib/server/config.ts';
import { resolveConfig } from '../../../src/lib/server/config.ts';
import { jsonOk, jsonError } from '../../../src/lib/server/http.ts';
import {
  resolveService,
  computePricing,
  checkSlotAvailability,
  normalizeTime,
  buildIntentMetadata,
  type AddOnInput,
  type BookingMode,
  type BookingWritePayload,
} from '../../../src/lib/server/booking.ts';
import { getDuration } from '../../../src/lib/booking/constants.ts';
import { useCentralPayments, createCentralIntent } from '../../../src/lib/server/payments.ts';

interface CreateIntentBody {
  name?: string;
  email?: string;
  phone?: string;
  service?: string;
  homeSize?: string;
  date?: string;
  time?: string;
  addOns?: AddOnInput[];
  notes?: string;
  promoCode?: string;
  frequency?: string;
  serviceAddress?: string;
  turnstileToken?: string;
  mode?: 'residential' | 'business';
  business_name?: string;
  property_type?: string;
}

async function verifyTurnstile(secret: string, token: string, ip: string): Promise<boolean> {
  try {
    const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ secret, response: token, remoteip: ip }).toString(),
    });
    const data = await res.json() as { success: boolean };
    return data.success;
  } catch (err) {
    console.warn('[create-intent] turnstile verify failed (soft-passing):', err);
    return true;
  }
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const env = context.env;
    const config = resolveConfig(env);
    const body = await context.request.json() as CreateIntentBody;
    const { name, email, phone, service, homeSize, date, time } = body;

    if (!name || !email || !phone || !service || !homeSize || !date || !time) {
      return jsonError('Missing required fields: name, email, phone, service, homeSize, date, time');
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return jsonError('date must be YYYY-MM-DD');

    const mode: BookingMode = body.mode === 'business' ? 'business' : 'residential';

    // Bot check — only when a secret is configured.
    if (env.TURNSTILE_SECRET_KEY) {
      const ip = context.request.headers.get('CF-Connecting-IP') ?? '';
      const ok = await verifyTurnstile(env.TURNSTILE_SECRET_KEY, body.turnstileToken ?? '', ip);
      if (!ok) return jsonError('Bot verification failed. Please refresh and try again.', 403);
    }

    const resolved = resolveService(service, homeSize, mode);
    if (!resolved) return jsonError(`Invalid service: ${service}`);

    const normalizedTime = normalizeTime(time);
    const duration = getDuration(resolved.baseServiceKey, homeSize);

    const slot = await checkSlotAvailability(env.DB, config, date, normalizedTime, duration);
    if (!slot.ok) return jsonError(slot.error, slot.status);

    const priced = await computePricing(
      env.DB, resolved.baseServiceKey, homeSize, mode, body.addOns ?? [], body.promoCode,
    );
    if (!priced.ok) return jsonError(priced.error, 400);
    const pricing = priced.pricing;

    const breakdown = {
      basePrice: pricing.basePriceCents,
      addOnTotal: pricing.addOnTotalCents,
      discountPct: pricing.discountPct,
      discountAmount: pricing.discountAmountCents,
      total: pricing.totalCents,
    };

    const payload: BookingWritePayload = {
      name,
      email,
      phone,
      serviceKey: resolved.serviceKey,
      homeSizeType: resolved.homeSizeType,
      date,
      time: normalizedTime,
      estimatedHours: duration,
      addOnsJson: JSON.stringify(body.addOns ?? []),
      notes: body.notes ?? null,
      serviceAddress: body.serviceAddress ?? null,
      basePriceCents: pricing.basePriceCents,
      addOnTotalCents: pricing.addOnTotalCents,
      discountPct: pricing.discountPct,
      totalCents: pricing.totalCents,
      promoCodeId: pricing.promoCodeRow?.id ?? null,
      stripePaymentIntentId: null,
      stripeCustomerId: null,
    };

    // $0 promo booking — frontend calls confirm-free; no Stripe, no D1.
    if (pricing.totalCents === 0) {
      return jsonOk({ isFree: true, clientSecret: null, total: 0, breakdown });
    }

    // ── Central payments (somi-payments Connect) — flag-gated ──
    if (useCentralPayments(env)) {
      const intent = await createCentralIntent(env, {
        amountCents: pricing.totalCents,
        currency: config.currency,
        metadata: buildIntentMetadata(payload),
        receiptEmail: email.toLowerCase(),
      });
      return jsonOk({
        clientSecret: intent.clientSecret,
        paymentIntentId: intent.paymentIntentId,
        stripeAccount: intent.stripeAccount,
        publishableKey: intent.publishableKey,
        isFree: false,
        total: pricing.totalCents,
        breakdown,
      });
    }

    // ── Stripe customer + PaymentIntent (legacy single-account path) ──
    const Stripe = (await import('stripe')).default;
    const stripe = new Stripe(env.STRIPE_SECRET_KEY, {
      // @ts-expect-error Stripe fetch HTTP client for the Cloudflare Workers runtime
      httpClient: Stripe.createFetchHttpClient(),
    });

    const digits = phone.replace(/\D/g, '');
    const e164Phone = digits.length === 10 ? `+1${digits}` : `+${digits}`;

    let stripeCustomerId: string;
    const existing = await stripe.customers.list({ email: email.toLowerCase(), limit: 1 });
    if (existing.data.length > 0) {
      stripeCustomerId = existing.data[0].id;
    } else {
      const created = await stripe.customers.create({ name, email: email.toLowerCase(), phone: e164Phone });
      stripeCustomerId = created.id;
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: pricing.totalCents,
      currency: config.currency,
      customer: stripeCustomerId,
      automatic_payment_methods: { enabled: true },
      metadata: buildIntentMetadata(payload),
    });

    return jsonOk({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      isFree: false,
      total: pricing.totalCents,
      breakdown,
    });
  } catch (err) {
    console.error('[bookings/create-intent]', err);
    return jsonError(err instanceof Error ? err.message : 'Internal server error', 500);
  }
};

