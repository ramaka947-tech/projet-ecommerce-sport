import sharp from 'sharp';
import { mkdirSync } from 'node:fs';

const SRC = 'public/logo.png';
mkdirSync('public/icons', { recursive: true });

for (const s of [192, 512]) {
  // Icône normale
  await sharp(SRC).resize(s, s).png().toFile(`public/icons/icon-${s}.png`);

  // Icône "maskable" : logo réduit à 80 % sur fond noir (Android la découpe en rond/carré)
  const inner = Math.round(s * 0.8);
  const pad = Math.round((s - inner) / 2);
  await sharp(SRC)
    .resize(inner, inner)
    .extend({ top: pad, bottom: pad, left: pad, right: pad, background: '#000000' })
    .png()
    .toFile(`public/icons/maskable-${s}.png`);
}

// Icône iPhone
await sharp(SRC).resize(180, 180).png().toFile('public/icons/apple-touch-icon.png');
console.log('Icônes créées dans public/icons');