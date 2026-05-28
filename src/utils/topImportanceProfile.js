/**
 * Runtime profile depth from existing structured fields only (no invented facts).
 */

import { getQuizThemeIdForLeague, getQuizThemePlayHref } from '../data/quizThemes';
import { formatClubIdentityTags } from './clubIdentity';
import { formatPosition } from './footballDisplay';
import { isQuizEligiblePlayer } from './quizPlayerRules';

const TOP_PLAYER_IMPORTANCE = 68;
const TOP_TEAM_ROSTER_SUM = 1200;

function normalizeList(raw, max = 8) {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw.map((v) => String(v).trim()).filter(Boolean).slice(0, max);
  return String(raw)
    .split(/[·•,;|/]/g)
    .map((t) => t.trim())
    .filter(Boolean)
    .slice(0, max);
}

export function isHighImportancePlayer(player) {
  return (Number(player?.importanceScore) || 0) >= TOP_PLAYER_IMPORTANCE;
}

export function isHighTrafficTeam(team, roster = []) {
  const sum = roster.reduce((s, p) => s + (Number(p.importanceScore) || 0), 0);
  return sum >= TOP_TEAM_ROSTER_SUM;
}

/**
 * One-line play-style blurb from tags/summary already on the player row.
 * @param {object} player
 */
export function buildPlayStyleBlurb(player) {
  const summary = String(player?.playStyleSummary ?? player?.styleSummary ?? '').trim();
  if (summary) return summary;

  const tags = normalizeList(player?.playingStyle, 6);
  if (tags.length >= 2) {
    return `Profile tags in the dataset: ${tags.join(', ')}.`;
  }
  if (tags.length === 1) return `Listed playing style: ${tags[0]}.`;

  return '';
}

/**
 * @param {object} player
 * @returns {string[]}
 */
export function buildAchievementsSummary(player) {
  const honors = normalizeList(player?.honors ?? player?.honours ?? player?.trophies, 10);
  return honors;
}

/**
 * @param {object} player
 * @param {object[]} rosterSameTeam
 * @param {number} [limit]
 */
export function pickRelatedPlayersByImportance(player, rosterSameTeam, limit = 6) {
  const position = String(player?.position ?? '').toLowerCase();
  const samePos = rosterSameTeam.filter(
    (p) => p.id !== player.id && String(p.position ?? '').toLowerCase() === position,
  );
  const pool = samePos.length >= 2 ? samePos : rosterSameTeam.filter((p) => p.id !== player.id);
  return [...pool]
    .sort((a, b) => (b.importanceScore ?? 0) - (a.importanceScore ?? 0))
    .slice(0, limit);
}

/**
 * @param {{ team?: object, league?: object, leagueId?: string, quizReady?: boolean }} ctx
 * @returns {string}
 */
export function buildStructuredExploreLead(ctx = {}) {
  const { team, league, leagueId, quizReady } = ctx;
  const parts = [];

  if (team?.name && team?.rivals?.length) {
    parts.push(
      `Rivalries in the dataset include ${team.rivals.slice(0, 2).join(' and ')} — browse those clubs, then test yourself with derby-themed quizzes.`,
    );
  }

  if (team?.identityTags?.length) {
    const labels = formatClubIdentityTags(team.identityTags)
      .map((x) => x.label)
      .slice(0, 2);
    if (labels.length) {
      parts.push(`${team.name} is tagged as ${labels.join(' and ').toLowerCase()} in FootyCompass.`);
    }
  }

  const leagueName = league?.name ?? '';
  const lid = leagueId ?? team?.leagueId ?? league?.id ?? '';
  const themeId = lid ? getQuizThemeIdForLeague(lid) : '';
  if (themeId && leagueName) {
    parts.push(`Reinforce ${leagueName} names with the ${leagueName} player quiz hub.`);
  } else if (quizReady && team?.name) {
    parts.push(`Run a ${team.name} squad quiz after scanning positions here.`);
  }

  if (team?.stadium) {
    parts.push(`Stadium quiz routes cover ${team.stadium} when you want club trivia beyond player names.`);
  }

  return parts.slice(0, 2).join(' ');
}

/**
 * @param {{ team?: object, leagueId?: string, nationalTeamId?: string }} ctx
 * @returns {{ label: string, to: string }[]}
 */
export function buildSemanticProfileLinks(ctx = {}) {
  const links = [];
  const { team, leagueId, nationalTeamId } = ctx;

  if (team?.id) {
    links.push({ label: `${team.name} squad`, to: `/team/${team.id}` });
  }
  if (leagueId) {
    links.push({ label: 'League hub', to: `/league/${leagueId}` });
    const themeId = getQuizThemeIdForLeague(leagueId);
    if (themeId) {
      links.push({ label: 'Themed league quiz', to: getQuizThemePlayHref(themeId) });
    }
    links.push({
      label: 'Stadium quiz',
      to: `/club-quiz?category=stadium&league=${leagueId}`,
    });
  }
  if (nationalTeamId) {
    links.push({ label: 'National team', to: `/national-team/${nationalTeamId}` });
    links.push({ label: 'World Cup hub', to: '/world-cup' });
  }

  return links;
}

/**
 * CTR-focused meta line — only composes from fields already on the entity.
 * @param {object} player
 * @param {{ teamName?: string, leagueName?: string, quizReady?: boolean }} ctx
 */
export function buildTopPlayerMetaDescription(player, ctx = {}) {
  const position = formatPosition(player.position);
  const teamName = ctx.teamName ?? 'club';
  const leagueName = ctx.leagueName ?? 'league';
  const country = String(player.nationalTeam || player.nationality || '').trim();
  const quizBit = ctx.quizReady || isQuizEligiblePlayer(player)
    ? 'Quiz clues included.'
    : 'Squad study profile.';
  const honors = buildAchievementsSummary(player);
  const honorBit =
    honors.length > 0 ? `Honours listed: ${honors.slice(0, 2).join(', ')}.` : '';
  const natBit = country ? `${country} international · ` : '';
  return `${player.name} (${position}, ${teamName}, ${leagueName}). ${natBit}${quizBit} ${honorBit}`.replace(
    /\s+/g,
    ' ',
  ).trim();
}

/**
 * @param {object} league
 * @param {{ clubs: number, players: number, quizReady: number }} stats
 */
export function buildTopLeagueMetaDescription(league, stats) {
  const name = league.name ?? 'League';
  const country = league.country ? ` (${league.country})` : '';
  const rivalBit =
    league.rivalries?.length > 0
      ? ` Rivalries: ${league.rivalries.slice(0, 2).join(', ')}.`
      : '';
  return `${name}${country}: ${stats.clubs} clubs, ${stats.players} players, ${stats.quizReady} with quiz clues.${rivalBit} Learn squads and play football quizzes on FootyCompass.`;
}

/**
 * @param {object} team
 * @param {{ rosterSize: number, quizReady: number, leagueName?: string }} stats
 */
export function buildTopTeamMetaDescription(team, stats) {
  const bits = [
    `${team.name}${stats.leagueName ? ` (${stats.leagueName})` : ''}`,
    `${stats.rosterSize} players listed`,
  ];
  if (team.stadium) bits.push(`home: ${team.stadium}`);
  if (team.rivals?.length) bits.push(`rivals include ${team.rivals.slice(0, 2).join(', ')}`);
  if (stats.quizReady > 0) bits.push(`${stats.quizReady} quiz-ready profiles`);
  return `${bits.join(' · ')}. Club identity, squad, and quizzes on FootyCompass.`;
}
