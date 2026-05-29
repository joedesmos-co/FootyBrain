#!/usr/bin/env node
/**
 * Learner UX audit for top 100 pages (50 players · 25 clubs · 8 leagues · 17 nations).
 * Run: npm run audit:learner-top-100
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { players, teams, leagues } from '../src/data/sampleData.js';
import liveNt from '../src/data/nationalTeamLive.json' with { type: 'json' };
import {
  TOP_TIER_COUNTS,
  isTopTierClub,
  isTopTierLeague,
  isTopTierNationalTeam,
  isTopTierPlayer,
} from '../src/utils/topTierPages.js';
import {
  hasSubstantiveQuickFact,
  isPlaceholderClubCopy,
} from '../src/utils/entityDepthAudit.js';
import {
  buildLeagueHeroLede,
  buildNationalHeroLede,
  buildPlayerHeroLede,
  polishGeneratedCopy,
} from '../src/utils/learnerProfileCopy.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT_JSON = path.join(ROOT, 'generated-data/learner-top-100-audit.json');
const OUT_MD = path.join(ROOT, 'generated-data/learner-top-100-audit.md');

const INTERNAL_RE =
  /\b(in the dataset|dataset tags|controlled expansion|editorial profile coming soon|browse and quiz practice)\b/i;

function flagEntity(type, id, name, issues) {
  return { type, id, name, issueCount: issues.length, issues };
}

function auditPlayer(player) {
  const issues = [];
  const hero = buildPlayerHeroLede(player, { teamName: 'Club', leagueName: 'League' });
  const about = polishGeneratedCopy(player.quickFact ?? player.playStyleSummary ?? '');
  if (!hero || hero.length < 24) issues.push('thin_hero_lede');
  if (about.length > 280) issues.push('long_about');
  if (INTERNAL_RE.test(about)) issues.push('internal_copy');
  if (!hasSubstantiveQuickFact(player) && !(player.playingStyle || player.strengths?.length)) {
    issues.push('missing_quick_context');
  }
  return flagEntity('player', player.id, player.name, issues);
}

function auditClub(team) {
  const issues = [];
  const story = isPlaceholderClubCopy(team)
    ? ''
    : polishGeneratedCopy(team.shortHistory || team.fanGuide || '');
  if (!story || story.length < 40) issues.push('thin_intro');
  if (story.length > 320) issues.push('long_intro');
  for (const field of [
    team.tacticalIdentity,
    team.stadiumContext,
    team.legendsSummary,
    team.quizDiscoveryLead,
  ]) {
    if (INTERNAL_RE.test(polishGeneratedCopy(field))) issues.push('internal_overlay_copy');
  }
  if (!team.stadium && !team.founded && !team.manager) issues.push('missing_quick_facts');
  return flagEntity('club', team.id, team.name, issues);
}

function auditLeague(league) {
  const issues = [];
  const lede = buildLeagueHeroLede(league);
  if (!lede || lede.length < 30) issues.push('thin_hero_lede');
  if (INTERNAL_RE.test(lede)) issues.push('internal_hero');
  const desc = String(league.description ?? league.styleOfPlay ?? '');
  if (desc.length > 340) issues.push('long_identity');
  return flagEntity('league', league.id, league.name, issues);
}

function auditNational(nt) {
  const issues = [];
  const hero = buildNationalHeroLede(nt, { linkedCount: 12, quizReadyCount: 6 });
  if (!hero || hero.length < 24) issues.push('thin_hero_lede');
  if (INTERNAL_RE.test(hero)) issues.push('internal_hero');
  const history = polishGeneratedCopy(nt.shortHistory ?? nt.fanGuide ?? '');
  if (history.length > 280) issues.push('long_history');
  return flagEntity('national', nt.id, nt.displayName, issues);
}

const topPlayers = players.filter((p) => isTopTierPlayer(p));
const topClubs = teams.filter((t) => isTopTierClub(t));
const topLeagues = leagues.filter((l) => isTopTierLeague(l));
const topNational = (liveNt.nationalTeams ?? []).filter((nt) => isTopTierNationalTeam(nt));

const results = [
  ...topPlayers.map(auditPlayer),
  ...topClubs.map(auditClub),
  ...topLeagues.map(auditLeague),
  ...topNational.map(auditNational),
];

const withIssues = results.filter((r) => r.issueCount > 0);
const report = {
  generatedAt: new Date().toISOString(),
  scope: TOP_TIER_COUNTS,
  totals: {
    pages: results.length,
    flagged: withIssues.length,
    players: topPlayers.length,
    clubs: topClubs.length,
    leagues: topLeagues.length,
    national: topNational.length,
  },
  flagged: withIssues,
  clean: results.length - withIssues.length,
};

const md = `# Learner top-100 audit

Generated: ${report.generatedAt}

| Metric | Value |
|--------|------:|
| Pages | ${report.totals.pages} |
| Flagged | ${report.totals.flagged} |
| Clean | ${report.clean} |

## Flagged pages

${withIssues.length ? withIssues.map((r) => `- **${r.name}** (${r.type}) — ${r.issues.join(', ')}`).join('\n') : '_None._'}

## Rerun

\`\`\`bash
npm run audit:learner-top-100
\`\`\`
`;

fs.mkdirSync(path.dirname(OUT_JSON), { recursive: true });
fs.writeFileSync(OUT_JSON, `${JSON.stringify(report, null, 2)}\n`);
fs.writeFileSync(OUT_MD, md);

console.log(`Learner top-100: ${report.totals.pages} pages, ${report.totals.flagged} flagged`);
console.log(`Wrote ${path.relative(ROOT, OUT_JSON)}`);
