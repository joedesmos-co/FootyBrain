#!/usr/bin/env node
/**
 * Generate public/data/quiz-registry.json
 *
 * Slim quiz/daily registry: quiz-ready players + lightweight filter metadata.
 * Avoids loading full sampleData monolith on quiz/daily cold paths.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import { players, teams, leagues } from '../src/data/sampleData.js';
import { DATASET_META } from '../src/data/datasetMeta.js';
import { isQuizEligiblePlayer } from '../src/utils/quizPlayerRules.js';
import {
  INTERNATIONAL_PER_NATION_CAP,
  INTERNATIONAL_UNION_POOL_CAP,
} from '../src/data/worldCupQuizConstants.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const OUT_DIR = path.join(ROOT, 'public/data');
const OUT_PATH = path.join(OUT_DIR, 'quiz-registry.json');

const liveNtRaw = fs.readFileSync(path.join(ROOT, 'src/data/nationalTeamLive.json'), 'utf8');
const liveNt = JSON.parse(liveNtRaw);
const liveNationalTeams = liveNt.nationalTeams ?? [];
const liveMemberships = liveNt.nationalMemberships ?? [];
const liveNationalTeamIds = new Set(liveNt.meta?.liveNationalTeamIds ?? []);

const quizReadyPlayers = players.filter(isQuizEligiblePlayer);

if (typeof DATASET_META?.quizEligibleCount === 'number') {
  if (quizReadyPlayers.length !== DATASET_META.quizEligibleCount) {
    console.warn(
      `[write-quiz-registry] Warning: quiz-ready count ${quizReadyPlayers.length} != DATASET_META.quizEligibleCount ${DATASET_META.quizEligibleCount}`,
    );
  }
}

const teamById = new Map(teams.map((t) => [t.id, t]));
const leagueById = new Map(leagues.map((l) => [l.id, l]));

// Build quiz-ready membership lists per national team (player ids only).
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

// Stable order: importanceScore desc, then name, then id.
const quizReadyByPlayerId = new Map(quizReadyPlayers.map((p) => [p.id, p]));
for (const [nationalTeamId, ids] of quizReadyPlayerIdsByNationalTeamId) {
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

// Precompute international union pool (matches nationalQuizPools.js behavior, but registry-only).
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

const slimTeams = teams.map((t) => ({
  id: t.id,
  name: t.name,
  leagueId: t.leagueId,
  country: t.country ?? null,
}));

const slimLeagues = leagues.map((l) => ({
  id: l.id,
  name: l.name,
  country: l.country ?? null,
}));

const registry = {
  schemaVersion: 1,
  dataAsOf: DATASET_META.dataAsOf,
  meta: {
    quizEligibleCount: slimPlayers.length,
    teamCount: slimTeams.length,
    leagueCount: slimLeagues.length,
    generatedAt: new Date().toISOString(),
  },
  players: slimPlayers,
  teams: slimTeams,
  leagues: slimLeagues,
  national: {
    liveNationalTeamIds: [...liveNationalTeamIds],
    nationalTeams: liveNationalTeams,
    quizReadyPlayerIdsByNationalTeamId: Object.fromEntries(
      [...quizReadyPlayerIdsByNationalTeamId.entries()],
    ),
    internationalPoolPlayerIds: internationalPoolIds,
  },
};

fs.mkdirSync(OUT_DIR, { recursive: true });
fs.writeFileSync(OUT_PATH, `${JSON.stringify(registry)}\n`);

const rawKb = (fs.statSync(OUT_PATH).size / 1024).toFixed(1);
console.log(
  `Wrote ${OUT_PATH} (${slimPlayers.length} quiz-ready players, ${rawKb} KB raw)`,
);
