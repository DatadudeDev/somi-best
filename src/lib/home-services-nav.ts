import type { To } from 'react-router-dom';

/** Services bento section id on the home page (hash fragment, no `#`). */
export const HOME_CLEANING_SECTION_ID = 'services';

/** Home page scroll targets for top nav. */
export const HOME_SECTION_IDS = {
  services: 'services',
  testimonials: 'testimonials',
  products: 'products',
} as const;

export type HomeSectionId = keyof typeof HOME_SECTION_IDS;

export function homeSectionTo(section: HomeSectionId): To {
  return { pathname: '/', hash: HOME_SECTION_IDS[section] };
}

export function homeSectionHref(section: HomeSectionId): string {
  return `/#${HOME_SECTION_IDS[section]}`;
}

export function navHomeSectionLinkActive(
  section: HomeSectionId,
  loc: { pathname: string; hash: string },
): boolean {
  return loc.pathname === '/' && loc.hash === `#${HOME_SECTION_IDS[section]}`;
}

/** Smooth-scroll when the target section is already in the URL. */
export function scrollToHomeSection(section: HomeSectionId): void {
  document.getElementById(HOME_SECTION_IDS[section])?.scrollIntoView({
    behavior: 'smooth',
    block: 'start',
  });
}

export type HomeServicesTab = 'residential' | 'custom' | 'business';

export function parseHomeServicesTab(search: string): HomeServicesTab {
  const v = new URLSearchParams(search.startsWith('?') ? search.slice(1) : search).get('tab');
  if (v === 'custom' || v === 'business') return v;
  return 'residential';
}

/** React Router `to` for the Our Services section + tab. Residential omits `?tab=`. */
export function homeCleaningTo(tab: HomeServicesTab): To {
  if (tab === 'residential') {
    return { pathname: '/', hash: HOME_CLEANING_SECTION_ID };
  }
  return { pathname: '/', search: `?tab=${tab}`, hash: HOME_CLEANING_SECTION_ID };
}

/** Plain href for `<a href>` (e.g. Button). */
export function homeCleaningHref(tab: HomeServicesTab): string {
  if (tab === 'residential') return `/#${HOME_CLEANING_SECTION_ID}`;
  return `/?tab=${tab}#${HOME_CLEANING_SECTION_ID}`;
}

type LocSlice = { pathname: string; search: string; hash: string };

/** Navbar / nav-style “is this link current?”. */
export function navHomeServicesLinkActive(to: To, loc: LocSlice): boolean {
  if (loc.pathname !== '/' || loc.hash !== `#${HOME_CLEANING_SECTION_ID}`) return false;

  if (typeof to === 'string') {
    if (to === `/#${HOME_CLEANING_SECTION_ID}`) {
      return parseHomeServicesTab(loc.search) === 'residential';
    }
    return false;
  }

  const o = to as { pathname?: string; search?: string; hash?: string };
  if (o.pathname !== '/' || o.hash !== HOME_CLEANING_SECTION_ID) return false;

  return parseHomeServicesTab(loc.search) === parseHomeServicesTab(o.search ?? '');
}
