import { loadStripe, type Stripe } from '@stripe/stripe-js';

const STRIPE_PUBLISHABLE_KEY = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY as string | undefined;

export const hasStripeKey = Boolean(STRIPE_PUBLISHABLE_KEY?.trim());

let stripePromise: Promise<Stripe | null> | null = null;
let warnedMissingKey = false;

export function getStripe(): Promise<Stripe | null> | null {
  if (!hasStripeKey) {
    if (import.meta.env.DEV && !warnedMissingKey) {
      warnedMissingKey = true;
      console.info(
        '[stripe] No VITE_STRIPE_PUBLISHABLE_KEY — checkout preview only. '
        + 'Copy .env.example to .env and add your pk_test_ key.',
      );
    }
    return null;
  }

  if (!stripePromise) {
    stripePromise = loadStripe(STRIPE_PUBLISHABLE_KEY!);
  }
  return stripePromise;
}

/**
 * Load Stripe.js for a specific publishable key + connected account. Used by the
 * central-payments (Connect) path: create-intent returns the platform
 * publishable key and the merchant's connected account, and Stripe.js must be
 * initialized with `{ stripeAccount }` so the PaymentElement targets the
 * connected account's direct charge.
 */
export function getStripeFor(publishableKey: string, stripeAccount?: string): Promise<Stripe | null> {
  return loadStripe(publishableKey, stripeAccount ? { stripeAccount } : undefined);
}
