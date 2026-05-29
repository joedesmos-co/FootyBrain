#!/usr/bin/env node
/**
 * Polish existing club overlay strings (consumer-facing) without dropping entries.
 * Run: npm run refresh:club-overlay-copy
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { polishGeneratedCopy } from '../src/utils/learnerProfileCopy.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, 'src/data/teamEditorialOverlays.json');

function polishOverlayEntry(entry) {
  if (!entry || typeof entry !== 'object') return entry;
  const out = { ...entry };
  for (const key of Object.keys(out)) {
    if (typeof out[key] === 'string') {
      out[key] = polishGeneratedCopy(out[key]);
    }
  }
  return out;
}

const raw = JSON.parse(fs.readFileSync(OUT, 'utf8'));
const overlays = raw.overlays ?? {};
let updated = 0;

for (const [id, entry] of Object.entries(overlays)) {
  const next = polishOverlayEntry(entry);
  if (JSON.stringify(next) !== JSON.stringify(entry)) {
    overlays[id] = next;
    updated += 1;
  }
}

const payload = {
  ...raw,
  polishedAt: new Date().toISOString(),
  overlays,
};

fs.writeFileSync(OUT, `${JSON.stringify(payload, null, 2)}\n`);
console.log(`Polished ${updated}/${Object.keys(overlays).length} club overlays → ${path.relative(ROOT, OUT)}`);
