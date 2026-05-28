import { truncateClubText } from './clubIdentity';
import { buildClubIdentitySection } from './entityEditorialSynthesis';
import { formatCountryLabel } from './footballDisplay';
import { getTeamProfileEditorial } from './teamProfileDisplay';

/**
 * @param {object} team
 * @param {string} leagueName
 * @param {number} rosterSize
 */
export function buildSyntheticClubStory(team, leagueName, rosterSize = 0) {
  return buildClubIdentitySection(team, leagueName, rosterSize);
}

/**
 * @param {object} team
 * @param {string} leagueName
 */
export function buildClubLeagueContext(team, leagueName) {
  const country = formatCountryLabel(team.country);
  if (!leagueName) return '';
  const region =
    country && country !== '—' ? `${leagueName} (${country})` : leagueName;
  return `League context: ${team.name} are tracked in ${region}. Open the league page for rivalries, featured clubs, and quiz links.`;
}

/**
 * @param {object} team
 * @param {string} leagueName
 * @param {number} rosterSize
 */
export function buildClubProfileDescription(team, leagueName, rosterSize = 0) {
  const editorial = getTeamProfileEditorial(team);
  if (editorial.shortHistory) {
    const snippet = truncateClubText(editorial.shortHistory, 140);
    return `${team.name} — ${snippet} Club profile with squad, rivals, and quizzes on FootyCompass.`;
  }

  const story = truncateClubText(buildSyntheticClubStory(team, leagueName, rosterSize), 160);
  return `${team.name} (${leagueName}) — ${story}`;
}

/**
 * @param {object} team
 */
export { countClubEditorialDepth } from './entityDepthAudit';
