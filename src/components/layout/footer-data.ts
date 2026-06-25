import { site } from '../../config/site';
import { homeSectionHref } from '../../lib/home-services-nav';

/** Navbar lockup uses 21px / 7px — keep that ratio for footer sizing. */
const NAV_LOGO_MARK_PX = 21;
const NAV_LOGO_SUB_PX = 7;
export const FOOTER_LOGO_MARK_PX = 26 * 1.5;
export const FOOTER_LOGO_SUB_PX = Number(((FOOTER_LOGO_MARK_PX * NAV_LOGO_SUB_PX) / NAV_LOGO_MARK_PX).toFixed(3));

export const QUICK_LINKS = [
  { label: site.nav.services, to: homeSectionHref('services') },
  { label: site.nav.testimonials, to: homeSectionHref('testimonials') },
  { label: site.nav.products, to: homeSectionHref('products') },
  { label: 'Help', to: '/help' },
  { label: 'Contact Us', to: '/contact' },
] as const;
