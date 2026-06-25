/**
 * useTurnstile — Cloudflare Turnstile invisible widget hook
 * Script is loaded statically in index.html — this hook just mounts the widget.
 */

import { useRef, useEffect, useCallback, useState } from 'react';

const SITE_KEY = import.meta.env.VITE_TURNSTILE_SITE_KEY as string
  || '1x00000000000000000000AA'; // CF always-passes test key

declare global {
  interface Window {
    turnstile?: {
      render: (container: HTMLElement, options: TurnstileOptions) => string;
      reset: (widgetId: string) => void;
      remove: (widgetId: string) => void;
      getResponse: (widgetId: string) => string | undefined;
    };
  }
}

interface TurnstileOptions {
  sitekey: string;
  callback: (token: string) => void;
  'error-callback'?: () => void;
  'expired-callback'?: () => void;
  size?: 'invisible' | 'normal' | 'compact';
  theme?: 'light' | 'dark' | 'auto';
  action?: string;
}

export function useTurnstile(action = 'booking', enabled = true) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);
  const tokenRef = useRef<string | null>(null);
  const resolversRef = useRef<Array<(token: string) => void>>([]);
  const [ready, setReady] = useState(false);

  const mountWidget = useCallback(() => {
    if (!containerRef.current || widgetIdRef.current) return;
    if (!window.turnstile) return;

    widgetIdRef.current = window.turnstile.render(containerRef.current, {
      sitekey: SITE_KEY,
      size: 'invisible',
      theme: 'light',
      action,
      callback: (token: string) => {
        tokenRef.current = token;
        resolversRef.current.forEach(resolve => resolve(token));
        resolversRef.current = [];
        setReady(true);
      },
      'expired-callback': () => {
        tokenRef.current = null;
        setReady(false);
      },
      'error-callback': () => {
        tokenRef.current = null;
        setReady(false);
      },
    });
  }, [action]);

  useEffect(() => {
    if (!enabled) return;  // Don't mount until enabled (lazy-load support)

    // Script is in index.html — just wait for window.turnstile to be ready
    if (window.turnstile) {
      mountWidget();
    } else {
      // Poll briefly in case script is still loading
      const interval = setInterval(() => {
        if (window.turnstile) {
          clearInterval(interval);
          mountWidget();
        }
      }, 100);
      // Cleanup: clear poll interval on unmount
      return () => clearInterval(interval);
    }

    // Cleanup: remove widget on unmount to avoid stale widget warnings
    return () => {
      if (widgetIdRef.current && window.turnstile) {
        window.turnstile.remove(widgetIdRef.current);
        widgetIdRef.current = null;
      }
    };
  }, [mountWidget, enabled]);

  const getToken = useCallback((): Promise<string> => {
    return new Promise((resolve, reject) => {
      if (tokenRef.current) {
        resolve(tokenRef.current);
        return;
      }
      resolversRef.current.push(resolve);
      setTimeout(() => {
        resolversRef.current = resolversRef.current.filter(r => r !== resolve);
        reject(new Error('Turnstile timeout'));
      }, 10_000);
    });
  }, []);

  const reset = useCallback(() => {
    tokenRef.current = null;
    setReady(false);
    if (widgetIdRef.current && window.turnstile) {
      window.turnstile.reset(widgetIdRef.current);
    }
  }, []);

  return { containerRef, getToken, reset, ready };
}
