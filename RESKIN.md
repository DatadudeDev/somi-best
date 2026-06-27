# Reskin guide — BEST-V2 / somi-full-template

**Canonical deploy path:** `BEST-V2/` → Cloudflare Pages (`treytherapy.com`). Backend email/PDF lives on the `somi-app` worker; payments relay on `somi-payments`.

Per-client branding and deployment settings. Visuals stay in code; **URLs and email identity** come from env vars so one codebase serves many tenants.

## Primary reskin targets

| What | Where |
|------|--------|
| Copy, contact, nav, booking strings | `src/config/site.ts` |
| Colors, fonts, hero slides, image paths | `src/styles/tokens.ts` |
| Marketing + booking prices | `src/data/pricing.ts` (+ mirror in `src/lib/booking/constants.ts`) |
| Favicon / logo assets | `public/images/best/` → run `npm run generate:favicons` |

## Canonical URL (must stay in sync)

Set the same origin in **three places**:

1. **Build-time (SPA + index.html):** `VITE_SITE_ORIGIN` in `.env` / Pages build env  
2. **Runtime SEO:** `site.domain` reads `VITE_SITE_ORIGIN` (fallback in `site.ts`)  
3. **Server emails + links:** `SITE_ORIGIN` in `wrangler.toml` / Pages dashboard  

Also update `public/sitemap.xml` and `public/robots.txt` when the production domain changes.

## Backend / email (Pages Functions)

| Var | Purpose |
|-----|---------|
| `SITE_ORIGIN` | Email links, invoice PDF links |
| `EMAIL_LOGO_URL` | Header logo in transactional email |
| `BUSINESS_NAME`, `REPLY_TO_EMAIL`, `BUSINESS_NOTIFY_EMAIL` | Email From/Reply/notify |
| `BOOKING_REQUIRES_ADDRESS` | Address field + email “Where” row |
| `USE_CENTRAL_PAYMENTS` + `PAYMENTS` binding | Route Stripe via somi-payments |

Secrets: `CLIENT_USER_ID`, `INTERNAL_CALLBACK_SECRET`, `TURNSTILE_SECRET_KEY` (optional).

## Hero images

Self-hosted WebP under `public/images/best/hero/` (CSP `img-src 'self'`):

```bash
npm run download:hero-images
```

## Deploy

```bash
npm run build
npx wrangler pages deploy dist --project-name <pages-project>
```

Booking API changes deploy with the Pages bundle; central email/PDF logic lives on `somi-app` (separate worker).
