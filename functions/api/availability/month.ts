/**
 * functions/api/availability/month.ts
 * GET /api/availability/month?year=&month=&service=&homeSize=
 *
 * Calendar view: per-day slot summary for a whole month in one pass.
 * Response: { year, month, days: { "YYYY-MM-DD": { slotCount, available, blocked, bookingCount } } }
 */

import type { Env } from '../../../src/lib/server/config.ts';
import { resolveConfig } from '../../../src/lib/server/config.ts';
import { jsonOk, jsonError } from '../../../src/lib/server/http.ts';
import { todayInTimezone, currentHourInTimezone, dayOfWeek } from '../../../src/lib/server/time.ts';
import { getCapacityCap } from '../../../src/lib/server/booking.ts';
import { getDuration, getAvailableStartHours } from '../../../src/lib/booking/constants.ts';

interface DaySummary {
  slotCount: number;
  available: boolean;
  blocked: boolean;
  bookingCount: number;
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const env = context.env;
  const config = resolveConfig(env);
  const url = new URL(context.request.url);
  const yearParam = url.searchParams.get('year');
  const monthParam = url.searchParams.get('month');
  const service = url.searchParams.get('service') ?? 'essential';
  const homeSize = url.searchParams.get('homeSize') ?? 's2';

  if (!yearParam || !monthParam) return jsonError('year and month are required');
  const year = parseInt(yearParam, 10);
  const month = parseInt(monthParam, 10); // 1-indexed
  if (isNaN(year) || isNaN(month) || month < 1 || month > 12) {
    return jsonError('Invalid year or month');
  }

  const monthStr = String(month).padStart(2, '0');
  const daysInMonth = new Date(year, month, 0).getDate();
  const startDate = `${year}-${monthStr}-01`;
  const endDate = `${year}-${monthStr}-${String(daysInMonth).padStart(2, '0')}`;

  // Blocked dates in range.
  let blockedSet = new Set<string>();
  try {
    const rows = await env.DB.prepare(
      `SELECT date FROM blocked_dates WHERE date >= ? AND date <= ?`,
    ).bind(startDate, endDate).all<{ date: string }>();
    blockedSet = new Set((rows.results ?? []).map((r) => r.date));
  } catch (err) {
    console.warn('[availability/month] blocked_dates query failed:', err);
  }

  // Booking counts + booked hours per day.
  const bookingCounts = new Map<string, number>();
  const bookedHoursByDay = new Map<string, Set<number>>();
  try {
    const countRows = await env.DB.prepare(
      `SELECT date, COUNT(*) AS cnt FROM bookings
       WHERE date >= ? AND date <= ? AND status = 'confirmed'
       GROUP BY date`,
    ).bind(startDate, endDate).all<{ date: string; cnt: number }>();
    for (const row of countRows.results ?? []) bookingCounts.set(row.date, row.cnt);

    const slotRows = await env.DB.prepare(
      `SELECT date, time FROM bookings
       WHERE date >= ? AND date <= ? AND status = 'confirmed'`,
    ).bind(startDate, endDate).all<{ date: string; time: string }>();
    for (const row of slotRows.results ?? []) {
      const h = parseInt(row.time.split(':')[0], 10);
      if (!bookedHoursByDay.has(row.date)) bookedHoursByDay.set(row.date, new Set());
      bookedHoursByDay.get(row.date)!.add(h);
    }
  } catch (err) {
    console.warn('[availability/month] bookings query failed:', err);
  }

  const today = todayInTimezone(config.timezone);
  const todayMinHour = today.startsWith(`${year}-${monthStr}-`)
    ? currentHourInTimezone(config.timezone) + 1
    : 0;

  const capacity = await getCapacityCap(env.DB);
  const duration = getDuration(service, homeSize);
  const startHours = getAvailableStartHours(duration);

  const days: Record<string, DaySummary> = {};
  for (let d = 1; d <= daysInMonth; d++) {
    const dayStr = `${year}-${monthStr}-${String(d).padStart(2, '0')}`;

    if (dayStr < today) {
      days[dayStr] = { slotCount: 0, available: false, blocked: false, bookingCount: 0 };
      continue;
    }
    const dow = dayOfWeek(dayStr);
    if (dow === 0 || dow === 6) {
      days[dayStr] = { slotCount: 0, available: false, blocked: false, bookingCount: 0 };
      continue;
    }
    if (blockedSet.has(dayStr)) {
      days[dayStr] = { slotCount: 0, available: false, blocked: true, bookingCount: bookingCounts.get(dayStr) ?? 0 };
      continue;
    }
    const bookingCount = bookingCounts.get(dayStr) ?? 0;
    if (bookingCount >= capacity) {
      days[dayStr] = { slotCount: 0, available: false, blocked: false, bookingCount };
      continue;
    }
    const bookedHours = bookedHoursByDay.get(dayStr) ?? new Set<number>();
    const minHour = dayStr === today ? todayMinHour : 0;
    const slotCount = startHours.filter((h) => h >= minHour && !bookedHours.has(h)).length;
    days[dayStr] = { slotCount, available: slotCount > 0, blocked: false, bookingCount };
  }

  return jsonOk({ year, month, days });
};

