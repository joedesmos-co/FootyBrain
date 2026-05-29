#!/usr/bin/env node
/**
 * Thin entity quality audit — players, clubs, leagues, national teams.
 *
 * Run: npm run audit:thin-data
 * Outputs:
 *   generated-data/thin-data-audit.json
 *   generated-data/thin-data-summary.md
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
  isPlaceholderClubCopy,
  isThinTeam,
} from '../src/utils/entityDepthAudit.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const OUT_JSON = path.join(ROOT, 'generated-data/thin-data-audit.json');
const OUT_MD = path.join(ROOT, 'generated-data/thin-data-summary.md');

function isBrowseOnlyPlayer(player) {
  if (!player) return false;
  if (player.quizEligible === false) return true;
  if (player.dataStatus === 'generated-needs-editorial') return true;
  return !(player.quizHints?.length > 0);
}

function rosterImportanceSum(teamId) {
  return players
    .filter((p) => p.teamId === teamId)
    .reduce((s, p) => s + (Number(p.importanceScore) || 0), 0);
}

function loadOverlays() {
  let teamOverlays = {};
  let playerOverlays = {};
  try {
    teamOverlays =
      JSON.parse(
        fs.readFileSync(path.join(ROOT, 'src/data/teamEditorialOverlays.json'), 'utf8'),
      ).overlays ?? {};
  } catch {
    /* empty */
  }
  try {
    playerOverlays =
      JSON.parse(
        fs.readFileSync(path.join(ROOT, 'src/data/playerEditorialOverlays.json'), 'utf8'),
      ).overlays ?? {};
  } catch {
    /* empty */
  }
  return { teamOverlays, playerOverlays };
}

const { teamOverlays, playerOverlays } = loadOverlays();

const majorClubs = teams
  .filter(isMajorClub)
  .map((team) => {
    const merged = { ...team, ...(teamOverlays[team.id] ?? {}) };
    const gaps = auditTeamGaps(merged);
    const depth = countClubEditorialDepth(merged);
    return {
      id: team.id,
      name: team.name,
      leagueId: team.leagueId,
      rosterImportanceSum: rosterImportanceSum(team.id),
      placeholder: isPlaceholderClubCopy(team),
      hasOverlay: Boolean(teamOverlays[team.id]),
      depth,
      thin: isThinTeam(merged, 3),
      gapCount: gapCount(gaps),
      gaps,
    };
  })
  .sort((a, b) => b.rosterImportanceSum - a.rosterImportanceSum);

const thinClubs = majorClubs.filter((t) => t.thin || t.placeholder);
const placeholderClubs = majorClubs.filter((t) => t.placeholder);

const topPlayers = [...players]
  .sort((a, b) => (b.importanceScore ?? 0) - (a.importanceScore ?? 0))
  .slice(0, TOP_PLAYER_COUNT)
  .map((player) => {
    const merged = { ...player, ...(playerOverlays[player.id] ?? {}) };
    const gaps = auditPlayerGaps(merged);
    const depth = countPlayerEditorialDepth(merged);
    return {
      id: player.id,
      name: player.name,
      importanceScore: player.importanceScore ?? 0,
      browseOnly: isBrowseOnlyPlayer(player),
      hasOverlay: Boolean(playerOverlays[player.id]),
      depth,
      thin: isThinPlayer(merged, 2),
      gapCount: gapCount(gaps),
      gaps,
    };
  });

const browseOnlyHigh = players
  .filter(
    (p) =>
      p.leagueId !== 'external' &&
      isBrowseOnlyPlayer(p) &&
      (p.importanceScore ?? 0) >= 48,
  )
  .map((p) => ({
    id: p.id,
    name: p.name,
    importanceScore: p.importanceScore ?? 0,
    hasOverlay: Boolean(playerOverlays[p.id]),
    thin: isThinPlayer({ ...p, ...(playerOverlays[p.id] ?? {}) }, 2),
  }))
  .sort((a, b) => b.importanceScore - a.importanceScore);

const allLeagues = leagues
  .filter((l) => l.id !== 'external')
  .map((league) => ({
    id: league.id,
    name: league.name,
    depth: countLeagueEditorialDepth(league),
    thin: isThinLeague(league, 4),
    gapCount: gapCount(auditLeagueGaps(league)),
  }));

