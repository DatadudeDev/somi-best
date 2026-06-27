/**
 * Generate a 1200×630 Open Graph image for social previews.
 *
 * Override at generation time:
 *   OG_TAGLINE="Your tagline" OG_SUBTITLE="Your subtitle" node scripts/generate-og-image.mjs
 */
import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const outRel = 'public/images/best/og-image.png';
const outPath = path.join(root, outRel);
const wordmarkPath = path.join(root, 'public/images/best/logo-wordmark.png');
const markPath = path.join(root, 'public/images/best/logo-mark.png');

const W = 1200;
const H = 630;
const GOLD = '#FFB800';
const CREAM = '#F2F2F2';
const MUTED = '#9A9A9A';

const TAGLINE = process.env.OG_TAGLINE?.trim() || 'Active recovery. Every second counts.';
const SUBTITLE = process.env.OG_SUBTITLE?.trim() || 'Better Every Second Therapeutics';
const SITE_HOST = (process.env.OG_SITE_HOST || process.env.VITE_SITE_ORIGIN || 'https://treytherapy.com')
  .replace(/^https?:\/\//, '')
  .replace(/\/$/, '');

function escapeXml(value) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function backgroundSvg() {
  return Buffer.from(
    `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="glow" cx="50%" cy="42%" r="58%">
          <stop offset="0%" stop-color="#FFB800" stop-opacity="0.14"/>
          <stop offset="100%" stop-color="#FFB800" stop-opacity="0"/>
        </radialGradient>
        <linearGradient id="base" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#050505"/>
          <stop offset="100%" stop-color="#12100a"/>
        </linearGradient>
      </defs>
      <rect width="${W}" height="${H}" fill="url(#base)"/>
      <rect width="${W}" height="${H}" fill="url(#glow)"/>
      <rect x="0" y="${H - 5}" width="${W}" height="5" fill="${GOLD}"/>
    </svg>`,
  );
}

function textOverlaySvg() {
  return Buffer.from(
    `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
      <text x="600" y="404"
        text-anchor="middle"
        font-family="'Barlow Condensed', 'Arial Narrow', Arial, sans-serif"
        font-size="34"
        font-weight="800"
        letter-spacing="3"
        fill="${GOLD}"
        text-transform="uppercase">${escapeXml(TAGLINE)}</text>
      <text x="600" y="448"
        text-anchor="middle"
        font-family="Barlow, Arial, sans-serif"
        font-size="20"
        font-weight="500"
        letter-spacing="5"
        fill="${MUTED}"
        text-transform="uppercase">${escapeXml(SUBTITLE)}</text>
      <text x="600" y="548"
        text-anchor="middle"
        font-family="Barlow, Arial, sans-serif"
        font-size="18"
        font-weight="600"
        letter-spacing="2"
        fill="${CREAM}">${escapeXml(SITE_HOST)}</text>
    </svg>`,
  );
}

async function loadLogoStack() {
  const mark = await sharp(markPath)
    .trim({ threshold: 12 })
    .resize({ height: 88 })
    .toBuffer();

  const wordmark = await sharp(wordmarkPath)
    .trim({ threshold: 12 })
    .resize({ width: 420 })
    .toBuffer();

  const markMeta = await sharp(mark).metadata();
  const wordMeta = await sharp(wordmark).metadata();
  const gap = 18;
  const stackW = (markMeta.width ?? 0) + gap + (wordMeta.width ?? 0);
  const stackH = Math.max(markMeta.height ?? 0, wordMeta.height ?? 0);

  const stackSvg = Buffer.from(
    `<svg width="${stackW}" height="${stackH}" xmlns="http://www.w3.org/2000/svg"></svg>`,
  );

  return sharp(stackSvg)
    .composite([
      { input: mark, left: 0, top: Math.round((stackH - (markMeta.height ?? 0)) / 2) },
      {
        input: wordmark,
        left: (markMeta.width ?? 0) + gap,
        top: Math.round((stackH - (wordMeta.height ?? 0)) / 2),
      },
    ])
    .png()
    .toBuffer();
}

async function main() {
  if (!fs.existsSync(wordmarkPath) || !fs.existsSync(markPath)) {
    throw new Error('Missing logo assets in public/images/best/');
  }

  const logoStack = await loadLogoStack();
  const logoMeta = await sharp(logoStack).metadata();
  const logoLeft = Math.round((W - (logoMeta.width ?? 0)) / 2);
  const logoTop = 148;

  await sharp(backgroundSvg())
    .resize(W, H)
    .composite([
      { input: logoStack, left: logoLeft, top: logoTop },
      { input: textOverlaySvg(), left: 0, top: 0 },
    ])
    .png({ compressionLevel: 9 })
    .toFile(outPath);

  const { width, height } = await sharp(outPath).metadata();
  const stat = fs.statSync(outPath);
  console.log(`Wrote ${outRel} (${width}x${height}, ${Math.round(stat.size / 1024)} KB)`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
