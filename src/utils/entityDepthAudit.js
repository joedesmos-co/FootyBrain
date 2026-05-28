/**
 * Shared depth/gap detection for top-importance audits (no invented facts).
 */

import { EXTERNAL_LEAGUE_ID } from './footballDisplay.js';
import { isQuizEligiblePlayer } from './quizPlayerRules.js';

export const TOP_PLAYER_COUNT = 300;

const PLACEHOLDER_FACT_RE =
  /editorial profile coming soon|editorial quiz profile pending|footybrain|footycompass sample|listed as .*footybrain/i;

export function hasSubstantiveQuickFact(player) {
  const fact = String(player?.quickFact ?? '').trim();
  if (!fact || PLACEHOLDER_FACT_RE.test(fact)) return false;
  return fact.length >= 12;
}

export function parsePlayStyleTags(player) {
  const raw = String(player?.playingStyle ?? '').trim();
  if (!raw) return [];
  return raw
    .split(/[·•,;|/]/g)
    .map((t) => t.trim())
    .filter(Boolean);
}

export function parseStrengths(player) {
  const raw = player?.strengths ?? player?.keyStrengths ?? player?.signatureStrengths;
  if (!raw) return [];
  if (Array.isArray(raw)) return raw.map((v) => String(v).trim()).filter(Boolean);
  return String(raw)
    .split(/[·•,;|/]/g)
    .map((t) => t.trim())
    .filter(Boolean);
}

/** @param {object} player */
export function auditPlayerGaps(player) {
  const honors = player?.honors ?? player?.honours ?? player?.trophies;
  const hasHonors = Array.isArray(honors)
    ? honors.length > 0
    : Boolean(String(honors ?? '').trim());

  return {
    missingQuickFact: !hasSubstantiveQuickFact(player),
    missingPlayStyle:
      !parsePlayStyleTags(player).length &&
      !String(player?.playStyleSummary ?? player?.styleSummary ?? '').trim(),
    missingStrengths: parseStrengths(player).length === 0,
    missingCareerHistory: !(player?.careerHistory?.length > 0),
    missingHonors: !hasHonors,
    missingQuizHints: !(player?.quizHints?.length >= 2),
    quizReady: isQuizEligiblePlayer(player),
  };
}

export function countPlayerEditorialDepth(player) {
  let depth = 0;
  if (hasSubstantiveQuickFact(player)) depth += 3;
  if (player?.playingStyle || player?.playStyleSummary) depth += 2;
  if (parseStrengths(player).length) depth += 2;
  if (player?.careerHistory?.length) depth += 2;
  if (player?.honors?.length || player?.honours?.length) depth += 1;
  if (player?.quizHints?.length) depth += 1;
  return depth;
}

/** @param {object} team */
export function auditTeamGaps(team) {
  const shortHistory = String(team?.shortHistory ?? '').trim();
  const fanGuide = String(team?.fanGuide ?? '').trim();
  return {
    missingQuickFacts: !team?.stadium && !team?.founded && !team?.manager,
    missingStadium: !String(team?.stadium ?? '').trim(),
    missingClubIdentity: !(team?.identityTags?.length > 0),
    missingRivalries: !(team?.rivals?.length > 0),
    missingLegends: !(team?.legends?.length > 0),
    missingHistory: !shortHistory,
    missingFanGuide: !fanGuide,
    missingKeyPlayers: !(team?.currentKeyPlayers?.length > 0),
    hasStory: Boolean(shortHistory),
    hasFanGuide: Boolean(fanGuide),
  };
}

export function countClubEditorialDepth(team) {
  const gaps = auditTeamGaps(team);
  let depth = 0;
  if (gaps.hasStory) depth += 3;
  if (gaps.hasFanGuide) depth += 3;
  if (!gaps.missingRivalries) depth += 2;
  if (!gaps.missingLegends) depth += 2;
  if (!gaps.missingKeyPlayers) depth += 1;
  if (!gaps.missingClubIdentity) depth += 1;
  if (team?.manager) depth += 1;
  return depth;
}

/** @param {object} league */
export function auditLeagueGaps(league) {
  return {
    missingDescription: !String(league?.description ?? '').trim(),
    missingStyleOfPlay: !String(league?.styleOfPlay ?? '').trim(),
    missingFamousClubs: !(league?.famousClubs?.length > 0),
    missingRivalries: !(league?.rivalries?.length > 0),
    missingFamousPlayers: !(league?.famousPlayers?.length > 0),
  };
}

export function countLeagueEditorialDepth(league) {
  const g = auditLeagueGaps(league);
  let depth = 0;
  if (!g.missingDescription) depth += 2;
  if (!g.missingStyleOfPlay) depth += 2;
  if (!g.missingFamousClubs) depth += 2;
  if (!g.missingRivalries) depth += 2;
  return depth;
}

/** @param {object} nationalTeam */
export function auditNationalTeamGaps(nationalTeam) {
  return {
    missingFanGuide: !String(nationalTeam?.fanGuide ?? '').trim(),
    missingHistory: !String(nationalTeam?.shortHistory ?? '').trim(),
    missingRivalries: !(nationalTeam?.rivalIds?.length > 0),
  };
}

export function countNationalEditorialDepth(nationalTeam) {
  const g = auditNationalTeamGaps(nationalTeam);
  let depth = 0;
  if (!g.missingFanGuide) depth += 3;
  if (!g.missingHistory) depth += 2;
  if (!g.missingRivalries) depth += 2;
  return depth;
}

export function isMajorClub(team) {
  return Boolean(team?.id) && team.leagueId !== EXTERNAL_LEAGUE_ID;
}

export function gapCount(gaps) {
  return Object.values(gaps).filter((v) => v === true).length;
}

export function isThinPlayer(player, threshold = 2) {
  return countPlayerEditorialDepth(player) <= threshold;
}

export function isThinTeam(team, threshold = 3) {
  return countClubEditorialDepth(team) <= threshold;
}

export function isThinLeague(league, threshold = 3) {
  return countLeagueEditorialDepth(league) <= threshold;
}

export function isThinNationalTeam(nt, threshold = 3) {
  return countNationalEditorialDepth(nt) <= threshold;
}
