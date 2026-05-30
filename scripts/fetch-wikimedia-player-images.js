#!/usr/bin/env node
/**
 * Incremental Wikimedia player image ingest (batched, cached, bounded).
 *
 * Run one batch at a time — never process the full catalog in one pass.
 *
 *   npm run fetch:wikimedia-player-images
 *   npm run fetch:wikimedia-player-images -- --offset=25 --limit=25
 *   npm run fetch:wikimedia-player-images -- --dry-run --limit=10
 *   npm run fetch:wikimedia-player-images -- --download --limit=25
 *
 * Options:
 *   --limit=N       Players to attempt this run (default 25, max 50)
 *   --offset=N      Skip first N queued players (default 0)
 *   --dry-run       No writes to approved/cache
 *   --download      Save files under public/images/players/
 *   --force         Re-fetch even if cached skip/resolved
 *   --force-large   Allow --limit above 50 (not recommended)
 */

import { mkdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { players } from '../src/data/sampleData.js';
import curated from './data/wikimedia-player-curated.mjs';
import {
  API_DELAY_MS,
  buildApprovedEntry,
  downloadImage,
  resolvePlayerCommonsImage,
  sleep,
} from './lib/wikimediaPlayerImage.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const APPROVED_PATH = join(root, 'src/data/playerImageApproved.json');
const CACHE_PATH = join(root, 'generated-data/player-image-wikimedia-cache.json');
const RUN_LOG_PATH = join(root, 'generated-data/player-image-fetch-last-run.json');
const IMAGES_DIR = join(root, 'public/images/players');

const DEFAULT_LIMIT = 25;
const MAX_LIMIT = 50;
const MAX_CONSECUTIVE_API_ERRORS = 3;

function parseArgs(argv) {
  const out = {
    dryRun: argv.includes('--dry-run'),
    download: argv.includes('--download'),
    force: argv.includes('--force'),
    forceLarge: argv.includes('--force-large'),
    offset: 0,
    limit: DEFAULT_LIMIT,
    ids: null,
  };

  for (const arg of argv) {
    if (arg.startsWith('--offset=')) out.offset = Number(arg.split('=')[1]) || 0;
    if (arg.startsWith('--limit=')) out.limit = Number(arg.split('=')[1]) || DEFAULT_LIMIT;
    if (arg.startsWith('--ids=')) out.ids = arg.split('=')[1].split(',').map((s) => s.trim()).filter(Boolean);
  }

  if (!out.forceLarge && out.limit > MAX_LIMIT) {
    console.warn(`Limit capped at ${MAX_LIMIT}. Pass --force-large to override.`);
    out.limit = MAX_LIMIT;
  }

  return out;
}

function readJson(path, fallback) {
  try {
    return JSON.parse(readFileSync(path, 'utf8'));
  } catch {
    return fallback;
  }
}

function writeJson(path, data) {
  writeFileSync(path, `${JSON.stringify(data, null, 2)}\n`, 'utf8');
}

function loadCache() {
  return readJson(CACHE_PATH, {
    schemaVersion: 1,
    updatedAt: null,
    resolved: {},
    skipped: {},
  });
}

function saveCache(cache) {
  cache.updatedAt = new Date().toISOString();
  writeJson(CACHE_PATH, cache);
}

function buildQueue(playerById) {
  return Object.entries(curated.entries ?? {})
    .map(([playerId, spec]) => ({
      playerId,
      spec,
      player: playerById.get(playerId),
      importance: playerById.get(playerId)?.importanceScore ?? 0,
    }))
    .filter((row) => row.player)
    .sort((a, b) => b.importance - a.importance || a.playerId.localeCompare(b.playerId));
}

function logProgress(index, total, playerId, name, status, detail = '') {
  const ts = new Date().toISOString().slice(11, 19);
  const msg = detail ? ` — ${detail}` : '';
  console.log(`[${ts}] ${index + 1}/${total} ${playerId} (${name}): ${status}${msg}`);
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const playerById = new Map(players.map((p) => [p.id, p]));
  const queue = buildQueue(playerById);
  const batch = args.ids?.length
    ? queue.filter((row) => args.ids.includes(row.playerId))
    : queue.slice(args.offset, args.offset + args.limit);

  console.log('FootyCompass — Wikimedia player image batch');
  console.log(`Queue: ${queue.length} curated | Batch: ${batch.length} (offset ${args.offset}, limit ${args.limit})`);
  console.log(`Mode: ${args.dryRun ? 'dry-run' : 'write'}${args.download ? ' + download' : ''}${args.force ? ' + force' : ''}`);
  console.log('');

  if (!batch.length) {
    console.log('Nothing to process in this batch.');
    return;
  }

  const approved = readJson(APPROVED_PATH, { schemaVersion: 1, entries: {} });
  approved.entries ??= {};
  const cache = loadCache();
  cache.resolved ??= {};
  cache.skipped ??= {};

  const runStats = {
    startedAt: new Date().toISOString(),
    offset: args.offset,
    limit: args.limit,
    added: [],
    skipped: [],
    cachedHits: [],
    alreadyApproved: [],
    apiErrors: 0,
    stoppedEarly: false,
  };

  let consecutiveApiErrors = 0;

  for (let i = 0; i < batch.length; i += 1) {
    const { playerId, spec, player } = batch[i];

    if (approved.entries[playerId]?.imageUrl && !args.force) {
      runStats.alreadyApproved.push(playerId);
      logProgress(i, batch.length, playerId, player.name, 'skip', 'already approved');
      continue;
    }

    if (!args.force && cache.resolved[playerId]?.meta) {
      const meta = cache.resolved[playerId].meta;
      const entry = buildApprovedEntry(player, meta, meta.thumbUrl);
      if (!args.dryRun) approved.entries[playerId] = entry;
      runStats.cachedHits.push(playerId);
      runStats.added.push({ playerId, name: player.name, source: 'cache' });
      logProgress(i, batch.length, playerId, player.name, 'cache hit', meta.commonsFile);
      if (!args.dryRun) writeJson(APPROVED_PATH, { ...approved, updatedAt: new Date().toISOString().slice(0, 10) });
      continue;
    }

    if (!args.force && cache.skipped[playerId]) {
      runStats.skipped.push({ playerId, name: player.name, reason: cache.skipped[playerId].reason, cached: true });
      logProgress(i, batch.length, playerId, player.name, 'skip', `cached: ${cache.skipped[playerId].reason}`);
      continue;
    }

    logProgress(i, batch.length, playerId, player.name, 'fetching…');

    let result;
    try {
      result = await resolvePlayerCommonsImage(spec, player);
    } catch (err) {
      consecutiveApiErrors += 1;
      runStats.apiErrors += 1;
      const reason = err.name === 'TimeoutError' || err.name === 'AbortError' ? 'timeout' : `error:${err.message}`;
      runStats.skipped.push({ playerId, name: player.name, reason });
      if (!args.dryRun) {
        cache.skipped[playerId] = { reason, at: new Date().toISOString() };
        saveCache(cache);
      }
      logProgress(i, batch.length, playerId, player.name, 'error', reason);

      if (consecutiveApiErrors >= MAX_CONSECUTIVE_API_ERRORS) {
        console.warn(`\nStopping batch: ${MAX_CONSECUTIVE_API_ERRORS} consecutive API errors. Retry later with --offset=${args.offset + i + 1}`);
        runStats.stoppedEarly = true;
        break;
      }
      continue;
    }

    consecutiveApiErrors = 0;

    if (result.skip) {
      runStats.skipped.push({ playerId, name: player.name, reason: result.reason });
      if (!args.dryRun) {
        cache.skipped[playerId] = { reason: result.reason, at: new Date().toISOString() };
        saveCache(cache);
      }
      logProgress(i, batch.length, playerId, player.name, 'skip', result.reason);
      continue;
    }

    const { meta, quality } = result;
    let imageUrl = meta.thumbUrl;

    if (args.download) {
      mkdirSync(IMAGES_DIR, { recursive: true });
      const ext = meta.mime?.includes('png') ? 'png' : meta.mime?.includes('webp') ? 'webp' : 'jpg';
      const localRel = `/images/players/${playerId}.${ext}`;
      const localAbs = join(root, 'public', localRel.replace(/^\//, ''));

      if (!args.dryRun) {
        try {
          await downloadImage(meta.thumbUrl, localAbs, writeFileSync);
          imageUrl = localRel;
        } catch (err) {
          const reason = `download_failed:${err.message}`;
          runStats.skipped.push({ playerId, name: player.name, reason });
          cache.skipped[playerId] = { reason, at: new Date().toISOString() };
          saveCache(cache);
          logProgress(i, batch.length, playerId, player.name, 'skip', reason);
          continue;
        }
      }
    }

    const entry = buildApprovedEntry(player, meta, imageUrl, quality);

    if (!args.dryRun) {
      cache.resolved[playerId] = { meta, at: new Date().toISOString() };
      delete cache.skipped[playerId];
      approved.entries[playerId] = entry;
      approved.updatedAt = new Date().toISOString().slice(0, 10);
      writeJson(APPROVED_PATH, approved);
      saveCache(cache);
    }

    runStats.added.push({ playerId, name: player.name, license: meta.licenseShort, commonsFile: meta.commonsFile });
    logProgress(i, batch.length, playerId, player.name, 'added', `${meta.commonsFile} (${meta.licenseShort})`);

    await sleep(API_DELAY_MS);
  }

  runStats.finishedAt = new Date().toISOString();
  if (!args.dryRun) writeJson(RUN_LOG_PATH, runStats);

  console.log('\n--- Batch summary ---');
  console.log(`Added: ${runStats.added.length}`);
  console.log(`Skipped: ${runStats.skipped.length}`);
  console.log(`Cache hits: ${runStats.cachedHits.length}`);
  console.log(`Already approved: ${runStats.alreadyApproved.length}`);
  console.log(`API errors: ${runStats.apiErrors}`);
  if (runStats.stoppedEarly) console.log('Stopped early due to repeated API errors.');

  const nextOffset = args.offset + batch.length;
  if (nextOffset < queue.length && !runStats.stoppedEarly) {
    console.log(`\nNext batch: npm run fetch:wikimedia-player-images -- --offset=${nextOffset} --limit=${args.limit}`);
  }

  if (!args.dryRun) {
    console.log(`\nCache: ${CACHE_PATH}`);
    console.log(`Approved: ${APPROVED_PATH}`);
    console.log(`Run log: ${RUN_LOG_PATH}`);
  }
}

main().catch((err) => {
  console.error('Fatal:', err.message);
  process.exit(1);
});
