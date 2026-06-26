/**
 * Local availability for template dev — used when booking APIs are not deployed.
 * Mirrors business-hours.ts (Wed/Thu · 6 AM – 9 PM).
 */
import {
  getAvailableStartHours,
  hourToLabel,
  endTimeLabel,
  isBookableDay,
} from './business-hours';
import { getDuration } from './constants';

export interface MockAvailabilitySlot {
  hour: number;
  label: string;
  endsBy: string;
}

export interface MockMonthDaySummary {
  slotCount: number;
  available: boolean;
  blocked: boolean;
  bookingCount: number;
}

function durationHours(pkg: string, size: string): number {
  return getDuration(pkg, size);
}

export function getMockDaySlots(pkg: string, size: string): MockAvailabilitySlot[] {
  const dur = durationHours(pkg, size);
  return getAvailableStartHours(dur).map(h => ({
    hour: h,
    label: hourToLabel(h),
    endsBy: endTimeLabel(h, dur),
  }));
}

/** Bookable days in month (Wed/Thu only). */
export function getMockMonthAvailability(
  year: number,
  month: number,
  pkg: string,
  size: string,
): Record<string, MockMonthDaySummary> {
  const days: Record<string, MockMonthDaySummary> = {};
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const slotCount = getMockDaySlots(pkg, size).length;

  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month, day);
    if (date < today) continue;
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    if (!isBookableDay(dateStr)) continue;
    days[dateStr] = {
      slotCount,
      available: slotCount > 0,
      blocked: false,
      bookingCount: 0,
    };
  }

  return days;
}

/** True when a month summary contains at least one bookable day with open slots. */
export function monthHasAvailability(
  days: Record<string, Pick<MockMonthDaySummary, 'available' | 'slotCount'>>,
): boolean {
  return Object.values(days).some(d => d.available && d.slotCount > 0);
}

/**
 * Scan forward from startYear/startMonth (0-indexed) for the first month
 * with at least one available slot (mock rules — Wed/Thu, not in the past).
 */
export function getFirstAvailableMonth(
  startYear: number,
  startMonth: number,
  pkg: string,
  size: string,
  maxMonthsAhead = 12,
): { year: number; month: number } {
  let year = startYear;
  let month = startMonth;
  for (let i = 0; i < maxMonthsAhead; i++) {
    const days = getMockMonthAvailability(year, month, pkg, size);
    if (monthHasAvailability(days)) return { year, month };
    month++;
    if (month > 11) {
      month = 0;
      year++;
    }
  }
  return { year: startYear, month: startMonth };
}

/** True when live booking APIs should be called (disabled in template by default). */
export function isBookingApiEnabled(): boolean {
  return import.meta.env.VITE_USE_BOOKING_API === 'true';
}
