import { formatClubIdentityTags, truncateClubText } from './clubIdentity';
import { formatCountryLabel } from './footballDisplay';
import { getTeamProfileEditorial } from './teamProfileDisplay';

/**
 * @param {object} team
 * @param {string} leagueName
 * @param {number} rosterSize
 */
export function buildSyntheticClubStory(team, leagueName, rosterSize = 0) {
  const country = formatCountryLabel(team.country);
  const parts = [];

  const locale =
    country && country !== '—' ? `${leagueName} club based in ${country}` : `${leagueName} club`;
  parts.push(`${team.name} is a ${locale}.`);

  const facts = [];
  if (team.founded) facts.push(`founded in ${team.founded}`);
  if (team.stadium) facts.push(`home ground ${team.stadium}`);
  if (facts.length) parts.push(`${facts.join(' · ').replace(/^./, (c) => c.toUpperCase())}.`);

  const identity = formatClubIdentityTags(team.identityTags);
  if (identity.length) {
    parts.push(
      `Playing identity in FootyCompass: ${identity
        .slice(0, 3)
        .map((t) => t.label.toLowerCase())
        .join(', ')}.`,
    );
  }

  if (rosterSize > 0) {
    parts.push(
      `Browse ${rosterSize} listed players for squad context, then try the club or league quiz when available.`,
    );
  }

  return parts.join(' ');
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
export function countClubEditorialDepth(team) {
  const editorial = getTeamProfileEditorial(team);
  let depth = 0;
  if (editorial.shortHistory) depth += 3;
  if (editorial.fanGuide) depth += 3;
  if (team.rivals?.length) depth += 2;
  if (team.legends?.length) depth += 2;
  if (team.currentKeyPlayers?.length) depth += 1;
  if (team.identityTags?.length) depth += 1;
  if (team.manager) depth += 1;
  return depth;
}
