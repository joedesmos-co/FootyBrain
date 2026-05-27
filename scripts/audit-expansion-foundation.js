#!/usr/bin/env node
/**
 * Expansion foundation audit — league/club/national coverage, gzip, registry-only nations.
 */

import fs from 'fs';
import path from 'path';
import { gzipSync } from 'zlib';
import { fileURLToPath } from 'url';
import { players, teams, leagues } from '../src/data/sampleData.js';
import { DATASET_META } from '../src/data/datasetMeta.js';
import { isQuizEligiblePlayer } from '../src/utils/quizPlayerRules.js';
import live from '../src/data/nationalTeamLive.json' with { type: 'json' };
import qualified from '../editorial-overlays/world-cup-2026-qualified-teams.json' with { type: 'json' };
import { loadExpansionFoundation } from './lib/expansion-foundation.js';
import { EXPANSION_LIMITS } from './phase1-curation.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const SAMPLE_PATH = path.join(ROOT, 'src/data/sampleData.js');
const foundation = loadExpansionFoundation();
const manifestPath = path.join(ROOT, 'public/data/content-manifest.json');
const contentManifest = fs.existsSync(manifestPath)
  ? JSON.parse(fs.readFileSync(manifestPath, 'utf8'))
  : { leagues: leagues.map((l) => ({ id: l.id, shardStatus: 'bundled' })) };

const liveIds = new Set(live.meta.liveNationalTeamIds ?? []);
const quizReady = players.filter(isQuizEligiblePlayer);

console.log('FootyBrain expansion foundation audit\n');
console.log('Players:', players.length, '| Quiz-ready:', quizReady.length);
console.log('Hard max:', EXPANSION_LIMITS.playersHardMax);
console.log('DATASET_META:', DATASET_META);

const gz = gzipSync(fs.readFileSync(SAMPLE_PATH));
const gzipKb = gz.length / 1024;
console.log(`\nsampleData.js gzip: ${gzipKb.toFixed(1)} KB (warn ${foundation.dataPolicy?.sampleDataGzipWarnKb ?? 230}, fail ${foundation.dataPolicy?.sampleDataGzipFailKb ?? 280})`);

console.log('\n=== Players by league ===');
const top5 = ['premier-league', 'la-liga', 'bundesliga', 'serie-a', 'ligue-1'];
for (const league of leagues) {
  const tcount = teams.filter((t) => t.leagueId === league.id).length;
  const pcount = players.filter((p) => p.leagueId === league.id).length;
  const qcount = players.filter((p) => p.leagueId === league.id && isQuizEligiblePlayer(p)).length;
  const shard = contentManifest.leagues.find((l) => l.id === league.id);
  console.log(
    `${league.id.padEnd(16)} teams ${String(tcount).padStart(3)} players ${String(pcount).padStart(5)} quiz ${String(qcount).padStart(4)} shard ${shard?.shardStatus ?? '—'}`,
  );
}

const externalPlayers = players.filter((p) => p.leagueId === 'external').length;
console.log(`\nExternal league share: ${((100 * externalPlayers) / players.length).toFixed(1)}% of players`);
console.log('Top-5 EU share:', ((100 * players.filter((p) => top5.includes(p.leagueId)).length) / players.length).toFixed(1) + '%');

console.log('\n=== Incomplete major leagues (manifest) ===');
for (const league of contentManifest.leagues) {
  if (league.id === 'external') continue;
  const expected = league.id === 'eredivisie' ? 18 : league.id === 'bundesliga' ? 18 : league.id === 'ligue-1' ? 18 : 20;
  const actual = teams.filter((t) => t.leagueId === league.id).length;
  if (actual < expected) {
    console.log(`  ${league.id}: ${actual}/${expected} clubs`);
  }
}

console.log('\n=== Thin clubs (<18 players, excluding external) ===');
const thin = teams
  .map((t) => ({
    id: t.id,
    league: t.leagueId,
    n: players.filter((p) => p.teamId === t.id).length,
  }))
  .filter((t) => t.leagueId !== 'external' && t.n < 18)
  .sort((a, b) => a.n - b.n);
console.log(`Count: ${thin.length}`);
thin.slice(0, 20).forEach((t) => console.log(`  ${t.league} ${t.id}: ${t.n}`));

console.log('\n=== World Cup qualified not live ===');
const wcMissing = (qualified.teams ?? []).filter((t) => !liveIds.has(t.id));
for (const t of wcMissing) {
  console.log(`  ${t.id} (${t.displayName})`);
}

console.log('\n=== Registry-heavy live nations (preview links < 5) ===');
const previewCounts = live.meta.previewMembershipsPerTeam ?? {};
for (const id of liveIds) {
  const linked = live.meta.membershipsPerTeam?.[id] ?? 0;
  const preview = previewCounts[id] ?? 0;
  const registryOnly = linked > 0 && preview < Math.min(5, linked * 0.15);
  if (registryOnly && linked >= 15) {
    console.log(`  ${id}: ${linked} linked, ${preview} preview TM links`);
  }
}

const shardDir = path.join(ROOT, 'public/data/leagues');
if (fs.existsSync(shardDir)) {
  console.log('\n=== League shard sizes (raw KB) ===');
  for (const file of fs.readdirSync(shardDir).filter((f) => f.endsWith('.json'))) {
    const kb = fs.statSync(path.join(shardDir, file)).size / 1024;
    console.log(`  ${file}: ${kb.toFixed(1)} KB`);
  }
}

console.log('\n=== Projections (foundation manifest) ===');
console.log(JSON.stringify(foundation.projections ?? {}, null, 2));
