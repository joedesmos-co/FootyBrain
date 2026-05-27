#!/usr/bin/env node
/**
 * Generate a lightweight entity index for runtime lookups without importing sampleData.js.
 *
 * Output:
 * - public/data/entity-index.json
 *
 * Contains:
 * - teams: [{ id, name, leagueId, country? }]
 * - players: [{ id, leagueId, teamId }]
 *
 * Note: This does NOT change any data — it is a derived index to enable shard loading.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const OUT_PATH = path.join(ROOT, 'public/data/entity-index.json');

const { DATASET_META } = await import('../src/data/datasetMeta.js');
const { players, teams } = await import('../src/data/sampleData.js');

const index = {
  schemaVersion: 1,
  dataAsOf: DATASET_META.dataAsOf,
  generatedAt: new Date().toISOString(),
  counts: {
    players: players.length,
    teams: teams.length,
  },
  players: players.map((p) => ({ id: p.id, leagueId: p.leagueId, teamId: p.teamId })),
  teams: teams.map((t) => ({
    id: t.id,
    name: t.name,
    leagueId: t.leagueId,
    country: t.country ?? null,
  })),
};

fs.mkdirSync(path.dirname(OUT_PATH), { recursive: true });
fs.writeFileSync(OUT_PATH, `${JSON.stringify(index)}\n`);
console.log('Wrote', path.relative(ROOT, OUT_PATH));
console.log(`  players: ${index.counts.players}, teams: ${index.counts.teams}`);

