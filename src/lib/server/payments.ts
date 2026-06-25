/**
 * src/lib/server/payments.ts
 * Central-payments adapter. When USE_CENTRAL_PAYMENTS is on (and the PAYMENTS
 * service binding + CLIENT_USER_ID are present), booking endpoints route Stripe
 * operations through the platform-owned somi-payments Worker (Connect direct
 * charges, 8% application fee) instead of holding a per-client Stripe key. When
 * off, the legacy single-account Stripe path runs unchanged (the live demo).
 */
import type { Env } from './config.ts';

export interface CentralIntent {
  clientSecret: string | null;
  paymentIntentId: string;
  stripeAccount?: string;
  publishableKey?: string;
}
export interface CentralIntentStatus {
  id: string;
  status: string;
  amount: number;
  currency: string;
  metadata: Record<string, string>;
}

/** True when this site should route payments through somi-payments. */
export function useCentralPayments(env: Env): boolean {
  return env.USE_CENTRAL_PAYMENTS === 'true' && !!env.PAYMENTS && !!env.CLIENT_USER_ID;
}

class PaymentsError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

async function call<T>(env: Env, path: string, init: RequestInit): Promise<T> {
  const res = await env.PAYMENTS!.fetch(`https://payments${path}`, init);
  const json = (await res.json().catch(() => ({}))) as { error?: string };
  if (!res.ok) throw new PaymentsError(json?.error || `payments ${res.status}`, res.status);
  return json as unknown as T;
}

export function createCentralIntent(
  env: Env,
  args: { amountCents: number; currency: string; metadata: Record<string, string>; receiptEmail?: string },
): Promise<CentralIntent> {
  return call<CentralIntent>(env, '/intents/create', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ulid: env.CLIENT_USER_ID, ...args }),
  });
}

export function retrieveCentralIntent(env: Env, id: string): Promise<CentralIntentStatus> {
  const q = `?ulid=${encodeURIComponent(env.CLIENT_USER_ID!)}`;
  return call<CentralIntentStatus>(env, `/intents/${encodeURIComponent(id)}${q}`, { method: 'GET' });
}

export function updateCentralIntent(
  env: Env,
  id: string,
  args: { amountCents: number; metadata?: Record<string, string> },
): Promise<{ id: string; amount: number; applicationFeeAmount: number }> {
  return call(env, `/intents/${encodeURIComponent(id)}/update`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ulid: env.CLIENT_USER_ID, ...args }),
  });
}
