/**
 * src/lib/booking/constants.ts
 * Shared constants for pricing, durations, time slots — used by Book.tsx.
 */

import { HOST_TURNOVER_PRICES, hostTurnoverPrice } from '../../data/pricing.ts';

type HomeSize = '1br' | '2br' | '3br' | '4br';

// Re-export for consumers that import from this module
export { HOST_TURNOVER_PRICES, hostTurnoverPrice };

// ── Service display key → ServiceType ─────────────────────────────────────────
// The booking form uses display strings ("Essential", "Signature", "Premier", "Ultimate").
// Map them to lowercase canonical keys.
export const SERVICE_DISPLAY_TO_KEY: Record<string, string> = {
  Essential: 'essential',
  Signature: 'signature',
  Premier: 'premier',
  Ultimate: 'ultimate',
  Deep: 'ultimate',
  essential: 'essential',
  signature: 'signature',
  premier: 'premier',
  ultimate: 'ultimate',
  deep: 'ultimate',
};

// ── Home size key mapping ─────────────────────────────────────────────────────
// Front-end uses s1/s2/s3/s4 keys; DB stores 1br/2br/3br/4br.
export const HOME_SIZE_KEY_TO_TYPE: Record<string, HomeSize> = {
  s1: '1br',
  s2: '2br',
  s3: '3br',
  s4: '4br',
};

// Reverse mapping (db → form key)
export const HOME_SIZE_TYPE_TO_KEY: Record<string, string> = {
  studio: 'studio',
  '1br': 's1',
  '2br': 's2',
  '3br': 's3',
  '4br': 's4',
  '5br_plus': 's4',
};

// ── Prices (dollars) ──────────────────────────────────────────────────────────
// SERVER pricing source of truth — create-intent reads these via getBasePrice.
// Mirrors src/data/pricing.ts — BEST Therapeutics recovery protocol prices.
export const PRICES: Record<string, Record<string, number>> = {
  essential: { s1: 79, s2: 79, s3: 79, s4: 79 },
  signature: { s1: 119, s2: 119, s3: 119, s4: 119 },
  premier: { s1: 159, s2: 159, s3: 159, s4: 159 },
  ultimate: { s1: 209, s2: 209, s3: 209, s4: 209 },
  deep: { s1: 209, s2: 209, s3: 209, s4: 209 },
};
export function getBasePrice(service: string, homeSize: string): number {
  const svc = service.toLowerCase();
  // homeSize may be s1/s2/s3/s4 or 1br/2br/3br/4br
  const key = HOME_SIZE_TYPE_TO_KEY[homeSize] ?? homeSize;
  return PRICES[svc]?.[key] ?? 0;
}

// ── Business mode pricing helpers ─────────────────────────────────
// Business bookings use HOST_TURNOVER_PRICES (10% off residential, rounded).
// Service key gets a biz_ prefix in the DB (biz_essential, biz_signature, biz_deep).

/** Prefix applied to the service column in D1 for business bookings. */
export const BIZ_SERVICE_PREFIX = 'biz_';

/** True when a stored service key is a business booking. */
export function isBizService(service: string): boolean {
  return service.startsWith(BIZ_SERVICE_PREFIX);
}

/**
 * Map from the base service key (essential/signature/deep) to the host tier ID
 * used in HOST_TURNOVER_PRICES.
 */
const BIZ_TIER_MAP: Record<string, string> = {
  essential: 'essentials',
  signature: 'premium',
  premier: 'extended',
  ultimate: 'ultimate',
  deep: 'ultimate',
};

/**
 * Return the base price in CAD dollars for a booking, choosing between
 * residential PRICES and HOST_TURNOVER_PRICES based on `mode`.
 *
 * @param service  Base service key — essential | signature | deep (no biz_ prefix)
 * @param homeSize Home size key — s1/s2/s3/s4 or 1br/2br/3br/4br
 * @param mode     'residential' (default) | 'business'
 */
export function getBasePriceForMode(
  service: string,
  homeSize: string,
  mode: string = 'residential',
): number {
  if (mode === 'business') {
    // Strip biz_ prefix if caller accidentally passes it
    const baseSvc = service.toLowerCase().replace(BIZ_SERVICE_PREFIX, '');
    const tierId = BIZ_TIER_MAP[baseSvc] ?? baseSvc;
    const sizeKey = HOME_SIZE_TYPE_TO_KEY[homeSize] ?? homeSize;
    return hostTurnoverPrice(tierId, sizeKey as 's1' | 's2' | 's3' | 's4') ?? 0;
  }
  return getBasePrice(service, homeSize);
}

// ── Durations (hours) ─────────────────────────────────────────────────────────
export const DURATIONS: Record<string, Record<string, number>> = {
  essential: { s1: 0.75, s2: 0.75, s3: 0.75, s4: 0.75 },
  signature: { s1: 1, s2: 1, s3: 1, s4: 1 },
  premier: { s1: 1.5, s2: 1.5, s3: 1.5, s4: 1.5 },
  ultimate: { s1: 2, s2: 2, s3: 2, s4: 2 },
  deep: { s1: 2, s2: 2, s3: 2, s4: 2 },
};

export function getDuration(service: string, homeSize: string): number {
  const svc = service.toLowerCase();
  const key = HOME_SIZE_TYPE_TO_KEY[homeSize] ?? homeSize;
  return DURATIONS[svc]?.[key] ?? 3;
}

// ── Add-on prices (dollars) ───────────────────────────────────────────────────
// Zeroed (mirrors src/data/pricing.ts) so a test charge equals exactly the plan
// price. calcAddOnTotal therefore always contributes $0 server-side.
export const ADDON_PRICES: Record<string, number> = {
  'mobility-ball': 30,
  'twin-mobility-ball': 40,
  'foam-roller': 40,
  'power-bottle': 25,
  'trainer-bands': 50,
  'personalized-protocol': 20,
};

// Per-unit add-ons (price × quantity)
export const ADDON_PER_UNIT = new Set<string>();

export function calcAddOnTotal(addOns: Array<{ id: string; quantity?: number }>): number {
  return addOns.reduce((sum, a) => {
    const price = ADDON_PRICES[a.id] ?? 0;
    const qty = a.quantity ?? 1;
    return sum + price * qty;
  }, 0);
}

// ── Time slots ────────────────────────────────────────────────────────────────
// Wed/Thu only · 6 AM – 9 PM (see business-hours.ts)
export {
  ALL_SLOT_HOURS,
  END_OF_DAY_HOUR,
  getAvailableStartHours,
  isBookableDay,
  BUSINESS_START_HOUR,
  BUSINESS_END_HOUR,
} from './business-hours.ts';

// ── Daily capacity cap ────────────────────────────────────────────────────────
export const DEFAULT_DAILY_CAPACITY = 4;

// ── Calgary timezone offset ───────────────────────────────────────────────────
// Calgary is Mountain Time: UTC-7 (MDT) / UTC-6 (MST). We use a fixed -6
// for simplicity (same as the existing availability code).
export const CALGARY_OFFSET_HOURS = 6;

/**
 * Return today's date string (YYYY-MM-DD) in Calgary time.
 */
export function todayCalgary(): string {
  const now = Date.now() - CALGARY_OFFSET_HOURS * 60 * 60 * 1000;
  return new Date(now).toISOString().split('T')[0];
}
