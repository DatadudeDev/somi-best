/**
 * functions/api/webhooks/stripe.ts
 * POST /api/webhooks/stripe
 *
 * Idempotent backup for confirm-payment. On payment_intent.succeeded it does
 * the same metadata-driven booking write — useful when the browser closed
 * before confirm-payment ran. Signature is verified with
 * STRIPE_WEBHOOK_SIGNING_SECRET.
 */

import type { Env } from '../../../src/lib/server/config.ts';
import { resolveConfig } from '../../../src/lib/server/config.ts';
import { jsonOk, jsonError } from '../../../src/lib/server/http.ts';
import { extractBookingFromMetadata, writeBooking } from '../../../src/lib/server/booking.ts';

export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const env = context.env;
    const config = resolveConfig(env);
    const webhookSecret = env.STRIPE_WEBHOOK_SIGNING_SECRET;
    if (!webhookSecret) {
      console.error('[stripe-webhook] STRIPE_WEBHOOK_SIGNING_SECRET not configured');
      return new Response('Webhook secret not configured', { status: 500 });
    }

    const signature = context.request.headers.get('stripe-signature');
    if (!signature) return new Response('Missing stripe-signature header', { status: 400 });
    const rawBody = await context.request.text();

    const Stripe = (await import('stripe')).default;
    const stripe = new Stripe(env.STRIPE_SECRET_KEY, {
      // @ts-expect-error Stripe fetch HTTP client for the Cloudflare Workers runtime
      httpClient: Stripe.createFetchHttpClient(),
    });

    let event: import('stripe').Stripe.Event;
    try {
      // constructEventAsync is required on the Workers runtime (async WebCrypto).
      event = await stripe.webhooks.constructEventAsync(rawBody, signature, webhookSecret);
    } catch (err) {
      console.error('[stripe-webhook] Signature verification failed:', err);
      return new Response('Invalid signature', { status: 400 });
    }

    if (event.type === 'payment_intent.succeeded') {
      const pi = event.data.object as {
        id: string;
        customer?: string | { id: string } | null;
        metadata?: Record<string, string>;
      };
      const stripeCustomerId = typeof pi.customer === 'string'
        ? pi.customer
        : (pi.customer as { id?: string } | null)?.id ?? '';
      const payload = extractBookingFromMetadata((pi.metadata ?? {}) as Record<string, string>, pi.id, stripeCustomerId);

      if (!payload) {
        console.warn('[stripe-webhook] PaymentIntent missing booking metadata — skipping:', pi.id);
        return jsonOk({ received: true, skipped: true });
      }

      try {
        const result = await writeBooking(env, config, payload);
        console.log(result.isNew
          ? `[stripe-webhook] Booking created via webhook: ${result.bookingId}`
          : `[stripe-webhook] Booking already existed (idempotent): ${result.bookingId}`);
      } catch (err) {
        if (err instanceof Error && err.message.includes('time slot was taken')) {
          console.error('[stripe-webhook] Slot conflict — booking not created:', pi.id, err.message);
          return jsonOk({ received: true, slotConflict: true });
        }
        throw err;
      }
    } else if (event.type === 'payment_intent.payment_failed') {
      const pi = event.data.object as { id: string };
      console.log('[stripe-webhook] Payment failed (no booking to cancel):', pi.id);
    }

    return jsonOk({ received: true });
  } catch (err) {
    console.error('[stripe-webhook]', err);
    return jsonError(err instanceof Error ? err.message : 'Internal server error', 500);
  }
};

