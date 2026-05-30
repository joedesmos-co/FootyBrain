#!/usr/bin/env node
/**
 * Validates player image manifest + public mirror sync.
 * Run: npm run validate:player-images
 */

import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateManifestEntryForPlayer } from '../src/utils/playerImageManifest.js';
import { isApprovedAssetUrl, isDisallowedImageUrl } from '../src/utils/playerImageUrlPolicy.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

function readJson(relPath) {
  const full = join(root, relPath);
  return JSON.parse(readFileSync(full, 'utf8'));
}

const errors = [];
const warnings = [];

function err(msg) {
  errors.push(msg);
}

function warn(msg) {
  warnings.push(msg);
}

const srcManifest = readJson('src/data/playerImageManifest.json');
const publicManifest = readJson('public/data/player-image-manifest.json');

if (!srcManifest.schemaVersion) {
  err('src manifest missing schemaVersion');
}

const hierarchy = srcManifest.placeholderHierarchy ?? [];
const expectedHierarchy = ['manifest', 'overlay', 'playerField', 'gradientInitials'];
if (JSON.stringify(hierarchy) !== JSON.stringify(expectedHierarchy)) {
  err(`placeholderHierarchy must be ${JSON.stringify(expectedHierarchy)}`);
}

const generic = srcManifest.assets?.genericPlaceholder;
if (!generic || !isApprovedAssetUrl(generic)) {
  err(`assets.genericPlaceholder must be an approved local path: ${generic}`);
}

for (const host of srcManifest.approvedCdnHosts ?? []) {
  if (typeof host !== 'string' || !host.trim()) {
    err('approvedCdnHosts entries must be non-empty strings');
  }
}

const srcEntries = srcManifest.entries ?? {};
const publicEntries = publicManifest.entries ?? {};

if (JSON.stringify(Object.keys(srcEntries).sort()) !== JSON.stringify(Object.keys(publicEntries).sort())) {
  err('public/data/player-image-manifest.json entries keys must match src/data/playerImageManifest.json');
}

for (const [playerId, entry] of Object.entries(srcEntries)) {
  const path = entry?.path ?? entry?.url;
  if (!path) {
    err(`Manifest entry ${playerId} missing path`);
    continue;
  }
  if (isDisallowedImageUrl(path)) {
    err(`Manifest entry ${playerId} uses disallowed URL pattern`);
  }
  if (!isApprovedAssetUrl(path)) {
    err(`Manifest entry ${playerId} path not approved: ${path}`);
  }
  if (entry.source === 'cdn') {
    try {
      const parsed = new URL(path);
      if (!srcManifest.approvedCdnHosts?.some((h) => parsed.hostname === h || parsed.hostname.endsWith(`.${h}`))) {
        err(`Manifest entry ${playerId} CDN host not on allowlist: ${parsed.hostname}`);
      }
    } catch {
      err(`Manifest entry ${playerId} invalid CDN URL`);
    }
  } else if (!String(path).startsWith('/images/')) {
    warn(`Manifest entry ${playerId} local source should live under /images/`);
  }

  validateManifestEntryForPlayer({ id: playerId }, { err, warn });

  const publicEntry = publicEntries[playerId];
  if (!publicEntry || (publicEntry.path ?? publicEntry.url) !== path) {
    err(`Public mirror out of sync for ${playerId}`);
  }
}

if (publicManifest.approvedCdnHosts && JSON.stringify(publicManifest.approvedCdnHosts) !== JSON.stringify(srcManifest.approvedCdnHosts)) {
  err('public mirror approvedCdnHosts must match src manifest');
}

console.log(`Player image manifest: ${Object.keys(srcEntries).length} entries`);
console.log(`Approved CDN hosts: ${(srcManifest.approvedCdnHosts ?? []).join(', ') || '(none)'}`);

if (warnings.length) {
  console.warn('\nWarnings:');
  for (const w of warnings) console.warn(`  - ${w}`);
}

if (errors.length) {
  console.error('\nErrors:');
  for (const e of errors) console.error(`  - ${e}`);
  process.exit(1);
}

console.log('\nvalidate:player-images OK');
