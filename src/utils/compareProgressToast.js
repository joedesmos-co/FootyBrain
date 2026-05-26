import { getAchievementById } from '../data/achievements';

export function buildCompareProgressToast(xp, newAchievementIds) {
  const achievement = newAchievementIds[0]
    ? getAchievementById(newAchievementIds[0])
    : null;

  if (achievement) {
    return `Achievement: ${achievement.label}${xp > 0 ? ` · +${xp} XP` : ''}`;
  }
  if (xp > 0) return `+${xp} XP · comparison logged`;
  return 'Comparison logged';
}
