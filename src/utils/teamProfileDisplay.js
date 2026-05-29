import { formatCountryLabel } from './footballDisplay';
import { isPlaceholderClubCopy } from './entityDepthAudit';
import { getTeamHonorsList, parseKeyPlayerLine } from './teamPageUtils';

/** @typedef {{ icon: string, label: string, value: string, href?: string }} TeamQuickFact */

/**
 * Best-effort nickname from fanGuide lead-in (e.g. "The Gunners wear…").
 * @param {object} team
 * @returns {string[]}
 */
export function inferTeamNicknames(team) {
  const guide = String(team.fanGuide ?? '').trim();
  if (!guide) return [];

  const lead = guide.match(
    /^((?:The|Les|Die|La|El|Os)\s+[A-Za-zÀ-ÿ][\wÀ-ÿ'-]*(?:\s+[A-Za-zÀ-ÿ][\wÀ-ÿ'-]*)?)/,
  );
  if (lead?.[1]) return [lead[1]];

  return [];
}

/**
 * @param {{ team: object, leagueName: string, rosterSize: number, rivalCount: number, honorCount: number }} ctx
 * @returns {TeamQuickFact[]}
 */
export function buildTeamQuickFacts({ team, leagueName, rosterSize, rivalCount, honorCount }) {
  /** @type {TeamQuickFact[]} */
  const facts = [];

  if (leagueName) {
    facts.push({
      icon: '⚽',
      label: 'League',
      value: leagueName,
      href: `/league/${team.leagueId}`,
    });
  }

  const country = formatCountryLabel(team.country);
  if (country && country !== '—') {
    facts.push({ icon: '🌍', label: 'Country', value: country });
  }

  if (team.stadium) {
    facts.push({ icon: '🏟', label: 'Stadium', value: String(team.stadium) });
  }

  if (team.founded) {
    facts.push({ icon: '📅', label: 'Founded', value: String(team.founded) });
  }

  const manager = team.manager?.trim();
  if (manager) {
    facts.push({ icon: '👔', label: 'Head coach', value: manager });
  }

  if (rosterSize > 0) {
    facts.push({ icon: '👥', label: 'Squad', value: `${rosterSize} players` });
  }

  if (rivalCount > 0) {
    facts.push({
      icon: '⚔️',
      label: 'Rivals',
      value: `${rivalCount} listed`,
    });
  }

  if (honorCount > 0) {
    facts.push({
      icon: '🏆',
      label: 'Honours',
      value: `${honorCount} noted`,
    });
  }

  return facts;
}

/**
 * @param {string[]} legendLines
 * @returns {Array<{ name: string, note: string }>}
 */
export function parseTeamLegendLines(legendLines) {
  if (!Array.isArray(legendLines)) return [];
  return legendLines
    .map((line) => parseKeyPlayerLine(line))
    .filter((entry) => entry.name);
}

export function getTeamProfileEditorial(team) {
  const rawFanGuide = String(team.fanGuide ?? '').trim();
  const rawShortHistory = String(team.shortHistory ?? '').trim();
  const fanGuide = isPlaceholderClubCopy({ shortHistory: '', fanGuide: rawFanGuide })
    ? ''
    : rawFanGuide;
  const shortHistory = isPlaceholderClubCopy({
    shortHistory: rawShortHistory,
    fanGuide: '',
  })
    ? ''
    : rawShortHistory;
  const nicknames = inferTeamNicknames(team);
  const honors = getTeamHonorsList(team);
  const metaDescription = String(team.metaDescription ?? '').trim();
  const tacticalIdentity = String(team.tacticalIdentity ?? '').trim();
  const stadiumContext = String(team.stadiumContext ?? '').trim();
  const leagueContext = String(team.leagueContext ?? '').trim();
  const rivalsSummary = String(team.rivalsSummary ?? '').trim();
  const legendsSummary = String(team.legendsSummary ?? '').trim();
  const playersToKnowIntro = String(team.playersToKnowIntro ?? '').trim();
  const quizDiscoveryLead = String(team.quizDiscoveryLead ?? '').trim();

  return {
    fanGuide,
    shortHistory,
    nicknames,
    honors,
    metaDescription,
    tacticalIdentity,
    stadiumContext,
    leagueContext,
    rivalsSummary,
    legendsSummary,
    playersToKnowIntro,
    quizDiscoveryLead,
    hasFanGuide: Boolean(fanGuide),
    hasStory: Boolean(shortHistory),
    hasPremiumOverlay: Boolean(metaDescription || tacticalIdentity),
    hasContext: Boolean(
      fanGuide ||
        shortHistory ||
        nicknames.length > 0 ||
        honors.length > 0 ||
        tacticalIdentity ||
        stadiumContext ||
        leagueContext,
    ),
  };
}
