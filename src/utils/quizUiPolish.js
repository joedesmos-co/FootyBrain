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

export function getStreakTier(value) {
  if (value >= 10) return 10;
  if (value >= 5) return 5;
  if (value >= 3) return 3;
  return 0;
}

/**
 * @param {number} accuracy 0–100
 * @param {number} bestStreak
 * @param {number} [missedCount]
 */
export function getSessionEncouragement(accuracy, bestStreak, missedCount = 0) {
  if (accuracy >= 100) return 'Perfect run — try a harder theme or timed mode while it is fresh.';
  if (accuracy >= 80 && bestStreak >= 5) {
    return 'Strong session with real momentum — one more round on a harder theme?';
  }
  if (accuracy >= 80) return 'Strong session. Push difficulty up or chase a longer streak.';
  if (accuracy >= 55 && missedCount > 0) {
    return 'Solid work — skim the misses below, then replay on Easy or Medium.';
  }
  if (bestStreak >= 3) return `You hit a ${bestStreak}-answer streak — review the weak spots and run it back.`;
  if (missedCount >= 2) return 'Each miss is a name worth knowing — profiles and hints below.';
  return 'Names stick with one focused pass — your next session builds on this one.';
}

/**
 * Short line after a wrong answer — forward-looking, not punitive.
 * @param {number} bestStreak best streak in the current session (before reset)
 */
export function getIncorrectMomentumCopy(bestStreak) {
  if (bestStreak >= 8) {
    return `You reached ${bestStreak} in a row — one slip, then back to the clues.`;
  }
  if (bestStreak >= 5) {
    return `Session best: ${bestStreak} streak. The next question is a clean start.`;
  }
  if (bestStreak >= 3) {
    return `You had ${bestStreak} correct in a row — use club and nation on the next one.`;
  }
  return 'Read the answer, then move on — the next clue starts fresh.';
}

/**
 * @param {number} streak current streak after the answer (0 if just missed)
 * @param {'correct' | 'incorrect'} outcome
 * @param {{ bestStreak?: number, isLast?: boolean }} [opts]
 */
export function getNextQuestionButtonLabel(streak, outcome, opts = {}) {
  const { bestStreak = 0, isLast = false } = opts;
  if (isLast) return 'See results';

  if (streak >= 8) return `Keep going · ${streak} streak`;
  if (streak >= 5) return `On a roll · ${streak} streak`;
  if (streak >= 3 && outcome === 'correct') return `Momentum · ${streak} streak`;

  if (outcome === 'incorrect') {
    if (bestStreak >= 5) return 'Next question';
    return 'Next question';
  }

  return 'Next question';
}

/**
 * Short streak milestone line after a correct answer.
 * @param {number} streak
 */
export function getStreakMilestoneCopy(streak) {
  if (streak === 10) return '10 in a row — elite recall';
  if (streak === 7) return '7-streak — bonus XP zone';
  if (streak === 5) return '5-streak — keep the rhythm';
  if (streak === 3) return '3-streak — momentum';
  return '';
}

/** @param {number} streak */
export function getStreakMilestoneLabel(streak) {
  const copy = getStreakMilestoneCopy(streak);
  return copy || null;
}

/**
 * One-line nudge on session-end screens (no dark patterns).
 * @param {number} accuracy
 * @param {number} bestStreak
 */
export function getOneMoreQuizNudge(accuracy, bestStreak) {
  if (accuracy >= 90 && bestStreak >= 5) return 'You are warmed up — one more round while recall is sharp.';
  if (accuracy >= 70) return 'A short follow-up quiz locks in what you just saw.';
  if (bestStreak >= 4) return 'Your streak muscle is active — try a different format next.';
  return 'Pick a recommended path below or replay with easier clues.';
}

/**
 * @param {number} accuracy
 * @param {boolean} perfect
 */
export function getSessionEndHeadline(accuracy, perfect) {
  if (perfect) return 'Perfect session';
  if (accuracy >= 85) return 'Strong session';
  if (accuracy >= 55) return 'Session complete';
  return 'Good effort — session complete';
}
