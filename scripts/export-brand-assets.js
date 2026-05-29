#!/usr/bin/env node
/**
 * Export production-ready PNGs from SVG brand sources.
 * Run: node scripts/export-brand-assets.js
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const BRAND_DIR = path.join(ROOT, 'public', 'brand');
const PUBLIC_DIR = path.join(ROOT, 'public');

function read(rel) {
  return fs.readFileSync(path.join(ROOT, rel));
}

async function exportPng({ inputRel, outRel, width, height }) {
  const input = read(inputRel);
  const outPath = path.join(ROOT, outRel);
  await sharp(input, { density: 240 })
    .resize(width, height, { fit: 'contain' })
    .png({ compressionLevel: 9, adaptiveFiltering: true })
    .toFile(outPath);
  return outPath;
}

async function main() {
  fs.mkdirSync(BRAND_DIR, { recursive: true });

  const outputs = [];

  // Favicon / app icons
  outputs.push(
    await exportPng({
      inputRel: 'public/brand/footycompass-icon-square.svg',
      outRel: 'public/brand/favicon-32.png',
      width: 32,
      height: 32,
    }),
  );
  outputs.push(
    await exportPng({
      inputRel: 'public/brand/footycompass-icon-square.svg',
      outRel: 'public/brand/apple-touch-icon-180.png',
      width: 180,
      height: 180,
    }),
  );
  outputs.push(
    await exportPng({
      inputRel: 'public/brand/footycompass-icon-square.svg',
      outRel: 'public/brand/pwa-512.png',
      width: 512,
      height: 512,
    }),
  );
  outputs.push(
    await exportPng({
      inputRel: 'public/brand/footycompass-icon-square.svg',
      outRel: 'public/brand/pwa-192.png',
      width: 192,
      height: 192,
    }),
  );

  // Transparent icon-only PNGs (useful for embeds / UI)
  outputs.push(
    await exportPng({
      inputRel: 'public/brand/footycompass-icon.svg',
      outRel: 'public/brand/icon-512.png',
      width: 512,
      height: 512,
    }),
  );
  outputs.push(
    await exportPng({
      inputRel: 'public/brand/footycompass-icon-mono.svg',
      outRel: 'public/brand/icon-mono-512.png',
      width: 512,
      height: 512,
    }),
  );

  // Social sharing image
  outputs.push(
    await exportPng({
      inputRel: 'public/og.svg',
      outRel: 'public/og.png',
      width: 1200,
      height: 630,
    }),
  );

  // Make sure we keep a stable SEO default even if someone deletes og.svg later.
  if (!fs.existsSync(path.join(PUBLIC_DIR, 'og.png'))) {
    throw new Error('Failed to write public/og.png');
  }

  console.log('Exported:');
  for (const p of outputs) console.log(`- ${path.relative(ROOT, p)}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

