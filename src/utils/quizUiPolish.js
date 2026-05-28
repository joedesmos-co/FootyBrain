/** Small UX helpers for quiz flows — no state, no dependencies. */

export function scrollQuizPanelIntoView() {
  if (typeof window === 'undefined') return;
  requestAnimationFrame(() => {
    const panel = document.querySelector('.quiz-panel, .club-quiz__panel, .daily-question-panel');
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
 * @param {number} [missedCount]
 */
export function getSessionEncouragement(accuracy, bestStreak, missedCount = 0) {
  if (accuracy >= 100) return 'Perfect run — elite recall. Try Hardcore or Football nerd next.';
  if (accuracy >= 80 && bestStreak >= 5) {
    return 'Strong session and a real streak — one more round on a harder theme?';
  }
  if (accuracy >= 80) return 'Strong session. Push difficulty up or chase a longer streak.';
  if (accuracy >= 55 && missedCount > 0) {
    return 'Solid work — study the misses below, then replay on Easy or Medium.';
  }
  if (bestStreak >= 3) return 'You built a streak — review the weak spots and run it back.';
  if (missedCount >= 2) return 'Every miss is a player worth knowing — hints and profiles below.';
  return 'Keep going — recognizable names get easier with one focused review pass.';
}

/**
 * @param {number} streak after current answer
 * @param {'correct' | 'incorrect'} outcome
 */
export function getNextQuestionButtonLabel(streak, outcome) {
  if (streak >= 8) return `Unstoppable · ${streak} streak`;
  if (streak >= 5) return `Keep rolling · ${streak} streak`;
  if (streak >= 3 && outcome === 'correct') return `On fire · ${streak} streak`;
  if (outcome === 'correct') return 'Next question';
  return 'Next question';
}

/**
 * Short streak milestone line after a correct answer.
 * @param {number} streak
 */
export function getStreakMilestoneCopy(streak) {
  if (streak === 10) return '10 in a row — legendary recall';
  if (streak === 7) return '7-streak — heating up';
  if (streak === 5) return '5-streak — bonus XP territory';
  if (streak === 3) return '3-streak — momentum';
  return '';
}
