import type { To } from 'react-router-dom';



/** Primary services / pricing section on the home page (hash fragment, no `#`). */

export const SERVICES_SECTION_ID = 'services';



/** Home page scroll targets for top nav. */

export const SITE_SECTION_IDS = {

  services: SERVICES_SECTION_ID,

  testimonials: 'testimonials',

  products: 'products',

} as const;



export type SiteSectionId = keyof typeof SITE_SECTION_IDS;



export function siteSectionTo(section: SiteSectionId): To {

  return { pathname: '/', hash: SITE_SECTION_IDS[section] };

}



export function siteSectionHref(section: SiteSectionId): string {

  return `/#${SITE_SECTION_IDS[section]}`;

}



export function navSiteSectionLinkActive(

  section: SiteSectionId,

  loc: { pathname: string; hash: string },

): boolean {

  return loc.pathname === '/' && loc.hash === `#${SITE_SECTION_IDS[section]}`;

}



/** Smooth-scroll when the target section is already in the URL. */

export function scrollToSiteSection(section: SiteSectionId): void {

  document.getElementById(SITE_SECTION_IDS[section])?.scrollIntoView({

    behavior: 'smooth',

    block: 'start',

  });

}



/** URL `?tab=` values for services section variants. */

export type ServicesTabId = 'individual' | 'custom' | 'business';



export function parseServicesTab(search: string): ServicesTabId {

  const v = new URLSearchParams(search.startsWith('?') ? search.slice(1) : search).get('tab');

  if (v === 'custom' || v === 'business') return v;

  return 'individual';

}



/** React Router `to` for the services section + tab. Primary tab omits `?tab=`. */

export function servicesSectionTo(tab: ServicesTabId): To {

  if (tab === 'individual') {

    return { pathname: '/', hash: SERVICES_SECTION_ID };

  }

  return { pathname: '/', search: `?tab=${tab}`, hash: SERVICES_SECTION_ID };

}



/** Plain href for `<a href>` (e.g. Button). */

export function servicesSectionHref(tab: ServicesTabId): string {

  if (tab === 'individual') return `/#${SERVICES_SECTION_ID}`;

  return `/?tab=${tab}#${SERVICES_SECTION_ID}`;

}



type LocSlice = { pathname: string; search: string; hash: string };



/** Navbar-style “is this services-tab link current?”. */

export function navServicesTabLinkActive(to: To, loc: LocSlice): boolean {

  if (loc.pathname !== '/' || loc.hash !== `#${SERVICES_SECTION_ID}`) return false;



  if (typeof to === 'string') {

    if (to === `/#${SERVICES_SECTION_ID}`) {

      return parseServicesTab(loc.search) === 'individual';

    }

    return false;

  }



  const o = to as { pathname?: string; search?: string; hash?: string };

  if (o.pathname !== '/' || o.hash !== SERVICES_SECTION_ID) return false;



  return parseServicesTab(loc.search) === parseServicesTab(o.search ?? '');

}


