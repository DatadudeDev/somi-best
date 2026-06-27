/**
 * src/lib/tracker.ts
 *
 * Zero-dependency client-side analytics tracker for the template.
 * Client-side analytics stub for the template (no /api/t endpoint).
 *
 * Auto-tracks:
 * - Page views (SPA-aware: popstate + pushState monkey-patch)
 * - Web Vitals (LCP, FID, CLS via PerformanceObserver)
 * - Scroll depth (max depth per page)
 * - Time on page
 * - Referrer + UTM params (captured once on first load)
 *
 * Manual API:
 * - tracker.event(action, data?)
 * - tracker.identify(userId, userType?)
 */

// ─── Types ───────────────────────────────────────────────────────────────────

interface TrackerEvent {
  c: string;    // category
  a: string;    // action
  p?: string;   // page path
  s?: number;   // step
  sd?: number;  // scroll depth
  t?: number;   // time on page (s)
  lcp?: number;
  fid?: number;
  cls?: number;
  svc?: string;
  sz?: string;
  freq?: string;
  promo?: string;
  rev?: number;
  ref?: string;
  us?: string;
  um?: string;
  uc?: string;
  qty?: number;
}

interface TrackerState {
  sid: string;
  uid: string;
  ut: string;
  queue: TrackerEvent[];
  pageStart: number;
  maxScroll: number;
  referrer: string;
  utmSource: string;
  utmMedium: string;
  utmCampaign: string;
  initialized: boolean;
}

// ─── State ───────────────────────────────────────────────────────────────────

const state: TrackerState = {
  sid: '',
  uid: '',
  ut: 'anon',
  queue: [],
  pageStart: Date.now(),
  maxScroll: 0,
  referrer: '',
  utmSource: '',
  utmMedium: '',
  utmCampaign: '',
  initialized: false,
};

// ─── Session ID ──────────────────────────────────────────────────────────────

function getOrCreateSessionId(): string {
  const KEY = 'template_sid';
  let sid = sessionStorage.getItem(KEY);
  if (!sid) {
    sid = crypto.randomUUID();
    sessionStorage.setItem(KEY, sid);
  }
  return sid;
}

// ─── UTM + Referrer ──────────────────────────────────────────────────────────

function captureAttribution() {
  const params = new URLSearchParams(window.location.search);
  state.utmSource = params.get('utm_source') ?? '';
  state.utmMedium = params.get('utm_medium') ?? '';
  state.utmCampaign = params.get('utm_campaign') ?? '';
  state.referrer = document.referrer || '';
}

// ─── Flush Queue ─────────────────────────────────────────────────────────────

/** When set, events POST to this endpoint; otherwise observers are skipped in production. */
const ANALYTICS_ENDPOINT = import.meta.env.VITE_ANALYTICS_ENDPOINT as string | undefined;

let flushTimer: ReturnType<typeof setTimeout> | null = null;

function flush() {
  if (!ANALYTICS_ENDPOINT) {
    state.queue.length = 0;
    return;
  }
  // Future: POST state.queue to ANALYTICS_ENDPOINT
  state.queue.length = 0;
}

function scheduleFlush() {
  if (flushTimer) return;
  flushTimer = setTimeout(() => {
    flushTimer = null;
    flush();
  }, 3000); // flush every 3s
}

// ─── Push Event ──────────────────────────────────────────────────────────────

function pushEvent(evt: TrackerEvent) {
  // Attach attribution on first event only
  if (state.referrer && !evt.ref) evt.ref = state.referrer;
  if (state.utmSource && !evt.us) evt.us = state.utmSource;
  if (state.utmMedium && !evt.um) evt.um = state.utmMedium;
  if (state.utmCampaign && !evt.uc) evt.uc = state.utmCampaign;

  state.queue.push(evt);
  scheduleFlush();
}

// ─── Page View Tracking ──────────────────────────────────────────────────────

function trackPageView() {
  // Send time-on-page for previous page
  const timeOnPage = Math.round((Date.now() - state.pageStart) / 1000);
  if (timeOnPage > 1 && state.initialized) {
    pushEvent({
      c: 'interaction',
      a: 'page_leave',
      p: window.location.pathname,
      t: timeOnPage,
      sd: state.maxScroll,
    });
  }

  // Reset for new page
  state.pageStart = Date.now();
  state.maxScroll = 0;

  pushEvent({
    c: 'page_view',
    a: 'view',
    p: window.location.pathname,
  });
}

