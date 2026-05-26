#!/usr/bin/env node
/**
 * Sync public/data/player-image-manifest.json from src/data/playerImageManifest.json.
 * Run: npm run sync:player-image-manifest
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

const src = JSON.parse(readFileSync(join(root, 'src/data/playerImageManifest.json'), 'utf8'));
const entryCount = Object.keys(src.entries ?? {}).length;

const publicMirror = {
  schemaVersion: src.schemaVersion,
  updatedAt: src.updatedAt,
  note: 'Mirror of src/data/playerImageManifest.json entries for tooling. App imports the src copy at build time.',
  policy: src.policy,
  placeholderHierarchy: src.placeholderHierarchy,
  assets: src.assets,
  approvedCdnHosts: src.approvedCdnHosts,
  entryCount,
  entries: src.entries ?? {},
};

writeFileSync(
  join(root, 'public/data/player-image-manifest.json'),
  `${JSON.stringify(publicMirror, null, 2)}\n`,
  'utf8',
);

console.log(`Synced public mirror (${entryCount} entries).`);
