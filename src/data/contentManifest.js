/**
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
    'england',
    'france',
    'spain',
    'brazil',
    'argentina',
    'germany',
    'portugal',
    'italy',
    'netherlands',
    'belgium',
    'croatia',
    'switzerland',
    'denmark',
    'serbia',
    'turkey',
    'united-states',
    'mexico',
    'uruguay',
    'colombia',
    'chile',
    'morocco',
    'senegal',
    'nigeria',
    'japan',
    'korea-republic',
  ],
  leagues: [
    {
      id: 'premier-league',
      name: 'Premier League',
      country: 'England',
      teamCount: 15,
      playerCount: 341,
      shardStatus: 'bundled',
      shardPath: null,
      badgeTheme: { from: '#22c55e', to: '#134e4a', accent: '#dcfce7' },
    },
    {
      id: 'la-liga',
      name: 'La Liga',
      country: 'Spain',
      teamCount: 10,
      playerCount: 225,
      shardStatus: 'bundled',
      shardPath: null,
      badgeTheme: { from: '#f97316', to: '#7f1d1d', accent: '#ffedd5' },
    },
    {
      id: 'bundesliga',
      name: 'Bundesliga',
      country: 'Germany',
      teamCount: 10,
      playerCount: 222,
      shardStatus: 'bundled',
      shardPath: null,
      badgeTheme: { from: '#ef4444', to: '#111827', accent: '#fee2e2' },
    },
    {
      id: 'serie-a',
      name: 'Serie A',
      country: 'Italy',
      teamCount: 6,
      playerCount: 136,
      shardStatus: 'bundled',
      shardPath: null,
      badgeTheme: { from: '#38bdf8', to: '#1e3a8a', accent: '#e0f2fe' },
    },
    {
      id: 'ligue-1',
      name: 'Ligue 1',
      country: 'France',
      teamCount: 9,
      playerCount: 197,
      shardStatus: 'bundled',
      shardPath: null,
      badgeTheme: { from: '#22c55e', to: '#134e4a', accent: '#dcfce7' },
    },
    {
      id: 'eredivisie',
      name: 'Eredivisie',
      country: 'Netherlands',
      teamCount: 5,
      playerCount: 110,
      shardStatus: 'bundled',
      shardPath: null,
      badgeTheme: { from: '#f97316', to: '#7f1d1d', accent: '#ffedd5' },
    },
    {
      id: 'mls',
      name: 'Major League Soccer',
      country: 'United States',
      teamCount: 30,
      playerCount: 660,
      shardStatus: 'bundled',
      shardPath: null,
      badgeTheme: { from: '#ef4444', to: '#111827', accent: '#fee2e2' },
    },
    {
      id: 'brasileirao',
      name: 'Série A',
      country: 'Brazil',
      teamCount: 20,
      playerCount: 440,
      shardStatus: 'bundled',
      shardPath: null,
      badgeTheme: { from: '#38bdf8', to: '#1e3a8a', accent: '#e0f2fe' },
    }
  ],
};

const leagueById = new Map(CONTENT_MANIFEST.leagues.map((league) => [league.id, league]));

export function getManifestLeague(id) {
  return leagueById.get(id) ?? null;
}

export function getManifestLeagues() {
  return CONTENT_MANIFEST.leagues;
}

/** Future: dynamic import when shardPath is set. */
export async function loadLeagueShard(leagueId) {
  const league = getManifestLeague(leagueId);
  if (!league?.shardPath) {
    const mod = await import('./sampleData.js');
    return {
      league: mod.getLeagueById(leagueId),
      players: mod.getPlayersForLeague(leagueId),
      teams: mod.teams.filter((t) => t.leagueId === leagueId),
    };
  }
  throw new Error(`League shard not implemented: ${leagueId}`);
}
