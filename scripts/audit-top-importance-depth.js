#!/usr/bin/env node
/**
 * Audit editorial depth for top-importance players, clubs, leagues, and national teams.
 * Uses only fields already present in the dataset — no generated copy.
 *
 * Run: node scripts/audit-top-importance-depth.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import { players, teams, leagues } from '../src/data/sampleData.js';
import liveNt from '../src/data/nationalTeamLive.json' with { type: 'json' };
import { isQuizEligiblePlayer } from '../src/utils/quizPlayerRules.js';

function countPlayerEditorialDepth(player) {
  let depth = 0;
  const qf = String(player?.quickFact ?? '');
  if (qf && !/pending|coming soon/i.test(qf)) depth += 3;
  if (player?.playingStyle || player?.playStyleSummary) depth += 2;
  const strengths = player?.strengths ?? player?.keyStrengths;
  if (Array.isArray(strengths) ? strengths.length : strengths) depth += 2;
  if (player?.careerHistory?.length) depth += 2;
  if (player?.honors?.length || player?.honours?.length) depth += 1;
  if (player?.quizHints?.length) depth += 1;
  return depth;
}

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const OUT_PATH = path.join(ROOT, 'generated-data/top-importance-depth-audit.json');

const TOP_N = 300;

function teamDepth(team) {
  let score = 0;
  if (String(team.shortHistory ?? '').trim()) score += 3;
  if (String(team.fanGuide ?? '').trim()) score += 3;
  if (team.rivals?.length) score += 2;
  if (team.legends?.length) score += 2;
  if (team.currentKeyPlayers?.length) score += 1;
  if (team.identityTags?.length) score += 1;
  return score;
}

function leagueDepth(league) {
  let score = 0;
  if (String(league.description ?? '').trim()) score += 2;
  if (String(league.styleOfPlay ?? '').trim()) score += 2;
  if (league.famousClubs?.length) score += 2;
  if (league.rivalries?.length) score += 2;
  return score;
}

function nationalDepth(nt) {
  let score = 0;
  if (String(nt.fanGuide ?? '').trim()) score += 3;
  if (String(nt.shortHistory ?? '').trim()) score += 2;
  if (nt.rivals?.length) score += 2;
  return score;
}

function rosterImportanceSum(teamId) {
  return players
    .filter((p) => p.teamId === teamId)
    .reduce((s, p) => s + (Number(p.importanceScore) || 0), 0);
}

const topPlayers = [...players]
  .sort((a, b) => (b.importanceScore ?? 0) - (a.importanceScore ?? 0))
  .slice(0, TOP_N)
  .map((p) => ({
    id: p.id,
    name: p.name,
    importanceScore: p.importanceScore ?? 0,
    depth: countPlayerEditorialDepth(p),
    quizReady: isQuizEligiblePlayer(p),
    teamId: p.teamId,
    leagueId: p.leagueId,
  }));

const topTeams = [...teams]
  .map((t) => ({ team: t, rosterSum: rosterImportanceSum(t.id) }))
  .sort((a, b) => b.rosterSum - a.rosterSum)
  .slice(0, TOP_N)
  .map(({ team: t, rosterSum }) => ({
    id: t.id,
    name: t.name,
    leagueId: t.leagueId,
    rosterImportanceSum: rosterSum,
    depth: teamDepth(t),
    hasStory: Boolean(String(t.shortHistory ?? '').trim()),
    hasFanGuide: Boolean(String(t.fanGuide ?? '').trim()),
    rivalCount: t.rivals?.length ?? 0,
  }));

const topLeagues = [...leagues]
  .filter((l) => l.id !== 'external')
  .map((l) => {
    const leaguePlayers = players.filter((p) => p.leagueId === l.id);
    const imp = leaguePlayers.reduce((s, p) => s + (Number(p.importanceScore) || 0), 0);
    return { league: l, imp };
  })
  .sort((a, b) => b.imp - a.imp)
  .slice(0, Math.min(TOP_N, leagues.length))
  .map(({ league: l }) => ({
    id: l.id,
    name: l.name,
    depth: leagueDepth(l),
    playerCount: players.filter((p) => p.leagueId === l.id).length,
    quizReady: players.filter((p) => p.leagueId === l.id && isQuizEligiblePlayer(p)).length,
  }));

const nationalTeams = liveNt.nationalTeams ?? [];
const topNational = [...nationalTeams]
  .map((nt) => {
    const linked = (liveNt.nationalMemberships ?? []).filter(
      (m) => m.nationalTeamId === nt.id,
    ).length;
    return { nt, linked };
  })
  .sort((a, b) => b.linked - a.linked)
  .slice(0, Math.min(TOP_N, nationalTeams.length))
  .map(({ nt, linked }) => ({
    id: nt.id,
    displayName: nt.displayName,
    depth: nationalDepth(nt),
    membershipCount: linked,
  }));

const thinPlayers = topPlayers.filter((p) => p.depth <= 2);
const thinTeams = topTeams.filter((t) => t.depth <= 3);

const report = {
  generatedAt: new Date().toISOString(),
  topN: TOP_N,
  summary: {
    playersAudited: topPlayers.length,
    thinPlayersInTop: thinPlayers.length,
    teamsAudited: topTeams.length,
    thinTeamsInTop: thinTeams.length,
    leaguesAudited: topLeagues.length,
    nationalTeamsAudited: topNational.length,
  },
  topPlayers,
  thinPlayersInTop: thinPlayers.slice(0, 40),
  topTeams,
  thinTeamsInTop: thinTeams.slice(0, 40),
  topLeagues,
  topNational,
};

fs.mkdirSync(path.dirname(OUT_PATH), { recursive: true });
fs.writeFileSync(OUT_PATH, `${JSON.stringify(report, null, 2)}\n`);

console.log('Top-importance depth audit');
console.log(`  Players (top ${TOP_N}): ${topPlayers.length}, thin: ${thinPlayers.length}`);
console.log(`  Teams (top ${TOP_N}): ${topTeams.length}, thin: ${thinTeams.length}`);
console.log(`  Leagues: ${topLeagues.length}`);
console.log(`  National teams: ${topNational.length}`);
console.log(`Wrote ${path.relative(ROOT, OUT_PATH)}`);
