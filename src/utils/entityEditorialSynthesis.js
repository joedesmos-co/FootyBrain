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
import { resolveRivalEntries } from './teamPageUtils';
import {
  hasSubstantiveQuickFact,
  parsePlayStyleTags,
  parseStrengths,
} from './entityDepthAudit';
import { buildSquadIdentityContext } from './nationalProfileEditorial.js';

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

  const tags = parsePlayStyleTags(player);
  if (tags.length >= 2) {
    return `Dataset playing-style tags: ${tags.join(', ')}.`;
  }
  if (tags.length === 1) return `Listed as a ${tags[0]} profile.`;

  const strengths = parseStrengths(player);
  if (strengths.length >= 2) {
    return `Strengths noted in the dataset: ${strengths.slice(0, 4).join(', ')}.`;
  }

  const position = formatPosition(player?.position);
  if (position && position !== '—') {
    return `${player.name} is listed as a ${position.toLowerCase()} — use club and league context on this page for recognition practice.`;
  }

  return '';
}

/**
 * @param {object} team
 * @param {string} leagueName
 * @param {number} [rosterSize]
 */
export function buildClubIdentitySection(team, leagueName, rosterSize = 0) {
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
      `Identity tags: ${identity
        .slice(0, 3)
        .map((t) => t.label.toLowerCase())
        .join(', ')}.`,
    );
  }

  if (team?.rivals?.length) {
    parts.push(`Listed rivals: ${team.rivals.slice(0, 3).join(', ')}.`);
  }

  if (rosterSize > 0) {
    parts.push(`${rosterSize} squad players are listed for browse and quiz practice.`);
  }

  return parts.join(' ');
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
  return parts.join(' ');
}

/**
 * @param {object} nationalTeam
 */
export function buildNationalIdentitySection(nationalTeam, stats = {}) {
  const history = String(nationalTeam?.shortHistory ?? '').trim();
  if (history) return history;

  const synthesized = buildSquadIdentityContext(nationalTeam, {
    linkedCount: stats.linkedCount ?? 0,
    quizReadyCount: stats.quizReadyCount ?? 0,
    squad: stats.squad ?? [],
  });
  if (synthesized.length >= 80) return synthesized;

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
 * }} ctx
 * @returns {{ label: string, to: string }[]}
 */
export function buildKeepExploringLinks(ctx = {}) {
  const links = [];
  const seen = new Set();

  const add = (label, to) => {
    const key = to;
    if (!to || seen.has(key)) return;
    seen.add(key);
    links.push({ label, to });
  };

  const { team, league, leagueId, leagueTeams, nationalTeamId, quizReady, nationality } = ctx;
  const lid = leagueId ?? team?.leagueId ?? league?.id ?? '';

  if (team?.id) add(`${team.name} squad`, `/team/${team.id}`);
  if (team?.id) add('Club quiz guide', `/hubs/quizzes/team/${team.id}`);
  if (lid) add(ctx.leagueName ? `${ctx.leagueName} league` : 'League page', `/league/${lid}`);
  if (lid) add('League quiz guide', `/hubs/quizzes/league/${lid}`);

  if (team?.rivals?.length && leagueTeams?.length) {
    for (const { label, team: rival } of resolveRivalEntries(team.rivals, leagueTeams).slice(0, 2)) {
      if (rival?.id) add(`Rival: ${label}`, `/team/${rival.id}`);
    }
  }

  if (nationalTeamId) {
    add('National team', `/national-team/${nationalTeamId}`);
    add('World Cup 2026', '/world-cup');
  }

  const natLabel = nationality ?? team?.country ?? league?.country;
  const natPath = getNationalityHubPath(natLabel);
  if (natPath) add(`${natLabel} players`, natPath);

  if (league?.country && !nationalTeamId) {
    const ntId = findNationalTeamIdForCountry(league.country);
    if (ntId) add(`${league.country} national team`, `/national-team/${ntId}`);
  }

  const themeId = lid ? getQuizThemeIdForLeague(lid) : '';
  if (themeId) add('Themed league quiz', getQuizThemePlayHref(themeId));
  if (quizReady && team?.id) add('Team player quiz', `/quiz?team=${team.id}`);
  if (lid) add('League player quiz', `/quiz?league=${lid}`);
  if (lid) add('Stadium quiz', `/club-quiz?category=stadium&league=${lid}`);
  if (team?.rivals?.length && lid) {
    add('Rivalry quiz', `/club-quiz?category=rivalry&league=${lid}`);
  }

  add('Daily challenge', '/daily');
  add('Explore football', '/hubs');

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
