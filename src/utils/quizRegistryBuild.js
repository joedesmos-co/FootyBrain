/**
 * Build quiz-registry.json payload — shared by write-quiz-registry.js and runtime fallback.
 */

import {
  INTERNATIONAL_PER_NATION_CAP,
  INTERNATIONAL_UNION_POOL_CAP,
} from '../data/worldCupQuizConstants.js';
import {
  hasEditorialQuizClues,
  isInQuizEcosystem,
  isQuizEligiblePlayer,
} from './quizPlayerRules.js';
import { ensureQuizPlayablePlayer } from './quizPlayerSynthesis.js';

const QUIZ_MIN_SESSION_POOL = 3;

function sortPlayerIds(ids, playerById) {
  ids.sort((a, b) => {
    const pa = playerById.get(a);
    const pb = playerById.get(b);
    const ia = pa?.importanceScore ?? 0;
    const ib = pb?.importanceScore ?? 0;
    if (ib !== ia) return ib - ia;
    const na = pa?.name ?? '';
    const nb = pb?.name ?? '';
    if (na !== nb) return na.localeCompare(nb);
    return String(a).localeCompare(String(b));
  });
}

/**
 * @param {{
 *   players: object[],
 *   teams: object[],
 *   leagues: object[],
 *   liveNt: object,
 *   dataAsOf?: string,
 *   source?: string,
 * }} input
 */
export function buildQuizRegistryPayload({
  players,
  teams,
  leagues,
  liveNt,
  dataAsOf = '',
  source = 'build',
}) {
  const liveNationalTeams = liveNt.nationalTeams ?? [];
  const liveMemberships = liveNt.nationalMemberships ?? [];
  const liveNationalTeamIds = new Set(liveNt.meta?.liveNationalTeamIds ?? []);

  const ecosystemSource = players.filter(isInQuizEcosystem);
  const editorialCount = ecosystemSource.filter(isQuizEligiblePlayer).length;

  const teamById = new Map(teams.map((t) => [t.id, t]));
  const leagueById = new Map(leagues.map((l) => [l.id, l]));

  const membershipByPlayerId = new Map();
  for (const row of liveMemberships) {
    if (row?.playerId) membershipByPlayerId.set(row.playerId, row);
  }

  const ecosystemById = new Map();
  const slimPlayers = ecosystemSource.map((p) => {
    const team = teamById.get(p.teamId);
    const league = leagueById.get(p.leagueId);
    const membership = membershipByPlayerId.get(p.id);
    const playable = ensureQuizPlayablePlayer(p, {
      teamName: team?.name,
      leagueName: league?.name,
    });
    ecosystemById.set(p.id, playable);
    return {
      id: playable.id,
      name: playable.name,
      fullName: playable.fullName ?? null,
      teamId: playable.teamId,
      teamName: team?.name ?? null,
      leagueId: playable.leagueId,
      leagueName: league?.name ?? null,
      position: playable.position ?? null,
      nationality: playable.nationality ?? null,
      nationalTeam: playable.nationalTeam ?? null,
      age: typeof playable.age === 'number' ? playable.age : null,
      _nationalTeamId: membership?.nationalTeamId ?? null,
      importanceScore: playable.importanceScore ?? 0,
      quizHints: Array.isArray(playable.quizHints) ? playable.quizHints : [],
      quickFact: playable.quickFact ?? '',
      quizClueTier: playable.quizClueTier ?? 'synthetic',
      hasEditorialClues: Boolean(playable.hasEditorialClues),
      quizEligible: hasEditorialQuizClues(playable),
      rosterTier: playable.rosterTier ?? null,
      dataStatus: playable.dataStatus ?? null,
      visualTheme: playable.visualTheme ?? null,
      _syntheticClues: Boolean(playable._syntheticClues),
    };
  });

  const ecosystemIds = new Set(slimPlayers.map((p) => p.id));

  const playerIdsByNationalTeamId = new Map();
  for (const row of liveMemberships) {
    if (!row?.playerId || !row?.nationalTeamId) continue;
    if (!ecosystemIds.has(row.playerId)) continue;
    if (!playerIdsByNationalTeamId.has(row.nationalTeamId)) {
      playerIdsByNationalTeamId.set(row.nationalTeamId, []);
    }
    playerIdsByNationalTeamId.get(row.nationalTeamId).push(row.playerId);
  }

  for (const [, ids] of playerIdsByNationalTeamId) {
    sortPlayerIds(ids, ecosystemById);
  }

  const viableIds = [];
  for (const [nationalTeamId, ids] of playerIdsByNationalTeamId.entries()) {
    if (!liveNationalTeamIds.has(String(nationalTeamId))) continue;
    if (ids.length >= QUIZ_MIN_SESSION_POOL) viableIds.push(nationalTeamId);
  }

  for (const [nationalTeamId, ids] of playerIdsByNationalTeamId.entries()) {
    if (ids.length < QUIZ_MIN_SESSION_POOL) playerIdsByNationalTeamId.delete(nationalTeamId);
  }

  const internationalCandidates = new Map();
  for (const nationalTeamId of viableIds) {
    const slice = (playerIdsByNationalTeamId.get(nationalTeamId) ?? []).slice(
      0,
      INTERNATIONAL_PER_NATION_CAP,
    );
    for (const playerId of slice) {
      const player = ecosystemById.get(playerId);
      if (player) internationalCandidates.set(playerId, player);
    }
  }

  const internationalPoolIds = [...internationalCandidates.values()]
    .sort((a, b) => (b.importanceScore ?? 0) - (a.importanceScore ?? 0))
    .slice(0, INTERNATIONAL_UNION_POOL_CAP)
    .map((p) => p.id);

  const internationalPoolIdSet = new Set(internationalPoolIds);

  for (const row of slimPlayers) {
    row._inInternationalPool = internationalPoolIdSet.has(row.id);
  }

  const slimTeams = teams.map((t) => ({
    id: t.id,
    name: t.name,
    leagueId: t.leagueId,
    country: t.country ?? null,
  }));

  const slimLeagues = leagues
    .map((l) => ({
      id: l.id,
      name: l.name,
      country: l.country ?? null,
    }))
    .filter((l) => l.id !== 'external');

  return {
    schemaVersion: 2,
    dataAsOf,
    meta: {
      quizEcosystemCount: slimPlayers.length,
      quizEligibleCount: editorialCount,
      teamCount: slimTeams.length,
      leagueCount: slimLeagues.length,
      generatedAt: new Date().toISOString(),
      source,
    },
    players: slimPlayers,
    teams: slimTeams,
    leagues: slimLeagues,
    national: {
      liveNationalTeamIds: [...liveNationalTeamIds],
      viableNationalTeamIds: viableIds,
      nationalTeams: liveNationalTeams,
      quizReadyPlayerIdsByNationalTeamId: Object.fromEntries(
        [...playerIdsByNationalTeamId.entries()],
      ),
      internationalPoolPlayerIds: internationalPoolIds,
    },
  };
}
