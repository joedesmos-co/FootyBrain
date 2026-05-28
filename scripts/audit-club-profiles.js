#!/usr/bin/env node
/**
 * Club profile richness audit — gaps and runtime synthesis coverage.
 * Run: npm run audit:club-profiles
 */

import { players, teams, leagues } from '../src/data/sampleData.js';
import {
  auditTeamGaps,
  countClubEditorialDepth,
  gapCount,
  isMajorClub,
  isThinTeam,
} from '../src/utils/entityDepthAudit.js';
let failures = 0;

/** Mirror runtime synthesis length without importing Vite-only module graph. */
function estimateRuntimeSynthesisChars(team, league, rosterSize) {
  let chars = String(team.shortHistory ?? '').trim().length;
  if (team.stadium) chars += 40;
  if (team.founded) chars += 15;
  if (team.manager) chars += 20;
  if (team.rivals?.length) chars += 30 + team.rivals.join('').length;
  if (team.legends?.length) chars += 25;
  if (team.fanGuide) chars += Math.min(120, String(team.fanGuide).length);
  if (team.identityTags?.length) chars += 25;
  if (league?.description) chars += Math.min(100, String(league.description).length);
  if (league?.styleOfPlay) chars += Math.min(80, String(league.styleOfPlay).length);
  if (rosterSize > 0) chars += 25;
  return chars;
}

function fail(msg) {
  console.error(`FAIL: ${msg}`);
  failures += 1;
}

function pass(msg) {
  console.log(`OK: ${msg}`);
}

function rosterImportanceSum(teamId) {
  return players
    .filter((p) => p.teamId === teamId)
    .reduce((s, p) => s + (Number(p.importanceScore) || 0), 0);
}

const majorClubs = teams
  .filter(isMajorClub)
  .map((team) => {
    const roster = players.filter((p) => p.teamId === team.id);
    const gaps = auditTeamGaps(team);
    const depth = countClubEditorialDepth(team);
    const league = leagues.find((l) => l.id === team.leagueId) ?? null;
    const synthesisChars = estimateRuntimeSynthesisChars(team, league, roster.length);

    return {
      id: team.id,
      name: team.name,
      leagueId: team.leagueId,
      rosterSize: roster.length,
      rosterImportanceSum: rosterImportanceSum(team.id),
      depth,
      gapCount: gapCount(gaps),
      gaps,
      thin: isThinTeam(team, 3),
      synthesisChars,
      hasRuntimeStory: synthesisChars >= 80,
    };
  })
  .sort((a, b) => b.rosterImportanceSum - a.rosterImportanceSum);

const thinClubs = majorClubs.filter((t) => t.thin);
const top20 = majorClubs.slice(0, 20);
const top20WithoutStory = top20.filter((t) => t.gaps.missingHistory);
const top20WithSynthesis = top20.filter((t) => t.hasRuntimeStory);

pass(`Audited ${majorClubs.length} in-league clubs`);

if (top20WithSynthesis.length >= 18) {
  pass(`top 20 clubs by roster importance: ${top20WithSynthesis.length}/20 have runtime synthesis (≥80 chars)`);
} else {
  fail(
    `only ${top20WithSynthesis.length}/20 top clubs have adequate runtime synthesis — check clubProfileEditorial`,
  );
}

const gapTotals = {
  missingHistory: majorClubs.filter((t) => t.gaps.missingHistory).length,
  missingRivalries: majorClubs.filter((t) => t.gaps.missingRivalries).length,
  missingLegends: majorClubs.filter((t) => t.gaps.missingLegends).length,
  missingFanGuide: majorClubs.filter((t) => t.gaps.missingFanGuide).length,
  missingStadium: majorClubs.filter((t) => t.gaps.missingStadium).length,
};

console.log('\nDataset gaps (expected — synthesis fills at runtime):');
for (const [key, count] of Object.entries(gapTotals)) {
  console.log(`  ${key}: ${count}/${majorClubs.length}`);
}

console.log(`\nThin clubs (depth ≤3): ${thinClubs.length}`);
console.log(`Top clubs missing shortHistory: ${top20WithoutStory.length}/20`);

if (thinClubs.length > majorClubs.length * 0.85) {
  fail('too many thin clubs — synthesis may be insufficient');
} else {
  pass('thin club share within expected range');
}

console.log(`\nClub profile audit: ${failures === 0 ? 'PASSED' : `${failures} failure(s)`}`);
if (failures > 0) process.exitCode = 1;
