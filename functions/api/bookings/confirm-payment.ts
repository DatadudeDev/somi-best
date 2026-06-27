/**
 * functions/api/bookings/confirm-payment.ts
 * POST /api/bookings/confirm-payment
 *
 * Payment-first step 2 (frontend path). Retrieves the PaymentIntent, asserts it
 * succeeded, reconstructs the booking from its metadata, and writes the
 * customer + booking to D1 idempotently (keyed on stripe_payment_intent_id).
 * The Stripe webhook is the idempotent backup if the browser never returns.
 */

import type { Env } from '../../../src/lib/server/config.ts';
import { resolveConfig } from '../../../src/lib/server/config.ts';
import { jsonOk, jsonError } from '../../../src/lib/server/http.ts';
import { extractBookingFromMetadata, writeBooking } from '../../../src/lib/server/booking.ts';
import { useCentralPayments, retrieveCentralIntent } from '../../../src/lib/server/payments.ts';
import { hasTurnstileVerification } from '../../../src/lib/server/turnstile.ts';

export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const env = context.env;
    const config = resolveConfig(env);
    const body = await context.request.json() as { paymentIntentId?: string };
    if (!body.paymentIntentId) return jsonError('paymentIntentId is required');

    // ── Central payments (somi-payments Connect) — flag-gated ──
    if (useCentralPayments(env)) {
      const cpi = await retrieveCentralIntent(env, body.paymentIntentId);
      if (cpi.status !== 'succeeded') {
        return jsonError(`Payment has not succeeded yet (status: ${cpi.status}). Please wait a moment and try again.`, 402);
      }
      if (!hasTurnstileVerification(env, cpi.metadata ?? {})) {
        return jsonError('Bot verification required before completing booking.', 403);
      }
      const cPayload = extractBookingFromMetadata(cpi.metadata ?? {}, body.paymentIntentId, '');
      if (!cPayload) {
        console.error('[confirm-payment] central PI missing booking metadata:', body.paymentIntentId);
        return jsonError('Could not retrieve booking details from payment. Please contact support.', 422);
      }
      const cResult = await writeBooking(env, config, cPayload);
      return jsonOk({ bookingId: cResult.bookingId, status: 'confirmed', emailWarning: cResult.emailWarning });
    }

    const Stripe = (await import('stripe')).default;
    const stripe = new Stripe(env.STRIPE_SECRET_KEY, {
      // @ts-expect-error Stripe fetch HTTP client for the Cloudflare Workers runtime
      httpClient: Stripe.createFetchHttpClient(),
    });

    const pi = await stripe.paymentIntents.retrieve(body.paymentIntentId);
    if (pi.status !== 'succeeded') {
      return jsonError(`Payment has not succeeded yet (status: ${pi.status}). Please wait a moment and try again.`, 402);
    }

    const piMeta = (pi.metadata ?? {}) as Record<string, string>;
    if (!hasTurnstileVerification(env, piMeta)) {
      return jsonError('Bot verification required before completing booking.', 403);
    }

    const stripeCustomerId = typeof pi.customer === 'string'
      ? pi.customer
      : (pi.customer as { id?: string } | null)?.id ?? '';
    const payload = extractBookingFromMetadata(
      piMeta,
      body.paymentIntentId,
      stripeCustomerId,
    );
    if (!payload) {
      console.error('[confirm-payment] PaymentIntent missing booking metadata:', body.paymentIntentId);
      return jsonError('Could not retrieve booking details from payment. Please contact support.', 422);
    }

    const result = await writeBooking(env, config, payload);
    return jsonOk({ bookingId: result.bookingId, status: 'confirmed', emailWarning: result.emailWarning });
  } catch (err) {
    console.error('[bookings/confirm-payment]', err);
    if (err instanceof Error && err.message.includes('time slot was taken')) {
      return jsonError(err.message, 409);
    }
    return jsonError(
      err instanceof Error
        ? err.message
        : 'Your payment was processed but we could not create your booking. Please contact support.',
      500,
    );
  }
};

