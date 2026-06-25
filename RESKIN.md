# RESKIN.md — Phased website reskin playbook

Complete guide for rebranding this template for a real client: identity, visuals, pricing, every page, and booking. Work **in phase order** unless a later phase is blocked — then finish prerequisites first.

---

## How to use this document (agents & humans)

### Skeleton vs freedom

| Layer | Rule |
|-------|------|
| **Skeleton** | Routes, booking step flow, bento tab IDs, package **keys** (`Essential` / `Signature` / `Deep`), size **keys** (`s1`–`s4`), section id `#home-cleaning`, URL query shape (`?pkg=&size=`, `?tab=`) |
| **Display layer** | Tier **names**, bullet copy, images, colors, fonts, prices, add-on labels, FAQ text — change freely |
| **Minor component edits** | Allowed when the skeleton still works: rename a CTA, swap emoji for SVG icons, hide a section, add a 4th accordion panel, adjust grid copy blocks, tweak `Book.tsx` step labels |
| **Structural migration** | Only when the brief requires it (e.g. 4 tiers, flat single-tier pricing): follow **Appendix A** and update every file that references old keys |

Search the repo for `PLACEHOLDER (reskin)` and `SCAFFOLDING` comments — they mark exact edit sites.

### Template runtime (current state)

- **Frontend-only**: no Cloudflare Pages Functions (`functions/` is empty).
- **Booking calendar**: mock slots via `src/lib/booking/mock-availability.ts` unless `VITE_USE_BOOKING_API=true` and APIs are restored.
- **API toggle**: `isBookingApiEnabled()` — plain function, not a React hook.
- **Size → price**: Bento passes `?size=s1|s2|s3|s4` on book links; `/book` has **no size picker** — checkout uses URL size (default **`s1`**). Tier card prices on `/book` must match checkout subtotal for that size.
- **Stripe**: UI renders; live payment needs `VITE_STRIPE_PUBLISHABLE_KEY` + backend create-intent.
- **Forms** (contact, custom quote): UI preview only; wire APIs in Phase 12. `/for-business` redirects to `/contact`.
- **Removed**: chat widget, all `/api` functions, legacy email/Inngest/D1 code, `calculateQuote` / `residentialPricing` table.

### Definition of done

- Zero placeholder copy visible on primary user paths (home → book → success).
- `npm run build` and `npm run typecheck` pass.
- `pricing.ts` and `lib/booking/constants.ts` prices match.
- Bento “Book” price = `/book` subtotal for same `pkg` + `size` URL params.
- Brand colors/fonts applied; real logo and hero imagery in place.
- SEO: `site.domain`, `index.html`, `sitemap.xml`, JSON-LD updated.
- Manual pass: mobile nav, all three bento tabs, book flow through step 3.

---

## Phase overview

| Phase | Focus | Primary files |
|-------|--------|----------------|
| 0 | Client brief & pricing model | — |
| 1 | Business identity & global copy | `src/config/site.ts` |
| 2 | Visual system (color, type) | `src/styles/tokens.ts`, `src/styles/global.css` |
| 3 | Static assets & imagery | `public/`, `scripts/generate-placeholders.mjs`, `tokens.ts` |
| 4 | Pricing, packages & add-ons | `src/data/pricing.ts`, `src/lib/booking/constants.ts` |
| 5 | Services bento (home) | `HomeBentoSection.tsx`, `src/styles/home-bento.css` |
| 6 | Home page (non-bento) | `Home.tsx`, `HomeHeroSlideshow.tsx` |
| 7 | Layout chrome | `Navbar.tsx`, `Footer.tsx`, `Layout.tsx` |
| 8 | Booking flow | `Book.tsx`, `QuoteIntakeForm.tsx`, booking UI components |
| 9 | Secondary pages | Contact, Help, Terms, Privacy, NotFound, BookingSuccess (`/for-business` → contact) |
| 10 | SEO & discoverability | `seo.ts`, `index.html`, `public/sitemap.xml`, `manifest.json` |
| 11 | Environment & analytics | `.env.example` → `.env`, stripe, clarity, tracker |
| 12 | Production backends (optional) | `functions/`, `VITE_USE_BOOKING_API` |
| 13 | QA & launch | Checklist below |