function setupSPATracking() {
  // Monkey-patch pushState / replaceState for SPA navigation
  const origPush = history.pushState;
  const origReplace = history.replaceState;

  history.pushState = function (...args) {
    origPush.apply(this, args);
    trackPageView();
  };
  history.replaceState = function (...args) {
    origReplace.apply(this, args);
    // Don't track replaceState — it's usually not a real navigation
  };

  window.addEventListener('popstate', trackPageView);
}

// ─── Scroll Depth ────────────────────────────────────────────────────────────

function setupScrollTracking() {
  window.addEventListener('scroll', () => {
    const scrollTop = window.scrollY;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    if (docHeight > 0) {
      const depth = Math.round((scrollTop / docHeight) * 100);
      if (depth > state.maxScroll) state.maxScroll = depth;
    }
  }, { passive: true });
}

// ─── Web Vitals ──────────────────────────────────────────────────────────────

function setupWebVitals() {
  if (!('PerformanceObserver' in window)) return;

  // LCP
  try {
    const lcpObs = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const last = entries[entries.length - 1];
      if (last) {
        pushEvent({
          c: 'web_vital',
          a: 'lcp',
          p: window.location.pathname,
          lcp: Math.round(last.startTime),
        });
      }
    });
    lcpObs.observe({ type: 'largest-contentful-paint', buffered: true });
  } catch {
    // PerformanceObserver unsupported in this browser
  }

  // FID
  try {
    const fidObs = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const first = entries[0] as PerformanceEventTiming | undefined;
      if (first) {
        pushEvent({
          c: 'web_vital',
          a: 'fid',
          p: window.location.pathname,
          fid: Math.round(first.processingStart - first.startTime),
        });
      }
    });
    fidObs.observe({ type: 'first-input', buffered: true });
  } catch {
    // PerformanceObserver unsupported in this browser
  }

  // CLS
  try {
    let clsValue = 0;
    const clsObs = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        const le = entry as unknown as { hadRecentInput: boolean; value: number };
        if (!le.hadRecentInput) clsValue += le.value;
      }
    });
    clsObs.observe({ type: 'layout-shift', buffered: true });
    // Report CLS on page leave
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden' && clsValue > 0) {
        pushEvent({
          c: 'web_vital',
          a: 'cls',
          p: window.location.pathname,
          cls: clsValue,
        });
      }
    });
  } catch {
    // PerformanceObserver unsupported in this browser
  }
}

// ─── Visibility / Unload ─────────────────────────────────────────────────────

function setupUnloadTracking() {
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      flush(); // flush remaining events on tab hide / close
    }
  });
}

// ─── Public API ──────────────────────────────────────────────────────────────

export const tracker = {
  /** Initialize the tracker — call once in main.tsx */
  init() {
    if (state.initialized) return;
    state.sid = getOrCreateSessionId();
    captureAttribution();
    if (import.meta.env.DEV || ANALYTICS_ENDPOINT) {
      setupSPATracking();
      setupScrollTracking();
      setupWebVitals();
      setupUnloadTracking();
      trackPageView();
    }
    state.initialized = true;
  },

  /** Track a custom event */
  event(action: string, data?: Partial<Omit<TrackerEvent, 'c' | 'a'>>) {
    pushEvent({ c: 'interaction', a: action, p: window.location.pathname, ...data });
  },

  /** Track a booking funnel step */
  bookingStep(step: number, data?: { service?: string; size?: string; frequency?: string; promo?: string }) {
    pushEvent({
      c: 'booking',
      a: `step_${step}`,
      p: '/book',
      s: step,
      svc: data?.service,
      sz: data?.size,
      freq: data?.frequency,
      promo: data?.promo,
    });
  },

  /** Set user identity after login */
  identify(userId: string, userType = 'customer') {
    state.uid = userId;
    state.ut = userType;
    pushEvent({ c: 'interaction', a: 'identify', p: window.location.pathname });
  },

  /** Get session ID (for passing to API calls as X-Session-ID) */
  getSessionId() {
    return state.sid;
  },
};
