/**
 * Download hero slideshow images for CSP compliance (img-src 'self' only).
 * Run: node scripts/download-hero-images.mjs
 *
 * Two originals were removed from Unsplash; script uses working replacements
 * for sports-therapy and business slides.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.join(__dirname, '..', 'public', 'images', 'best', 'hero');

const IMAGES = {
  'hero-01-athlete-training.jpg':
    'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?auto=format&fit=crop&w=1920&q=80',
  'hero-02-gym.jpg':
    'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=1920&q=80',
  'hero-03-weight-room.jpg':
    'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=1920&q=80',
  'hero-04-sports-therapy.jpg':
    'https://images.unsplash.com/photo-1574680096145-d05b474e2155?auto=format&fit=crop&w=1920&q=80',
  'hero-05-stretching.jpg':
    'https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?auto=format&fit=crop&w=1920&q=80',
  'hero-06-business.jpg':
    'https://images.unsplash.com/photo-1571902943202-507ec2618e8f?auto=format&fit=crop&w=1920&q=80',
};

fs.mkdirSync(outDir, { recursive: true });

for (const [filename, url] of Object.entries(IMAGES)) {
  const dest = path.join(outDir, filename);
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed ${url}: ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  fs.writeFileSync(dest, buf);
  console.log(`Wrote ${filename} (${buf.length} bytes)`);
}

console.log(`Done — ${Object.keys(IMAGES).length} images in public/images/best/hero/`);
