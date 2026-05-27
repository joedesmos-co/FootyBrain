/**
 * Live men's national teams (wave 1 + wave 2) — separate from club teams[] in sampleData.
 */

import live from './nationalTeamLive.json';
import { getPlayerById } from './sampleData';
import { getQuizEligiblePlayers } from '../utils/quizEligibility';

export const LIVE_NATIONAL_TEAM_IDS = live.meta.liveNationalTeamIds;

export const nationalTeams = live.nationalTeams;

const nationalTeamById = new Map(nationalTeams.map((t) => [t.id, t]));

const membershipsByNationalTeamId = new Map();
const membershipByPlayerId = new Map();

for (const row of live.nationalMemberships) {
  if (!membershipsByNationalTeamId.has(row.nationalTeamId)) {
    membershipsByNationalTeamId.set(row.nationalTeamId, []);
  }
  membershipsByNationalTeamId.get(row.nationalTeamId).push(row);
  membershipByPlayerId.set(row.playerId, row);
}

/** Precomputed at build time — avoids O(memberships) player lookups at module init. */
const linkedCountByNationalTeamId = new Map(
  Object.entries(live.meta.membershipsPerTeam ?? {}).map(([id, count]) => [id, count]),
);

const quizReadyCountByNationalTeamId = new Map(
  Object.entries(live.meta.quizEligibleMembershipsPerTeam ?? {}).map(([id, count]) => [
    id,
    count,
  ]),
);

const squadCache = new Map();

const DEFAULT_MEMBERSHIP_TAGS = ['nationalPool'];
const MEMBERSHIP_TAGS = {
  nationalPool: 'nationalPool',
  currentSquad: 'currentSquad',
  worldCup2026Roster: 'worldCup2026Roster',
  projectedWorldCup2026Roster: 'projectedWorldCup2026Roster',
  worldCup2026Alternate: 'worldCup2026Alternate',
};

function getMembershipTags(row) {
  const tags = Array.isArray(row?.membershipTags) && row.membershipTags.length
    ? row.membershipTags
    : DEFAULT_MEMBERSHIP_TAGS;
  return new Set(tags);
}

export function isLiveNationalTeamId(id) {
  return nationalTeamById.has(id);
}

export function getNationalTeamById(id) {
  return nationalTeamById.get(id) ?? null;
}

export function getNationalTeamName(id) {
  return getNationalTeamById(id)?.displayName ?? 'Unknown';
}

export function getLiveNationalTeams() {
  return nationalTeams;
}

export function getMembershipForPlayer(playerId) {
  return membershipByPlayerId.get(playerId) ?? null;
}

export function getLiveNationalTeamForPlayer(player) {
  if (!player?.id) return null;
  const membership = membershipByPlayerId.get(player.id);
  if (!membership) return null;
  return getNationalTeamById(membership.nationalTeamId);
}

function getPlayersForNationalTeamByFilter(nationalTeamId, predicate) {
  const rows = membershipsByNationalTeamId.get(nationalTeamId) ?? [];
  const list = [];
  for (const row of rows) {
    if (predicate && !predicate(row)) continue;
    const player = getPlayerById(row.playerId);
    if (player) list.push(player);
  }
  list.sort((a, b) => (b.importanceScore ?? 0) - (a.importanceScore ?? 0));
  return list;
}

/**
 * Backward-compatible default “squad” for national-team pages.
 * Interpreted as the broader nationalPool (not a tournament roster).
 */
export function getPlayersForNationalTeam(nationalTeamId) {
  const cached = squadCache.get(nationalTeamId);
  if (cached) return cached;
  const pool = getNationalPoolPlayers(nationalTeamId);
  squadCache.set(nationalTeamId, pool);
  return pool;
}

export function getNationalPoolPlayers(nationalTeamId) {
  return getPlayersForNationalTeamByFilter(nationalTeamId, (row) =>
    getMembershipTags(row).has(MEMBERSHIP_TAGS.nationalPool),
  );
}

