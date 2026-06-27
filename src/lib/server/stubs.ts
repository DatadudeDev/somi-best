/**
 * Stub / not-configured responses for optional tenant APIs.
 */
import { jsonError } from './http.ts';

export function apiNotConfigured(feature: string): Response {
  return jsonError(`${feature} is not configured for this site`, 503);
}
