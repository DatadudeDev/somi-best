/**
 * GET /api/calendar/booking.ics
 * Universal add-to-calendar download (Apple, Google, Outlook, Android).
 */
import type { Env } from '../../../src/lib/server/config.ts';
import { buildIcsContent } from '../../../src/lib/server/calendar-ics.ts';

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const url = new URL(context.request.url);
  const date = url.searchParams.get('date')?.trim() ?? '';
  const time = url.searchParams.get('time')?.trim() ?? '';
  const title = url.searchParams.get('title')?.trim() ?? 'Recovery session';
  const hours = parseFloat(url.searchParams.get('hours') || '1');
  const tz = url.searchParams.get('tz')?.trim() || 'America/Edmonton';
  const description = url.searchParams.get('description')?.trim() || undefined;
  const location = url.searchParams.get('location')?.trim() || undefined;

  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^\d{1,2}:\d{2}$/.test(time)) {
    return new Response('Invalid date or time', { status: 400 });
  }

  const [h, m] = time.split(':');
  const time24 = `${String(parseInt(h, 10)).padStart(2, '0')}:${m}`;

  const ics = buildIcsContent({
    date,
    time: time24,
    title,
    hours: Number.isFinite(hours) && hours > 0 ? hours : 1,
    timezone: tz,
    description,
    location,
  });

  return new Response(ics, {
    status: 200,
    headers: {
      'Content-Type': 'text/calendar; charset=utf-8',
      'Content-Disposition': 'attachment; filename="booking.ics"',
      'Cache-Control': 'no-store',
    },
  });
};
