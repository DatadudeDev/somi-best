/**
 * functions/api/bookings/create-intent.ts
 * POST /api/bookings/create-intent
 *
 * Creates a priced PaymentIntent as soon as checkout opens (service/date/time).
 * Contact fields are optional here — the client syncs them via update-intent
 * before payment. Turnstile runs only when contact info is supplied.
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
  buildEmailMetadata,
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
  sizeKey?: string;
  date?: string;
  time?: string;
  addOns?: AddOnInput[];
  notes?: string;
  promoCode?: string;
  frequency?: string;
  serviceAddress?: string;
  turnstileToken?: string;
  mode?: 'individual' | 'business';
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

function contactComplete(body: CreateIntentBody): boolean {
  return !!(body.name?.trim() && body.email?.trim() && body.phone?.trim());
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const env = context.env;
    const config = resolveConfig(env);
    const body = await context.request.json() as CreateIntentBody;
    const { service, sizeKey, date, time } = body;

    if (!service || !sizeKey || !date || !time) {
      return jsonError('Missing required fields: service, sizeKey, date, time');
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return jsonError('date must be YYYY-MM-DD');

    const mode: BookingMode = body.mode === 'business' ? 'business' : 'individual';

    if (env.TURNSTILE_SECRET_KEY && contactComplete(body)) {
      const ip = context.request.headers.get('CF-Connecting-IP') ?? '';
      const ok = await verifyTurnstile(env.TURNSTILE_SECRET_KEY, body.turnstileToken ?? '', ip);
      if (!ok) return jsonError('Bot verification failed. Please refresh and try again.', 403);
    }

    const resolved = resolveService(service, sizeKey, mode);
    if (!resolved) return jsonError(`Invalid service: ${service}`);

    const normalizedTime = normalizeTime(time);
    const duration = getDuration(resolved.baseServiceKey, sizeKey);

    const slot = await checkSlotAvailability(env.DB, config, date, normalizedTime, duration);
    if (!slot.ok) return jsonError(slot.error, slot.status);

    const priced = await computePricing(
      env.DB, resolved.baseServiceKey, sizeKey, mode, body.addOns ?? [], body.promoCode,
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
      name: body.name?.trim() ?? '',
      email: body.email?.trim() ?? '',
      phone: body.phone?.trim() ?? '',
      serviceKey: resolved.serviceKey,
      sizeKey: resolved.sizeKey,
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

    if (pricing.totalCents === 0) {
      return jsonOk({ isFree: true, clientSecret: null, total: 0, breakdown });
    }

    const metadata = { ...buildIntentMetadata(payload), ...buildEmailMetadata(payload, config) };

    if (useCentralPayments(env)) {
      const intent = await createCentralIntent(env, {
        amountCents: pricing.totalCents,
        currency: config.currency,
        metadata,
        receiptEmail: payload.email ? payload.email.toLowerCase() : undefined,
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

    const Stripe = (await import('stripe')).default;
    const stripe = new Stripe(env.STRIPE_SECRET_KEY, {
      // @ts-expect-error Stripe fetch HTTP client for the Cloudflare Workers runtime
      httpClient: Stripe.createFetchHttpClient(),
    });

    let stripeCustomerId: string | undefined;
    if (contactComplete(body)) {
      const { name, email, phone } = body;
      const digits = phone!.replace(/\D/g, '');
      const e164Phone = digits.length === 10 ? `+1${digits}` : `+${digits}`;
      const existing = await stripe.customers.list({ email: email!.toLowerCase(), limit: 1 });
      if (existing.data.length > 0) {
        stripeCustomerId = existing.data[0].id;
      } else {
        const created = await stripe.customers.create({
          name: name!.trim(),
          email: email!.toLowerCase(),
          phone: e164Phone,
        });
        stripeCustomerId = created.id;
      }
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: pricing.totalCents,
      currency: config.currency,
      ...(stripeCustomerId ? { customer: stripeCustomerId } : {}),
      automatic_payment_methods: { enabled: true },
      metadata,
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
