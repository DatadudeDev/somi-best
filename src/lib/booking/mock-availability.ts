/**
 * Local availability for template dev — used when booking APIs are not deployed.
 * Mirrors business-hours.ts (Wed/Thu · 6 AM – 9 PM).
 */
import { DURATIONS, type Pkg, type SizeKey } from '../../data/pricing';
import {
  getAvailableStartHours,
  hourToLabel,
  endTimeLabel,
  isBookableDay,
} from './business-hours';

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
  return DURATIONS[pkg as Pkg]?.[size as SizeKey] ?? 3;
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

/** True when live booking APIs should be called (disabled in template by default). */
export function isBookingApiEnabled(): boolean {
  return import.meta.env.VITE_USE_BOOKING_API === 'true';
}
