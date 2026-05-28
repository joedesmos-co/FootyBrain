/** Small UX helpers for quiz flows — no state, no dependencies. */

export function scrollQuizPanelIntoView() {
  if (typeof window === 'undefined') return;
  requestAnimationFrame(() => {
    const panel = document.querySelector('.quiz-panel, .club-quiz__panel');
    panel?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
}

export function scrollPageTop() {
  if (typeof window === 'undefined') return;
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

/**
 * @param {number} accuracy 0–100
 * @param {number} bestStreak
 */
export function getSessionEncouragement(accuracy, bestStreak) {
  if (accuracy >= 100) return 'Perfect run — that is elite recall.';
  if (accuracy >= 80) return 'Strong session. One more round could push you to a new best streak.';
  if (accuracy >= 55) return 'Solid work — review the misses below, then jump back in.';
  if (bestStreak >= 3) return 'You built a streak — tighten the weak spots and run it back.';
  return 'Every miss is a player worth knowing — explore profiles, then play again.';
}

/**
 * @param {number} streak after current answer
 * @param {'correct' | 'incorrect'} outcome
 */
export function getNextQuestionButtonLabel(streak, outcome) {
  if (streak >= 5) return `Keep rolling · ${streak} streak`;
  if (streak >= 3 && outcome === 'correct') return `One more · ${streak} streak`;
  if (outcome === 'correct') return 'One more question';
  return 'Next question';
}