---

## Phase 0 — Client brief & pricing model

**Goal:** Decide structure before touching code.

### Step 0.1 — Collect brand inputs

- Company name (legal + marketing), tagline, city/region, phone, email, social URLs.
- Logo (SVG preferred), favicon, OG image (1200×630), 3–5 hero photos.
- Primary + accent colors, font preferences (Google Fonts links).
- Google Business Profile URL (reviews badge).
- Cancellation policy, terms highlights, service area.

### Step 0.2 — Choose pricing shape

Pick one model (or hybrid). See **Appendix A** for implementation detail.

| Model | Skeleton impact | Typical use |
|-------|-----------------|-------------|
| **A — 3 tiers × 4 sizes** (default) | None — update display names & numbers only | Cleaning, landscaping tiers by property size |
| **B — 4 tiers × 4 sizes** | Add 4th `Pkg` key + accordion + `PRICES` column | Four distinct service levels |
| **C — 1 tier × 4 price variations** | Keep 3 `Pkg` keys; show one tier in UI; map all `pkg=` URLs to same tier | Single service, size-based pricing only |
| **D — Flat tier (no size axis)** | Hide size UI in bento/book; default `size=s1` silently | Fixed-price packages |
| **E — Quote-only tab** | Keep `custom` tab; no prices on those cards | Specialty / move-out / construction |

### Step 0.3 — Map tabs to offerings

| Tab ID | Default role | Reskin freedom |
|--------|--------------|----------------|
| `residential` | Priced tiers + book links | Rename tiers, bullets, duration labels |
| `custom` | 3 quote-only accordions | Rename scopes, change count (2–4 panels) |
| `business` | Host/STR-style tiers | Rename, adjust features; prices from `hostTiers` |

Document decisions in a short brief (even a comment at top of `site.ts`) so later phases stay consistent.

---

## Phase 1 — Business identity & global copy

**File:** `src/config/site.ts`

Work top to bottom. This file feeds nav, hero, footer, testimonials fallback, booking checkout strings, and legal name.

### Step 1.1 — Core identity

- `name`, `nameShort`, `logoSub`, `tagline`, `subtagline`
- `domain` (production URL, no trailing slash)
- `contact.*`, `location.*`, `social.*`, `googleProfileUrl`
- `legal.companyLegalName`

### Step 1.2 — Navigation & services labels

- `nav.residential`, `nav.custom`, `nav.business`, `nav.bookCta`
- `services.sectionLabel`, `services.headlinePrefix`, `services.swappable` (animated headline words per tab)
- `services.bedroomLabel` — rename if size axis is not bedrooms (e.g. "Square footage band")

### Step 1.3 — Hero & marketing blocks

- `hero.headline`, `hero.subheadline`, `hero.primaryCta`, `hero.secondaryCta`
- `testimonials.*` — section copy + `fallback` array (used when live reviews API unavailable)
- `productSection.*` — optional product line on home (or hide section in Phase 6)
- `finalCta.*`, `footer.tagline`

### Step 1.4 — Booking checkout copy

- `booking.checkout.*` — notes, address, terms acknowledgment, cancellation policy, custom quote sidebar, `propertyTypes`

**Do not change:** tab id strings (`residential` / `custom` / `business`) in comments marked SCAFFOLDING.

---

## Phase 2 — Visual system

**Files:** `src/styles/tokens.ts`, `src/styles/global.css`

Styles live under `src/styles/` — there is no root `App.css` or `index.css`.

### Step 2.1 — Brand colors

In `tokens.ts`, replace grayscale values:

