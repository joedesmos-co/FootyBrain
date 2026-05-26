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

export function getPlayersForNationalTeam(nationalTeamId) {
  const cached = squadCache.get(nationalTeamId);
  if (cached) return cached;

  const rows = membershipsByNationalTeamId.get(nationalTeamId) ?? [];
  const squad = [];
  for (const row of rows) {
    const player = getPlayerById(row.playerId);
    if (player) squad.push(player);
  }
  squad.sort((a, b) => (b.importanceScore ?? 0) - (a.importanceScore ?? 0));
  squadCache.set(nationalTeamId, squad);
  return squad;
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
