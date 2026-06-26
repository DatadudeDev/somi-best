/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_STRIPE_PUBLISHABLE_KEY?: string;
  readonly VITE_USE_BOOKING_API?: string;
  readonly VITE_BOOKING_REQUIRES_ADDRESS?: string;
  readonly VITE_GOOGLE_MAPS_API_KEY?: string;
  readonly VITE_TURNSTILE_SITE_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare module '*.css' {}
