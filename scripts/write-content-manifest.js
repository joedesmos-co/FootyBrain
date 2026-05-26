#!/usr/bin/env node
/**
 * Refresh league player/team counts in contentManifest.js from live sampleData.
 * Run after merge: node scripts/write-content-manifest.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { leagues, teams, players } from '../src/data/sampleData.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const MANIFEST_PATH = path.join(ROOT, 'src/data/contentManifest.js');
const PUBLIC_JSON_PATH = path.join(ROOT, 'public/data/content-manifest.json');

const liveNationalMeta = JSON.parse(
  fs.readFileSync(path.join(ROOT, 'src/data/nationalTeamLive.json'), 'utf8'),
).meta;

const manifestSrc = fs.readFileSync(MANIFEST_PATH, 'utf8');
const dataAsOfMatch = manifestSrc.match(/dataAsOf:\s*'([^']+)'/);
const dataAsOf = dataAsOfMatch?.[1] ?? new Date().toISOString().slice(0, 10);

/** Phase 8 league shards — preserve when regenerating manifest. */
const SHARD_OVERRIDES = {
  'premier-league': {
    shardStatus: 'deferred',
    shardPath: '/data/leagues/premier-league.json',
  },
  'la-liga': {
    shardStatus: 'deferred',
    shardPath: '/data/leagues/la-liga.json',
  },
  bundesliga: {
    shardStatus: 'deferred',
    shardPath: '/data/leagues/bundesliga.json',
  },
  'serie-a': {
    shardStatus: 'deferred',
    shardPath: '/data/leagues/serie-a.json',
  },
  'ligue-1': {
    shardStatus: 'deferred',
    shardPath: '/data/leagues/ligue-1.json',
  },
  eredivisie: {
    shardStatus: 'deferred',
    shardPath: '/data/leagues/eredivisie.json',
  },
  mls: {
    shardStatus: 'deferred',
    shardPath: '/data/leagues/mls.json',
  },
  brasileirao: {
    shardStatus: 'deferred',
    shardPath: '/data/leagues/brasileirao.json',
  },
};

const leagueRows = leagues.map((league, index) => {
  const teamCount = teams.filter((t) => t.leagueId === league.id).length;
  const playerCount = players.filter((p) => p.leagueId === league.id).length;
  const theme = league.badgeTheme ?? {
    from: '#22c55e',
    to: '#134e4a',
    accent: '#dcfce7',
  };
  const shardOverride = SHARD_OVERRIDES[league.id];
  return {
    id: league.id,
    name: league.name,
    country: league.country,
    teamCount,
    playerCount,
    shardStatus: shardOverride?.shardStatus ?? 'bundled',
    shardPath: shardOverride?.shardPath ?? null,
    badgeTheme: theme,
  };
});

const liveNationalTeamIds = [...liveNationalMeta.liveNationalTeamIds];

function formatLeague(league) {
  const shardStatus = league.shardStatus ?? 'bundled';
  const shardPath =
    league.shardPath === null || league.shardPath === undefined
      ? 'null'
      : `'${league.shardPath}'`;
  return `    {
      id: '${league.id}',
      name: '${league.name.replace(/'/g, "\\'")}',
      country: '${league.country.replace(/'/g, "\\'")}',
      teamCount: ${league.teamCount},
      playerCount: ${league.playerCount},
      shardStatus: '${shardStatus}',
      shardPath: ${shardPath},
      badgeTheme: { from: '${league.badgeTheme.from}', to: '${league.badgeTheme.to}', accent: '${league.badgeTheme.accent}' },
    }`;
}

const output = `/**
 * Lightweight content manifest — league/national shell without player rows.
 * Full squads remain in sampleData.js until league shards ship (see PERFORMANCE_SCALING_PLAN.md).
 * Regenerated: scripts/write-content-manifest.js
 */

import { DATASET_META } from './datasetMeta';

/** @typedef {'bundled' | 'deferred'} LeagueShardStatus */

export const CONTENT_MANIFEST = {
  schemaVersion: 1,
  dataAsOf: DATASET_META.dataAsOf,
  defaultPlayerChunk: 'sample-data',
  nationalTeamChunk: 'national-team-data',
  liveNationalTeamIds: [
${liveNationalTeamIds.map((id) => `    '${id}',`).join('\n')}
  ],
  leagues: [
${leagueRows.map(formatLeague).join(',\n')}
  ],
};

const leagueById = new Map(CONTENT_MANIFEST.leagues.map((league) => [league.id, league]));

export function getManifestLeague(id) {
  return leagueById.get(id) ?? null;
}

export function getManifestLeagues() {
  return CONTENT_MANIFEST.leagues;
}

export { loadLeagueShard, hasExternalLeagueShard, PILOT_SHARD_LEAGUE_ID, peekLeagueShard } from './leagueShard';
`;

fs.writeFileSync(MANIFEST_PATH, output);

const publicJson = {
  schemaVersion: 1,
  dataAsOf,
  defaultPlayerChunk: 'sample-data',
  nationalTeamChunk: 'national-team-data',
  note: 'Mirror of src/data/contentManifest.js for future runtime fetch.',
  liveNationalTeamIds,
  leagues: leagueRows.map(({ id, shardStatus, shardPath, playerCount, teamCount }) => ({
    id,
    shardStatus,
    shardPath,
    playerCount,
    teamCount,
  })),
};

fs.writeFileSync(PUBLIC_JSON_PATH, `${JSON.stringify(publicJson, null, 2)}\n`);

console.log('Wrote', path.relative(ROOT, MANIFEST_PATH));
console.log('Wrote', path.relative(ROOT, PUBLIC_JSON_PATH));
for (const l of leagueRows) {
  console.log(`  ${l.id}: ${l.playerCount} players, ${l.teamCount} teams`);
}
