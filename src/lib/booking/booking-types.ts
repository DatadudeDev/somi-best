/**
 * src/lib/booking/booking-types.ts
 * Shared TypeScript interfaces for the booking flow (extracted from Book.tsx).
 */

/* ── API availability types ── */
export interface AvailabilitySlot {
  hour: number;
  label: string;
  endsBy: string;
}

export interface MonthDaySummary {
  slotCount: number;
  available: boolean;
  blocked: boolean;
  bookingCount: number;
}

/* ── types for multi-slot selection ── */
export interface SlotSelection {
  day: number;
  month: number;
  year: number;
  time: string | null;
  endsBy?: string;
}

/* ── create-intent response ── */
export interface CreateIntentResponse {
  clientSecret: string | null;
  paymentIntentId?: string;
  customerSessionClientSecret?: string | null;
  stripeAccount?: string;
  publishableKey?: string;
  total: number;
  isFree: boolean;
  breakdown?: {
    basePrice: number;
    addOnTotal: number;
    discountPct: number;
    discountAmount: number;
    total: number;
  };
}

/* ── promo validate response ── */
export interface PromoResponse {
  valid: boolean;
  type?: 'percent_off' | 'fixed_off' | 'complimentary' | 'quote_price';
  value?: number;
  description?: string;
  discountAmount?: number;
  /** For quote_price promos: the approved total in cents (overrides all other pricing) */
  finalPrice?: number;
  reason?: string;
}
