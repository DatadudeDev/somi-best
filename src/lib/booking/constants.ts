/**
 * Booking constants — pricing, durations, size keys, add-ons.
 * Mirrors src/data/pricing.ts for server-side create-intent.
 */

import { BUSINESS_TIER_PRICES, businessTierPrice } from '../../data/pricing.ts';

export type SizeKey = 's1' | 's2' | 's3' | 's4';

export { BUSINESS_TIER_PRICES, businessTierPrice };

export const SERVICE_DISPLAY_TO_KEY: Record<string, string> = {
  Tier1: 'tier1',
  Tier2: 'tier2',
  Tier3: 'tier3',
  Tier4: 'tier4',
  tier1: 'tier1',
  tier2: 'tier2',
  tier3: 'tier3',
  tier4: 'tier4',
};

const VALID_SIZE_KEYS = new Set<string>(['s1', 's2', 's3', 's4']);

/** Normalize a size key from URL/API (must be s1–s4). */
export function normalizeSizeKey(sizeKey: string): SizeKey {
  return VALID_SIZE_KEYS.has(sizeKey) ? (sizeKey as SizeKey) : 's1';
}

export const PRICES: Record<string, Record<SizeKey, number>> = {
  tier1: { s1: 79, s2: 79, s3: 79, s4: 79 },
  tier2: { s1: 119, s2: 119, s3: 119, s4: 119 },
  tier3: { s1: 159, s2: 159, s3: 159, s4: 159 },
  tier4: { s1: 209, s2: 209, s3: 209, s4: 209 },
};

export function getBasePrice(service: string, sizeKey: string): number {
  const svc = service.toLowerCase();
  const key = normalizeSizeKey(sizeKey);
  return PRICES[svc]?.[key] ?? 0;
}

export const BIZ_SERVICE_PREFIX = 'biz_';

export function isBizService(service: string): boolean {
  return service.startsWith(BIZ_SERVICE_PREFIX);
}

const BIZ_TIER_MAP: Record<string, string> = {
  tier1: 'business_t1',
  tier2: 'business_t2',
  tier3: 'business_t3',
  tier4: 'business_t4',
};

export type BookingMode = 'individual' | 'business';

export function getBasePriceForMode(
  service: string,
  sizeKey: string,
  mode: BookingMode = 'individual',
): number {
  if (mode === 'business') {
    const baseSvc = service.toLowerCase().replace(BIZ_SERVICE_PREFIX, '');
    const tierId = BIZ_TIER_MAP[baseSvc] ?? baseSvc;
    return businessTierPrice(tierId, normalizeSizeKey(sizeKey)) ?? 0;
  }
  return getBasePrice(service, sizeKey);
}

export const DURATIONS: Record<string, Record<SizeKey, number>> = {
  tier1: { s1: 0.75, s2: 0.75, s3: 0.75, s4: 0.75 },
  tier2: { s1: 1, s2: 1, s3: 1, s4: 1 },
  tier3: { s1: 1.5, s2: 1.5, s3: 1.5, s4: 1.5 },
  tier4: { s1: 2, s2: 2, s3: 2, s4: 2 },
};

export function getDuration(service: string, sizeKey: string): number {
  const svc = service.toLowerCase();
  const key = normalizeSizeKey(sizeKey);
  return DURATIONS[svc]?.[key] ?? 3;
}

export const ADDON_PRICES: Record<string, number> = {
  'mobility-ball': 30,
  'twin-mobility-ball': 40,
  'foam-roller': 40,
  'power-bottle': 25,
  'trainer-bands': 50,
  'personalized-protocol': 20,
};

export const ADDON_PER_UNIT = new Set<string>();

export function calcAddOnTotal(addOns: Array<{ id: string; quantity?: number }>): number {
  return addOns.reduce((sum, a) => {
    const price = ADDON_PRICES[a.id] ?? 0;
    const qty = a.quantity ?? 1;
    return sum + price * qty;
  }, 0);
}

export {
  ALL_SLOT_HOURS,
  END_OF_DAY_HOUR,
  getAvailableStartHours,
  isBookableDay,
  BUSINESS_START_HOUR,
  BUSINESS_END_HOUR,
} from './business-hours.ts';

export const DEFAULT_DAILY_CAPACITY = 4;
export const CALGARY_OFFSET_HOURS = 6;

export function todayCalgary(): string {
  const now = Date.now() - CALGARY_OFFSET_HOURS * 60 * 60 * 1000;
  return new Date(now).toISOString().split('T')[0];
}