- `colors.sageGreen` — primary brand
- `colors.sageLight`, `colors.sageHover` — primary variants
- `colors.gold`, `colors.goldShimmer` — accent / highlights
- `colors.deepSage`, `colors.richBlack` — dark sections
- `colors.cream`, `colors.stone`, `colors.charcoal`, `colors.warmGray` — surfaces & text

Legacy key names (`sageGreen`, etc.) are intentional — update **values**, not keys, unless doing a wide refactor.

### Step 2.2 — Typography

- `fonts.logo`, `fonts.logoSub`, `fonts.display`, `fonts.body`, `fonts.tagline`
- Load webfonts in `index.html` or `global.css` if using Google Fonts.
- Adjust `typography.*` only if the brand needs different weight/letter-spacing.

### Step 2.3 — Global & section CSS

- `src/styles/global.css` — base resets, selection color, scrollbar (optional)
- `src/styles/home-bento.css`, `home-hero-slideshow.css` — section-specific (edit if layout tweaks needed)

**Skeleton:** `spacing`, `breakpoints`, `transitions` in `tokens.ts` — keep unless layout rhythm must change.

---

## Phase 3 — Static assets & imagery

### Step 3.1 — Placeholder generation (optional)

```bash
npm run generate:placeholders
```

Writes grayscale assets to `public/images/placeholders/` (logo, OG image, section photos). Replace with client assets during reskin.

### Step 3.2 — Logo & icons

| Asset | Path / usage |
|-------|----------------|
| Favicon | `public/favicon.svg` |
| PWA icons | `public/manifest.json` → `icons` |
| Logo mark (optional img) | `public/images/...` → reference in `Navbar.tsx` |
| Sprite / misc | `public/icons.svg` |

Update `tokens.ts` → `images.logoCleaningCompany`, `images.ogDefault`, and all `images.*` paths.

### Step 3.3 — Hero slideshow

`tokens.ts` → `heroSlides[]`:

- Replace Unsplash URLs with client photos (local `/images/hero-1.jpg` or CDN).
- Keep `kenBurnsClass` keys (`kb-1` …) unless adding slides (then add matching CSS in `home-hero-slideshow.css`).

### Step 3.4 — Bento & section images

Update in `tokens.ts`:

- `livingRoom`, `hostBedroom`, `cardMoment`, `productLine`, testimonial backgrounds, etc.
- Optimize images (WebP, reasonable dimensions).

### Step 3.5 — `public/` SEO files

- `robots.txt` — allow crawl; set sitemap URL
- `sitemap.xml` — all public routes + `site.domain`
- `manifest.json` — `name`, `short_name`, theme/background colors
- `public/_headers` — cache/security headers for Cloudflare Pages

---

## Phase 4 — Pricing, packages & add-ons

**Files:** `src/data/pricing.ts` (marketing source of truth) and `src/lib/booking/constants.ts` (API/booking mirror)

**Critical:** After any price change, sync both files.

### Step 4.1 — Residential matrix

```ts
PRICES: Record<Pkg, Record<SizeKey, number>>
DURATIONS: Record<Pkg, Record<SizeKey, number>>  // hours, decimals OK
PKG_DISPLAY_NAME: Record<Pkg, string>            // customer-facing tier names
SIZE_LABELS: Record<SizeKey, string>             // e.g. "2 Bed" → "Up to 2,000 sq ft"
```

Book checkout reads `PRICES[pkg][size]` — there is no separate quote calculator.

### Step 4.2 — Add-ons

`addOns[]` — id (stable slug), label, price, unit, description. IDs are scaffolding for checkout state; labels/descriptions are reskin.

### Step 4.3 — Frequency discounts

`frequencyDiscounts` — labels and discount rates for recurring bookings.

### Step 4.4 — Business / host tiers

`hostTiers[]`, `HOST_TURNOVER_PRICES`, `hostTurnoverPrice()`:

