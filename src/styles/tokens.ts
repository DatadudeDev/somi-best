/**
 * Design tokens — BEST Therapeutics brand theme.
 * Aggressive dark palette: black, white, safety orange/gold accent.
 */

export const colors = {
  sageGreen: '#FFB800',
  sageLight: '#FFCC33',
  cream: '#0d0d0d',
  white: '#161616',

  gold: '#FFB800',
  charcoal: '#F2F2F2',
  warmGray: '#9A9A9A',
  stone: '#2A2A2A',

  deepSage: '#000000',
  richBlack: '#000000',

  sageHover: '#E6A600',
  creamText: '#FFFFFF',
  goldShimmer: '#FFD966',
} as const;

export const fonts = {
  logo: "'Barlow Condensed', 'Arial Narrow', sans-serif",
  logoSub: "'Barlow', system-ui, sans-serif",
  display: "'Barlow Condensed', 'Arial Narrow', sans-serif",
  body: "'Barlow', system-ui, -apple-system, 'Segoe UI', sans-serif",
  tagline: "'Barlow Condensed', 'Arial Narrow', sans-serif",
  heading: "'Barlow Condensed', 'Arial Narrow', sans-serif",
} as const;

export const fontWeights = {
  light: 300,
  regular: 400,
  medium: 500,
  semibold: 600,
} as const;

export const typography = {
  logoMark: {
    fontFamily: fonts.logo,
    fontWeight: 800,
    letterSpacing: '0.06em',
    textTransform: 'uppercase' as const,
  },
  logoSub: {
    fontFamily: fonts.logoSub,
    fontWeight: fontWeights.medium,
    letterSpacing: '0.14em',
    textTransform: 'uppercase' as const,
  },
  tagline: {
    fontFamily: fonts.tagline,
    fontWeight: 800,
    fontStyle: 'normal' as const,
    letterSpacing: '0.02em',
    lineHeight: 1.1,
    textTransform: 'uppercase' as const,
  },
  h1: {
    fontFamily: fonts.display,
    fontWeight: 800,
    fontSize: 'clamp(40px, 5vw, 72px)',
    letterSpacing: '0.03em',
    lineHeight: 1.05,
    textTransform: 'uppercase' as const,
  },
  h2: {
    fontFamily: fonts.display,
    fontWeight: 800,
    fontSize: 'clamp(28px, 3.5vw, 40px)',
    letterSpacing: '0.04em',
    lineHeight: 1.15,
    textTransform: 'uppercase' as const,
  },
  h3: {
    fontFamily: fonts.display,
    fontWeight: 700,
    fontSize: 'clamp(18px, 2vw, 24px)',
    letterSpacing: '0.03em',
    lineHeight: 1.25,
    textTransform: 'uppercase' as const,
  },
  body: {
    fontFamily: fonts.body,
    fontWeight: fontWeights.regular,
    fontSize: '18px',
    letterSpacing: '0.01em',
    lineHeight: 1.65,
  },
  caption: {
    fontFamily: fonts.body,
    fontWeight: fontWeights.light,
    fontSize: '14px',
    letterSpacing: '0.06em',
    lineHeight: 1.5,
  },
  button: {
    fontFamily: fonts.body,
    fontWeight: 700,
    fontSize: '14px',
    letterSpacing: '0.12em',
    textTransform: 'uppercase' as const,
    lineHeight: 1,
  },
  sectionLabel: {
    fontFamily: fonts.body,
    fontWeight: fontWeights.semibold,
    fontSize: '13px',
    letterSpacing: '0.14em',
    textTransform: 'uppercase' as const,
    lineHeight: 1,
    color: '#FFB800',
  },
} as const;

export const spacing = {
  xs: '4px',
  sm: '8px',
  md: '16px',
  lg: '24px',
  xl: '32px',
  xxl: '48px',
  section: '80px',
  sectionMobile: '48px',
} as const;

export const breakpoints = {
  mobile: '768px',
  tablet: '1200px',
} as const;

export const transitions = {
  fadeUp: { duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] },
  nav: { duration: 0.3, ease: 'easeInOut' },
  button: { duration: 0.2, ease: 'easeOut' },
  page: { duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] },
  card: { duration: 0.2, ease: 'easeOut' },
  testimonial: { duration: 5, ease: 'linear' },
} as const;

export type HeroSlideEffect =
  | 'zoom-pan-left'
  | 'zoom-pan-right'
  | 'zoom-pan-up'
  | 'zoom-pan-down'
  | 'zoom-out-pan-right';

export const heroSlides = [
  {
    src: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?auto=format&fit=crop&w=1920&q=80',
    alt: 'Athlete training intensely',
    effect: 'zoom-pan-left' as HeroSlideEffect,
  },
  {
    src: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=1920&q=80',
    alt: 'Gym recovery environment',
    effect: 'zoom-pan-right' as HeroSlideEffect,
  },
  {
    src: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=1920&q=80',
    alt: 'Weight room athlete',
    effect: 'zoom-pan-up' as HeroSlideEffect,
  },
  {
    src: 'https://images.unsplash.com/photo-1599058945522-28d584b6f82f?auto=format&fit=crop&w=1920&q=80',
    alt: 'Sports therapy session',
    effect: 'zoom-pan-down' as HeroSlideEffect,
  },
  {
    src: 'https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?auto=format&fit=crop&w=1920&q=80',
    alt: 'Athlete stretching recovery',
    effect: 'zoom-out-pan-right' as HeroSlideEffect,
  },
] as const;

export const images = {
  hero: '/images/best/logo-mark.png',
  heroVideo: '/images/best/logo-mark.png',
  logo: '/images/best/logo-wordmark.png',
  logoCleaningCompany: '/images/best/logo-full.png',
  cardMoment: '/images/best/logo-mark.png',
  hostBedroom: '/images/best/logo-mark.png',
  almostFridayBottles: '/images/best/logo-mark.png',
  faithPortrait: '/images/best/logo-mark.png',
  logoLightSage: '/images/best/logo-wordmark.png',
  logoDarkMode: '/images/best/logo-wordmark.png',
  logoLightMode: '/images/best/logo-wordmark.png',
  livingRoom: '/images/best/logo-mark.png',
  contactHero: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?auto=format&fit=crop&w=1920&q=80',
  businessHero: 'https://images.unsplash.com/photo-1517649763962-0c62306601b7?auto=format&fit=crop&w=1920&q=80',
  ogDefault: '/images/best/logo-full.png',
} as const;
