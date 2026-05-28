#!/usr/bin/env node
/**
 * Crawl-depth / orphan heuristic audit: sitemap URLs vs inbound <Link to="…"> refs in src.
 * Run: node scripts/audit-internal-linking.js
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SRC_DIR = path.join(ROOT, 'src');
const SITEMAP_PATH = path.join(ROOT, 'public/sitemap.xml');

function walk(dir, acc = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, acc);
    else if (/\.(jsx?|tsx?)$/.test(entry.name)) acc.push(full);
  }
  return acc;
}

function pathFromSitemapLoc(loc) {
  try {
    const u = new URL(loc);
    return u.pathname.replace(/\/$/, '') || '/';
  } catch {
    return null;
  }
}

function collectInboundLinks() {
  const inbound = new Map();
  const linkRe = /to=\{?[`'"]([^`'"]+)[`'"]\}?|to=["']([^"']+)["']/g;

  for (const file of walk(SRC_DIR)) {
    const text = fs.readFileSync(file, 'utf8');
    let match;
    while ((match = linkRe.exec(text)) !== null) {
      const raw = match[1] ?? match[2];
      if (!raw || raw.startsWith('http') || raw.startsWith('#')) continue;
      const normalized = raw.split('?')[0].replace(/\/$/, '') || '/';
      inbound.set(normalized, (inbound.get(normalized) ?? 0) + 1);
    }
  }

  return inbound;
}

function main() {
  if (!fs.existsSync(SITEMAP_PATH)) {
    console.error('Missing public/sitemap.xml — run npm run build first.');
    process.exit(1);
  }

  const sitemapXml = fs.readFileSync(SITEMAP_PATH, 'utf8');
  const locs = [...sitemapXml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
  const paths = [...new Set(locs.map(pathFromSitemapLoc).filter(Boolean))];

  const inbound = collectInboundLinks();
  const alwaysReachable = new Set(['/', '/browse', '/teams', '/quiz', '/hubs', '/collections']);

  const orphans = [];
  const weak = [];

  for (const p of paths) {
    const count = inbound.get(p) ?? 0;
    if (count === 0 && !alwaysReachable.has(p)) {
      orphans.push(p);
    } else if (count <= 1 && !alwaysReachable.has(p)) {
      weak.push({ path: p, inbound: count });
    }
  }

  const outDir = path.join(ROOT, 'generated-data');
  fs.mkdirSync(outDir, { recursive: true });
  const report = {
    generatedAt: new Date().toISOString(),
    sitemapUrlCount: paths.length,
    zeroInboundCount: orphans.length,
    weakInboundCount: weak.length,
    zeroInboundSample: orphans.slice(0, 40),
    weakInboundSample: weak.slice(0, 40),
    notes: [
      'Heuristic only: counts static to=/href in src, not runtime nav or footer in App.jsx.',
      'Entity profiles gain inbound via EntityRelatedNav, hubs, and browse cards.',
    ],
  };

  fs.writeFileSync(
    path.join(outDir, 'internal-linking-audit.json'),
    `${JSON.stringify(report, null, 2)}\n`,
  );

  console.log('Internal linking audit\n');
  console.log(`Sitemap paths: ${paths.length}`);
  console.log(`Zero inbound (heuristic): ${orphans.length}`);
  console.log(`Weak inbound (≤1): ${weak.length}`);
  console.log(`Wrote generated-data/internal-linking-audit.json`);

  if (orphans.length > 200) {
    console.warn('Many paths lack static inbound refs — expected for individual player URLs.');
  }
}

main();
