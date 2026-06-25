/**
 * Generates grayscale placeholder images for the unbranded template.
 * Run: node scripts/generate-placeholders.mjs
 */
import sharp from 'sharp';
import { mkdir, writeFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const outDir = join(__dirname, '..', 'public', 'images', 'placeholders');

const assets = [
  { name: 'hero-poster.webp', w: 1920, h: 1080, label: 'Hero Poster' },
  { name: 'living-room.webp', w: 1200, h: 800, label: 'Section Image' },
  { name: 'host-bedroom.webp', w: 800, h: 600, label: 'Business Tier' },
  { name: 'card-moment.webp', w: 800, h: 600, label: 'Card Image' },
  { name: 'product.webp', w: 800, h: 600, label: 'Product Image' },
  { name: 'contact-hero.webp', w: 1600, h: 900, label: 'Contact Hero' },
  { name: 'business-hero.webp', w: 1600, h: 900, label: 'Business Hero' },
  { name: 'logo.webp', w: 400, h: 120, label: 'Logo Placeholder' },
  { name: 'og-default.png', w: 1200, h: 630, label: 'OG Image', ext: 'png' },
  { name: 'logo.png', w: 512, h: 512, label: 'Logo', ext: 'png' },
];

function svgFor(w, h, label) {
  const fontSize = Math.max(14, Math.min(w, h) / 12);
  return Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
  <defs>
    <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
      <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#d4d4d4" stroke-width="1"/>
    </pattern>
  </defs>
  <rect width="100%" height="100%" fill="#e5e5e5"/>
  <rect width="100%" height="100%" fill="url(#grid)" opacity="0.6"/>
  <rect x="${w * 0.08}" y="${h * 0.08}" width="${w * 0.84}" height="${h * 0.84}" fill="none" stroke="#a3a3a3" stroke-width="2" stroke-dasharray="8 6"/>
  <text x="50%" y="48%" dominant-baseline="middle" text-anchor="middle" font-family="system-ui,sans-serif" font-size="${fontSize}" fill="#525252">${label}</text>
  <text x="50%" y="58%" dominant-baseline="middle" text-anchor="middle" font-family="system-ui,sans-serif" font-size="${fontSize * 0.65}" fill="#737373">${w}×${h} · PLACEHOLDER</text>
</svg>`);
}

await mkdir(outDir, { recursive: true });

for (const asset of assets) {
  const ext = asset.ext ?? 'webp';
  const outPath = join(outDir, asset.name.replace(/\.(webp|png)$/, `.${ext}`));
  const svg = svgFor(asset.w, asset.h, asset.label);
  let pipeline = sharp(svg);
  if (ext === 'png') {
    await pipeline.png().toFile(outPath);
  } else {
    await pipeline.webp({ quality: 80 }).toFile(outPath);
  }
  console.log('wrote', outPath);
}

const faviconSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
  <rect width="32" height="32" rx="6" fill="#525252"/>
  <text x="16" y="21" text-anchor="middle" font-family="system-ui,sans-serif" font-size="14" font-weight="600" fill="#f5f5f5">C</text>
</svg>`;
await writeFile(join(__dirname, '..', 'public', 'favicon.svg'), faviconSvg);
console.log('wrote public/favicon.svg');
