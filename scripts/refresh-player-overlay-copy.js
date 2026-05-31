#!/usr/bin/env node
/**
 * Polish existing player overlay strings (consumer-facing) without dropping entries.
 * Run: npm run refresh:player-overlay-copy
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { polishGeneratedCopy } from '../src/utils/learnerProfileCopy.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, 'src/data/playerEditorialOverlays.json');

const STRING_FIELDS = [
  'quickFact',
  'playStyleSummary',
  'playingStyle',
  'roleSummary',
  'careerContext',
];

function polishOverlayEntry(entry) {
  if (!entry || typeof entry !== 'object') return entry;
  const out = { ...entry };

  for (const key of STRING_FIELDS) {
    if (typeof out[key] === 'string') {
      out[key] = polishGeneratedCopy(out[key]);
    }
  }

  if (Array.isArray(out.strengths)) {
    out.strengths = out.strengths.map((s) => polishGeneratedCopy(s)).filter(Boolean);
  }
  if (Array.isArray(out.knownFor)) {
    out.knownFor = out.knownFor.map((s) => polishGeneratedCopy(s)).filter(Boolean);
  }
  if (Array.isArray(out.quizHints)) {
    out.quizHints = out.quizHints.map((s) => polishGeneratedCopy(s)).filter(Boolean);
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
console.log(`Polished ${updated}/${Object.keys(overlays).length} player overlays → ${path.relative(ROOT, OUT)}`);
