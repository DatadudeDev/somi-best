# AGENTS.md — Service Website Template

## Overview

Unbranded **home services website template**: marketing site, services bento, and booking flow. React 19 + TypeScript + Vite SPA for Cloudflare Pages.

**Frontend-only by default** — no Pages Functions, no chat widget, no live form/booking APIs until Phase 12 of [RESKIN.md](./RESKIN.md).

## Architecture

```
src/
├── config/site.ts           # Primary reskin target (copy, contact, nav, booking strings)
├── styles/
│   ├── tokens.ts            # Colors, fonts, images, heroSlides
│   ├── global.css           # Base resets (imported by Layout)
│   ├── home-bento.css       # Services bento
│   └── home-hero-slideshow.css
├── data/pricing.ts          # Marketing pricing source of truth
├── lib/
│   ├── booking/
│   │   ├── constants.ts     # API mirror — keep PRICES in sync with pricing.ts
│   │   └── mock-availability.ts  # Calendar slots when APIs not deployed
│   ├── home-services-nav.ts # Bento tab routing (#home-cleaning, ?tab=)
│   ├── seo.ts, useSEO.ts
│   ├── stripe.ts, clarity.ts, tracker.ts, useTurnstile.ts
├── pages/                   # Route pages
└── components/              # layout/, home/, booking/, ui/

functions/                   # Empty — add Pages Functions for production APIs
public/
├── images/placeholders/     # Grayscale assets (regenerate via npm script)
scripts/generate-placeholders.mjs
.env.example                 # Copy → .env for local Stripe / optional keys
```

## Key conventions

| Comment tag | Meaning |
|-------------|---------|
| `PLACEHOLDER (reskin)` | Swap on client rebrand |
| `SCAFFOLDING` | Keep structure/keys unless migrating APIs |

## Routes

| Path | Page |
|------|------|
| `/` | Home (hero slideshow, services bento, testimonials) |
| `/book` | Booking checkout (steps 2–3) |
| `/contact` | Contact form (UI preview — no `/api/contact`) |
| `/for-business` | Redirect → `/contact` (legacy path) |
| `/help` | FAQ |
| `/privacy`, `/terms` | Legal |
| `/booking-success` | Post-checkout confirmation |
| `/services`, `/pricing` | Redirect → `/#home-cleaning` |
| `/custom-services` | Redirect → `/?tab=custom#home-cleaning` |
| `/business-services` | Redirect → `/?tab=business#home-cleaning` |

## Scaffolding identifiers (do not rename casually)

- Package keys: `Essential` / `Signature` / `Deep` (URL `?pkg=`)
- Size keys: `s1`–`s4` (URL `?size=`) — default **`s1`** on bento and `/book`
- Bento tab IDs: `residential` / `custom` / `business`
- Section hash: `#home-cleaning`
- Business tier IDs: `essentials` / `premium` / `luxe` → map to pkg keys in book URLs

## Booking & pricing behavior

| Concern | Template behavior |
|---------|-------------------|
| Size selection | Bento bedroom pills set `?size=` on book links; **no size picker on `/book`** |
| Default size | `s1` (1 bed) when URL omits `size` |
| Tier prices on `/book` | Shown for `selectedSize` from URL — must match bento link |
| Calendar | `mock-availability.ts` unless `VITE_USE_BOOKING_API=true` |
| Session cap | Up to **10** days/sessions per frequency (`MAX_BOOKING_SESSIONS` in `booking-helpers.ts`) |
| Continue gating | Step 3 requires service, frequency, ≥1 day, and a time on every selected day |
| Stripe | UI only; needs key in `.env` + backend create-intent for live pay |
| API flag | `isBookingApiEnabled()` in `mock-availability.ts` (not a React hook) |

Always sync **`pricing.ts`** ↔ **`lib/booking/constants.ts`** after price edits.

## Reskin workflow

1. Read client brief → pick pricing model ([RESKIN.md](./RESKIN.md) Phase 0)
2. Edit `site.ts` + `tokens.ts` + replace `public/images/`
3. Update `pricing.ts` + mirror in `constants.ts`
4. Work through [RESKIN.md](./RESKIN.md) phases 5–13 (pages, SEO, QA)

## Scripts

| Command | Purpose |
|---------|---------|
| `npm run dev` | Local dev server |
| `npm run build` | Production build → `dist/` |
| `npm run typecheck` | TypeScript check |
| `npm run lint` | ESLint |
| `npm run generate:placeholders` | Regenerate grayscale placeholder images |
| `npm run generate:favicons` | Regenerate favicon/PWA icons from client logo |

## Build & deploy

```bash
npm run build    # → dist/
```

Deploy `dist/` to Cloudflare Pages. Set env vars from `.env.example` in the Pages dashboard (RESKIN.md Phase 11). Restore `functions/api/*` and set `VITE_USE_BOOKING_API=true` for live booking (Phase 12).

## What is not in this repo

- Cloudflare Pages Functions (`/api/*`)
- Chat widget
- Inngest / email templates / D1 schema (removed during unbrand)
- Legacy `calculateQuote` / `residentialPricing` table (Book uses `PRICES` matrix directly)
