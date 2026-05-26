#!/usr/bin/env node
/**
 * Squad depth report for sampleData — run after merge.
 */

import { players, teams } from '../src/data/sampleData.js';
import { isQuizEligiblePlayer } from '../src/utils/quizEligibility.js';
import { EXPANSION_LIMITS } from './phase1-curation.js';

const MIN_SQUAD = EXPANSION_LIMITS.minSquadPerClub ?? 18;
const MIN_QUIZ = EXPANSION_LIMITS.minQuizReadyPerClub ?? 5;

function main() {
  const byTeam = new Map();
  for (const team of teams) {
    byTeam.set(team.id, {
      teamId: team.id,
      teamName: team.name,
      leagueId: team.leagueId,
      total: 0,
      quizReady: 0,
    });
  }

  for (const player of players) {
    const row = byTeam.get(player.teamId);
    if (!row) continue;
    row.total += 1;
    if (isQuizEligiblePlayer(player)) row.quizReady += 1;
  }

  const rows = [...byTeam.values()].sort((a, b) => b.total - a.total);
  const totalPlayers = players.length;
  const squadSizes = rows.map((r) => r.total);
  const avgSquad =
    squadSizes.length > 0
      ? (squadSizes.reduce((a, b) => a + b, 0) / squadSizes.length).toFixed(1)
      : '0';
  const largest = rows[0];
  const underSquad = rows.filter((r) => r.total < MIN_SQUAD);
  const overSquad = rows.filter((r) => r.total > 30);
  const underQuiz = rows.filter((r) => r.quizReady < MIN_QUIZ);

  console.log('FootyBrain squad report\n');
  console.log(`Total players: ${totalPlayers}`);
  console.log(`Clubs: ${teams.length}`);
  console.log(`Average squad size: ${avgSquad}`);
  if (largest) {
    console.log(`Largest squad: ${largest.teamName} (${largest.total})`);
  }
  console.log(`\nSquad size per club (total · quiz-ready):`);
  for (const row of rows) {
    const flags = [];
    if (row.total < MIN_SQUAD) flags.push(`under ${MIN_SQUAD} players`);
    if (row.quizReady < MIN_QUIZ) flags.push(`under ${MIN_QUIZ} quiz-ready`);
    const suffix = flags.length ? ` ⚠ ${flags.join('; ')}` : '';
    console.log(`  ${row.teamName.padEnd(28)} ${String(row.total).padStart(3)} · ${String(row.quizReady).padStart(2)}${suffix}`);
  }

  console.log(`\nClubs under ${MIN_SQUAD} players: ${underSquad.length}`);
  if (underSquad.length) {
    underSquad.forEach((r) => console.log(`  - ${r.teamName} (${r.total})`));
  }

  console.log(`\nClubs over 30 players: ${overSquad.length}`);
  if (overSquad.length) {
    overSquad.forEach((r) => console.log(`  - ${r.teamName} (${r.total})`));
  }

  console.log(`\nClubs under ${MIN_QUIZ} quiz-ready players: ${underQuiz.length}`);
  if (underQuiz.length) {
    underQuiz.forEach((r) => console.log(`  - ${r.teamName} (${r.quizReady})`));
  }

  const editorialGaps = players.filter(
    (p) => p.dataStatus === 'generated-needs-editorial' || p.quizEligible === false,
  ).length;
  console.log(`\nEditorial gaps (browse-only / needs editorial): ${editorialGaps} players`);
  console.log(`Quiz-eligible total: ${players.filter(isQuizEligiblePlayer).length}`);
}

main();
