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
    'norway',
    'ghana',
    'algeria',
    'poland',
    'austria',
    'ukraine',
    'scotland',
    'paraguay',
    'czechia',
    'sweden',
    'cote-divoire',
    'canada',
    'australia',
    'ecuador',
    'bosnia-herzegovina',
    'congo-dr',
    'haiti',
  ],
  leagues: [
    {
      id: 'premier-league',
      name: 'Premier League',
      country: 'England',
      teamCount: 20,
      playerCount: 522,
      shardStatus: 'deferred',
      shardPath: '/data/leagues/premier-league.json',
      badgeTheme: { from: '#22c55e', to: '#134e4a', accent: '#dcfce7' },
    },
    {
      id: 'la-liga',
      name: 'La Liga',
      country: 'Spain',
      teamCount: 20,
      playerCount: 512,
      shardStatus: 'deferred',
      shardPath: '/data/leagues/la-liga.json',
      badgeTheme: { from: '#f97316', to: '#7f1d1d', accent: '#ffedd5' },
    },
    {
      id: 'bundesliga',
      name: 'Bundesliga',
      country: 'Germany',
      teamCount: 18,
      playerCount: 494,
      shardStatus: 'deferred',
      shardPath: '/data/leagues/bundesliga.json',
      badgeTheme: { from: '#ef4444', to: '#111827', accent: '#fee2e2' },
    },
    {
      id: 'serie-a',
      name: 'Serie A',
      country: 'Italy',
      teamCount: 20,
      playerCount: 530,
      shardStatus: 'deferred',
      shardPath: '/data/leagues/serie-a.json',
      badgeTheme: { from: '#38bdf8', to: '#1e3a8a', accent: '#e0f2fe' },
    },
    {
      id: 'ligue-1',
      name: 'Ligue 1',
      country: 'France',
      teamCount: 18,
      playerCount: 460,
      shardStatus: 'deferred',
      shardPath: '/data/leagues/ligue-1.json',
      badgeTheme: { from: '#22c55e', to: '#134e4a', accent: '#dcfce7' },
    },
    {
      id: 'eredivisie',
      name: 'Eredivisie',
      country: 'Netherlands',
      teamCount: 5,
      playerCount: 135,
      shardStatus: 'deferred',
      shardPath: '/data/leagues/eredivisie.json',
      badgeTheme: { from: '#f97316', to: '#7f1d1d', accent: '#ffedd5' },
    },
    {
      id: 'mls',
      name: 'Major League Soccer',
      country: 'United States',
      teamCount: 30,
      playerCount: 806,
      shardStatus: 'deferred',
      shardPath: '/data/leagues/mls.json',
      badgeTheme: { from: '#ef4444', to: '#111827', accent: '#fee2e2' },
    },
    {
      id: 'brasileirao',
      name: 'Série A',
      country: 'Brazil',
      teamCount: 20,
      playerCount: 627,
      shardStatus: 'deferred',
      shardPath: '/data/leagues/brasileirao.json',
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

export { loadLeagueShard, hasExternalLeagueShard, PILOT_SHARD_LEAGUE_ID, peekLeagueShard } from './leagueShard';
