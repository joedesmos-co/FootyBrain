import { isBrowseOnlyPlayer } from './playerEditorial';
import {
  getPositionCategory,
  getSquadSummary,
  SQUAD_POSITION_GROUPS,
  squadGroupCountLabel,
} from './squadGrouping';
import { getQuizEligiblePlayers } from './quizEligibility';

function positionGroupLabel(groupId) {
  return SQUAD_POSITION_GROUPS.find((group) => group.id === groupId)?.label ?? groupId;
}

/** Short role line for compare headers (e.g. "Midfielders — Central Midfielder"). */
export function getPlayerRoleSummary(player) {
  const groupId = getPositionCategory(player.position);
  return `${positionGroupLabel(groupId)} · ${player.position}`;
}

/**
 * 2–3 scannable strength bullets from editorial playingStyle (no external stats).
 * @returns {string[]}
 */
export function getPlayerStrengths(player) {
  if (isBrowseOnlyPlayer(player)) {
    return ['Profile preview—playing strengths coming soon.'];
  }

  const style = String(player.playingStyle ?? '').trim();
  if (!style) return ['Playing style notes not added yet.'];
  if (style.startsWith('Listed as')) {
    return ['Squad listing — detailed strengths not reviewed yet.'];
  }

  const parts = style
    .split(/[,;]|\s+and\s+/)
    .map((part) => part.trim())
    .filter((part) => part.length > 8);

  if (parts.length >= 2) return parts.slice(0, 3);
  return [style.length > 140 ? `${style.slice(0, 137)}…` : style];
}

/**
 * @param {ReturnType<import('./squadGrouping').getSquadSummary>} rosterStats
 */
export function getSquadStrengthSummary(rosterStats) {
  const { total, topPlayer, counts } = rosterStats;
  if (total === 0) return 'No players in the FootyCompass sample for this club yet.';

  let dominantId = 'midfielders';
  let dominantCount = 0;
  for (const group of SQUAD_POSITION_GROUPS) {
    if (counts[group.id] > dominantCount) {
      dominantCount = counts[group.id];
      dominantId = group.id;
    }
  }

  const depth =
    dominantCount > 0
      ? `deepest ${positionGroupLabel(dominantId).toLowerCase()} pool (${dominantCount})`
      : 'balanced squad spread';

  const top =
    topPlayer != null
      ? `top importance score ${topPlayer.importanceScore} (${topPlayer.name})`
      : 'no rated leader in sample';

  return `${total} players · ${depth} · ${top}`;
}

/**
 * @param {string} teamId
 * @param {Array} allPlayers
 */
export function getTeamCompareSnapshot(teamId, allPlayers) {
  const roster = allPlayers.filter((player) => player.teamId === teamId);
  const rosterStats = getSquadSummary(roster);
  const avgScore =
    rosterStats.total > 0
      ? Math.round(
          roster.reduce((sum, player) => sum + player.importanceScore, 0) /
            rosterStats.total,
        )
      : 0;
  const quizReady = getQuizEligiblePlayers(roster).length;

  return {
    rosterStats,
    avgScore,
    quizReady,
    strengthSummary: getSquadStrengthSummary(rosterStats),
  };
}

export { squadGroupCountLabel, SQUAD_POSITION_GROUPS };