- `id`: `essentials` | `premium` | `luxe` (scaffolding — maps to `Essential` / `Signature` / `Deep` in book URLs)
- `name`, `features`, `icon` — free to customize

### Step 4.5 — Mirror in `constants.ts`

Update `PRICES`, `DURATIONS`, `SERVICE_DISPLAY_TO_KEY`, and business price helpers to match `pricing.ts`.

`constants.ts` also exports slot/capacity/timezone helpers for future Pages Functions — unused by the frontend today but needed when restoring APIs (Phase 12).

---

## Phase 5 — Services bento (home)

**Files:** `src/components/home/HomeBentoSection.tsx`, `src/styles/home-bento.css`

### Step 5.1 — Residential tab

- `TIER_COPY` — per `Pkg`: eyebrow, title, lede, `lines[]` (strings or `{ strong: '...' }` for "includes previous tier")
- Default open tier: `initialResidentialOpen()` (currently `Signature` on desktop)
- Default size pill: **`s1`** (1 bed) — book links include `?size=` from active pill
- Price chips read from `PRICES` / `PKG_DISPLAY_NAME` — no duplicate numbers in JSX

### Step 5.2 — Custom tab

- `CUSTOM_QUOTE_TIERS` — 3 quote scopes (title, lede, metaLine, bullet lines)
- **Improvisation:** add/remove panels; keep `key` strings unique; wire CTAs to `/contact` or `/book?mode=custom`

### Step 5.3 — Business tab

- `HOST_ACC_LEDE` — summaries per host tier name
- `hostTiers` features from `pricing.ts`
- Book links use `bizBookPath()` — do not break `tierId` → `Pkg` mapping without updating `Book.tsx`

### Step 5.4 — Tab chrome

- Headline animation uses `site.services.headlinePrefix` + `HEADLINE_SWAPPABLE`
- Slide images: `SLIDE_IMAGES` from `tokens.ts`

### Step 5.5 — Minor layout freedom

- Adjust accordion density, badge text ("Most popular"), or recommended tier highlight
- Do not remove tab switcher without updating Navbar and redirects

---

## Phase 6 — Home page (non-bento)

**Files:** `src/pages/Home.tsx`, `src/components/home/HomeHeroSlideshow.tsx`, `src/styles/home-hero-slideshow.css`

### Step 6.1 — Hero

- Title/subtitle from `site.hero` (inline responsive styles marked PLACEHOLDER)
- Slideshow component reads `heroSlides` from tokens — no hardcoded URLs in TSX

### Step 6.2 — Testimonials

- Live Google reviews: set `googleProfileUrl`; if no API, `site.testimonials.fallback` displays
- Update section headline/label from `site.testimonials`

### Step 6.3 — Product section

- Copy from `site.productSection`
- Image from `images.productLine` (or hide entire section if N/A)

### Step 6.4 — Final CTA

- `site.finalCta` + link to `/book` (include `pkg` + `size` if promoting a specific tier)

---

## Phase 7 — Layout chrome

**Files:** `src/components/layout/Navbar.tsx`, `Footer.tsx`, `Layout.tsx`

### Step 7.1 — Navbar

- Logo lockup (text or `<img>`)
- Links use `homeCleaningTo()` for services tabs — preserve tab ids
- Mobile drawer: same links + `site.nav.bookCta`
- Book CTAs may use explicit `?pkg=Signature&size=s2` — ensure size matches intended entry price

### Step 7.2 — Footer

- Tagline, contact, social, legal links (`/privacy`, `/terms`, `/help`)
- Copyright: `site.legal.companyLegalName`

---

## Phase 8 — Booking flow

**Files:** `src/pages/Book.tsx`, `src/components/booking/QuoteIntakeForm.tsx`, `BookingStepper.tsx`, `PaymentForm.tsx`, `AddressAutocomplete.tsx`

### Step 8.1 — URL parameters (scaffolding)

