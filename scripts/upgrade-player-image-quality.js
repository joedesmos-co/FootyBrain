#!/usr/bin/env node
/**
 * Re-fetch higher-quality Wikimedia images for priority players.
 * Uses preferredOverrides + quality-ranked search.
 *
 * Run: npm run upgrade:player-image-quality
 * Options:
 *   --limit=N     Max players to upgrade (default 100)
 *   --dry-run     No writes
 *   --force       Re-fetch even if current image passes
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { players } from '../src/data/sampleData.js';
import curated from './data/wikimedia-player-curated.mjs';
import {
  buildApprovedEntry,
  resolvePlayerCommonsImage,
  sleep,
  API_DELAY_MS,
} from './lib/wikimediaPlayerImage.mjs';
import { getPreferredOverride, scorePlayerImage } from './lib/playerImageQuality.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const APPROVED_PATH = join(root, 'src/data/playerImageApproved.json');
const CACHE_PATH = join(root, 'generated-data/player-image-wikimedia-cache.json');

function parseArgs(argv) {
  const out = { dryRun: argv.includes('--dry-run'), force: argv.includes('--force'), limit: 100 };
  for (const arg of argv) {
    if (arg.startsWith('--limit=')) out.limit = Number(arg.split('=')[1]) || 100;
  }
  return out;
}

function readJson(path, fallback = {}) {
  try {
    return JSON.parse(readFileSync(path, 'utf8'));
  } catch {
    return fallback;
  }
}

function currentScore(entry, player) {
  if (!entry?.commonsFile) return 0;
  return scorePlayerImage(
    {
      commonsFile: entry.commonsFile,
      description: entry.commonsDescription,
      width: entry.imageWidth,
      height: entry.imageHeight,
    },
    player?.name,
  ).score;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const approved = readJson(APPROVED_PATH);
  const cache = readJson(CACHE_PATH, { resolved: {}, skipped: {} });
  const playerById = new Map(players.map((p) => [p.id, p]));

  const candidates = players
    .map((p) => {
      const entry = approved.entries?.[p.id];
      const override = getPreferredOverride(p.id);
      const score = entry ? currentScore(entry, p) : 0;
      const missing = !entry?.imageUrl;
      const hasOverride = Boolean(override?.commonsFile);
      return {
        playerId: p.id,
        player: p,
        spec: curated.entries?.[p.id] ?? { verifyName: p.name.split(' ').pop() },
        entry,
        score,
        missing,
        hasOverride,
        importance: p.importanceScore ?? 0,
      };
    })
    .filter((row) => row.spec || row.hasOverride)
    .sort((a, b) => {
      if (a.hasOverride !== b.hasOverride) return a.hasOverride ? -1 : 1;
      if (a.missing !== b.missing) return a.missing ? -1 : 1;
      if (a.score !== b.score) return a.score - b.score;
      return b.importance - a.importance;
    })
    .slice(0, args.limit);

  console.log(`Upgrading up to ${candidates.length} players${args.dryRun ? ' (dry-run)' : ''}…`);

  const stats = { upgraded: [], skipped: [], failed: [] };

  for (let i = 0; i < candidates.length; i += 1) {
    const { playerId, player, spec, entry, score } = candidates[i];

    if (!args.force && entry?.imageUrl && score >= 70 && !getPreferredOverride(playerId)) {
      stats.skipped.push({ playerId, reason: 'already_good', score });
      continue;
    }

    console.log(`[${i + 1}/${candidates.length}] ${playerId} (${player.name}) current=${score || 'none'}…`);

    try {
      const result = await resolvePlayerCommonsImage(spec, player);
      if (result.skip) {
        stats.skipped.push({ playerId, reason: result.reason, score });
        console.log(`  skip: ${result.reason}`);
        continue;
      }

      const { meta, quality } = result;
      if (!args.force && entry?.imageUrl && quality.score <= score) {
        stats.skipped.push({ playerId, reason: 'no_improvement', score, newScore: quality.score });
        console.log(`  skip: no improvement (${quality.score} <= ${score})`);
        continue;
      }

      const imageUrl = meta.thumbUrl;
      const nextEntry = buildApprovedEntry(player, meta, imageUrl, quality);

      if (!args.dryRun) {
        approved.entries ??= {};
        approved.entries[playerId] = nextEntry;
        approved.updatedAt = new Date().toISOString().slice(0, 10);
        cache.resolved ??= {};
        cache.resolved[playerId] = { meta, at: new Date().toISOString() };
        delete cache.skipped?.[playerId];
        writeFileSync(APPROVED_PATH, `${JSON.stringify(approved, null, 2)}\n`, 'utf8');
        writeFileSync(CACHE_PATH, `${JSON.stringify({ ...cache, updatedAt: new Date().toISOString() }, null, 2)}\n`, 'utf8');
      }

      stats.upgraded.push({
        playerId,
        name: player.name,
        from: entry?.commonsFile ?? null,
        to: meta.commonsFile,
        fromScore: score,
        toScore: quality.score,
      });
      console.log(`  upgraded: ${meta.commonsFile} (${quality.score})`);
    } catch (err) {
      stats.failed.push({ playerId, error: err.message });
      console.log(`  error: ${err.message}`);
    }

    await sleep(API_DELAY_MS);
  }

  console.log('\n--- Upgrade summary ---');
  console.log(`Upgraded: ${stats.upgraded.length}`);
  console.log(`Skipped: ${stats.skipped.length}`);
  console.log(`Failed: ${stats.failed.length}`);
}

main().catch((err) => {
  console.error('Fatal:', err.message);
  process.exit(1);
});
