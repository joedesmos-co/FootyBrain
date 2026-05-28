#!/usr/bin/env node
/**
 * Full top-importance content depth audit — players, clubs, leagues, national teams.
 * Synthesis fields are flagged only; copy is generated at runtime from existing data.
 *
 * Run: npm run audit:top-importance-depth
 * Outputs:
 *   generated-data/top-importance-depth-audit.json
 *   generated-data/top-importance-depth-summary.md
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import { players, teams, leagues } from '../src/data/sampleData.js';
import liveNt from '../src/data/nationalTeamLive.json' with { type: 'json' };
import {
  TOP_PLAYER_COUNT,
  auditLeagueGaps,
  auditNationalTeamGaps,
  auditPlayerGaps,
  auditTeamGaps,
  countClubEditorialDepth,
  countLeagueEditorialDepth,
  countNationalEditorialDepth,
  countPlayerEditorialDepth,
  gapCount,
  isMajorClub,
  isThinLeague,
  isThinNationalTeam,
  isThinPlayer,
  isThinTeam,
} from '../src/utils/entityDepthAudit.js';
import { isQuizEligiblePlayer } from '../src/utils/quizPlayerRules.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const OUT_JSON = path.join(ROOT, 'generated-data/top-importance-depth-audit.json');
const OUT_MD = path.join(ROOT, 'generated-data/top-importance-depth-summary.md');

function rosterImportanceSum(teamId) {
  return players
    .filter((p) => p.teamId === teamId)
    .reduce((s, p) => s + (Number(p.importanceScore) || 0), 0);
}

function auditPlayerRow(player) {
  const gaps = auditPlayerGaps(player);
  const depth = countPlayerEditorialDepth(player);
  return {
    id: player.id,
    name: player.name,
    importanceScore: player.importanceScore ?? 0,
    teamId: player.teamId,
    leagueId: player.leagueId,
    depth,
    gapCount: gapCount(gaps),
    gaps,
    thin: isThinPlayer(player, 2),
    contentGaps: gapCount(gaps) >= 3,
    needsRuntimeSynthesis:
      (gaps.missingPlayStyle || gaps.missingQuickFact) &&
      (player.importanceScore ?? 0) >= 68,
  };
}

function auditTeamRow(team, rosterSize) {
  const gaps = auditTeamGaps(team);
  const depth = countClubEditorialDepth(team);
  return {
    id: team.id,
    name: team.name,
    leagueId: team.leagueId,
    rosterSize,
    rosterImportanceSum: rosterImportanceSum(team.id),
    depth,
    gapCount: gapCount(gaps),
    gaps,
    thin: isThinTeam(team, 3),
    contentGaps: gapCount(gaps) >= 3,
    needsRuntimeSynthesis: gaps.missingHistory && !gaps.hasStory,
  };
}

function auditLeagueRow(league) {
  const leaguePlayers = players.filter((p) => p.leagueId === league.id);
  const gaps = auditLeagueGaps(league);
  const depth = countLeagueEditorialDepth(league);
  return {
    id: league.id,
    name: league.name,
    depth,
    gapCount: gapCount(gaps),
    gaps,
    playerCount: leaguePlayers.length,
    quizReady: leaguePlayers.filter(isQuizEligiblePlayer).length,
    clubCount: teams.filter((t) => t.leagueId === league.id).length,
    thin: isThinLeague(league, 4),
  };
}

function auditNationalRow(nt, membershipCount) {
  const gaps = auditNationalTeamGaps(nt);
  const depth = countNationalEditorialDepth(nt);
  return {
    id: nt.id,
    displayName: nt.displayName,
    depth,
    gapCount: gapCount(gaps),
    gaps,
    membershipCount,
    thin: isThinNationalTeam(nt, 4),
  };
}

const topPlayers = [...players]
  .sort((a, b) => (b.importanceScore ?? 0) - (a.importanceScore ?? 0))
  .slice(0, TOP_PLAYER_COUNT)
  .map(auditPlayerRow);

const majorClubs = teams.filter(isMajorClub).map((team) => {
  const rosterSize = players.filter((p) => p.teamId === team.id).length;
  return auditTeamRow(team, rosterSize);
});

const allLeagues = leagues
  .filter((l) => l.id !== 'external')
  .map(auditLeagueRow);

const allNational = (liveNt.nationalTeams ?? []).map((nt) => {
  const membershipCount = (liveNt.nationalMemberships ?? []).filter(
    (m) => m.nationalTeamId === nt.id,
  ).length;
  return auditNationalRow(nt, membershipCount);
});

const thinTopPlayers = topPlayers.filter((p) => p.thin || p.contentGaps);
const thinClubs = majorClubs.filter((t) => t.thin || t.contentGaps);
const thinLeagues = allLeagues.filter((l) => l.thin || l.gapCount >= 2);
const thinNational = allNational.filter((n) => n.thin || n.gapCount >= 2);

const playerGapTotals = {
  missingQuickFact: topPlayers.filter((p) => p.gaps.missingQuickFact).length,
  missingPlayStyle: topPlayers.filter((p) => p.gaps.missingPlayStyle).length,
  missingCareerHistory: topPlayers.filter((p) => p.gaps.missingCareerHistory).length,
  missingQuizHints: topPlayers.filter((p) => p.gaps.missingQuizHints).length,
};

const clubGapTotals = {
  missingHistory: majorClubs.filter((t) => t.gaps.missingHistory).length,
  missingRivalries: majorClubs.filter((t) => t.gaps.missingRivalries).length,
  missingClubIdentity: majorClubs.filter((t) => t.gaps.missingClubIdentity).length,
  missingLegends: majorClubs.filter((t) => t.gaps.missingLegends).length,
};

const report = {
  generatedAt: new Date().toISOString(),
  scope: {
    topPlayers: TOP_PLAYER_COUNT,
    majorClubs: majorClubs.length,
    leagues: allLeagues.length,
    nationalTeams: allNational.length,
  },
  summary: {
    thinTopPlayers: thinTopPlayers.length,
    thinMajorClubs: thinClubs.length,
    thinLeagues: thinLeagues.length,
    thinNationalTeams: thinNational.length,
    topPlayersWithContentGaps: topPlayers.filter((p) => p.contentGaps).length,
    clubsWithContentGaps: majorClubs.filter((t) => t.contentGaps).length,
    topPlayersNeedingSynthesis: topPlayers.filter((p) => p.needsRuntimeSynthesis).length,
    clubsNeedingSynthesis: majorClubs.filter((t) => t.needsRuntimeSynthesis).length,
    playerGapTotals,
    clubGapTotals,
  },
  topPlayers,
  thinTopPlayers: thinTopPlayers.slice(0, 50),
  majorClubs,
  thinMajorClubs: thinClubs
    .sort((a, b) => b.rosterImportanceSum - a.rosterImportanceSum)
    .slice(0, 50),
  leagues: allLeagues,
  thinLeagues,
  nationalTeams: allNational,
  thinNationalTeams: thinNational,
};

function mdList(title, rows, formatter) {
  if (!rows.length) return `### ${title}\n\n_None._\n\n`;
  return `### ${title}\n\n${rows.map(formatter).join('\n')}\n\n`;
}

const md = `# Top-importance depth audit

Generated: ${report.generatedAt}

## Scope

| Entity | Count audited |
|--------|----------------|
| Top players | ${TOP_PLAYER_COUNT} |
| Major clubs | ${majorClubs.length} |
| Leagues | ${allLeagues.length} |
| National teams | ${allNational.length} |

## Summary

- **Thin top players** (depth ≤3): ${thinTopPlayers.length}
- **Thin major clubs** (depth ≤4): ${thinClubs.length}
- **Thin leagues**: ${thinLeagues.length}
- **Thin national teams**: ${thinNational.length}
- **Players with runtime synthesis** (thin + missing style/fact, importance ≥68): ${report.summary.topPlayersNeedingSynthesis}
- **Clubs with runtime Club identity synthesis**: ${report.summary.clubsNeedingSynthesis}

### Player gaps (top ${TOP_PLAYER_COUNT})

| Gap | Count |
|-----|------:|
| Missing quick fact | ${playerGapTotals.missingQuickFact} |
| Missing play style | ${playerGapTotals.missingPlayStyle} |
| Missing career history | ${playerGapTotals.missingCareerHistory} |
| Missing quiz hints | ${playerGapTotals.missingQuizHints} |

### Club gaps (all in-league clubs)

| Gap | Count |
|-----|------:|
| Missing short history | ${clubGapTotals.missingHistory} |
| Missing rivalries | ${clubGapTotals.missingRivalries} |
| Missing identity tags | ${clubGapTotals.missingClubIdentity} |
| Missing legends | ${clubGapTotals.missingLegends} |

## Thin top players (sample)

${thinTopPlayers
  .slice(0, 25)
  .map((p) => `- **${p.name}** (${p.importanceScore}) — ${p.gapCount} gaps`)
  .join('\n')}

## Thin major clubs (sample)

${thinClubs
  .slice(0, 25)
  .map((t) => `- **${t.name}** (roster sum ${t.rosterImportanceSum}) — ${t.gapCount} gaps`)
  .join('\n')}

## Rerun

\`\`\`bash
npm run audit:top-importance-depth
\`\`\`

Runtime synthesis modules: \`src/utils/entityEditorialSynthesis.js\`, \`src/utils/entityDepthAudit.js\`.
`;

fs.mkdirSync(path.dirname(OUT_JSON), { recursive: true });
fs.writeFileSync(OUT_JSON, `${JSON.stringify(report, null, 2)}\n`);
fs.writeFileSync(OUT_MD, md);

console.log('Top-importance depth audit\n');
console.log(`  Top players: ${topPlayers.length} (${thinTopPlayers.length} thin)`);
console.log(`  Major clubs: ${majorClubs.length} (${thinClubs.length} thin)`);
console.log(`  Leagues: ${allLeagues.length} (${thinLeagues.length} thin)`);
console.log(`  National teams: ${allNational.length} (${thinNational.length} thin)`);
console.log(`\nWrote ${path.relative(ROOT, OUT_JSON)}`);
console.log(`Wrote ${path.relative(ROOT, OUT_MD)}`);
