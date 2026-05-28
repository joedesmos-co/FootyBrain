/**
 * Pure quiz eligibility rules — no sampleData import (safe for profile/team shells).
 *
 * Editorial eligibility (full clues) is separate from the quiz ecosystem (all roster players).
 */

import { EXTERNAL_LEAGUE_ID } from './footballDisplay.js';

export function isDatasetPlayer(player) {
  return Boolean(player?.id && String(player.name ?? '').trim());
}

/** Any in-league roster player eligible for search, registry, and weighted quiz pools. */
export function isInQuizEcosystem(player) {
  if (!isDatasetPlayer(player)) return false;
  if (player.leagueId === EXTERNAL_LEAGUE_ID) return false;
  return true;
}

/** Curated editorial profile with hand-written quiz hints. */
export function isQuizEligiblePlayer(player) {
  if (!isInQuizEcosystem(player)) return false;
  if (player?.quizClueTier === 'synthetic' || player?._syntheticClues) return false;
  if (player?.hasEditorialClues === false) return false;
  if (player?.quizEligible === false) return false;
  const hints = player?.quizHints ?? [];
  const fact = String(player?.quickFact ?? '').trim();
  if (hints.length < 2 || fact.length < 12) return false;
  return true;
}

/** @returns {'editorial' | 'synthetic' | 'none'} */
export function getQuizClueTier(player) {
  if (isQuizEligiblePlayer(player)) return 'editorial';
  if (isInQuizEcosystem(player)) return 'synthetic';
  return 'none';
}

export function hasEditorialQuizClues(player) {
  return getQuizClueTier(player) === 'editorial';
}
