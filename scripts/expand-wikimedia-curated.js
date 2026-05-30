#!/usr/bin/env node
/**
 * Append high-importance players to wikimedia-player-curated.mjs (search-only specs).
 * Run: node scripts/expand-wikimedia-curated.js
 * Options:
 *   --min-importance=N   Default 78
 *   --limit=N            Max new entries (default 80)
 *   --dry-run            Print only, no file write
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { players } from '../src/data/sampleData.js';
import curated from './data/wikimedia-player-curated.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const CURATED_PATH = join(__dirname, 'data/wikimedia-player-curated.mjs');

function parseArgs(argv) {
  const out = { dryRun: argv.includes('--dry-run'), minImportance: 78, limit: 80 };
  for (const arg of argv) {
    if (arg.startsWith('--min-importance=')) out.minImportance = Number(arg.split('=')[1]) || 78;
    if (arg.startsWith('--limit=')) out.limit = Number(arg.split('=')[1]) || 80;
  }
  return out;
}

function verifyNameFromPlayer(name) {
  const parts = String(name ?? '')
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (parts.length >= 2) return parts[parts.length - 1];
  return parts[0] ?? 'Player';
}

function buildEntryLine(player) {
  const verifyName = verifyNameFromPlayer(player.name);
  const searchName = player.name.replace(/'/g, "\\'");
  return `    '${player.id}': { searchName: '${searchName}', verifyName: '${verifyName.replace(/'/g, "\\'")}' },`;
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const existing = new Set(Object.keys(curated.entries ?? {}));

  const candidates = players
    .filter((p) => p.leagueId !== 'external')
    .filter((p) => (p.importanceScore ?? 0) >= args.minImportance)
    .filter((p) => !existing.has(p.id))
    .sort((a, b) => (b.importanceScore ?? 0) - (a.importanceScore ?? 0) || a.id.localeCompare(b.id))
    .slice(0, args.limit);

  if (!candidates.length) {
    console.log('No new curated candidates.');
    return;
  }

  console.log(`Adding ${candidates.length} curated entries (importance >= ${args.minImportance})…`);
  for (const p of candidates.slice(0, 10)) {
    console.log(`  ${p.name} (${p.importanceScore})`);
  }
  if (candidates.length > 10) console.log(`  … and ${candidates.length - 10} more`);

  const block = [
    '',
    `    // Batch ${Math.ceil((existing.size + candidates.length) / 50)} — auto-expanded ${new Date().toISOString().slice(0, 10)}`,
    ...candidates.map(buildEntryLine),
  ].join('\n');

  if (args.dryRun) {
    console.log('\n(dry-run — no file write)\n');
    console.log(block);
    return;
  }

  const src = readFileSync(CURATED_PATH, 'utf8');
  const marker = '\n  },\n};';
  if (!src.includes(marker)) {
    console.error('Could not find entries closing marker in curated file.');
    process.exit(1);
  }
  const next = src.replace(marker, `${block}\n  },\n};`);
  writeFileSync(CURATED_PATH, next, 'utf8');
  console.log(`\nWrote ${CURATED_PATH}`);
}

main();
