/**
 * Calendar event helpers for booking emails and /api/calendar/booking.ics.
 */

export interface CalendarEventParams {
  date: string; // YYYY-MM-DD
  time: string; // HH:MM (24h)
  title: string;
  hours?: number;
  timezone?: string;
  description?: string;
  location?: string;
}

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

/** Format local wall time in `tz` as UTC for ICS DTSTART/DTEND (floating local via TZID). */
function icsLocalStamp(date: string, time: string): { start: string; end: string; tz: string } {
  const [y, m, d] = date.split('-').map((n) => parseInt(n, 10));
  const [hh, mm] = time.split(':').map((n) => parseInt(n, 10));
  const start = `${y}${pad(m)}${pad(d)}T${pad(hh)}${pad(mm ?? 0)}00`;
  return { start, end: start, tz: '' };
}

function addHoursToLocalStamp(start: string, hours: number): string {
  const y = parseInt(start.slice(0, 4), 10);
  const mo = parseInt(start.slice(4, 6), 10) - 1;
  const d = parseInt(start.slice(6, 8), 10);
  const h = parseInt(start.slice(9, 11), 10);
  const mi = parseInt(start.slice(11, 13), 10);
  const dt = new Date(y, mo, d, h, mi, 0);
  dt.setMinutes(dt.getMinutes() + Math.round(hours * 60));
  return `${dt.getFullYear()}${pad(dt.getMonth() + 1)}${pad(dt.getDate())}T${pad(dt.getHours())}${pad(dt.getMinutes())}00`;
}

function escIcs(text: string): string {
  return text.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n');
}

export function buildIcsContent(p: CalendarEventParams): string {
  const tz = p.timezone || 'America/Edmonton';
  const duration = p.hours && p.hours > 0 ? p.hours : 1;
  const { start } = icsLocalStamp(p.date, p.time);
  const end = addHoursToLocalStamp(start, duration);
  const uid = `${p.date}-${p.time}-${p.title.replace(/\s+/g, '-').toLowerCase()}@treytherapy.com`;
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Trey Therapy//Booking//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VTIMEZONE',
    `TZID:${tz}`,
    'END:VTIMEZONE',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${start}Z`,
    `DTSTART;TZID=${tz}:${start}`,
    `DTEND;TZID=${tz}:${end}`,
    `SUMMARY:${escIcs(p.title)}`,
  ];
  if (p.description) lines.push(`DESCRIPTION:${escIcs(p.description)}`);
  if (p.location) lines.push(`LOCATION:${escIcs(p.location)}`);
  lines.push('END:VEVENT', 'END:VCALENDAR');
  return lines.join('\r\n') + '\r\n';
}

export function buildGoogleCalendarUrl(p: CalendarEventParams): string {
  const tz = p.timezone || 'America/Edmonton';
  const duration = p.hours && p.hours > 0 ? p.hours : 1;
  const { start } = icsLocalStamp(p.date, p.time);
  const end = addHoursToLocalStamp(start, duration);
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: p.title,
    dates: `${start}/${end}`,
    ctz: tz,
  });
  if (p.description) params.set('details', p.description);
  if (p.location) params.set('location', p.location);
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

export function buildCalendarIcsUrl(origin: string, p: CalendarEventParams): string {
  const params = new URLSearchParams({
    date: p.date,
    time: p.time,
    title: p.title,
    hours: String(p.hours && p.hours > 0 ? p.hours : 1),
    tz: p.timezone || 'America/Edmonton',
  });
  if (p.description) params.set('description', p.description);
  if (p.location) params.set('location', p.location);
  return `${origin.replace(/\/$/, '')}/api/calendar/booking.ics?${params.toString()}`;
}
