/**
 * SEO utility — PLACEHOLDER (reskin): titles, descriptions, JSON-LD copy, geo tags.
 * SCAFFOLDING: setSEO DOM injection, meta tag structure, per-page canonical paths.
 */

import { site } from '../config/site';
import { images } from '../styles/tokens';

export interface SEOMeta {
  title: string;
  description: string;
  canonical: string;
  ogImage?: string;
  ogType?: 'website' | 'article';
  jsonLd?: Record<string, unknown>[];
}

const BASE_URL = site.domain.replace(/\/$/, '');
const DEFAULT_OG = `${BASE_URL}${images.ogDefault}`;
const SITE_NAME = `${site.name}`;

/** PLACEHOLDER (reskin): aggregate rating shown in structured data */
const AGGREGATE_RATING = {
  '@type': 'AggregateRating',
  ratingValue: '5.0',
  bestRating: '5',
  worstRating: '1',
  reviewCount: '10',
};

/** PLACEHOLDER (reskin): sample reviews for JSON-LD */
const REVIEWS = site.testimonials.fallback.slice(0, 3).map(t => ({
  '@type': 'Review',
  author: { '@type': 'Person', name: t.name },
  reviewRating: { '@type': 'Rating', ratingValue: '5', bestRating: '5' },
  reviewBody: t.quote,
}));

/** PLACEHOLDER (reskin): LocalBusiness entity */
const LOCAL_BUSINESS: Record<string, unknown> = {
  '@context': 'https://schema.org',
  '@type': ['LocalBusiness', 'HealthAndBeautyBusiness'],
  '@id': `${BASE_URL}/#business`,
  name: SITE_NAME,
  url: BASE_URL,
  logo: `${BASE_URL}${images.logoCleaningCompany}`,
  image: DEFAULT_OG,
  description: site.footer.tagline,
  telephone: site.contact.phoneTel,
  email: site.contact.emailPublic,
  address: {
    '@type': 'PostalAddress',
    addressLocality: site.location.city,
    addressRegion: site.location.region,
    addressCountry: site.location.country,
  },
  geo: {
    '@type': 'GeoCoordinates',
    latitude: site.location.geo.lat,
    longitude: site.location.geo.lng,
  },
  areaServed: { '@type': 'City', name: site.location.city },
  aggregateRating: AGGREGATE_RATING,
  review: REVIEWS,
  sameAs: [
    `https://www.google.com/maps/place/?q=place_id:${site.location.placeId}`,
    site.social.facebook,
    site.social.instagram,
    site.social.tiktok,
  ],
};

/** PLACEHOLDER (reskin): FAQ schema copy */
const FAQ_SCHEMA: Record<string, unknown> = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'How much does a recovery session cost?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Foundation sessions start at $79 for 45 minutes. Performance, Extended, and Ultimate protocols are $119, $159, and $209. See our homepage for full tier details.',
      },
    },
    {
      '@type': 'Question',
      name: 'Do you offer recurring recovery programs?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Yes — weekly and bi-weekly recovery programs with discounted rates. Ideal for athletes in-season or during heavy training blocks.',
      },
    },
    {
      '@type': 'Question',
      name: 'How do I book a recovery session?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: `Book online at ${BASE_URL}/book. Select your protocol, athlete tier, and preferred time slot.`,
      },
    },
  ],
};

export const seoMeta: Record<string, SEOMeta> = {
  home: {
    title: `${site.name} — Active Recovery & Performance Wellness`,
    description: site.tagline,
    canonical: `${BASE_URL}/`,
    ogImage: DEFAULT_OG,
    jsonLd: [
      LOCAL_BUSINESS,
      FAQ_SCHEMA,
      {
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        url: BASE_URL,
        name: SITE_NAME,
      },
    ],
  },

  pricing: {
    title: `Service Pricing — ${site.name}`,
    description: 'Recovery protocol pricing — Foundation, Performance, Extended, and Ultimate tiers for athletes at every level.',
    canonical: `${BASE_URL}/`,
    ogImage: DEFAULT_OG,
    jsonLd: [{ '@context': 'https://schema.org', '@type': 'Service', name: 'Active Recovery Therapy', provider: LOCAL_BUSINESS }],
  },

  contact: {
    title: `Get in Touch — ${site.name}`,
    description: `Reach ${site.name} — questions about recovery sessions, team programs, partnerships, or our performance stack.`,
    canonical: `${BASE_URL}/contact`,
    ogImage: `${BASE_URL}${images.contactHero}`,
    jsonLd: [{
      '@context': 'https://schema.org',
      '@type': 'ContactPage',
      url: `${BASE_URL}/contact`,
      name: `Contact ${site.name}`,
      mainEntity: LOCAL_BUSINESS,
    }],
  },

  book: {
    title: `Book Recovery — ${site.name}`,
    description: 'Book your active recovery session online — select protocol, tier, and time slot.',
    canonical: `${BASE_URL}/book`,
    ogImage: DEFAULT_OG,
    jsonLd: [{
      '@context': 'https://schema.org',
      '@type': 'ReservationPage',
      url: `${BASE_URL}/book`,
      name: `Book — ${site.name}`,
      provider: LOCAL_BUSINESS,
    }],
  },
};

function setMeta(name: string, content: string, attr: 'name' | 'property' = 'name') {
  let el = document.querySelector<HTMLMetaElement>(`meta[${attr}="${name}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, name);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

function setLink(rel: string, href: string, extra?: Record<string, string>) {
  let el = document.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`);
  if (!el) {
    el = document.createElement('link');
    el.setAttribute('rel', rel);
    document.head.appendChild(el);
  }
  el.setAttribute('href', href);
  if (extra) Object.entries(extra).forEach(([k, v]) => el!.setAttribute(k, v));
}

function injectJsonLd(schemas: Record<string, unknown>[]) {
  document.querySelectorAll('script[data-site-jsonld]').forEach(s => s.remove());
  schemas.forEach(schema => {
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.setAttribute('data-site-jsonld', 'true');
    script.textContent = JSON.stringify(schema);
    document.head.appendChild(script);
  });
}

export function setSEO(meta: SEOMeta) {
  const ogImage = meta.ogImage ?? DEFAULT_OG;

  document.title = meta.title;
  setMeta('description', meta.description);
  setMeta('robots', 'index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1');
  setLink('canonical', meta.canonical);

  setMeta('og:type', meta.ogType ?? 'website', 'property');
  setMeta('og:title', meta.title, 'property');
  setMeta('og:description', meta.description, 'property');
  setMeta('og:url', meta.canonical, 'property');
  setMeta('og:site_name', SITE_NAME, 'property');
  setMeta('og:image', ogImage, 'property');
  setMeta('og:image:width', '1200', 'property');
  setMeta('og:image:height', '630', 'property');
  setMeta('og:image:alt', `${SITE_NAME}`, 'property');
  setMeta('og:locale', 'en_US', 'property');

  setMeta('twitter:card', 'summary_large_image');
  setMeta('twitter:title', meta.title);
  setMeta('twitter:description', meta.description);
  setMeta('twitter:image', ogImage);
  setMeta('twitter:image:alt', SITE_NAME);

  setMeta('geo.region', `${site.location.country}-${site.location.region}`);
  setMeta('geo.placename', site.location.city);
  setMeta('geo.position', `${site.location.geo.lat};${site.location.geo.lng}`);
  setMeta('ICBM', `${site.location.geo.lat}, ${site.location.geo.lng}`);

  if (meta.jsonLd) injectJsonLd(meta.jsonLd);
}
