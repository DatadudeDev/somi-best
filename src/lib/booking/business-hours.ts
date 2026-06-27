/**
 * Clinic operating hours — source of truth for calendar + slot APIs.
 * BEST Therapeutics: Wednesday & Thursday only, 6:00 AM – 9:00 PM.
 */
import { dayOfWeek } from '../server/time.ts';

/** 0=Sun … 6=Sat */
export const BOOKABLE_DAYS_OF_WEEK = [3, 4] as const; // Wednesday, Thursday

export const BUSINESS_START_HOUR = 6;
/** Sessions must finish by 9:00 PM */
export const BUSINESS_END_HOUR = 21;

/** Whole-hour start times from 6 AM up to (but not including) end of day */
export const ALL_SLOT_HOURS = Array.from(
  { length: BUSINESS_END_HOUR - BUSINESS_START_HOUR },
  (_, i) => BUSINESS_START_HOUR + i,
);

/** @deprecated alias used by legacy imports */
export const END_OF_DAY_HOUR = BUSINESS_END_HOUR;

export function isBookableDay(dateStr: string): boolean {
  const dow = dayOfWeek(dateStr);
  return (BOOKABLE_DAYS_OF_WEEK as readonly number[]).includes(dow);
}

export function getAvailableStartHours(duration: number): number[] {
  return ALL_SLOT_HOURS.filter((h) => h + duration <= BUSINESS_END_HOUR);
}

export function minStartHourForDate(
  dateStr: string,
  todayStr: string,
  currentHour: number,
): number {
  const floor = BUSINESS_START_HOUR;
  if (dateStr !== todayStr) return floor;
  return Math.max(floor, currentHour + 1);
}

export function hourToLabel(hour: number): string {
  if (hour < 12) return `${hour}:00 AM`;
  if (hour === 12) return '12:00 PM';
  return `${hour - 12}:00 PM`;
}

export function endTimeLabel(startHour: number, durationHours: number): string {
  const endHour24 = startHour + durationHours;
  const endHourWhole = Math.floor(endHour24);
  const endMin = Math.round((endHour24 - endHourWhole) * 60);
  const isPM = endHourWhole >= 12;
  const displayHour = endHourWhole > 12 ? endHourWhole - 12 : endHourWhole === 0 ? 12 : endHourWhole;
  const minStr = endMin > 0 ? `:${String(endMin).padStart(2, '0')}` : ':00';
  return `${displayHour}${minStr} ${isPM ? 'PM' : 'AM'}`;
}

const SCHEMA_DAY_NAMES = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
] as const;

function hourToSchemaTime(hour: number): string {
  return `${String(hour).padStart(2, '0')}:00`;
}

/** schema.org OpeningHoursSpecification for LocalBusiness JSON-LD */
export function getSchemaOpeningHoursSpecification(): Record<string, unknown>[] {
  return [{
    '@type': 'OpeningHoursSpecification',
    dayOfWeek: BOOKABLE_DAYS_OF_WEEK.map((d) => SCHEMA_DAY_NAMES[d]),
    opens: hourToSchemaTime(BUSINESS_START_HOUR),
    closes: hourToSchemaTime(BUSINESS_END_HOUR),
  }];
}