const allNational = (liveNt.nationalTeams ?? []).map((nt) => ({
  id: nt.id,
  displayName: nt.displayName,
  depth: countNationalEditorialDepth(nt),
  thin: isThinNationalTeam(nt, 4),
  gapCount: gapCount(auditNationalTeamGaps(nt)),
}));

const report = {
  generatedAt: new Date().toISOString(),
  summary: {
    majorClubs: majorClubs.length,
    thinClubs: thinClubs.length,
    placeholderClubs: placeholderClubs.length,
    clubsWithOverlay: majorClubs.filter((t) => t.hasOverlay).length,
    thinClubsWithOverlay: thinClubs.filter((t) => t.hasOverlay).length,
    topPlayersAudited: topPlayers.length,
    thinTopPlayers: topPlayers.filter((p) => p.thin).length,
    browseOnlyImportance48Plus: browseOnlyHigh.length,
    browseOnlyHighWithoutOverlay: browseOnlyHigh.filter((p) => !p.hasOverlay).length,
    thinLeagues: allLeagues.filter((l) => l.thin).length,
    thinNational: allNational.filter((n) => n.thin).length,
    teamOverlayCount: Object.keys(teamOverlays).length,
    playerOverlayCount: Object.keys(playerOverlays).length,
  },
  thinClubsPriority: thinClubs.slice(0, 40),
  placeholderClubs: placeholderClubs.slice(0, 40),
  browseOnlyHighPriority: browseOnlyHigh.slice(0, 40),
  thinTopPlayersSample: topPlayers.filter((p) => p.thin).slice(0, 30),
  thinLeagues: allLeagues.filter((l) => l.thin),
  thinNational: allNational.filter((n) => n.thin),
};

const md = `# Thin data quality audit

Generated: ${report.generatedAt}

## Summary

| Metric | Count |
|--------|------:|
| Major clubs | ${report.summary.majorClubs} |
| Thin / placeholder clubs | ${report.summary.thinClubs} |
| Placeholder club copy | ${report.summary.placeholderClubs} |
| Clubs with editorial overlay | ${report.summary.clubsWithOverlay} |
| Thin clubs with overlay | ${report.summary.thinClubsWithOverlay} |
| Top ${TOP_PLAYER_COUNT} players (thin) | ${report.summary.thinTopPlayers} |
| Browse-only players (importance ≥48) | ${report.summary.browseOnlyImportance48Plus} |
| Browse-only ≥48 without overlay | ${report.summary.browseOnlyHighWithoutOverlay} |
| Thin leagues | ${report.summary.thinLeagues} |
| Thin national teams | ${report.summary.thinNational} |

## Priority thin clubs (by roster importance)

${report.thinClubsPriority
  .slice(0, 20)
  .map(
    (t) =>
      `- **${t.name}** — depth ${t.depth}, placeholder=${t.placeholder}, overlay=${t.hasOverlay}`,
  )
  .join('\n')}

## Browse-only players (importance ≥48, sample)

${report.browseOnlyHighPriority
  .slice(0, 20)
  .map((p) => `- **${p.name}** (${p.importanceScore}) — overlay=${p.hasOverlay}, thin=${p.thin}`)
  .join('\n')}

## Commands

\`\`\`bash
npm run enrich:thin-clubs
npm run enrich:thin-players
npm run audit:thin-data
\`\`\`
`;

fs.mkdirSync(path.dirname(OUT_JSON), { recursive: true });
fs.writeFileSync(OUT_JSON, `${JSON.stringify(report, null, 2)}\n`);
fs.writeFileSync(OUT_MD, md);

console.log('Thin data audit\n');
console.log(`  Thin clubs: ${report.summary.thinClubs} (${report.summary.placeholderClubs} placeholder)`);
console.log(`  Club overlays: ${report.summary.teamOverlayCount}`);
console.log(`  Browse-only ≥48: ${report.summary.browseOnlyImportance48Plus} (${report.summary.browseOnlyHighWithoutOverlay} missing overlay)`);
console.log(`  Player overlays: ${report.summary.playerOverlayCount}`);
console.log(`\nWrote ${path.relative(ROOT, OUT_JSON)}`);
console.log(`Wrote ${path.relative(ROOT, OUT_MD)}`);
