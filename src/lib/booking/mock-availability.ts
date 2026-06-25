/**
 * Local availability for template dev — used when booking APIs are not deployed.
 */
import { DURATIONS, type Pkg, type SizeKey } from '../../data/pricing';

const SLOT_HOURS = [8, 9, 10, 11, 12, 13, 14, 15, 16, 17];
const END_OF_DAY = 19;

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

function formatHour(h: number): string {
  const isPM = h >= 12;
  const display = h > 12 ? h - 12 : h === 0 ? 12 : h;
  return `${display}:00 ${isPM ? 'PM' : 'AM'}`;
}

function formatEndTime(startHour: number, duration: number): string {
  const endHour24 = startHour + duration;
  const endHourWhole = Math.floor(endHour24);
  const endMin = Math.round((endHour24 - endHourWhole) * 60);
  const isPM = endHourWhole >= 12;
  const displayHour = endHourWhole > 12 ? endHourWhole - 12 : endHourWhole === 0 ? 12 : endHourWhole;
  const minStr = endMin > 0 ? `:${String(endMin).padStart(2, '0')}` : ':00';
  return `${displayHour}${minStr} ${isPM ? 'PM' : 'AM'}`;
}

function durationHours(pkg: string, size: string): number {
  return DURATIONS[pkg as Pkg]?.[size as SizeKey] ?? 3;
}

export function getMockDaySlots(pkg: string, size: string): MockAvailabilitySlot[] {
  const dur = durationHours(pkg, size);
  return SLOT_HOURS
    .filter(h => h + dur <= END_OF_DAY)
    .map(h => ({
      hour: h,
      label: formatHour(h),
      endsBy: formatEndTime(h, dur),
    }));
}

/** Weekdays in month with open slots (template preview calendar). */
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
    const dow = date.getDay();
    if (dow === 0) continue;
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
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
