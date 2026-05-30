#!/usr/bin/env node
/**
 * Add or update a licensed player image in playerImageApproved.json.
 *
 * Usage:
 *   npm run add:player-image -- --id=haaland --url=/images/players/haaland.webp \
 *     --credit="Jane Doe" --license="CC BY-SA 4.0" --source="Wikimedia Commons" \
 *     --source-url="https://commons.wikimedia.org/wiki/File:Example.jpg"
 */

import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { isApprovedAssetUrl, isDisallowedImageUrl } from '../src/utils/playerImageUrlPolicy.js';
import { requiresAttribution } from './lib/wikimediaPlayerImage.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const APPROVED_PATH = join(root, 'src/data/playerImageApproved.json');

function parseArgs(argv) {
  const out = {};
  for (const arg of argv) {
    if (!arg.startsWith('--')) continue;
    const eq = arg.indexOf('=');
    if (eq === -1) continue;
    out[arg.slice(2, eq)] = arg.slice(eq + 1);
  }
  return out;
}

const args = parseArgs(process.argv.slice(2));
const playerId = args.id?.trim();
const imageUrl = args.url?.trim();

if (!playerId || !imageUrl) {
  console.error('Required: --id=player-id --url=/images/players/id.webp');
  process.exit(1);
}

if (isDisallowedImageUrl(imageUrl) || !isApprovedAssetUrl(imageUrl)) {
  console.error(`URL not approved: ${imageUrl}`);
  process.exit(1);
}

if (imageUrl.startsWith('/images/')) {
  const localPath = join(root, 'public', imageUrl.replace(/^\//, ''));
  if (!existsSync(localPath)) {
    console.warn(`Warning: local file not found yet: ${localPath}`);
  }
}

const credit = args.credit?.trim() ?? '';
const license = args.license?.trim() ?? '';
if (!credit || !license) {
  console.error('Required for licensed images: --credit=... --license=...');
  process.exit(1);
}

const approved = JSON.parse(readFileSync(APPROVED_PATH, 'utf8'));
approved.entries ??= {};
approved.entries[playerId] = {
  imageUrl,
  imageAlt: args.alt?.trim() || null,
  imageCredit: credit,
  imageLicense: license,
  imageSourceUrl: args['source-url']?.trim() || null,
  imageSource: args.source?.trim() || null,
  imageSrcSet: args.srcset?.trim() || null,
  imageAttributionRequired: args['attribution-required'] === 'false' ? false : requiresAttribution(license),
  status: 'approved',
};
approved.updatedAt = new Date().toISOString().slice(0, 10);

writeFileSync(APPROVED_PATH, `${JSON.stringify(approved, null, 2)}\n`, 'utf8');
console.log(`Updated approved image for ${playerId}`);