| Param | Values | Notes |
|-------|--------|-------|
| `pkg` | `Essential` \| `Signature` \| `Deep` | Display name from `PKG_DISPLAY_NAME` |
| `size` | `s1` \| `s2` \| `s3` \| `s4` | **Default `s1`** if omitted; no size picker on this page |
| `mode` | `business` \| `custom` | Business pricing or quote intake |
| `quoteId`, `prefill`, `promo` | — | Quote conversion from approval email (when API exists) |

**Pricing rule:** Tier buttons show `PRICES[pkg][selectedSize]`. Checkout subtotal uses the same lookup. When changing default size behavior, update both `Book.tsx` default and bento default together.

### Step 8.2 — Service copy in Book.tsx

- `SERVICE_DESC`, `SERVICE_INCLUDES` — per tier key
- Promo / business / custom strings — search file for `Placeholder`
- `site.booking.checkout` for step 3 legal copy

### Step 8.3 — Calendar & availability

- Up to **10** sessions per frequency (`MAX_BOOKING_SESSIONS` in `booking-helpers.ts`); continue to checkout requires every selected day to have a time.
- Calendar cannot navigate before the current month.
- Default: `getMockMonthAvailability` / `getMockDaySlots` in `mock-availability.ts`
- Production: implement `/api/availability/*`, set `VITE_USE_BOOKING_API=true`, use `isBookingApiEnabled()`

### Step 8.4 — Payments

- `VITE_STRIPE_PUBLISHABLE_KEY` in `.env`
- `PaymentForm` + Stripe theme block at bottom of `Book.tsx` — match brand colors
- Without backend create-intent, payment step is UI preview only

### Step 8.5 — Quote intake

- `QuoteIntakeForm.tsx` — custom quote fields and local success navigation (no `POST /api/quotes` in template)

### Step 8.6 — Improvisation

- Date/time selection is optional in template preview
- Hide add-ons section if client has none (empty `addOns[]`)
- Rename step labels in `BookingStepper` — fine if step order unchanged
- Re-add a size picker on `/book` only if client needs in-flow size changes (component freedom)

---

## Phase 9 — Secondary pages

| Page | File | Reskin focus |
|------|------|----------------|
| Contact | `src/pages/Contact.tsx` | Centered full-screen form; intro copy, form labels, success message |
| Help | `src/pages/Help.tsx` | FAQ accordions — full rewrite per client |
| Terms | `src/pages/Terms.tsx` | Legal text, company name |
| Privacy | `src/pages/Privacy.tsx` | Privacy policy |
| Booking success | `src/pages/BookingSuccess.tsx` | Confirmation copy, next steps |
| 404 | `src/pages/NotFound.tsx` | Tone, CTA home |

Forms POST to `/api/*` routes that are not deployed — use honest preview copy or wire endpoints in Phase 12.

---

## Phase 10 — SEO & discoverability

### Step 10.1 — Per-page meta

- `src/lib/seo.ts` — `seoMeta` for each route; FAQ schema; `LocalBusiness` type (change `@type` if not cleaning)
- `AGGREGATE_RATING`, review snippets — real numbers only if truthful

### Step 10.2 — `index.html`

- Default title/description, geo meta, OG/Twitter tags (overridden by `useSEO` on navigation)

### Step 10.3 — Structured data sanity

- Logo URL resolves
- `site.domain` matches deployed host
- No placeholder FAQ answers in production

---

## Phase 11 — Environment & analytics

Copy `.env.example` → `.env`:

```bash
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_...
# VITE_GOOGLE_MAPS_API_KEY=...
# VITE_TURNSTILE_SITE_KEY=...
# VITE_USE_BOOKING_API=true
```

- `src/lib/stripe.ts` — publishable key; defers warnings until checkout
- `src/lib/clarity.ts` — Microsoft Clarity (initialized in `main.tsx`)
- `src/lib/tracker.ts` — analytics stub (no `/api/t` in template)
- `src/lib/useTurnstile.ts` — Cloudflare Turnstile on book step 3

