/**
 * functions/api/internal/booking-upsert.ts
 * POST /api/internal/booking-upsert  (internal — HMAC-verified)
 *
 * Idempotent backup booking write. The central somi-payments webhook calls this
 * after a successful charge when the browser never returned to confirm-payment.
 * The body is HMAC-SHA256 signed with INTERNAL_CALLBACK_SECRET (shared with
 * somi-payments). Same idempotent write path as confirm-payment.
 */
import type { Env } from '../../../src/lib/server/config.ts';
import { resolveConfig } from '../../../src/lib/server/config.ts';
import { jsonOk, jsonError } from '../../../src/lib/server/http.ts';
import { extractBookingFromMetadata, writeBooking } from '../../../src/lib/server/booking.ts';
import { hmacHex, timingSafeEqual } from '../../../src/lib/server/hmac.ts';

interface CallbackBody {
  source?: string;
  paymentIntentId?: string;
  amountCents?: number;
  currency?: string;
  metadata?: Record<string, string>;
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const env = context.env;
    if (!env.INTERNAL_CALLBACK_SECRET) {
      return jsonError('internal callback not configured', 503);
    }
    const raw = await context.request.text();
    const provided = context.request.headers.get('X-Somi-Signature') || '';
    const expected = `sha256=${await hmacHex(env.INTERNAL_CALLBACK_SECRET, raw)}`;
    if (!timingSafeEqual(expected, provided)) {
      return jsonError('invalid signature', 401);
    }

    let body: CallbackBody;
    try {
      body = JSON.parse(raw) as CallbackBody;
    } catch {
      return jsonError('invalid json', 400);
    }
    if (!body.paymentIntentId) return jsonError('paymentIntentId required', 400);

    const payload = extractBookingFromMetadata(
      body.metadata ?? {},
      body.paymentIntentId,
      '',
    );
    if (!payload) {
      // No booking metadata to reconstruct — nothing to write (e.g. a non-booking charge).
      return jsonOk({ status: 'skipped', reason: 'no_metadata' });
    }

    const config = resolveConfig(env);
    const result = await writeBooking(env, config, payload);
    return jsonOk({ bookingId: result.bookingId, status: 'upserted' });
  } catch (err) {
    console.error('[internal/booking-upsert]', err);
    if (err instanceof Error && err.message.includes('time slot was taken')) {
      // Slot already taken means a booking already exists for this slot — treat as written.
      return jsonOk({ status: 'duplicate' });
    }
    return jsonError(err instanceof Error ? err.message : 'Internal server error', 500);
  }
};
