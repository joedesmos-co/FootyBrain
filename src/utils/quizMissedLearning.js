/**
 * Post-session “missed players” study cards — lightweight, no extra data fetch.
 */

/**
 * @param {object} player
 */
export function getMissedPlayerStudyTip(player) {
  const hints = player?.quizHints ?? [];
  const firstHint = String(hints[0] ?? '').trim();
  if (firstHint) return firstHint;
  const fact = String(player?.quickFact ?? '').trim();
  if (fact.length > 12) return fact;
  return 'Open the profile for club, league, and quiz hints.';
}

/**
 * @param {object} player
 * @param {{ getTeamName?: (id: string) => string }} [ctx]
 */
export function buildMissedPlayerStudyCard(player, ctx = {}) {
  const getTeamName = ctx.getTeamName ?? (() => '');
  const club = getTeamName(player?.teamId) || player?.teamId || '';
  return {
    id: player.id,
    name: player.name,
    club,
    position: player?.position ?? '',
    tip: getMissedPlayerStudyTip(player),
    profileHref: `/player/${player.id}`,
    retryHref: `/quiz?difficulty=medium`,
  };
}

/**
 * @param {object[]} players
 * @param {{ getTeamName?: (id: string) => string, limit?: number }} [opts]
 */
export function buildMissedPlayerStudyCards(players, opts = {}) {
  const limit = opts.limit ?? 10;
  const unique = [];
  const seen = new Set();
  for (const player of players) {
    if (!player?.id || seen.has(player.id)) continue;
    seen.add(player.id);
    unique.push(buildMissedPlayerStudyCard(player, opts));
  }
  return unique.slice(0, limit);
}

/**
 * @param {number} missedCount
 */
export function getMissedLearningIntro(missedCount) {
  if (missedCount <= 0) return '';
  if (missedCount === 1) {
    return 'One name to lock in — read the hint, open the profile, then run the quiz again.';
  }
  return `${missedCount} players to revisit — study the hints below, then replay on Easy or Medium.`;
}
