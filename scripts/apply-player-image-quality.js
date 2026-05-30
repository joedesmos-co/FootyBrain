#!/usr/bin/env node
/**
 * Remove sub-threshold / denylisted approved images (revert to placeholder).
 * Run: npm run apply:player-image-quality
 *
 * Options:
 *   --dry-run   Report removals without writing
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { players } from '../src/data/sampleData.js';
import { fetchCommonsFile, sleep, API_DELAY_MS } from './lib/wikimediaPlayerImage.mjs';
import { isDeniedCommonsFile, scorePlayerImage } from './lib/playerImageQuality.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const APPROVED_PATH = join(root, 'src/data/playerImageApproved.json');
const CACHE_PATH = join(root, 'generated-data/player-image-wikimedia-cache.json');

const dryRun = process.argv.includes('--dry-run');

function readJson(path, fallback = {}) {
  try {
    return JSON.parse(readFileSync(path, 'utf8'));
  } catch {
    return fallback;
  }
}

function main() {
  return run();
}

async function run() {
  const approved = readJson(APPROVED_PATH);
  const cache = readJson(CACHE_PATH, { resolved: {}, skipped: {} });
  const playerById = new Map(players.map((p) => [p.id, p]));
  const entries = { ...(approved.entries ?? {}) };

  const removed = [];
  const updated = [];

  for (const [playerId, entry] of Object.entries(entries)) {
    const player = playerById.get(playerId);
    let width = entry.imageWidth;
    let height = entry.imageHeight;
    let description = entry.commonsDescription;

    if (entry.commonsFile && !isDeniedCommonsFile(entry.commonsFile) && (!width || !height)) {
      await sleep(API_DELAY_MS);
      const remote = await fetchCommonsFile(entry.commonsFile);
      if (remote && !remote.error) {
        width = remote.width;
        height = remote.height;
        description = remote.description ?? description;
      }
    }

    const meta = {
      commonsFile: entry.commonsFile,
      description,
      width,
      height,
    };

    const quality = scorePlayerImage(meta, player?.name ?? playerId);
    const denylisted = isDeniedCommonsFile(entry.commonsFile);

    if (!quality.pass || denylisted) {
      removed.push({
        playerId,
        name: player?.name ?? playerId,
        commonsFile: entry.commonsFile,
        score: quality.score,
        flags: quality.flags,
        denylisted,
      });
      delete entries[playerId];
      if (cache.resolved?.[playerId]) delete cache.resolved[playerId];
      continue;
    }

    const next = {
      ...entry,
      commonsDescription: description ?? entry.commonsDescription,
      imageWidth: width ?? entry.imageWidth ?? null,
      imageHeight: height ?? entry.imageHeight ?? null,
      qualityScore: quality.score,
      qualityGrade: quality.grade,
    };
    if (JSON.stringify(next) !== JSON.stringify(entry)) {
      entries[playerId] = next;
      updated.push({ playerId, score: quality.score, grade: quality.grade });
    }
  }

  console.log(`Quality apply${dryRun ? ' (dry-run)' : ''}: remove ${removed.length}, refresh scores ${updated.length}`);

  for (const r of removed) {
    console.log(`  remove ${r.playerId} (${r.name}) score=${r.score} ${r.denylisted ? 'denylist' : r.flags.join(',')} — ${r.commonsFile}`);
  }

  if (!dryRun) {
    writeFileSync(
      APPROVED_PATH,
      `${JSON.stringify({ ...approved, entries, updatedAt: new Date().toISOString().slice(0, 10) }, null, 2)}\n`,
      'utf8',
    );
    writeFileSync(
      CACHE_PATH,
      `${JSON.stringify({ ...cache, updatedAt: new Date().toISOString() }, null, 2)}\n`,
      'utf8',
    );
  }
}

main().catch((err) => {
  console.error('Fatal:', err.message);
  process.exit(1);
});
