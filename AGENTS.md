# AGENTS.md — Service Website Template

## Overview

Unbranded **service business website template**: marketing site, services pricing grid, and booking flow. React 19 + TypeScript + Vite SPA for Cloudflare Pages.

**Frontend-only by default** — no Pages Functions until backend is wired (see deployment notes).

## Architecture

```
src/
├── config/site.ts           # Primary reskin target (copy, contact, nav, booking strings)
├── styles/
│   ├── tokens.ts            # Colors, fonts, images, heroSlides
│   ├── global.css           # Base resets (imported by Layout)
│   └── home-hero-slideshow.css
├── data/pricing.ts          # Marketing pricing source of truth
├── lib/
│   ├── booking/
│   │   ├── constants.ts     # API mirror — keep PRICES in sync with pricing.ts
│   │   └── mock-availability.ts
│   ├── services-nav.ts      # Home section hash routing (#services, ?tab=)
│   ├── seo.ts, useSEO.ts
│   ├── stripe.ts, clarity.ts, tracker.ts, useTurnstile.ts
├── pages/                   # Route pages
└── components/              # layout/, home/, booking/, ui/

functions/                   # Cloudflare Pages Functions (/api/*)
schema.sql                   # Annotated D1 reference schema
migrations/                  # D1 migrations (0001 init, 0002 generalized naming)
public/
scripts/
.env.example
```

## Key conventions

| Comment tag | Meaning |
|-------------|---------|
| `PLACEHOLDER (reskin)` | Swap on client rebrand |
| `SCAFFOLDING` | Stable structure/keys — see wire contracts below |

## Routes

| Path | Page |
|------|------|
| `/` | Home (hero slideshow, services grid, testimonials, products) |
| `/book` | Booking checkout (steps 2–3) |
| `/contact` | Contact form |
| `/help` | FAQ |
| `/privacy`, `/terms` | Legal |
| `/booking-success` | Post-checkout confirmation |
| `/services`, `/pricing` | Redirect → `/#services` |
| `/custom-services`, `/business-services` | Redirect → `/#services` (legacy paths) |

## Wire contracts (source of truth)

| Contract | Values | Used by |
|----------|--------|---------|
| Book URL `?pkg=` | `Tier1`, `Tier2`, `Tier3`, `Tier4` | Book page, marketing links |
| Book URL `?size=` | `s1`–`s4` | Size/tier axis on book links |
| Book URL `?mode=` | `individual`, `business`, `custom` | Booking mode |
| Home hash | `#services` | Nav + legacy redirects |
| Home `?tab=` | `individual`, `custom`, `business` | Services tab variants |
| API `service` | `tier1`–`tier4` (or `Tier1`–`Tier4` display keys) | Availability + booking endpoints |
| API `sizeKey` | `s1`–`s4` | Availability + create-intent |
| API `mode` | `individual`, `business` | Booking endpoints (default: individual) |
| D1 `size_key` | `s1`–`s4` | Bookings table |
| D1 `service` | `tier1`–`tier4`, `biz_tier1`–`biz_tier4` | Bookings table |
| Stripe metadata `sizeKey` | `s1`–`s4` | PaymentIntent webhook / confirm-payment |
| Promo type | `complimentary` (100% off booking) | promo_codes table |

Display names (Foundation, Performance, etc.) live in `PKG_DISPLAY_NAME` — reskin only, not wire keys.

## Internal naming

| Concept | Code name |
|---------|-----------|
| Service tier on homepage | `SERVICE_TIERS`, `ServiceTier` |
| Business/team pricing | `BUSINESS_TIER_PRICES`, `businessTiers` |
| Home nav sections | `services-nav.ts`, `SiteSectionId` |
| Per-visit pricing vars | `perVisitSubtotal`, `totalVisits` |
| Checkout notes field | `sessionNotes` |
| Product card price line | `priceLabel` (in `site.productSection.items`) |
| Image tokens | `logoFull`, `productHero`, `brandMark`, etc. |

## Booking behavior

| Concern | Behavior |
|---------|----------|
| Size selection | Marketing links set `?size=`; no size picker on `/book` by default |
| Default size | `s1` when URL omits `size` |
| Default pkg | `Tier1` when URL omits `pkg`; CTAs often use `Tier3` (popular tier) |
| Calendar | Opens on first month with availability |
| Session cap | Up to **10** sessions per frequency |
| Stripe | Requires keys + create-intent for live pay |

Always sync **`pricing.ts`** ↔ **`lib/booking/constants.ts`** after price edits.

## D1 migrations

Fresh installs: `migrations/0001_init.sql` (uses generalized schema).

Existing DBs from the cleaning template: run `migrations/0002_generalized_naming.sql` once.

## Scripts

| Command | Purpose |
|---------|---------|
| `npm run dev` | Local dev server |
| `npm run build` | Production build → `dist/` |
| `npm run typecheck` | TypeScript check |
| `npm run lint` | ESLint |

## Build & deploy

Deploy `dist/` to Cloudflare Pages. Set env vars from `.env.example`. Set `VITE_USE_BOOKING_API=true` for live availability.

Apply D1 migrations: `npx wrangler d1 migrations apply <DB_NAME> --remote`
