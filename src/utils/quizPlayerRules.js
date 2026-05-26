/**
 * Pure quiz eligibility rules — no sampleData import (safe for profile/team shells).
 */

export function isQuizEligiblePlayer(player) {
  if (player?.quizEligible === false) return false;
  const hints = player?.quizHints ?? [];
  const fact = String(player?.quickFact ?? '').trim();
  if (hints.length < 2 || fact.length < 12) return false;
  return true;
}