export function getCurrentSquadPlayers(nationalTeamId) {
  return getPlayersForNationalTeamByFilter(nationalTeamId, (row) =>
    getMembershipTags(row).has(MEMBERSHIP_TAGS.currentSquad),
  );
}

export function getWorldCupRosterPlayers(nationalTeamId) {
  return getPlayersForNationalTeamByFilter(nationalTeamId, (row) =>
    getMembershipTags(row).has(MEMBERSHIP_TAGS.worldCup2026Roster),
  );
}

export function getProjectedWorldCupRosterPlayers(nationalTeamId) {
  return getPlayersForNationalTeamByFilter(nationalTeamId, (row) =>
    getMembershipTags(row).has(MEMBERSHIP_TAGS.projectedWorldCup2026Roster),
  );
}

export function getNationalTeamQuizReadyPlayers(nationalTeamId) {
  return getQuizEligiblePlayers(getNationalPoolPlayers(nationalTeamId));
}

export function getNationalTeamMeta() {
  return live.meta;
}

export function getUnmatchedTmSquadRows() {
  return live.unmatchedTmSquadRows ?? [];
}

/** Players in club DB on a live NT squad (for counts). */
export function countLinkedPlayers(nationalTeamId) {
  if (linkedCountByNationalTeamId.has(nationalTeamId)) {
    return linkedCountByNationalTeamId.get(nationalTeamId);
  }
  return getPlayersForNationalTeam(nationalTeamId).length;
}

/** Quiz-ready players with a live national membership (single registry row each). */
export function getQuizEligiblePlayersForNationalTeam(nationalTeamId) {
  return getQuizEligiblePlayers(getPlayersForNationalTeam(nationalTeamId));
}

export function getNationalTeamQuizReadyCount(nationalTeamId) {
  if (quizReadyCountByNationalTeamId.has(nationalTeamId)) {
    return quizReadyCountByNationalTeamId.get(nationalTeamId);
  }
  return getQuizEligiblePlayersForNationalTeam(nationalTeamId).length;
}

export function isPlayerLinkedToLiveNationalTeam(playerId, nationalTeamId) {
  const membership = membershipByPlayerId.get(playerId);
  return membership?.nationalTeamId === nationalTeamId;
}

/** Minimum quiz-ready linked players to treat a nation as quiz-viable (matches quiz session gating). */
export const LIVE_NATIONAL_TEAM_MIN_QUIZ = 3;

export function isLiveNationalTeamQuizViable(nationalTeamId) {
  return getNationalTeamQuizReadyCount(nationalTeamId) >= LIVE_NATIONAL_TEAM_MIN_QUIZ;
}

/** Live nations with enough quiz-ready players for national quiz / Today's Picks. */
export function getViableLiveNationalTeams() {
  return nationalTeams.filter((team) => isLiveNationalTeamQuizViable(team.id));
}

const CONFEDERATION_ORDER = ['UEFA', 'CONMEBOL', 'CONCACAF', 'CAF', 'AFC', 'OFC'];

/**
 * @returns {Array<{ confederation: string, teams: typeof nationalTeams }>}
 */
export function getLiveNationalTeamsByConfederation() {
  const buckets = new Map();
  for (const team of nationalTeams) {
    const key = team.confederation ?? 'Other';
    if (!buckets.has(key)) buckets.set(key, []);
    buckets.get(key).push(team);
  }

  return [...buckets.entries()]
    .sort(([a], [b]) => {
      const ai = CONFEDERATION_ORDER.indexOf(a);
      const bi = CONFEDERATION_ORDER.indexOf(b);
      if (ai === -1 && bi === -1) return a.localeCompare(b);
      if (ai === -1) return 1;
      if (bi === -1) return -1;
      return ai - bi;
    })
    .map(([confederation, teams]) => ({
      confederation,
      teams: teams.sort((a, b) => a.displayName.localeCompare(b.displayName)),
    }));
}
