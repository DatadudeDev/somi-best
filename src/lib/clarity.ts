/**
 * src/lib/clarity.ts
 *
 * Clarity integration using the official manual script injection.
 * The @microsoft/clarity npm package is just a thin wrapper around the same
 * script tag — but its API methods (identify, event, etc.) call window.clarity()
 * directly without queuing, so they fail if called before the async script loads.
 *
 * This wrapper injects the script tag (with its built-in queue) and exposes
 * typed helpers that safely proxy through window.clarity — which handles
 * queuing automatically until the script is ready.
 */

const PROJECT_ID = 'wb7oon07l6';

declare global {
  interface Window {
    clarity: ((...args: unknown[]) => void) & { q?: unknown[][] };
  }
}

/** Call once at app boot (main.tsx). Injects the Clarity script tag. */
export function clarityInit() {
  if (typeof window === 'undefined') return;
  if (document.getElementById('clarity-script')) return; // already injected

  // Set up the queue so API calls before script load are buffered
  window.clarity = window.clarity || function (...args: unknown[]) {
    (window.clarity.q = window.clarity.q || []).push(args);
  };

  const t = document.createElement('script');
  t.async = true;
  t.id = 'clarity-script';
  t.src = `https://www.clarity.ms/tag/${PROJECT_ID}`;
  const y = document.getElementsByTagName('script')[0];
  y.parentNode!.insertBefore(t, y);
}

/** Identify an authenticated user. Safe to call at any time — queued if script not yet loaded. */
export function clarityIdentify(
  customId: string,
  friendlyName?: string,
  customSessionId?: string,
  customPageId?: string,
) {
  try { window.clarity?.('identify', customId, customSessionId, customPageId, friendlyName); }
  catch { /* noop */ }
}

/** Fire a named custom event. */
export function clarityEvent(eventName: string) {
  try { window.clarity?.('event', eventName); }
  catch { /* noop */ }
}

/** Attach a key/value tag to the current session. */
export function clarityTag(key: string, value: string | string[]) {
  try { window.clarity?.('set', key, value); }
  catch { /* noop */ }
}

/** Prioritise this session for recording. */
export function clarityUpgrade(reason: string) {
  try { window.clarity?.('upgrade', reason); }
  catch { /* noop */ }
}
