/**
 * GET /api/google-reviews
 * Stub until Google Places / Business Profile integration is wired.
 * Returns 503 so the client falls back to static testimonials config.
 */
import { apiNotConfigured } from '../../src/lib/server/stubs.ts';

export const onRequestGet: PagesFunction = async () => {
  return apiNotConfigured('Google reviews');
};
