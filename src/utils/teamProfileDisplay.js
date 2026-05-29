import { formatCountryLabel } from './footballDisplay';
import { isPlaceholderClubCopy } from './entityDepthAudit';
import { polishGeneratedCopy, truncateLearnerCopy } from './learnerProfileCopy';
import { getTeamHonorsList, parseKeyPlayerLine } from './teamPageUtils';

function polishField(text, max = 280) {
  const t = polishGeneratedCopy(text);
  return t ? truncateLearnerCopy(t, max) : '';
}

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
    : polishField(rawFanGuide, 320);
  const shortHistory = isPlaceholderClubCopy({
    shortHistory: rawShortHistory,
    fanGuide: '',
  })
    ? ''
    : polishField(rawShortHistory, 280);
  const nicknames = inferTeamNicknames(team);
  const honors = getTeamHonorsList(team);
  const metaDescription = polishField(team.metaDescription ?? '', 165);
  const tacticalIdentity = polishField(team.tacticalIdentity ?? '', 240);
  const stadiumContext = polishField(team.stadiumContext ?? '', 220);
  const leagueContext = polishField(team.leagueContext ?? '', 240);
  const rivalsSummary = polishField(team.rivalsSummary ?? '', 220);
  const legendsSummary = polishField(team.legendsSummary ?? '', 240);
  const playersToKnowIntro = polishField(team.playersToKnowIntro ?? '', 180);
  const quizDiscoveryLead = polishField(team.quizDiscoveryLead ?? '', 200);

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
