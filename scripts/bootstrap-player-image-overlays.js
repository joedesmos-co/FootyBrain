#!/usr/bin/env node
/**
 * Bootstrap player image priority list (top-N by importanceScore).
 * Approved URLs live in playerImageApproved.json (empty until licensed).
 *
 * Run: npm run bootstrap:player-image-overlays
 * Options: --limit=200 --write
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { players } from '../src/data/sampleData.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const META_OUT = join(root, 'src/data/playerImageOverlays.meta.json');
const STUBS_OUT = join(root, 'generated-data/player-image-priority-stubs.json');

const args = process.argv.slice(2);
const limitArg = args.find((a) => a.startsWith('--limit='));
const limit = limitArg ? Number(limitArg.split('=')[1]) : 200;
const shouldWrite = args.includes('--write') || !args.includes('--dry-run');

function emptyOverlayStub() {
  return {
    imageUrl: null,
    imageAlt: null,
    imageCredit: null,
    imageLicense: null,
    imageSourceUrl: null,
    imageSource: null,
    imageSrcSet: null,
    status: 'pending',
  };
}

const ranked = [...players]
  .sort((a, b) => (Number(b.importanceScore) || 0) - (Number(a.importanceScore) || 0))
  .slice(0, limit);

const priorityPlayerIds = ranked.map((p) => p.id);

const stubs = Object.fromEntries(priorityPlayerIds.map((id) => [id, emptyOverlayStub()]));

const meta = {
  schemaVersion: 1,
  updatedAt: new Date().toISOString().slice(0, 10),
  policy:
    'Licensed URLs only. Use npm run add:player-image after obtaining rights. See PLAYER_IMAGE_POLICY.md.',
  priorityPlayerIds,
};

console.log(`Priority players: ${priorityPlayerIds.length}`);

if (!shouldWrite) {
  console.log('Dry run — pass --write to save.');
  process.exit(0);
}

writeFileSync(META_OUT, `${JSON.stringify(meta, null, 2)}\n`, 'utf8');
writeFileSync(STUBS_OUT, `${JSON.stringify({ priorityPlayerIds, stubs }, null, 2)}\n`, 'utf8');
console.log(`Wrote ${META_OUT}`);
console.log(`Wrote ${STUBS_OUT} (editorial checklist — not bundled at runtime)`);
