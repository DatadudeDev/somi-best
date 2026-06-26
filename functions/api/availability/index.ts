/**
 * functions/api/availability/index.ts
 * GET /api/availability?date=&service=&homeSize=
 *
 * Returns the bookable start times for a single day:
 *   { date, available, blocked, slots: [{ hour, label, endsBy }], bookingCount, capacity }
 *
 * Availability = bookable day (Wed/Thu) · not past · not blocked · confirmed bookings under the
 * settings.capacity_cap · start hours whose duration finishes by end of day.
 */

import type { Env } from '../../../src/lib/server/config.ts';
import { resolveConfig } from '../../../src/lib/server/config.ts';
import { jsonOk, jsonError } from '../../../src/lib/server/http.ts';
import { todayInTimezone, currentHourInTimezone } from '../../../src/lib/server/time.ts';
import { getCapacityCap } from '../../../src/lib/server/booking.ts';
import { getDuration } from '../../../src/lib/booking/constants.ts';
import {
  getAvailableStartHours,
  hourToLabel,
  endTimeLabel,
  isBookableDay,
  minStartHourForDate,
} from '../../../src/lib/booking/business-hours.ts';

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

  // Non-bookable day / past-day gating (timezone-aware).
  if (!isBookableDay(date)) return jsonOk(empty(false, 0));
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
  const minHour = minStartHourForDate(date, today, currentHourInTimezone(config.timezone));

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

