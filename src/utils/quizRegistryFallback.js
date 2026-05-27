/**
 * Build quiz-registry shape from bundled data when public/data/quiz-registry.json fails.
 * Mirrors scripts/write-quiz-registry.js — eligibility rules unchanged.
 */

import {
  INTERNATIONAL_PER_NATION_CAP,
  INTERNATIONAL_UNION_POOL_CAP,
} from '../data/worldCupQuizConstants.js';
import { DATASET_META } from '../data/datasetMeta.js';
import { isQuizEligiblePlayer } from './quizPlayerRules.js';

/** @returns {Promise<object>} Quiz registry shape (matches public/data/quiz-registry.json). */
export async function buildQuizRegistryFromBundledData() {
  const [{ players, teams, leagues }, liveNtModule] = await Promise.all([
    import('../data/sampleData.js'),
    import('../data/nationalTeamLive.json', { with: { type: 'json' } }),
  ]);
  const liveNt = liveNtModule.default;

  const liveNationalTeams = liveNt.nationalTeams ?? [];
  const liveMemberships = liveNt.nationalMemberships ?? [];
  const liveNationalTeamIds = new Set(liveNt.meta?.liveNationalTeamIds ?? []);

  const quizReadyPlayers = players.filter(isQuizEligiblePlayer);
  const teamById = new Map(teams.map((t) => [t.id, t]));
  const leagueById = new Map(leagues.map((l) => [l.id, l]));

  const quizReadyById = new Set(quizReadyPlayers.map((p) => p.id));
  const membershipByPlayerId = new Map();
  for (const row of liveMemberships) {
    if (row?.playerId) membershipByPlayerId.set(row.playerId, row);
  }

  const quizReadyPlayerIdsByNationalTeamId = new Map();
  for (const row of liveMemberships) {
    if (!row?.playerId || !row?.nationalTeamId) continue;
    if (!quizReadyById.has(row.playerId)) continue;
    if (!quizReadyPlayerIdsByNationalTeamId.has(row.nationalTeamId)) {
      quizReadyPlayerIdsByNationalTeamId.set(row.nationalTeamId, []);
    }
    quizReadyPlayerIdsByNationalTeamId.get(row.nationalTeamId).push(row.playerId);
  }

  const quizReadyByPlayerId = new Map(quizReadyPlayers.map((p) => [p.id, p]));
  for (const [, ids] of quizReadyPlayerIdsByNationalTeamId) {
    ids.sort((a, b) => {
      const pa = quizReadyByPlayerId.get(a);
      const pb = quizReadyByPlayerId.get(b);
      const ia = pa?.importanceScore ?? 0;
      const ib = pb?.importanceScore ?? 0;
      if (ib !== ia) return ib - ia;
      const na = pa?.name ?? '';
      const nb = pb?.name ?? '';
      if (na !== nb) return na.localeCompare(nb);
      return String(a).localeCompare(String(b));
    });
  }

  const viableIds = [];
  for (const [nationalTeamId, ids] of quizReadyPlayerIdsByNationalTeamId.entries()) {
    if (!liveNationalTeamIds.has(String(nationalTeamId))) continue;
    if (ids.length >= 3) viableIds.push(nationalTeamId);
  }

  const internationalCandidates = new Map();
  for (const nationalTeamId of viableIds) {
    const slice = (quizReadyPlayerIdsByNationalTeamId.get(nationalTeamId) ?? []).slice(
      0,
      INTERNATIONAL_PER_NATION_CAP,
    );
    for (const playerId of slice) {
      const player = quizReadyByPlayerId.get(playerId);
      if (player) internationalCandidates.set(playerId, player);
    }
  }

  const internationalPoolIds = [...internationalCandidates.values()]
    .sort((a, b) => (b.importanceScore ?? 0) - (a.importanceScore ?? 0))
    .slice(0, INTERNATIONAL_UNION_POOL_CAP)
    .map((p) => p.id);

  const internationalPoolIdSet = new Set(internationalPoolIds);

  const slimPlayers = quizReadyPlayers.map((p) => {
    const team = teamById.get(p.teamId);
    const league = leagueById.get(p.leagueId);
    const membership = membershipByPlayerId.get(p.id);
    return {
      id: p.id,
      name: p.name,
      fullName: p.fullName ?? null,
      teamId: p.teamId,
      teamName: team?.name ?? null,
      leagueId: p.leagueId,
      leagueName: league?.name ?? null,
      position: p.position ?? null,
      nationality: p.nationality ?? null,
      nationalTeam: p.nationalTeam ?? null,
      _nationalTeamId: membership?.nationalTeamId ?? null,
      _inInternationalPool: internationalPoolIdSet.has(p.id),
      importanceScore: p.importanceScore ?? 0,
      quizHints: Array.isArray(p.quizHints) ? p.quizHints : [],
      quickFact: p.quickFact ?? '',
      quizEligible: true,
      rosterTier: p.rosterTier ?? null,
      dataStatus: p.dataStatus ?? null,
      visualTheme: p.visualTheme ?? null,
    };
  });

  return {
    schemaVersion: 1,
    dataAsOf: DATASET_META.dataAsOf,
    meta: {
      quizEligibleCount: slimPlayers.length,
      teamCount: teams.length,
      leagueCount: leagues.length,
      generatedAt: new Date().toISOString(),
      source: 'bundled-fallback',
    },
    players: slimPlayers,
    teams: teams.map((t) => ({
      id: t.id,
      name: t.name,
      leagueId: t.leagueId,
      country: t.country ?? null,
    })),
    leagues: leagues.map((l) => ({
      id: l.id,
      name: l.name,
      country: l.country ?? null,
    })),
    national: {
      liveNationalTeamIds: [...liveNationalTeamIds],
      nationalTeams: liveNationalTeams,
      quizReadyPlayerIdsByNationalTeamId: Object.fromEntries(
        [...quizReadyPlayerIdsByNationalTeamId.entries()],
      ),
      internationalPoolPlayerIds: internationalPoolIds,
    },
  };
}
