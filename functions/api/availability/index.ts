/**
 * functions/api/availability/index.ts
 * GET /api/availability?date=&service=&homeSize=
 *
 * Returns the bookable start times for a single day:
 *   { date, available, blocked, slots: [{ hour, label, endsBy }], bookingCount, capacity }
 *
 * Availability = weekday · not past · not blocked · confirmed bookings under the
 * settings.capacity_cap · start hours whose duration finishes by end of day.
 */

import type { Env } from '../../../src/lib/server/config.ts';
import { resolveConfig } from '../../../src/lib/server/config.ts';
import { jsonOk, jsonError } from '../../../src/lib/server/http.ts';
import { todayInTimezone, currentHourInTimezone, isWeekend } from '../../../src/lib/server/time.ts';
import { getCapacityCap } from '../../../src/lib/server/booking.ts';
import { getDuration, getAvailableStartHours } from '../../../src/lib/booking/constants.ts';

interface AvailabilitySlot {
  hour: number;
  label: string;
  endsBy: string;
}

interface DayAvailabilityResponse {
  date: string;
  available: boolean;
  blocked: boolean;
  slots: AvailabilitySlot[];
  bookingCount: number;
  capacity: number;
}

function hourToLabel(hour: number): string {
  if (hour < 12) return `${hour}:00 AM`;
  if (hour === 12) return '12:00 PM';
  return `${hour - 12}:00 PM`;
}

function endTimeLabel(startHour: number, durationHours: number): string {
  const endHour24 = startHour + durationHours;
  const endHourWhole = Math.floor(endHour24);
  const endMin = Math.round((endHour24 - endHourWhole) * 60);
  const isPM = endHourWhole >= 12;
  const displayHour = endHourWhole > 12 ? endHourWhole - 12 : endHourWhole === 0 ? 12 : endHourWhole;
  const minStr = endMin > 0 ? `:${String(endMin).padStart(2, '0')}` : ':00';
  return `${displayHour}${minStr} ${isPM ? 'PM' : 'AM'}`;
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const env = context.env;
  const config = resolveConfig(env);
  const url = new URL(context.request.url);
  const date = url.searchParams.get('date');
  const service = url.searchParams.get('service') ?? 'essential';
  const homeSize = url.searchParams.get('homeSize') ?? 's2';

  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return jsonError('date is required (YYYY-MM-DD)');
  }

  const capacity = await getCapacityCap(env.DB);
  const empty = (blocked: boolean, bookingCount: number): DayAvailabilityResponse => ({
    date, available: false, blocked, slots: [], bookingCount, capacity,
  });

  // Weekend / past-day gating (timezone-aware).
  if (isWeekend(date)) return jsonOk(empty(false, 0));
  const today = todayInTimezone(config.timezone);
  if (date < today) return jsonOk(empty(false, 0));

  // Blocked date.
  let blocked = false;
  try {
    const row = await env.DB.prepare(`SELECT id FROM blocked_dates WHERE date = ? LIMIT 1`)
      .bind(date).first<{ id: string }>();
    blocked = !!row;
  } catch (err) {
    console.warn('[availability] blocked_dates query failed:', err);
  }
  if (blocked) return jsonOk(empty(true, 0));

  // Confirmed bookings for the day + the hours already taken.
  let bookingCount = 0;
  let bookedHours = new Set<number>();
  try {
    const countRow = await env.DB.prepare(
      `SELECT COUNT(*) AS cnt FROM bookings WHERE date = ? AND status = 'confirmed'`,
    ).bind(date).first<{ cnt: number }>();
    bookingCount = countRow?.cnt ?? 0;

    if (bookingCount < capacity) {
      const rows = await env.DB.prepare(
        `SELECT time FROM bookings WHERE date = ? AND status = 'confirmed'`,
      ).bind(date).all<{ time: string }>();
      bookedHours = new Set((rows.results ?? []).map((r) => parseInt(r.time.split(':')[0], 10)));
    }
  } catch (err) {
    console.warn('[availability] bookings query failed:', err);
  }

  if (bookingCount >= capacity) return jsonOk(empty(false, bookingCount));

  const duration = getDuration(service, homeSize);
  const minHour = date === today ? currentHourInTimezone(config.timezone) + 1 : 0;

  const slots: AvailabilitySlot[] = getAvailableStartHours(duration)
    .filter((h) => h >= minHour && !bookedHours.has(h))
    .map((h) => ({ hour: h, label: hourToLabel(h), endsBy: endTimeLabel(h, duration) }));

  return jsonOk({
    date,
    available: slots.length > 0,
    blocked: false,
    slots,
    bookingCount,
    capacity,
  });
};

