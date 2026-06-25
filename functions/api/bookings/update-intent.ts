/**
 * functions/api/bookings/update-intent.ts
 * PATCH /api/bookings/update-intent
 *
 * Re-prices the booking server-side and updates the open PaymentIntent's
 * amount + metadata when the cart changes on the checkout step (add-ons,
 * promo, frequency). Server pricing remains the source of truth.
 */

import type { Env } from '../../../src/lib/server/config.ts';
import { resolveConfig } from '../../../src/lib/server/config.ts';
import { jsonOk, jsonError } from '../../../src/lib/server/http.ts';
import {
  resolveService,
  computePricing,
  type AddOnInput,
  type BookingMode,
} from '../../../src/lib/server/booking.ts';
import { useCentralPayments, updateCentralIntent } from '../../../src/lib/server/payments.ts';

interface UpdateIntentBody {
  paymentIntentId?: string;
  service?: string;
  homeSize?: string;
  addOns?: AddOnInput[];
  promoCode?: string;
  mode?: 'residential' | 'business';
}

export const onRequestPatch: PagesFunction<Env> = async (context) => {
  try {
    const env = context.env;
    const config = resolveConfig(env);
    const body = await context.request.json() as UpdateIntentBody;
    const { paymentIntentId, service, homeSize } = body;

    if (!paymentIntentId || !service || !homeSize) {
      return jsonError('Missing required fields: paymentIntentId, service, homeSize');
    }

    const mode: BookingMode = body.mode === 'business' ? 'business' : 'residential';
    const resolved = resolveService(service, homeSize, mode);
    if (!resolved) return jsonError(`Invalid service: ${service}`);

    const priced = await computePricing(
      env.DB, resolved.baseServiceKey, homeSize, mode, body.addOns ?? [], body.promoCode,
    );
    if (!priced.ok) return jsonError(priced.error, 400);
    if (priced.pricing.totalCents <= 0) {
      // A $0 cart is handled by the free-booking flow, not a PaymentIntent.
      return jsonError('Updated total is $0 — use the free booking flow', 409);
    }

    const updateMeta = {
      basePriceCents: String(priced.pricing.basePriceCents),
      addOnTotalCents: String(priced.pricing.addOnTotalCents),
      discountPct: String(priced.pricing.discountPct),
      totalCents: String(priced.pricing.totalCents),
      promoCodeId: priced.pricing.promoCodeRow?.id ?? '',
    };

    // ── Central payments (somi-payments Connect) — flag-gated ──
    if (useCentralPayments(env)) {
      await updateCentralIntent(env, paymentIntentId, {
        amountCents: priced.pricing.totalCents,
        metadata: updateMeta,
      });
      return jsonOk({ total: priced.pricing.totalCents });
    }

    const Stripe = (await import('stripe')).default;
    const stripe = new Stripe(env.STRIPE_SECRET_KEY, {
      // @ts-expect-error Stripe fetch HTTP client for the Cloudflare Workers runtime
      httpClient: Stripe.createFetchHttpClient(),
    });

    await stripe.paymentIntents.update(paymentIntentId, {
      amount: priced.pricing.totalCents,
      currency: config.currency,
      metadata: updateMeta,
    });

    return jsonOk({ total: priced.pricing.totalCents });
  } catch (err) {
    console.error('[bookings/update-intent]', err);
    return jsonError(err instanceof Error ? err.message : 'Internal server error', 500);
  }
};

