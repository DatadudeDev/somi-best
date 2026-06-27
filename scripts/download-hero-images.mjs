/**
 * Download hero slideshow images for CSP compliance (img-src 'self' only).
 * Saves WebP (quality 82) under public/images/best/hero/.
 *
 * Run: npm run download:hero-images
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.join(__dirname, '..', 'public', 'images', 'best', 'hero');

const IMAGES = {
  'hero-01-athlete-training': 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?auto=format&fit=crop&w=1920&q=80',
  'hero-02-gym': 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=1920&q=80',
  'hero-03-weight-room': 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=1920&q=80',
  'hero-04-sports-therapy': 'https://images.unsplash.com/photo-1574680096145-d05b474e2155?auto=format&fit=crop&w=1920&q=80',
  'hero-05-stretching': 'https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?auto=format&fit=crop&w=1920&q=80',
  'hero-06-business': 'https://images.unsplash.com/photo-1571902943202-507ec2618e8f?auto=format&fit=crop&w=1920&q=80',
};

fs.mkdirSync(outDir, { recursive: true });

for (const [basename, url] of Object.entries(IMAGES)) {
  const dest = path.join(outDir, `${basename}.webp`);
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed ${url}: ${res.status}`);
  const input = Buffer.from(await res.arrayBuffer());
  const webp = await sharp(input)
    .resize({ width: 1920, withoutEnlargement: true })
    .webp({ quality: 82, effort: 4 })
    .toBuffer();
  fs.writeFileSync(dest, webp);
  console.log(`Wrote ${basename}.webp (${webp.length} bytes)`);
}

console.log(`Done — ${Object.keys(IMAGES).length} WebP images in public/images/best/hero/`);
