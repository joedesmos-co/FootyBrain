#!/usr/bin/env node
/**
 * Remaining weak entities after enrichment — prioritized backlog report.
 *
 * Run: npm run audit:weak-entities
 * Outputs:
 *   generated-data/weak-entities-report.json
 *   generated-data/weak-entities-report.md
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { players, teams, leagues } from '../src/data/sampleData.js';
import liveNt from '../src/data/nationalTeamLive.json' with { type: 'json' };
import {
  TOP_PLAYER_COUNT,
  auditNationalTeamGaps,
  auditPlayerGaps,
  auditTeamGaps,
  countClubEditorialDepth,
  countNationalEditorialDepth,
  countPlayerEditorialDepth,
  gapCount,
  isMajorClub,
  isPlaceholderClubCopy,
  isThinNationalTeam,
  isThinPlayer,
  isThinTeam,
} from '../src/utils/entityDepthAudit.js';
import { mergePlayerOverlay, mergeTeamOverlay } from '../src/data/editorialOverlayAccess.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const OUT_JSON = path.join(ROOT, 'generated-data/weak-entities-report.json');
const OUT_MD = path.join(ROOT, 'generated-data/weak-entities-report.md');

function rosterImportanceSum(teamId) {
  return players
    .filter((p) => p.teamId === teamId)
    .reduce((s, p) => s + (Number(p.importanceScore) || 0), 0);
}

const weakPlayers = players
  .filter((p) => p.leagueId !== 'external')
  .map((p) => {
    const merged = mergePlayerOverlay(p);
    const gaps = auditPlayerGaps(merged);
    return {
      id: p.id,
      name: p.name,
      importance: Number(p.importanceScore) || 0,
      leagueId: p.leagueId,
      depth: countPlayerEditorialDepth(merged),
      thin: isThinPlayer(merged, 3),
      gapCount: gapCount(gaps),
      gaps,
    };
  })
  .filter((p) => p.thin)
  .sort((a, b) => b.importance - a.importance);

const weakClubs = teams
  .filter(isMajorClub)
  .map((t) => {
    const merged = mergeTeamOverlay(t);
    return {
      id: t.id,
      name: t.name,
      leagueId: t.leagueId,
      rosterImportanceSum: rosterImportanceSum(t.id),
      placeholder: isPlaceholderClubCopy(t),
      depth: countClubEditorialDepth(merged),
      thin: isThinTeam(merged, 3),
      gaps: auditTeamGaps(merged),
      gapCount: gapCount(auditTeamGaps(merged)),
    };
  })
  .filter((t) => t.thin || t.placeholder)
  .sort((a, b) => b.rosterImportanceSum - a.rosterImportanceSum);

const weakNational = (liveNt.nationalTeams ?? [])
  .map((nt) => ({
    id: nt.id,
    name: nt.displayName,
    linkedCount: liveNt.meta?.membershipsPerTeam?.[nt.id] ?? 0,
    depth: countNationalEditorialDepth(nt),
    thin: isThinNationalTeam(nt, 3),
    gaps: auditNationalTeamGaps(nt),
    gapCount: gapCount(auditNationalTeamGaps(nt)),
  }))
  .filter((n) => n.thin)
  .sort((a, b) => b.linkedCount - a.linkedCount);

const topImportanceWeak = weakPlayers.filter((p) => p.importance >= 68).slice(0, 50);
const top300Weak = weakPlayers
  .filter((p) => players.find((x) => x.id === p.id))
  .slice(0, TOP_PLAYER_COUNT)
  .filter((p) => p.thin)
  .slice(0, 40);

const report = {
  generatedAt: new Date().toISOString(),
  summary: {
    totalPlayers: players.length,
    weakPlayers: weakPlayers.length,
    weakHighImportancePlayers: weakPlayers.filter((p) => p.importance >= 68).length,
    weakClubs: weakClubs.length,
    placeholderClubs: weakClubs.filter((c) => c.placeholder).length,
    weakNationalTeams: weakNational.length,
  },
  topImportanceWeakPlayers: topImportanceWeak,
  top300WeakPlayers: top300Weak,
  weakClubsPriority: weakClubs.slice(0, 40),
  weakNationalTeams: weakNational.slice(0, 20),
};

fs.mkdirSync(path.dirname(OUT_JSON), { recursive: true });
fs.writeFileSync(OUT_JSON, `${JSON.stringify(report, null, 2)}\n`);

const md = [
  '# Weak entities report',
  '',
  `Generated: ${report.generatedAt}`,
  '',
  '## Summary',
  '',
  `| Metric | Count |`,
  `| --- | ---: |`,
  `| Weak players (all) | ${report.summary.weakPlayers} |`,
  `| Weak players (importance ≥68) | ${report.summary.weakHighImportancePlayers} |`,
  `| Weak / placeholder clubs | ${report.summary.weakClubs} (${report.summary.placeholderClubs} placeholder) |`,
  `| Weak national teams | ${report.summary.weakNationalTeams} |`,
  '',
  '## Top weak high-importance players',
  '',
  '| Player | Importance | Depth | Gaps |',
  '| --- | ---: | ---: | --- |',
  ...topImportanceWeak.slice(0, 25).map(
    (p) => `| ${p.name} | ${p.importance} | ${p.depth} | ${p.gaps.join(', ') || '—'} |`,
  ),
  '',
  '## Priority weak clubs',
  '',
  '| Club | Roster sum | Placeholder | Gaps |',
  '| --- | ---: | --- | --- |',
  ...weakClubs.slice(0, 20).map(
    (c) =>
      `| ${c.name} | ${c.rosterImportanceSum} | ${c.placeholder ? 'yes' : 'no'} | ${c.gaps.join(', ') || '—'} |`,
  ),
  '',
  '## Weak national teams',
  '',
  '| Nation | Linked | Gaps |',
  '| --- | ---: | --- |',
  ...weakNational.slice(0, 12).map(
    (n) => `| ${n.name} | ${n.linkedCount} | ${n.gaps.join(', ') || '—'} |`,
  ),
  '',
].join('\n');

fs.writeFileSync(OUT_MD, `${md}\n`);

console.log('Weak entities report written:');
console.log(' ', path.relative(ROOT, OUT_JSON));
console.log(' ', path.relative(ROOT, OUT_MD));
console.log('Summary:', report.summary);
