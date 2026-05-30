/**
 * Structured editorial synthesis from existing dataset fields only.
 */

import { formatClubIdentityTags } from './clubIdentity';
import { formatCountryLabel, formatPosition } from './footballDisplay';
import { getQuizThemeIdForLeague, getQuizThemePlayHref } from '../data/quizThemes';
import {
  findNationalTeamIdForCountry,
  getNationalityHubPath,
} from './internalLinking.js';
import { buildCollectionDiscoveryLinks } from './collectionDiscovery.js';
import { resolveRivalEntries } from './teamPageUtils';
import {
  hasSubstantiveQuickFact,
  parsePlayStyleTags,
  parseStrengths,
} from './entityDepthAudit';
import { truncateLearnerCopy, buildNationalSquadLead } from './learnerProfileCopy.js';
import { buildSquadIdentityContext } from './nationalProfileEditorial.js';
import {
  LINK_CLUB_PLAYER_QUIZ,
  LINK_CLUB_QUIZ_GUIDE,
  LINK_DAILY_CHALLENGE,
  LINK_EXPLORE_FOOTBALL,
  LINK_LEAGUE_PLAYER_QUIZ,
  LINK_LEAGUE_QUIZ_GUIDE,
  LINK_NATIONAL_TEAM,
  LINK_RIVALRY_QUIZ,
  LINK_STADIUM_QUIZ,
  linkClubSquad,
  linkLeaguePage,
} from './entityCopy.js';

function normalizeList(raw, max = 8) {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw.map((v) => String(v).trim()).filter(Boolean).slice(0, max);
  return String(raw)
    .split(/[·•,;|/]/g)
    .map((t) => t.trim())
    .filter(Boolean)
    .slice(0, max);
}

/**
 * @param {object} player
 */
export function buildHowTheyPlaySection(player) {
  const summary = String(player?.playStyleSummary ?? player?.styleSummary ?? '').trim();
  if (summary) return summary;

  const role = String(player?.roleSummary ?? '').trim();
  if (role) {
    const tags = parsePlayStyleTags(player);
    if (tags.length >= 1) {
      return `${role} Key traits: ${tags.slice(0, 3).join(', ')}.`;
    }
    return role;
  }

  const tags = parsePlayStyleTags(player);
  if (tags.length >= 2) {
    return `${tags.join(', ')}.`;
  }
  if (tags.length === 1) return `Plays with a ${tags[0].toLowerCase()} profile.`;

  const strengths = parseStrengths(player);
  if (strengths.length >= 2) {
    return `Standout qualities: ${strengths.slice(0, 4).join(', ')}.`;
  }

  const position = formatPosition(player?.position);
  if (position && position !== '—') {
    return truncateLearnerCopy(
      `${player.name} plays as a ${position.toLowerCase()} — use club and league links above for context.`,
      120,
    );
  }

  return '';
}

/**
 * @param {object} team
 * @param {string} leagueName
 * @param {number} [rosterSize]
 */
export function buildClubIdentitySection(team, leagueName) {
  const history = String(team?.shortHistory ?? '').trim();
  if (history) return history;

  const parts = [];
  const country = formatCountryLabel(team?.country);
  parts.push(
    `${team.name} compete in ${leagueName}${country && country !== '—' ? ` (${country})` : ''}.`,
  );

  if (team?.founded) parts.push(`Founded ${team.founded}.`);
  if (team?.stadium) parts.push(`Home ground: ${team.stadium}.`);

  const identity = formatClubIdentityTags(team?.identityTags ?? []);
  if (identity.length) {
    parts.push(
      `Club character: ${identity
        .slice(0, 3)
        .map((t) => t.label.toLowerCase())
        .join(', ')}.`,
    );
  }

  if (team?.rivals?.length) {
    parts.push(`Rivalries with ${team.rivals.slice(0, 3).join(', ')}.`);
  }

  return truncateLearnerCopy(parts.join(' '), 240);
}

/**
 * @param {object} league
 */
export function buildLeagueIdentitySection(league) {
  const desc = String(league?.description ?? '').trim();
  if (desc) return desc;

  const parts = [`${league.name} on FootyCompass.`];
  const style = String(league?.styleOfPlay ?? '').trim();
  if (style) parts.push(style);
  if (league?.famousClubs?.length) {
    parts.push(`Featured clubs include ${league.famousClubs.slice(0, 3).map((c) => c.split(' — ')[0]).join(', ')}.`);
  }
  if (league?.rivalries?.length) {
    parts.push(`Rivalries: ${league.rivalries.slice(0, 2).join('; ')}.`);
  }
  return truncateLearnerCopy(parts.join(' '), 320);
}

/**
 * @param {object} nationalTeam
 */
export function buildNationalIdentitySection(nationalTeam, stats = {}) {
  const history = String(nationalTeam?.shortHistory ?? '').trim();
  if (history) return history;

  const synthesized = buildNationalSquadLead(nationalTeam, {
    linkedCount: stats.linkedCount ?? 0,
    quizReadyCount: stats.quizReadyCount ?? 0,
    squad: stats.squad ?? [],
  });
  if (synthesized) return synthesized;

  const full = buildSquadIdentityContext(nationalTeam, stats);
  if (full.length >= 40) return truncateLearnerCopy(full, 220);

  const guide = String(nationalTeam?.fanGuide ?? '').trim();
  if (guide) return guide.length > 320 ? `${guide.slice(0, 317).trimEnd()}…` : guide;

  const country = formatCountryLabel(nationalTeam?.country ?? nationalTeam?.displayName);
  return `${nationalTeam.displayName} (${country}) — browse linked club players and national quizzes on FootyCompass.`;
}

