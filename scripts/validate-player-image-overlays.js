#!/usr/bin/env node
/**
 * Validates playerImageApproved.json + priority meta.
 * Run: npm run validate:player-image-overlays
 */

import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { validateOverlayEntryForPlayer } from '../src/utils/playerImageOverlay.js';
import { isApprovedAssetUrl, isDisallowedImageUrl } from '../src/utils/playerImageUrlPolicy.js';
import { players } from '../src/data/sampleData.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

const errors = [];
const warnings = [];

function err(msg) {
  errors.push(msg);
}

function warn(msg) {
  warnings.push(msg);
}

const approved = JSON.parse(readFileSync(join(root, 'src/data/playerImageApproved.json'), 'utf8'));
const meta = JSON.parse(readFileSync(join(root, 'src/data/playerImageOverlays.meta.json'), 'utf8'));

const playerIds = new Set(players.map((p) => p.id));

if (!approved.schemaVersion) {
  err('playerImageApproved.json missing schemaVersion');
}

if (!meta.schemaVersion) {
  err('playerImageOverlays.meta.json missing schemaVersion');
}

for (const id of meta.priorityPlayerIds ?? []) {
  if (!playerIds.has(id)) {
    warn(`priorityPlayerIds includes unknown player id: ${id}`);
  }
}

for (const [playerId, entry] of Object.entries(approved.entries ?? {})) {
  if (!playerIds.has(playerId)) {
    warn(`Approved entry for unknown player id: ${playerId}`);
  }

  validateOverlayEntryForPlayer({ id: playerId }, { err, warn });

  const url = entry?.imageUrl;
  if (url != null && url !== '') {
    if (isDisallowedImageUrl(url)) {
      err(`Approved ${playerId} uses disallowed URL pattern`);
    } else if (!isApprovedAssetUrl(url)) {
      err(`Approved ${playerId} imageUrl not approved: ${url}`);
    }
    if (!String(entry.imageCredit ?? '').trim() || !String(entry.imageLicense ?? '').trim()) {
      warn(`Approved ${playerId} has imageUrl but missing credit/license`);
    }
  }

  const sourceUrl = entry?.imageSourceUrl;
  if (sourceUrl && isDisallowedImageUrl(sourceUrl)) {
    err(`Approved ${playerId} imageSourceUrl uses disallowed pattern`);
  }
}

const withImages = Object.values(approved.entries ?? {}).filter((e) => e?.imageUrl).length;

console.log(`Priority list: ${(meta.priorityPlayerIds ?? []).length} players`);
console.log(`Approved images: ${withImages}`);

if (warnings.length) {
  console.warn('\nWarnings:');
  for (const w of warnings) console.warn(`  - ${w}`);
}

if (errors.length) {
  console.error('\nErrors:');
  for (const e of errors) console.error(`  - ${e}`);
  process.exit(1);
}

console.log('\nvalidate:player-image-overlays OK');
