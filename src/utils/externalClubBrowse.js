import { isExternalClubStubTeam } from './footballDisplay';

/** @typedef {'team' | 'players' | 'coming-soon'} OtherClubBrowseChipMode */

/**
 * Count players on a team from a pre-filtered external-league player list.
 * @param {string} teamId
 * @param {object[]} players
 */
export function getOtherClubTeamRosterCount(teamId, players) {
  let count = 0;
  for (const player of players) {
    if (player.teamId === teamId) count += 1;
  }
  return count;
}

/**
 * Whether `/team/:id` is safe to open from Browse (guarded stub page or full club).
 * @param {object | null | undefined} team
 * @param {number} [rosterCount]
 */
export function isOtherClubTeamPageLinkSafe(team, rosterCount = 0) {
  if (!team?.id) return false;
  if (!isExternalClubStubTeam(team)) return true;
  return rosterCount > 0;
}

/**
 * Browse chip behavior for Other clubs — never a dead link.
 * @param {object | null | undefined} team
 * @param {number} [rosterCount]
 * @returns {OtherClubBrowseChipMode}
 */
export function getOtherClubBrowseChipMode(team, rosterCount = 0) {
  if (isOtherClubTeamPageLinkSafe(team, rosterCount)) return 'team';
  if (rosterCount > 0) return 'players';
  return 'coming-soon';
}
