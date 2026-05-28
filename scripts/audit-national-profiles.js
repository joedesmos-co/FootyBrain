#!/usr/bin/env node
/**
 * National team profile richness audit — dataset gaps and synthesis coverage.
 * Run: npm run audit:national-profiles
 */

import live from '../src/data/nationalTeamLive.json' with { type: 'json' };
import {
  auditNationalTeamGaps,
  countNationalEditorialDepth,
  gapCount,
  isThinNationalTeam,
} from '../src/utils/entityDepthAudit.js';

/** Mirror worldCupHubData.js — avoid importing Vite module graph in Node. */
const FEATURED_NATIONAL_TEAM_IDS = [
  'argentina',
  'brazil',
  'france',
  'england',
  'germany',
  'spain',
  'united-states',
  'mexico',
  'netherlands',
];

let failures = 0;

function fail(msg) {
  console.error(`FAIL: ${msg}`);
  failures += 1;
}

function pass(msg) {
  console.log(`OK: ${msg}`);
}

function estimateRuntimeSynthesisChars(nt, linkedCount) {
  let chars = String(nt.shortHistory ?? '').trim().length;
  if (nt.fanGuide) chars += Math.min(120, String(nt.fanGuide).length);
  if (nt.rivalIds?.length) chars += 30 + nt.rivalIds.join('').length;
  if (nt.confederation) chars += 20;
  if (nt.fifaRanking != null) chars += 15;
  if (linkedCount > 0) chars += 60;
  if (FEATURED_NATIONAL_TEAM_IDS.includes(nt.id)) chars += 50;
  return chars;
}

const teams = live.nationalTeams.map((nt) => {
  const linkedCount = live.meta.membershipsPerTeam?.[nt.id] ?? 0;
  const quizReady = live.meta.quizEligibleMembershipsPerTeam?.[nt.id] ?? 0;
  const gaps = auditNationalTeamGaps(nt);
  const depth = countNationalEditorialDepth(nt);
  const synthesisChars = estimateRuntimeSynthesisChars(nt, linkedCount);

  return {
    id: nt.id,
    name: nt.displayName,
    linkedCount,
    quizReady,
    depth,
    gapCount: gapCount(gaps),
    gaps,
    thin: isThinNationalTeam(nt, 3),
    synthesisChars,
    hasRuntimeStory: synthesisChars >= 80,
    featured: FEATURED_NATIONAL_TEAM_IDS.includes(nt.id),
  };
});

teams.sort((a, b) => b.linkedCount - a.linkedCount);

pass(`Audited ${teams.length} live national teams`);

const featured = teams.filter((t) => t.featured);
const featuredWithStory = featured.filter((t) => t.hasRuntimeStory);
if (featuredWithStory.length >= featured.length - 1) {
  pass(
    `World Cup featured nations: ${featuredWithStory.length}/${featured.length} have runtime synthesis (≥80 chars)`,
  );
} else {
  fail(
    `only ${featuredWithStory.length}/${featured.length} featured nations have adequate runtime synthesis`,
  );
}

const top15 = teams.slice(0, 15);
const top15WithStory = top15.filter((t) => t.hasRuntimeStory);
if (top15WithStory.length >= 13) {
  pass(`top 15 by linked pool: ${top15WithStory.length}/15 have runtime synthesis`);
} else {
  fail(`only ${top15WithStory.length}/15 top nations have adequate runtime synthesis`);
}

const gapTotals = {
  missingHistory: teams.filter((t) => t.gaps.missingHistory).length,
  missingFanGuide: teams.filter((t) => t.gaps.missingFanGuide).length,
  missingRivals: teams.filter((t) => t.gaps.missingRivals).length,
};

console.log('\nDataset gaps (expected — synthesis fills at runtime):');
for (const [key, count] of Object.entries(gapTotals)) {
  console.log(`  ${key}: ${count}/${teams.length}`);
}

const thin = teams.filter((t) => t.thin);
console.log(`\nThin national teams (depth ≤3): ${thin.length}/${teams.length}`);

if (thin.length > teams.length * 0.9) {
  fail('too many thin national teams — synthesis may be insufficient');
} else {
  pass('thin national share within expected range');
}

console.log(`\nNational profile audit: ${failures === 0 ? 'PASSED' : `${failures} failure(s)`}`);
if (failures > 0) process.exitCode = 1;
