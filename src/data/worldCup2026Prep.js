/**
 * World Cup 2026 groups prep — static manifest only (no fixtures, scores, or APIs).
 * Source: editorial-overlays/world-cup-2026-qualified-teams.json
 */

import qualifiedManifest from '../../editorial-overlays/world-cup-2026-qualified-teams.json';
import { getLearningPathIdForNationalTeam } from './learningPathsData';
import { getNationalTeamById, isLiveNationalTeamId } from './nationalTeamData';

const teamMetaById = new Map(qualifiedManifest.teams.map((team) => [team.id, team]));

const qualifiedTeamIds = new Set(qualifiedManifest.teams.map((team) => team.id));

/** Consumer copy for the groups draw (all 48 live). */
export const WORLD_CUP_DRAW_POOL_COVERAGE_NOTE =
  'All 48 World Cup teams now have live national pools in FootyBrain.';

export const WORLD_CUP_2026_GROUP_COUNT = Object.keys(qualifiedManifest.groups).length;

export const WORLD_CUP_2026_TEAM_COUNT = qualifiedManifest.teams.length;

/** @param {string} groupId e.g. group-a */
export function formatWorldCupGroupLabel(groupId) {
  const letter = groupId.replace(/^group-/i, '').toUpperCase();
  return `Group ${letter}`;
}

/**
 * @returns {Array<{
 *   groupId: string,
 *   label: string,
 *   nations: Array<{
 *     id: string,
 *     displayName: string,
 *     isLive: boolean,
 *     profileHref: string | null,
 *     learnPathId: string | null,
 *   }>,
 * }>}
 */
export function getWorldCup2026Groups() {
  return Object.entries(qualifiedManifest.groups).map(([groupId, nationIds]) => ({
    groupId,
    label: formatWorldCupGroupLabel(groupId),
    nations: nationIds.map((id) => {
      const meta = teamMetaById.get(id);
      const live = getNationalTeamById(id);
      return {
        id,
        displayName: live?.displayName ?? meta?.displayName ?? id,
        isLive: isLiveNationalTeamId(id),
        profileHref: isLiveNationalTeamId(id) ? `/national-team/${id}` : null,
        learnPathId: getLearningPathIdForNationalTeam(id),
      };
    }),
  }));
}

export function isWorldCup2026QualifiedTeam(nationalTeamId) {
  return qualifiedTeamIds.has(nationalTeamId);
}

/** @param {{ isLive: boolean }} nation */
export function getWorldCupDrawNationBadgeLabel({ isLive }) {
  return isLive ? 'Live' : 'Pool not added yet';
}

export function getWorldCup2026GroupsSummary() {
  const groups = getWorldCup2026Groups();
  let liveInDraw = 0;
  for (const group of groups) {
    liveInDraw += group.nations.filter((n) => n.isLive).length;
  }
  return {
    groupCount: groups.length,
    teamCount: WORLD_CUP_2026_TEAM_COUNT,
    liveInDraw,
    poolNotAddedInDraw: WORLD_CUP_2026_TEAM_COUNT - liveInDraw,
    previewInDraw: WORLD_CUP_2026_TEAM_COUNT - liveInDraw,
  };
}
