// One-time icon generator. Run: node scripts/gen-icons.mjs
// Produces the PWA icons in /public from an inline SVG (no design files needed).
import sharp from 'sharp';
import { mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const OUT = resolve(dirname(fileURLToPath(import.meta.url)), '..', 'public');
mkdirSync(OUT, { recursive: true });

// Ascending bars (a "progress / mastery" mark) on the indigo brand accent.
const bars = `
  <g fill="#ffffff">
    <rect x="150" y="300" width="46" height="82" rx="14"/>
    <rect x="233" y="238" width="46" height="144" rx="14"/>
    <rect x="316" y="166" width="46" height="216" rx="14"/>
  </g>`;

const rounded = `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <rect width="512" height="512" rx="104" fill="#7c6cf0"/>${bars}</svg>`;

// maskable: full-bleed square (no transparent corners) so OS masks crop cleanly
const square = `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <rect width="512" height="512" fill="#7c6cf0"/>${bars}</svg>`;

const png = (svg, size) => sharp(Buffer.from(svg)).resize(size, size).png().toBuffer();

const jobs = [
  ['icon-192.png', rounded, 192],
  ['icon-512.png', rounded, 512],
  ['icon-512-maskable.png', square, 512],
  ['apple-touch-icon.png', rounded, 180],
  ['favicon-32.png', rounded, 32],
];

for (const [name, svg, size] of jobs) {
  await sharp(await png(svg, size)).toFile(resolve(OUT, name));
  console.log('wrote', name);
}
