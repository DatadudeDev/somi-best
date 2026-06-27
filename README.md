# BEST Therapeutics V2

BEST Therapeutics client site built on the **refactored somi-full-template** stack:

- Full Cloudflare Pages Functions (`functions/api/*`)
- Modular booking flow (`src/lib/booking/*`, `src/components/booking/*`)
- BEST black/gold brand skin from the original `BEST/` reskin

## Dev

```bash
npm install
npm run dev    # http://localhost:6768
```

## Regenerate favicons

```bash
npm run generate:favicons
```

Source: `public/images/best/logo-wordmark.png`

Hero slideshow WebP files live under `public/images/best/hero/` (self-hosted for CSP). Re-download:

```bash
npm run download:hero-images
```

See `RESKIN.md` for per-client domain, email, and wrangler vars.

## vs `BEST/`

| | `BEST/` | `BEST-V2/` |
|---|---------|------------|
| Backend APIs | None | Full `functions/api` + D1 |
| Book.tsx | Monolithic | Refactored modules |
| Visuals | BEST skin | Same BEST skin |
| Dev port | 6768 | 6768 |
