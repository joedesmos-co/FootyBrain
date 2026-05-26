export function xpToAdvance(level) {
  return level * 100;
}

export function calculateLevel(totalXp) {
  let level = 1;
  let accumulated = 0;
  let needed = xpToAdvance(level);
  while (totalXp >= accumulated + needed) {
    accumulated += needed;
    level += 1;
    needed = xpToAdvance(level);
  }
  return { level, xpIntoLevel: totalXp - accumulated, xpForNextLevel: needed };
}
