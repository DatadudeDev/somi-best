/**
 * useTurnstile — Cloudflare Turnstile programmatic (invisible) widget hook
 */

import { useRef, useEffect, useCallback, useState } from 'react';
import { loadTurnstileScript } from './loadTurnstile';

const SITE_KEY = import.meta.env.VITE_TURNSTILE_SITE_KEY as string
  || '1x00000000000000000000AA'; // CF always-passes test key

declare global {
  interface Window {
    turnstile?: {
      render: (container: HTMLElement, options: TurnstileOptions) => string;
      reset: (widgetId: string) => void;
      remove: (widgetId: string) => void;
      getResponse: (widgetId: string) => string | undefined;
      isExpired?: (widgetId: string) => boolean;
      execute: (widgetId: string) => void;
    };
  }
}

interface TurnstileOptions {
  sitekey: string;
  callback: (token: string) => void;
  'error-callback'?: () => void;
  'expired-callback'?: () => void;
  execution?: 'render' | 'execute';
  appearance?: 'always' | 'execute' | 'interaction-only';
  size?: 'normal' | 'compact' | 'flexible' | 'invisible';
  theme?: 'light' | 'dark' | 'auto';
  action?: string;
}

export function useTurnstile(action = 'booking', enabled = true) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);
  const tokenRef = useRef<string | null>(null);
  const executingRef = useRef(false);
  const resolversRef = useRef<Array<(token: string) => void>>([]);
  const [ready, setReady] = useState(false);

  const finishExecution = useCallback(() => {
    executingRef.current = false;
  }, []);

  const resolveWaiters = useCallback((token: string) => {
    finishExecution();
    tokenRef.current = token;
    resolversRef.current.forEach((resolve) => resolve(token));
    resolversRef.current = [];
    setReady(true);
  }, [finishExecution]);

  const executeWidget = useCallback(() => {
    const id = widgetIdRef.current;
    if (!id || !window.turnstile?.execute) return;
    if (tokenRef.current) return;
    if (executingRef.current) return;

    if (window.turnstile.isExpired?.(id)) {
      window.turnstile.reset(id);
      finishExecution();
    }

    executingRef.current = true;
    window.turnstile.execute(id);
  }, [finishExecution]);

  const mountWidget = useCallback(() => {
    if (!containerRef.current || widgetIdRef.current) return;
    if (!window.turnstile) return;

    widgetIdRef.current = window.turnstile.render(containerRef.current, {
      sitekey: SITE_KEY,
      size: 'invisible',
      execution: 'execute',
      theme: 'light',
      action,
      callback: resolveWaiters,
      'expired-callback': () => {
        tokenRef.current = null;
        finishExecution();
        setReady(false);
      },
      'error-callback': () => {
        tokenRef.current = null;
        finishExecution();
        setReady(false);
        resolversRef.current = [];
      },
    });
  }, [action, finishExecution, resolveWaiters]);

  useEffect(() => {
    if (!enabled) return;

    let cancelled = false;

    const boot = async () => {
      try {
        await loadTurnstileScript();
        if (!cancelled) mountWidget();
      } catch {
        if (!cancelled) setReady(false);
      }
    };

    void boot();

    return () => {
      cancelled = true;
      if (widgetIdRef.current && window.turnstile) {
        window.turnstile.remove(widgetIdRef.current);
        widgetIdRef.current = null;
        tokenRef.current = null;
        executingRef.current = false;
        resolversRef.current = [];
      }
    };
  }, [mountWidget, enabled]);

  const getToken = useCallback((timeoutMs = 15_000): Promise<string> => {
    if (tokenRef.current) {
      return Promise.resolve(tokenRef.current);
    }

    return new Promise((resolve, reject) => {
      let settled = false;
      const timer = window.setTimeout(() => {
        if (settled) return;
        settled = true;
        resolversRef.current = resolversRef.current.filter((r) => r !== onToken);
        finishExecution();
        reject(new Error('Turnstile timeout'));
      }, timeoutMs);

      const onToken = (token: string) => {
        if (settled) return;
        settled = true;
        window.clearTimeout(timer);
        resolversRef.current = resolversRef.current.filter((r) => r !== onToken);
        resolve(token);
      };

      resolversRef.current.push(onToken);
      executeWidget();
    });
  }, [executeWidget, finishExecution]);

  const reset = useCallback(() => {
    tokenRef.current = null;
    executingRef.current = false;
    resolversRef.current = [];
    setReady(false);
    if (widgetIdRef.current && window.turnstile) {
      window.turnstile.reset(widgetIdRef.current);
    }
  }, []);

  return { containerRef, getToken, reset, ready };
}