/**
 * @param {{
 *   team?: object,
 *   league?: object,
 *   leagueId?: string,
 *   leagueName?: string,
 *   leagueTeams?: object[],
 *   nationalTeamId?: string,
 *   quizReady?: boolean,
 *   playerId?: string,
 *   teamId?: string,
 * }} ctx
 * @returns {{ label: string, to: string, hint?: string }[]}
 */
export function buildKeepExploringLinks(ctx = {}) {
  const links = [];
  const seen = new Set();

  const add = (label, to, hint = '') => {
    const key = to;
    if (!to || seen.has(key)) return;
    seen.add(key);
    links.push({ label, to, ...(hint ? { hint } : {}) });
  };

  const { team, league, leagueId, leagueTeams, nationalTeamId, quizReady, nationality, playerId, teamId } =
    ctx;
  const lid = leagueId ?? team?.leagueId ?? league?.id ?? '';

  if (playerId) {
    for (const link of buildCollectionDiscoveryLinks('player', playerId, 2)) {
      add(`Collection: ${link.label}`, link.to, link.hint);
    }
  }

  const featuredTeamId = team?.id ?? teamId;
  if (featuredTeamId) {
    for (const link of buildCollectionDiscoveryLinks('team', featuredTeamId, 2)) {
      add(`Collection: ${link.label}`, link.to, link.hint);
    }
  }

  if (lid) {
    for (const link of buildCollectionDiscoveryLinks('league', lid, 1)) {
      add(`Collection: ${link.label}`, link.to, link.hint);
    }
  }

  if (nationalTeamId) {
    for (const link of buildCollectionDiscoveryLinks('national-team', nationalTeamId, 2)) {
      add(`Collection: ${link.label}`, link.to, link.hint);
    }
  }

  if (team?.id) add(linkClubSquad(team.name), `/team/${team.id}`, 'Full roster and fan context');
  if (team?.id) add(LINK_CLUB_QUIZ_GUIDE, `/hubs/quizzes/team/${team.id}`, 'How to quiz this club');
  if (lid) {
    add(linkLeaguePage(ctx.leagueName), `/league/${lid}`, 'Clubs, rivalries, and league quizzes');
    add(LINK_LEAGUE_QUIZ_GUIDE, `/hubs/quizzes/league/${lid}`, 'Study paths for this competition');
  }

  if (team?.rivals?.length && leagueTeams?.length) {
    for (const { label, team: rival } of resolveRivalEntries(team.rivals, leagueTeams).slice(0, 2)) {
      if (rival?.id) add(`Rival: ${label}`, `/team/${rival.id}`);
    }
  }

  if (nationalTeamId) {
    add(LINK_NATIONAL_TEAM, `/national-team/${nationalTeamId}`, 'Squad pool and international quizzes');
    add('World Cup 2026', '/world-cup', 'Tournament prep hub');
  }

  const natLabel = nationality ?? team?.country ?? league?.country;
  const natPath = getNationalityHubPath(natLabel);
  if (natPath) add(`${natLabel} players`, natPath);

  if (league?.country && !nationalTeamId) {
    const ntId = findNationalTeamIdForCountry(league.country);
    if (ntId) add(`${league.country} national team`, `/national-team/${ntId}`);
  }

  const themeId = lid ? getQuizThemeIdForLeague(lid) : '';
  if (themeId) add('Themed league quiz', getQuizThemePlayHref(themeId), 'Curated question mix');
  if (quizReady && team?.id) add(LINK_CLUB_PLAYER_QUIZ, `/quiz?team=${team.id}`, 'Name recall from this squad');
  if (lid) add(LINK_LEAGUE_PLAYER_QUIZ, `/quiz?league=${lid}`, 'All clubs in the competition');
  if (lid) add(LINK_STADIUM_QUIZ, `/club-quiz?category=stadium&league=${lid}`, 'Grounds and home clubs');
  if (team?.rivals?.length && lid) {
    add(LINK_RIVALRY_QUIZ, `/club-quiz?category=rivalry&league=${lid}`, 'Derbies and feuds');
  }

  add(LINK_DAILY_CHALLENGE, '/daily', 'One quick round');
  add(LINK_EXPLORE_FOOTBALL, '/hubs', 'Leagues, quizzes, and guides');

  return links.slice(0, 10);
}

/**
 * @param {object} player
 * @param {{ teamName?: string, leagueName?: string, quizReady?: boolean }} ctx
 */
export function buildPlayerMetaDescription(player, ctx = {}) {
  const position = formatPosition(player.position);
  const teamName = ctx.teamName ?? 'club';
  const leagueName = ctx.leagueName ?? 'league';
  const country = String(player.nationalTeam || player.nationality || '').trim();
  const honors = normalizeList(player?.honors ?? player?.honours ?? player?.trophies, 3);
  const quizBit = ctx.quizReady
    ? 'Quiz clues on FootyCompass.'
    : 'Squad study profile.';
  const factBit = hasSubstantiveQuickFact(player)
    ? String(player.quickFact).slice(0, 90).trimEnd() + (player.quickFact.length > 90 ? '…' : '')
    : '';
  const honorBit = honors.length ? `Honours: ${honors.slice(0, 2).join(', ')}.` : '';
  const natBit = country ? `${country} · ` : '';
  const core = `${player.name} (${position}, ${teamName}, ${leagueName}). ${natBit}${quizBit}`;
  const extra = [factBit, honorBit].filter(Boolean).join(' ');
  const combined = `${core} ${extra}`.replace(/\s+/g, ' ').trim();
  return combined.length > 165 ? `${combined.slice(0, 162).trimEnd()}…` : combined;
}
