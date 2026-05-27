/** Shared consumer-facing labels (football-first, consistent terminology). */

export const IMPORTANCE_SCORE_LABEL = 'Importance score';
export const IMPORTANCE_SCORE_TITLE = 'FootyBrain importance score';

export const QUIZ_COMING_SOON = 'Quiz coming soon';

export function formatQuizReadyCount(count) {
  const n = Number(count) || 0;
  if (n <= 0) return '';
  if (n === 1) return '1 quiz-ready player';
  return `${n.toLocaleString()} quiz-ready players`;
}

/** Short inline suffix: " · 12 in quizzes" */
export function formatQuizReadyInline(count) {
  const n = Number(count) || 0;
  if (n <= 0) return '';
  if (n === 1) return '1 in quizzes';
  return `${n} in quizzes`;
}

export function clubChipSubline(quizCount) {
  const n = Number(quizCount) || 0;
  return n > 0 ? formatQuizReadyInline(n) : 'View squad';
}

export function leagueMetaLine({ clubs, players, quizReady }) {
  const parts = [`${clubs} clubs`, `${players} players`];
  const quizLine = formatQuizReadyCount(quizReady);
  if (quizLine) parts.push(quizLine);
  return parts.join(' · ');
}

export function leagueHubQuizLabel(quizReadyCount) {
  const n = Number(quizReadyCount) || 0;
  if (n <= 0) return 'Coming soon';
  return n === 1 ? '1 player ready' : `${n} players ready`;
}
