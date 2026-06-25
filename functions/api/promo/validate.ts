/**
 * functions/api/promo/validate.ts
 * POST /api/promo/validate
 *
 * Quick promo check before checkout. Body: { code, service?, basePrice? }.
 * Returns { valid: true, type, value, description, discountAmount?, finalPrice? }
 * or { valid: false, reason }. Redemption (incrementing current_uses) happens
 * later at booking confirmation — not here.
 */

import type { Env } from '../../../src/lib/server/config.ts';
import { jsonOk, jsonError } from '../../../src/lib/server/http.ts';
import type { PromoCodeRow } from '../../../src/lib/server/booking.ts';

interface ValidateBody {
  code?: string;
  service?: string;
  basePrice?: number; // dollars, for discount preview
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const body = await context.request.json() as ValidateBody;
    if (!body.code || typeof body.code !== 'string') {
      return jsonError('code is required');
    }

    const code = body.code.trim().toUpperCase();
    let promo: PromoCodeRow | null;
    try {
      promo = await context.env.DB.prepare(
        `SELECT * FROM promo_codes
         WHERE code = ? COLLATE NOCASE
           AND active = 1
           AND (expires_at IS NULL OR expires_at > strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
         LIMIT 1`,
      ).bind(code).first<PromoCodeRow>();
    } catch (err) {
      console.error('[promo/validate] DB error:', err);
      return jsonError('Promo code validation temporarily unavailable', 503);
    }

    if (!promo) return jsonOk({ valid: false, reason: 'Code not found or inactive' });
    if (promo.max_uses !== null && promo.current_uses >= promo.max_uses) {
      return jsonOk({ valid: false, reason: 'Code has reached its usage limit' });
    }

    let description: string;
    let discountAmount: number | undefined;
    let finalPrice: number | undefined;

    if (promo.type === 'percent_off') {
      description = `${promo.value}% off your booking`;
      if (body.basePrice) discountAmount = Math.round(body.basePrice * (promo.value / 100) * 100) / 100;
    } else if (promo.type === 'fixed_off') {
      const dollars = promo.value / 100;
      description = `$${dollars.toFixed(2)} off your booking`;
      discountAmount = dollars;
    } else if (promo.type === 'free_clean') {
      description = 'Free booking — $0 total';
      discountAmount = body.basePrice;
    } else if (promo.type === 'quote_price') {
      finalPrice = promo.value;
      description = `Custom quote price: $${(promo.value / 100).toFixed(2)}`;
    } else {
      description = 'Discount applied';
    }

    return jsonOk({
      valid: true,
      code: promo.code,
      type: promo.type,
      value: promo.value,
      description,
      discountAmount,
      finalPrice,
    });
  } catch (err) {
    console.error('[promo/validate]', err);
    return jsonError(err instanceof Error ? err.message : 'Internal server error', 500);
  }
};

