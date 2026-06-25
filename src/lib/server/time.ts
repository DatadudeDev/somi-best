/**
 * src/lib/server/time.ts
 * Timezone-aware date helpers for availability math.
 *
 * Replaces Saje's hard-coded Calgary UTC offset with an IANA timezone read
 * from the TIMEZONE env var (default America/Denver), so today's date and the
 * current hour are computed in the client's local time wherever they operate.
 */

/** Today's date as YYYY-MM-DD in the given IANA timezone. */
export function todayInTimezone(timezone: string, now: Date = new Date()): string {
  // en-CA formats as YYYY-MM-DD.
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now);
}

/** Current hour (0–23) in the given IANA timezone. */
export function currentHourInTimezone(timezone: string, now: Date = new Date()): number {
  const hourStr = new Intl.DateTimeFormat('en-GB', {
    timeZone: timezone,
    hour: '2-digit',
    hourCycle: 'h23',
  }).format(now);
  const hour = parseInt(hourStr, 10);
  return Number.isFinite(hour) ? hour % 24 : 0;
}

/** Day of week (0=Sun … 6=Sat) for a YYYY-MM-DD string, TZ-independent. */
export function dayOfWeek(dateStr: string): number {
  // Noon UTC avoids any timezone edge cases around midnight.
  return new Date(`${dateStr}T12:00:00Z`).getUTCDay();
}

/** True for Saturday/Sunday. */
export function isWeekend(dateStr: string): boolean {
  const dow = dayOfWeek(dateStr);
  return dow === 0 || dow === 6;
}

