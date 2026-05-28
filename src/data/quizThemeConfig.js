/**
 * Theme pool importance floors (Node-safe; no collection imports).
 */

export const MIN_RECOGNIZABLE_IMPORTANCE = 52;

export const THEME_IMPORTANCE_FLOORS = {
  legends: { easy: 84, medium: 78, hard: 72, hardcore: 66, nerd: 62 },
  wonderkids: { easy: 70, medium: 62, hard: 56, hardcore: 52, nerd: 48 },
  'cult-heroes': { easy: 58, medium: 52, hard: 50, hardcore: 48, nerd: 46 },
  'top-scorers': { easy: 80, medium: 76, hard: 72, hardcore: 68, nerd: 64 },
  'champions-league': { easy: 72, medium: 66, hard: 60, hardcore: 56, nerd: 52 },
  'world-cup': { easy: 68, medium: 62, hard: 58, hardcore: 54, nerd: 50 },
  'derby-rivalries': { easy: 66, medium: 60, hard: 56, hardcore: 52, nerd: 48 },
  'premier-league': { easy: 64, medium: 58, hard: 54, hardcore: 50, nerd: 46 },
  'la-liga': { easy: 64, medium: 58, hard: 54, hardcore: 50, nerd: 46 },
  'serie-a': { easy: 64, medium: 58, hard: 54, hardcore: 50, nerd: 46 },
  bundesliga: { easy: 64, medium: 58, hard: 54, hardcore: 50, nerd: 46 },
  veterans: { easy: 68, medium: 62, hard: 58, hardcore: 54, nerd: 50 },
};

const DEFAULT_THEME_FLOORS = {
  easy: 64,
  medium: 56,
  hard: 52,
  hardcore: 48,
  nerd: 44,
};

export function getThemeMinImportance(themeId, difficulty = 'medium') {
  const floors = THEME_IMPORTANCE_FLOORS[themeId] ?? DEFAULT_THEME_FLOORS;
  return floors[difficulty] ?? floors.medium ?? MIN_RECOGNIZABLE_IMPORTANCE;
}
