/**
 * Human-readable XP lines for quiz and learning actions.
 */

export function formatQuizXpFeedback(result) {
  if (!result || result.totalXp <= 0) return '';

  const parts = [];
  if (result.baseXp > 0) parts.push(`+${result.baseXp} correct`);
  if (result.streakBonus > 0) parts.push(`+${result.streakBonus} streak bonus`);
  if (result.milestoneXp > 0) parts.push(`+${result.milestoneXp} session bonus`);

  const detail = parts.length > 0 ? ` (${parts.join(', ')})` : '';
  const streakNote =
    result.newSessionStreak >= 5
      ? ' · streak bonus rolling'
      : result.newSessionStreak >= 3
        ? ' · streak building'
        : '';
  return `+${result.totalXp} XP${detail}${streakNote}`;
}

export function formatMilestoneMessage(result) {
  if (!result?.sessionMilestoneHit) return null;
  const { correct, total, teamId, leagueId } = result.sessionMilestoneHit;
  const scope = teamId ? 'club quiz' : leagueId ? 'league quiz' : 'quiz session';
  return `Session complete — ${correct}/${total} correct on this ${scope}. Bonus XP applied.`;
}