Cloudflare Pages: set same variables in project settings for production builds.

---

## Phase 12 — Production backends (optional)

When the client needs live booking, payments, and forms:

1. Add Cloudflare Pages Functions under `functions/api/` (availability, create-intent, bookings, contact, quotes).
2. Set `VITE_USE_BOOKING_API=true`.
3. Align request/response shapes with `lib/booking/constants.ts` (`essential` / `signature` / `deep`, `s1`–`s4`, slot helpers, add-on IDs).
4. Stripe webhook + confirmation email — implement fresh or port from a prior fork; no email/Inngest code ships with this template.

This phase is **out of scope** for a marketing-only reskin.

---

## Phase 13 — QA & launch checklist

### Build & routes

- [ ] `npm run build` — no errors
- [ ] `npm run typecheck` — no errors
- [ ] `/`, `/book`, `/contact`, `/for-business` (→ contact), `/help`, `/privacy`, `/terms` load
- [ ] `/#home-cleaning`, `/?tab=custom`, `/?tab=business` open correct bento tab
- [ ] Legacy redirects in `App.tsx` still work (`/business-services`, etc.)

### Visual

- [ ] No grayscale-only hero unless intentional
- [ ] Logo crisp on retina; favicon correct
- [ ] Dark sections readable; focus states visible
- [ ] Mobile: nav drawer, bento accordions, book steps

### Pricing integrity

- [ ] Each tier: bento price = `/book?pkg=X&size=Y` subtotal (test `s1` and at least one other size)
- [ ] Bento default pill (`s1`) matches book default when no URL params
- [ ] `PRICES` in `pricing.ts` = `constants.ts` = checkout for sample pkg/size
- [ ] Business tab links: `mode=business` + correct host turnover price
- [ ] Add-ons calculate correctly with quantity units

### Copy

- [ ] Grep `Placeholder` / `placeholder` in `src/` — none on user-facing paths
- [ ] Phone/email click-to-call/mailto work
- [ ] Legal pages show correct legal entity

### SEO

- [ ] View source: title, description, canonical on each page
- [ ] `sitemap.xml` uses production domain
- [ ] OG image previews correctly (Slack/Twitter card debugger)

### Env

- [ ] Production env vars set on Cloudflare Pages
- [ ] Stripe key matches mode (test vs live)

---

## Appendix A — Pricing & package improvisation

### A1 — Default: 3 tiers × 4 sizes (no structural change)

1. Set `PKG_DISPLAY_NAME` to client tier names.
2. Fill `PRICES` / `DURATIONS` / `SIZE_LABELS`.
3. Update `TIER_COPY`, `SERVICE_DESC`, `SERVICE_INCLUDES`.
4. Sync `constants.ts`.

### A2 — Four tiers

**Skeleton change required.**

1. Extend type: `export type Pkg = 'Essential' | 'Signature' | 'Deep' | 'Elite';` (example 4th key).
2. Add row to `PRICES`, `DURATIONS`, `PKG_DISPLAY_NAME`, `TIER_COPY`, `SERVICE_DESC`, `SERVICE_INCLUDES`.
3. `HomeBentoSection.tsx` — residential accordion iterates tiers; add 4th panel (copy pattern from existing).
4. `constants.ts` — add `elite` lowercase key in `PRICES` and `SERVICE_DISPLAY_TO_KEY`.
5. `Book.tsx` — ensure pkg query handles new key.
6. Optional: set `recommended` on the tier the client wants highlighted.

### A3 — One tier, four price variations (size only)

**Keep three `Pkg` keys internally; expose one tier in UI.**

