/**

 * functions/api/bookings/update-intent.ts

 * PATCH /api/bookings/update-intent

 *

 * Re-prices the booking server-side and updates the open PaymentIntent's

 * amount + metadata when the cart or contact info changes on checkout.

 */



import type { Env } from '../../../src/lib/server/config.ts';

import { resolveConfig } from '../../../src/lib/server/config.ts';

import { jsonOk, jsonError } from '../../../src/lib/server/http.ts';

import {

  resolveService,

  computePricing,

  normalizeTime,

  buildIntentMetadata,

  buildEmailMetadata,

  type AddOnInput,

  type BookingMode,

  type BookingWritePayload,

} from '../../../src/lib/server/booking.ts';

import { getDuration } from '../../../src/lib/booking/constants.ts';

import { useCentralPayments, updateCentralIntent } from '../../../src/lib/server/payments.ts';



interface UpdateIntentBody {

  paymentIntentId?: string;

  service?: string;

  sizeKey?: string;

  date?: string;

  time?: string;

  name?: string;

  email?: string;

  phone?: string;

  serviceAddress?: string;

  notes?: string;

  addOns?: AddOnInput[];

  promoCode?: string;

  frequency?: string;

  visitCount?: number;

  mode?: 'individual' | 'business';

}



export const onRequestPatch: PagesFunction<Env> = async (context) => {

  try {

    const env = context.env;

    const config = resolveConfig(env);

    const body = await context.request.json() as UpdateIntentBody;

    const { paymentIntentId, service, sizeKey, date, time } = body;



    if (!paymentIntentId || !service || !sizeKey || !date || !time) {

      return jsonError('Missing required fields: paymentIntentId, service, sizeKey, date, time');

    }



    const mode: BookingMode = body.mode === 'business' ? 'business' : 'individual';

    const resolved = resolveService(service, sizeKey, mode);

    if (!resolved) return jsonError(`Invalid service: ${service}`);



    const normalizedTime = normalizeTime(time);

    const duration = getDuration(resolved.baseServiceKey, sizeKey);



    const priced = await computePricing(

      env.DB, resolved.baseServiceKey, sizeKey, mode, body.addOns ?? [], body.promoCode,

      { frequency: body.frequency, visitCount: body.visitCount },

    );

    if (!priced.ok) return jsonError(priced.error, 400);

    if (priced.pricing.totalCents <= 0) {

      return jsonError('Updated total is $0 — use the free booking flow', 409);

    }



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

      basePriceCents: priced.pricing.basePriceCents,

      addOnTotalCents: priced.pricing.addOnTotalCents,

      discountPct: priced.pricing.discountPct,

      totalCents: priced.pricing.totalCents,

      promoCodeId: priced.pricing.promoCodeRow?.id ?? null,

      stripePaymentIntentId: paymentIntentId,

      stripeCustomerId: null,

    };



    const updateMeta = {

      ...buildIntentMetadata(payload),

      ...buildEmailMetadata(payload, config),

    };



    if (useCentralPayments(env)) {

      await updateCentralIntent(env, paymentIntentId, {

        amountCents: priced.pricing.chargeCents,

        metadata: updateMeta,

      });

      return jsonOk({ total: priced.pricing.chargeCents });

    }



    const Stripe = (await import('stripe')).default;

    const stripe = new Stripe(env.STRIPE_SECRET_KEY, {

      // @ts-expect-error Stripe fetch HTTP client for the Cloudflare Workers runtime

      httpClient: Stripe.createFetchHttpClient(),

    });



    const updateParams: import('stripe').Stripe.PaymentIntentUpdateParams = {

      amount: priced.pricing.chargeCents,

      currency: config.currency,

      metadata: updateMeta,

    };



    if (body.name?.trim() && body.email?.trim() && body.phone?.trim()) {

      const digits = body.phone.replace(/\D/g, '');

      const e164Phone = digits.length === 10 ? `+1${digits}` : `+${digits}`;

      const existing = await stripe.customers.list({ email: body.email.toLowerCase(), limit: 1 });

      const customerId = existing.data.length > 0

        ? existing.data[0].id

        : (await stripe.customers.create({

            name: body.name.trim(),

            email: body.email.toLowerCase(),

            phone: e164Phone,

          })).id;

      updateParams.customer = customerId;

      if (body.email) {

        updateParams.receipt_email = body.email.toLowerCase();

      }

    }



    await stripe.paymentIntents.update(paymentIntentId, updateParams);



    return jsonOk({ total: priced.pricing.chargeCents });

  } catch (err) {

    console.error('[bookings/update-intent]', err);

    return jsonError(err instanceof Error ? err.message : 'Internal server error', 500);

  }

};


