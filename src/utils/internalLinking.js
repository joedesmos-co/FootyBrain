/**
 * Semantic internal links between players, clubs, leagues, national teams, quizzes, and hubs.
 * Keeps crawl paths shallow without duplicating hero CTAs (cap + dedupe).
 */

import { getClubQuizPlayHref } from '../data/clubQuizCategories.js';
import { getLiveNationalTeams } from '../data/nationalTeamData.js';
import { getQuizThemePlayHref, getQuizThemeIdForLeague } from '../data/quizThemes.js';
import { formatCountryLabel } from './footballDisplay.js';
import { normalizeClubName, parseKeyPlayerLine, resolveRivalEntries } from './teamPageUtils.js';
/** Align with scripts/generate-sitemap.js nationality hub cap. */
export const NATIONALITY_HUB_INDEX_LIMIT = 80;

/**
 * @param {string} nationality
 * @returns {string | null}
 */
export function getNationalityHubPath(nationality) {
  const label = String(nationality ?? '').trim();
  if (!label) return null;
  return `/hubs/players/nationality/${encodeURIComponent(label)}`;
}

/**
 * @param {string} countryLabel
 * @returns {string | null}
 */
export function findNationalTeamIdForCountry(countryLabel) {
  const norm = normalizeClubName(countryLabel);
  if (!norm) return null;
  for (const nt of getLiveNationalTeams()) {
    const candidates = [nt.country, nt.displayName].filter(Boolean).map(normalizeClubName);
    if (candidates.some((c) => c === norm || c.includes(norm) || norm.includes(c))) {
      return nt.id;
    }
  }
  return null;
}

/**
 * @param {{ label: string, to: string }[]} links
 * @param {number} [max]
 */
export function dedupeInternalLinks(links, max = 8) {
  const seen = new Set();
  const out = [];
  for (const link of links ?? []) {
    const to = link?.to;
    if (!to || seen.has(to)) continue;
    seen.add(to);
    out.push({ label: String(link.label ?? '').trim() || to, to });
    if (out.length >= max) break;
  }
  return out;
}

function playerMatchesFamousName(player, name) {
  const norm = normalizeClubName(name);
  if (!norm) return false;
  const pn = normalizeClubName(player.name);
  return pn === norm || pn.startsWith(norm) || norm.startsWith(pn);
}

/**
 * @param {string[]} names
 * @param {object[]} leaguePlayers
 * @param {number} [limit]
 */
export function resolveFamousPlayerLinks(names, leaguePlayers, limit = 6) {
  const links = [];
  const used = new Set();
  for (const line of names ?? []) {
    const { name } = parseKeyPlayerLine(line);
    if (!name) continue;
    const player = (leaguePlayers ?? []).find((p) => playerMatchesFamousName(p, name));
    if (!player || used.has(player.id)) continue;
    used.add(player.id);
    links.push({ label: player.name, to: `/player/${player.id}` });
    if (links.length >= limit) break;
  }
  return links;
}

function cleanRivalryClubFragment(text) {
  return String(text ?? '')
    .replace(/^[^:]+:\s*/, '')
    .replace(/\([^)]*\)/g, '')
    .trim();
}

/**
 * @param {string} rivalryLine
 * @returns {string[]}
 */
export function extractClubNamesFromRivalry(rivalryLine) {
  const raw = String(rivalryLine ?? '').trim();
  if (!raw) return [];

  const vsParts = raw.split(/\s+(?:vs\.?|v\.?)\s+/i);
  if (vsParts.length >= 2) {
    return vsParts.map(cleanRivalryClubFragment).filter(Boolean);
  }

  const dashParts = raw.split(/\s*[—–]\s*/);
  if (dashParts.length >= 2) {
    const tail = dashParts[dashParts.length - 1];
    if (/\s+vs\.?\s+/i.test(tail)) {
      return extractClubNamesFromRivalry(tail);
    }
    return dashParts.map(cleanRivalryClubFragment).filter(Boolean);
  }

  const cleaned = cleanRivalryClubFragment(raw);
  return cleaned ? [cleaned] : [];
}

/**
 * @param {string[]} rivalryStrings
 * @param {object[]} leagueTeams
 * @param {number} [limit]
 */
export function resolveLeagueRivalryLinks(rivalryStrings, leagueTeams, limit = 4) {
  const links = [];
  for (const rivalry of rivalryStrings ?? []) {
    for (const clubName of extractClubNamesFromRivalry(rivalry)) {
      const { team } = resolveRivalEntries([clubName], leagueTeams)[0] ?? {};
      if (team?.id) {
        links.push({ label: team.name, to: `/team/${team.id}` });
      }
    }
  }
  return dedupeInternalLinks(links, limit);
}

