#!/usr/bin/env node
/**
 * Export one league's shell + teams + players to public/data/leagues/{id}.json
 * Usage: node scripts/write-league-shard.js <league-id>
 * Example: node scripts/write-league-shard.js mls
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { DATASET_META } from '../src/data/datasetMeta.js';
import { getLeagueById, getPlayersForLeague, teams } from '../src/data/sampleData.js';
import { mergePlayerOverlay, mergeTeamOverlay } from '../src/data/editorialOverlayAccess.js';

const leagueId = process.argv[2];
if (!leagueId) {
  console.error('Usage: node scripts/write-league-shard.js <league-id>');
  process.exit(1);
}

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const OUT_DIR = path.join(ROOT, 'public/data/leagues');
const OUT_FILE = path.join(OUT_DIR, `${leagueId}.json`);

const league = getLeagueById(leagueId);
if (!league) {
  console.error(`League not found: ${leagueId}`);
  process.exit(1);
}

const leagueTeams = teams.filter((team) => team.leagueId === leagueId).map((t) => mergeTeamOverlay(t));
const leaguePlayers = getPlayersForLeague(leagueId).map((p) => mergePlayerOverlay(p));

const shard = {
  schemaVersion: 1,
  leagueId,
  dataAsOf: DATASET_META.dataAsOf,
  league,
  teams: leagueTeams,
  players: leaguePlayers,
  meta: {
    teamCount: leagueTeams.length,
    playerCount: leaguePlayers.length,
    generatedAt: new Date().toISOString(),
  },
};

fs.mkdirSync(OUT_DIR, { recursive: true });
fs.writeFileSync(OUT_FILE, `${JSON.stringify(shard)}\n`);

const rawKb = (fs.statSync(OUT_FILE).size / 1024).toFixed(1);
console.log(`Wrote ${OUT_FILE} (${leagueTeams.length} teams, ${leaguePlayers.length} players, ${rawKb} KB raw)`);
