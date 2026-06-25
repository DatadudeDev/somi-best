import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const src = path.join(root, 'public/images/best/logo-wordmark.png');

/** Crop to the BEST wordmark row (exclude tagline) after trimming canvas padding. */
async function wordmarkSource() {
  const trimmed = await sharp(src).trim({ threshold: 10 }).toBuffer();
  const { width, height } = await sharp(trimmed).metadata();
  const cropHeight = Math.round(height * 0.55);
  return sharp(trimmed).extract({ left: 0, top: 0, width, height: cropHeight });
}

async function render(size) {
  const base = await wordmarkSource();
  return base
    .resize(512, 512, {
      fit: 'contain',
      background: { r: 0, g: 0, b: 0, alpha: 1 },
    })
    .resize(size, size)
    .sharpen({ sigma: size <= 32 ? 0.8 : 0.5 })
    .png()
    .toBuffer();
}

const files = [
  ['public/favicon-16x16.png', 16],
  ['public/favicon-32x32.png', 32],
  ['public/apple-touch-icon.png', 180],
  ['public/icon-192.png', 192],
  ['public/icon-512.png', 512],
];

for (const [rel, size] of files) {
  const buf = await render(size);
  await sharp(buf).toFile(path.join(root, rel));
}

const svg32 = await render(32);
const b64 = svg32.toString('base64');
const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" role="img" aria-label="BEST Therapeutics">
  <image width="32" height="32" href="data:image/png;base64,${b64}"/>
</svg>
`;
fs.writeFileSync(path.join(root, 'public/favicon.svg'), svg);
console.log('Generated favicons from logo-wordmark.png');
