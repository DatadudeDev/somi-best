import { useEffect } from 'react';
import { setSEO, type SEOMeta } from './seo';

/**
 * React hook — call at the top of any page component.
 * Injects title, meta, OG, Twitter, and JSON-LD into <head>.
 *
 * @example
 *   import { useSEO, seoMeta } from '../lib/useSEO';
 *   export default function PricingPage() {
 *     useSEO(seoMeta.pricing);
 *     ...
 *   }
 */
export { seoMeta } from './seo';
export type { SEOMeta } from './seo';

export function useSEO(meta: SEOMeta) {
  useEffect(() => {
    setSEO(meta);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [meta.canonical]); // re-run if canonical changes (shouldn't, but safe)
}