1. Choose canonical pkg (e.g. `Signature`) for all book links.
2. In bento, render **one** accordion; size chips still use `s1`–`s4` and `PRICES[canonicalPkg]`.
3. `bookPath()` always passes `pkg=Signature` (or chosen key).
4. Hide or collapse unused tier accordions (desktop/mobile).
5. Map marketing copy only in `TIER_COPY[canonicalPkg]`.
6. **Do not** delete unused `Pkg` keys from `PRICES` without a migration — unused keys can hold duplicate rows or min/max placeholders.

### A4 — Flat price (no size selector)

1. Set all sizes to one price or use only `s1` as default.
2. Bento: remove size chip row (component freedom) — link with `size=s1`.
3. `Book.tsx`: default `size=s1`; hide any size UI if re-added.
4. Rename `SIZE_LABELS` to a single customer-facing label if size still sent silently.

### A5 — Two tiers only

1. Keep three `Pkg` keys in data or migrate to two (harder).
2. Easier path: show two accordions; hide third via CSS/conditional; redirect old `/book?pkg=Deep` to remaining top tier if needed.

### A6 — Custom tab only (no residential prices)

1. Residential tab: replace price chips with "Get a quote" → `/contact`.
2. Or redirect default tab to `custom` via marketing choice (Navbar still uses tab ids).

### A7 — Rename size axis (not bedrooms)

1. Update `SIZE_LABELS` and `site.services.bedroomLabel`.
2. No key rename (`s1`–`s4`) unless migrating APIs.

### A8 — Business tab as generic B2B

1. Rename `hostTiers[].name` and features.
2. Adjust `HOST_TURNOVER_PRICES` discount formula in `pricing.ts` if B2B pricing is not "10% off residential".

---

## Appendix B — Skeleton contract (do not break without migration)

| Identifier | Where used |
|------------|------------|
| `Essential` / `Signature` / `Deep` | URL `pkg=`, `TIER_COPY`, `PRICES`, Book.tsx, bento book links |
| `s1` / `s2` / `s3` / `s4` | URL `size=`, price matrix, duration matrix |
| `residential` / `custom` / `business` | `?tab=`, Navbar, `home-services-nav.ts` |
| `#home-cleaning` | Hash navigation from nav and CTAs |
| `essentials` / `premium` / `luxe` | Business tier ids → pkg mapping in `bizBookPath()` |
| Routes in `App.tsx` | `/book`, `/contact`, `/for-business` redirect, legacy service redirects |

**Safe without migration:** display strings, images, colors, bullet lists, number of custom quote panels, hiding sections, adding 4th tier with coordinated key extension.

---

## Appendix C — File map (every reskin touchpoint)

```
src/config/site.ts
src/styles/tokens.ts, global.css, home-bento.css, home-hero-slideshow.css
src/data/pricing.ts
src/lib/booking/constants.ts, mock-availability.ts
src/lib/seo.ts, home-services-nav.ts
src/components/home/HomeBentoSection.tsx, HomeHeroSlideshow.tsx
src/pages/Home.tsx, Book.tsx, Contact.tsx, Help.tsx
  Terms.tsx, Privacy.tsx, BookingSuccess.tsx, NotFound.tsx
src/components/layout/Navbar.tsx, Footer.tsx
src/components/booking/QuoteIntakeForm.tsx
index.html
public/favicon.svg, manifest.json, sitemap.xml, robots.txt, images/*
scripts/generate-placeholders.mjs
.env.example → .env
```

### Grep commands (verification)

```bash
# Remaining placeholder copy
rg -i "placeholder" src/

# Scaffolding comments to respect
rg "SCAFFOLDING" src/

# Price drift between modules
rg "PRICES" src/data/pricing.ts src/lib/booking/constants.ts
```

---

## Appendix D — Agent decision log (recommended)

When improvising, leave a short note in the PR or at the top of `site.ts`:

```ts
// Reskin: Acme Co — 2026-06-14
// Model: A1 (3×4). Display: Spark / Shine / Deep Clean. Size axis: sq ft bands.
// Hidden: product section. Custom tab: 2 panels only.
```

This keeps display freedom from turning into silent skeleton drift.
