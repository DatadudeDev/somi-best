/**
 * src/lib/booking/booking-helpers.ts
 * Pricing/duration lookups, time-slot + calendar + frequency helpers for the
 * booking flow (extracted verbatim from Book.tsx).
 */
import { PRICES, DURATIONS, type Frequency, type SizeKey } from '../../data/pricing';
import type { SlotSelection } from './booking-types';

/* ── price / duration ── */
export function getPrice(pkg: string, size: string) {
  return PRICES[pkg as keyof typeof PRICES]?.[size as SizeKey] || 0;
}

export function getDuration(pkg: string, size: string) {
  return DURATIONS[pkg as keyof typeof DURATIONS]?.[size as SizeKey] || 3;
}

/* All possible start times — fallback while loading from API */
export const ALL_TIME_SLOTS = [
  { label: '8:00 AM', hour: 8 },
  { label: '9:00 AM', hour: 9 },
  { label: '10:00 AM', hour: 10 },
  { label: '11:00 AM', hour: 11 },
  { label: '12:00 PM', hour: 12 },
  { label: '1:00 PM', hour: 13 },
  { label: '2:00 PM', hour: 14 },
  { label: '3:00 PM', hour: 15 },
  { label: '4:00 PM', hour: 16 },
  { label: '5:00 PM', hour: 17 },
];
export const END_OF_DAY = 19;

export function getAvailableSlotsFallback(pkg: string, size: string) {
  const dur = getDuration(pkg, size);
  return ALL_TIME_SLOTS.filter(s => s.hour + dur <= END_OF_DAY);
}

export function formatCompletionTime(startLabel: string, pkg: string, size: string): string {
  const slot = ALL_TIME_SLOTS.find(s => s.label === startLabel);
  if (!slot) return '';
  const dur = getDuration(pkg, size);
  const endHour24 = slot.hour + dur;
  const endHourWhole = Math.floor(endHour24);
  const endMin = Math.round((endHour24 - endHourWhole) * 60);
  const isPM = endHourWhole >= 12;
  const displayHour = endHourWhole > 12 ? endHourWhole - 12 : endHourWhole === 0 ? 12 : endHourWhole;
  const minStr = endMin > 0 ? `:${String(endMin).padStart(2, '0')}` : ':00';
  return `${displayHour}${minStr} ${isPM ? 'PM' : 'AM'}`;
}

/* ── calendar helpers ── */
export function getMonthData(year: number, month: number) {
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  return { firstDay, daysInMonth };
}

export const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December'];
export const DAY_HEADERS = ['Su','Mo','Tu','We','Th','Fr','Sa'];

const WEEKDAY_NAMES_LONG = [
  'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday',
] as const;

export const CAL_SELECTED_LABEL_FONT = '9.9px';

function ordinalOf(n: number): string {
  const mod100 = n % 100;
  if (mod100 >= 11 && mod100 <= 13) return `${n}th`;
  const mod10 = n % 10;
  if (mod10 === 1) return `${n}st`;
  if (mod10 === 2) return `${n}nd`;
  if (mod10 === 3) return `${n}rd`;
  return `${n}th`;
}

function weekdayOccurrenceInMonth(year: number, month: number, day: number): number {
  const targetDow = new Date(year, month, day).getDay();
  let count = 0;
  for (let d = 1; d <= day; d++) {
    if (new Date(year, month, d).getDay() === targetDow) count++;
  }
  return count;
}

/** Calendar cell / chip label for a selected day */
export function formatCalendarSelectionLabel(sel: SlotSelection, frequency: Frequency): string {
  const { year, month, day, time } = sel;
  const weekday = WEEKDAY_NAMES_LONG[new Date(year, month, day).getDay()];
  const hasTime = !!time;

  if (frequency === 'one-time') {
    if (!hasTime) return 'pick time ↓';
    return `${time} @ ${weekday}, ${MONTH_NAMES[month]} ${day}`;
  }

  const ordinalWeek = ordinalOf(weekdayOccurrenceInMonth(year, month, day));

  if (frequency === 'monthly') {
    const recur = `Every ${ordinalWeek} ${weekday} each month`;
    return hasTime ? `${time} @ ${recur}` : recur;
  }

  if (frequency === 'weekly') {
    const recur = `Every ${weekday}`;
    return hasTime ? `${time} @ ${recur}` : recur;
  }

  if (frequency === 'biweekly') {
    const recur = `Every other ${weekday}`;
    return hasTime ? `${time} @ ${recur}` : recur;
  }

  return hasTime ? `${time} @ ${weekday}` : 'pick time ↓';
}

/* ── frequency config ── */
export const MAX_BOOKING_SESSIONS = 10;

export const FREQUENCY_OPTIONS: { value: Frequency; label: string; description: string }[] = [
  { value: 'one-time', label: 'One-time', description: 'Book up to 10 sessions' },
  { value: 'weekly', label: 'Weekly', description: 'Pick up to 10 days · Save 15%' },
  { value: 'biweekly', label: 'Bi-weekly', description: 'Pick up to 10 days · Save 10%' },
  { value: 'monthly', label: 'Monthly', description: 'Up to 10 days each month' },
];

export function getMaxSlots(): number {
  return MAX_BOOKING_SESSIONS;
}
