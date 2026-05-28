/** Shared consumer-facing labels (football-first, consistent terminology). */

export const IMPORTANCE_SCORE_LABEL = 'Importance score';
export const IMPORTANCE_SCORE_TITLE = 'FootyCompass importance score';

export const QUIZ_COMING_SOON = 'More quiz clues on the way';

/** Short inline suffix for club chips when quizzes exist. */
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

export function leagueMetaLine({ clubs, players }) {
  return `${clubs} clubs · ${players} players`;
}

export function leagueHubQuizLabel(quizReadyCount) {
  const n = Number(quizReadyCount) || 0;
  if (n <= 0) return 'Explore players';
  return n === 1 ? '1 in quizzes' : `${n} in quizzes`;
}
