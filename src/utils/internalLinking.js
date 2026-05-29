/**
 * Semantic internal links between players, clubs, leagues, national teams, quizzes, and hubs.
 * Keeps crawl paths shallow without duplicating hero CTAs (cap + dedupe).
 */

import { getClubQuizPlayHref } from '../data/clubQuizCategories.js';
import { getLiveNationalTeams, getNationalTeamById } from '../data/nationalTeamData.js';
import { getQuizThemePlayHref, getQuizThemeIdForLeague } from '../data/quizThemes.js';
import {
  LINK_ALL_NATIONAL_TEAMS,
  LINK_CLUB_PLAYER_QUIZ,
  LINK_CLUB_QUIZ_GUIDE,
  LINK_CLUB_QUIZ_GUIDES,
  LINK_DAILY_CHALLENGE,
  LINK_EXPLORE_FOOTBALL,
  LINK_LEAGUE_PLAYER_QUIZ,
  LINK_LEAGUE_QUIZ_GUIDE,
  LINK_NATIONAL_TEAM,
  LINK_NATIONAL_TEAM_QUIZ,
  LINK_PLAYERS_BY_NATIONALITY,
  LINK_RIVALRY_QUIZ,
  LINK_STADIUM_QUIZ,
  LINK_THEMED_LEAGUE_QUIZ,
  LINK_INTERNATIONAL_PLAYER_QUIZ,
  LINK_WORLD_CUP_PREP,
  linkClubSquad,
  linkCountryNationalTeam,
  linkLeaguePage,
  linkNationalityPlayers,
} from './entityCopy.js';
import { buildCollectionDiscoveryLinks } from './collectionDiscovery.js';
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

  if (teamId) add(linkClubSquad(teamName), `/team/${teamId}`);
  if (leagueId) add(linkLeaguePage(leagueName), `/league/${leagueId}`);
  if (nationalTeamId) add(LINK_NATIONAL_TEAM, `/national-team/${nationalTeamId}`);

  const natPath = getNationalityHubPath(nationality);
  if (natPath) add(linkNationalityPlayers(nationality), natPath);

  if (teamId) add(LINK_CLUB_QUIZ_GUIDE, `/hubs/quizzes/team/${teamId}`);
  if (quizReady && teamId) add(LINK_CLUB_PLAYER_QUIZ, `/quiz?team=${teamId}`);
  if (leagueId) add(LINK_LEAGUE_QUIZ_GUIDE, `/hubs/quizzes/league/${leagueId}`);
  if (leagueId && quizReady) add(LINK_LEAGUE_PLAYER_QUIZ, `/quiz?league=${leagueId}`);

  if (player?.id) {
    for (const link of buildCollectionDiscoveryLinks('player', player.id, 2)) {
      add(`Collection: ${link.label}`, link.to);
    }
  }
  if (teamId) {
    for (const link of buildCollectionDiscoveryLinks('team', teamId, 1)) {
      add(`Collection: ${link.label}`, link.to);
    }
  }
  if (nationalTeamId) {
    for (const link of buildCollectionDiscoveryLinks('national-team', nationalTeamId, 1)) {
      add(`Collection: ${link.label}`, link.to);
    }
  }

  add(LINK_EXPLORE_FOOTBALL, '/hubs');
  add(LINK_DAILY_CHALLENGE, '/daily');

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

  if (lid) add(LINK_LEAGUE_QUIZ_GUIDE, `/hubs/quizzes/league/${lid}`);
  if (quizReady && lid) add(LINK_LEAGUE_PLAYER_QUIZ, `/quiz?league=${lid}`);
  if (lid) add(LINK_STADIUM_QUIZ, getClubQuizPlayHref('stadium', { leagueId: lid }));
  if (lid) add(LINK_RIVALRY_QUIZ, getClubQuizPlayHref('rivalry', { leagueId: lid }));
  add(LINK_CLUB_QUIZ_GUIDES, '/hubs/quizzes/clubs');

  if (league?.country) {
    const natPath = getNationalityHubPath(league.country);
    if (natPath) add(linkNationalityPlayers(league.country), natPath);
    const ntId = findNationalTeamIdForCountry(league.country);
    if (ntId) add(linkCountryNationalTeam(league.country), `/national-team/${ntId}`);
  }

  const themeId = lid ? getQuizThemeIdForLeague(lid) : '';
  if (themeId) add(LINK_THEMED_LEAGUE_QUIZ, getQuizThemePlayHref(themeId));

  links.push(...resolveLeagueRivalryLinks(league?.rivalries, leagueTeams, 3));
  links.push(...resolveFamousPlayerLinks(league?.famousPlayers, leaguePlayers, 3));

  add(LINK_PLAYERS_BY_NATIONALITY, '/hubs/players/by-nationality');
  add(LINK_EXPLORE_FOOTBALL, '/hubs');

  return dedupeInternalLinks(links, 10);
}

/**
 * @param {object} ctx
 */
export function buildNationalTeamInternalLinks(ctx = {}) {
  const { nationalTeam, quizReady = false, squad = [] } = ctx;
  const links = [];
  const add = (label, to) => {
    if (to) links.push({ label, to });
  };

  if (nationalTeam?.id) {
    if (quizReady) {
      add(
        LINK_NATIONAL_TEAM_QUIZ,
        `/quiz?nationalTeam=${nationalTeam.id}&poolFocus=national&worldCup=prep`,
      );
    }
    add(LINK_WORLD_CUP_PREP, '/world-cup');
    add('World Cup quiz pool', '/quiz?theme=world-cup');
  }

  const country = nationalTeam?.country ?? nationalTeam?.displayName;
  const natPath = getNationalityHubPath(country);
  if (natPath) add(linkNationalityPlayers(country), natPath);

  if (nationalTeam?.rivalIds?.length) {
    for (const rivalId of nationalTeam.rivalIds.slice(0, 2)) {
      const rival = getNationalTeamById(rivalId);
      const label = rival?.displayName
        ? `Rival: ${rival.displayName}`
        : `Rival nation (${rivalId.replace(/-/g, ' ')})`;
      add(label, `/national-team/${rivalId}`);
    }
  }

  const leagueCounts = new Map();
  for (const player of squad ?? []) {
    if (!player?.leagueId) continue;
    leagueCounts.set(player.leagueId, (leagueCounts.get(player.leagueId) ?? 0) + 1);
  }
  const topLeague = [...leagueCounts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0];
  if (topLeague) {
    add('Top league', `/league/${topLeague}`);
    add(LINK_LEAGUE_QUIZ_GUIDE, `/hubs/quizzes/league/${topLeague}`);
  }

  add(LINK_ALL_NATIONAL_TEAMS, '/national-teams');
  add(LINK_PLAYERS_BY_NATIONALITY, '/hubs/players/by-nationality');
  add(LINK_INTERNATIONAL_PLAYER_QUIZ, '/quiz?poolFocus=international&worldCup=prep');

  if (nationalTeam?.id) {
    for (const link of buildCollectionDiscoveryLinks('national-team', nationalTeam.id, 2)) {
      add(`Collection: ${link.label}`, link.to);
    }
  }

  add(LINK_EXPLORE_FOOTBALL, '/hubs');
  add('Browse players', '/browse');

  return dedupeInternalLinks(links, 10);
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
