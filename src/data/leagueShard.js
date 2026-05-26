/**
 * League shard loader (Phase 8 — per-league JSON when manifest.shardPath is set).
 * Fetches public JSON when manifest.shardPath is set; otherwise falls back to sampleData.js.
 */

import { getManifestLeague } from './contentManifest';

/** @typedef {'shard' | 'bundled'} LeagueShardSource */

/**
 * @typedef {object} LeagueShardPayload
 * @property {LeagueShardSource} source
 * @property {object} league
 * @property {object[]} teams
 * @property {object[]} players
 * @property {(teamId: string) => string} getTeamName
 * @property {(leagueId: string) => string} getLeagueName
 */

/** @type {Map<string, LeagueShardPayload>} */
const shardCache = new Map();

/** @type {Map<string, Promise<LeagueShardPayload>>} */
const inflight = new Map();

/** @deprecated Use hasExternalLeagueShard(leagueId) — first pilot league id. */
export const PILOT_SHARD_LEAGUE_ID = 'premier-league';

export function hasExternalLeagueShard(leagueId) {
  const entry = getManifestLeague(leagueId);
  return entry?.shardStatus === 'deferred' && Boolean(entry?.shardPath);
}

function indexTeams(teams) {
  const teamById = new Map(teams.map((team) => [team.id, team]));
  return {
    teamById,
    getTeamName(teamId) {
      return teamById.get(teamId)?.name ?? 'Unknown';
    },
  };
}

function normalizeShardPayload(raw, source) {
  const teams = raw.teams ?? [];
  const league = raw.league ?? null;
  const { getTeamName } = indexTeams(teams);
  const leagueId = league?.id ?? raw.leagueId;

  return {
    source,
    league,
    teams,
    players: raw.players ?? [],
    getTeamName,
    getLeagueName(id) {
      if (id === leagueId) return league?.name ?? 'Unknown';
      return getManifestLeague(id)?.name ?? 'Unknown';
    },
  };
}

async function loadBundledLeagueShard(leagueId) {
  const mod = await import('./sampleData.js');
  return normalizeShardPayload(
    {
      league: mod.getLeagueById(leagueId),
      teams: mod.teams.filter((team) => team.leagueId === leagueId),
      players: mod.getPlayersForLeague(leagueId),
    },
    'bundled',
  );
}

async function fetchExternalShard(leagueId, shardPath) {
  const url = shardPath.startsWith('/') ? shardPath : `/${shardPath}`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`League shard fetch failed (${response.status}): ${url}`);
  }
  const raw = await response.json();
  if (raw.leagueId && raw.leagueId !== leagueId) {
    throw new Error(`League shard mismatch: expected ${leagueId}, got ${raw.leagueId}`);
  }
  return normalizeShardPayload(raw, 'shard');
}

/**
 * Load league teams + players (cached). External shards avoid importing sampleData.js.
 * @param {string} leagueId
 * @returns {Promise<LeagueShardPayload>}
 */
export async function loadLeagueShard(leagueId) {
  if (!leagueId) {
    throw new Error('loadLeagueShard: leagueId required');
  }

  const cached = shardCache.get(leagueId);
  if (cached) return cached;

  const pending = inflight.get(leagueId);
  if (pending) return pending;

  const manifestEntry = getManifestLeague(leagueId);
  const promise = (async () => {
    if (manifestEntry?.shardPath && manifestEntry.shardStatus === 'deferred') {
      try {
        const payload = await fetchExternalShard(leagueId, manifestEntry.shardPath);
        shardCache.set(leagueId, payload);
        return payload;
      } catch (error) {
        console.warn(`[leagueShard] ${leagueId} fetch failed, using bundled fallback`, error);
      }
    }
    const payload = await loadBundledLeagueShard(leagueId);
    shardCache.set(leagueId, payload);
    return payload;
  })();

  inflight.set(leagueId, promise);
  try {
    return await promise;
  } finally {
    inflight.delete(leagueId);
  }
}

export function peekLeagueShard(leagueId) {
  return shardCache.get(leagueId) ?? null;
}

export function clearLeagueShardCache() {
  shardCache.clear();
  inflight.clear();
}