/**
 * @param {object} ctx
 * @returns {{ label: string, to: string }[]}
 */
export function buildPlayerInternalLinks(ctx = {}) {
  const {
    player,
    teamId = player?.teamId,
    leagueId = player?.leagueId,
    teamName = '',
    leagueName = '',
    quizReady = false,
    nationalTeamId = '',
    nationality = player?.nationality ?? player?.nationalTeam,
  } = ctx;

  const links = [];
  const add = (label, to) => {
    if (to) links.push({ label, to });
  };

  if (teamId) add(teamName || 'Club squad', `/team/${teamId}`);
  if (leagueId) add(leagueName || 'League guide', `/league/${leagueId}`);
  if (nationalTeamId) add('National team', `/national-team/${nationalTeamId}`);

  const natPath = getNationalityHubPath(nationality);
  if (natPath) {
    add(`${formatCountryLabel(nationality)} players`, natPath);
  }

  if (teamId) add('Team quiz hub', `/hubs/quizzes/team/${teamId}`);
  if (quizReady && teamId) add('Club player quiz', `/quiz?team=${teamId}`);
  if (leagueId) add('League quiz hub', `/hubs/quizzes/league/${leagueId}`);
  if (leagueId && quizReady) add('League player quiz', `/quiz?league=${leagueId}`);

  add('Discovery hubs', '/hubs');
  add('Daily challenge', '/daily');

  return dedupeInternalLinks(links, 8);
}

/**
 * @param {object} ctx
 */
export function buildLeagueInternalLinks(ctx = {}) {
  const { league, leagueTeams = [], leaguePlayers = [], quizReady = false } = ctx;
  const lid = league?.id ?? '';
  const links = [];
  const add = (label, to) => {
    if (to) links.push({ label, to });
  };

  if (lid) add('League quiz hub', `/hubs/quizzes/league/${lid}`);
  if (quizReady && lid) add('League player quiz', `/quiz?league=${lid}`);
  if (lid) add('Stadium quiz', getClubQuizPlayHref('stadium', { leagueId: lid }));
  if (lid) add('Rivalry quiz', getClubQuizPlayHref('rivalry', { leagueId: lid }));
  add('Club quiz guides', '/hubs/quizzes/clubs');

  if (league?.country) {
    const natPath = getNationalityHubPath(league.country);
    if (natPath) add(`${formatCountryLabel(league.country)} players`, natPath);
    const ntId = findNationalTeamIdForCountry(league.country);
    if (ntId) add(`${formatCountryLabel(league.country)} national team`, `/national-team/${ntId}`);
  }

  const themeId = lid ? getQuizThemeIdForLeague(lid) : '';
  if (themeId) add('Themed league quiz', getQuizThemePlayHref(themeId));

  links.push(...resolveLeagueRivalryLinks(league?.rivalries, leagueTeams, 3));
  links.push(...resolveFamousPlayerLinks(league?.famousPlayers, leaguePlayers, 3));

  add('All nationalities', '/hubs/players/by-nationality');
  add('Discovery hubs', '/hubs');

  return dedupeInternalLinks(links, 10);
}

/**
 * @param {object} ctx
 */
export function buildNationalTeamInternalLinks(ctx = {}) {
  const { nationalTeam, quizReady = false } = ctx;
  const links = [];
  const add = (label, to) => {
    if (to) links.push({ label, to });
  };

  if (nationalTeam?.id) {
    if (quizReady) {
      add('National team quiz', `/quiz?nationalTeam=${nationalTeam.id}&poolFocus=national`);
    }
    add('World Cup hub', '/world-cup');
  }

  const country = nationalTeam?.country ?? nationalTeam?.displayName;
  const natPath = getNationalityHubPath(country);
  if (natPath) add(`${formatCountryLabel(country)} player hub`, natPath);

  add('All national teams', '/national-teams');
  add('Players by nationality', '/hubs/players/by-nationality');
  add('International quiz', '/quiz?poolFocus=international&worldCup=prep');
  add('Discovery hubs', '/hubs');
  add('Browse players', '/browse');

  return dedupeInternalLinks(links, 8);
}

/**
 * @param {'player' | 'team' | 'league' | 'nationalTeam'} variant
 * @param {object} ctx
 */
export function buildEntityInternalLinks(variant, ctx = {}) {
  switch (variant) {
    case 'player':
      return buildPlayerInternalLinks(ctx);
    case 'league':
      return buildLeagueInternalLinks(ctx);
    case 'nationalTeam':
      return buildNationalTeamInternalLinks(ctx);
  }
  return dedupeInternalLinks([], 8);
}
