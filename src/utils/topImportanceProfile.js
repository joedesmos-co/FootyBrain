/**
 * Top-importance thresholds and re-exports for profile depth (runtime).
 */

import { isQuizEligiblePlayer } from './quizPlayerRules.js';
import {
  buildPlayerMetaDescription,
  buildKeepExploringLinks,
  buildClubIdentitySection,
} from './entityEditorialSynthesis.js';

export const TOP_PLAYER_IMPORTANCE = 68;
export const TOP_TEAM_ROSTER_SUM = 1200;

export {
  buildHowTheyPlaySection as buildPlayStyleBlurb,
  buildKeepExploringLinks,
  buildKeepExploringLinks as buildSemanticProfileLinks,
  buildClubIdentitySection,
  buildLeagueIdentitySection,
  buildNationalIdentitySection,
  buildPlayerMetaDescription,
} from './entityEditorialSynthesis.js';

export function isHighImportancePlayer(player) {
  return (Number(player?.importanceScore) || 0) >= TOP_PLAYER_IMPORTANCE;
}

export function isHighTrafficTeam(team, roster = []) {
  const sum = roster.reduce((s, p) => s + (Number(p.importanceScore) || 0), 0);
  return sum >= TOP_TEAM_ROSTER_SUM;
}

export function buildAchievementsSummary(player) {
  const raw = player?.honors ?? player?.honours ?? player?.trophies;
  if (!raw) return [];
  if (Array.isArray(raw)) return raw.map((v) => String(v).trim()).filter(Boolean).slice(0, 10);
  return String(raw)
    .split(/[·•,;|/]/g)
    .map((t) => t.trim())
    .filter(Boolean)
    .slice(0, 10);
}

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
 */
export function buildStructuredExploreLead(ctx = {}) {
  const links = buildKeepExploringLinks({
    ...ctx,
    leagueName: ctx.league?.name,
    leagueTeams: ctx.leagueTeams,
  });
  const parts = [];

  if (ctx.team?.rivals?.length) {
    parts.push(
      `Rivalries in the dataset: ${ctx.team.rivals.slice(0, 2).join(' and ')} — open rival club pages or try a rivalry quiz.`,
    );
  }

  if (ctx.team?.name && ctx.team?.identityTags?.length) {
    const blurb = buildClubIdentitySection(ctx.team, ctx.league?.name ?? 'their league', 0);
    if (blurb.length < 140) parts.push(blurb);
  }

  if (links.some((l) => l.to.includes('theme'))) {
    parts.push('League-themed player quizzes help spaced repetition after browsing the squad.');
  } else if (ctx.quizReady && ctx.team?.name) {
    parts.push(`Quiz yourself on the ${ctx.team.name} squad when names are fresh.`);
  }

  return parts.slice(0, 2).join(' ');
}

export function buildTopPlayerMetaDescription(player, ctx = {}) {
  return buildPlayerMetaDescription(player, {
    ...ctx,
    quizReady: ctx.quizReady ?? isQuizEligiblePlayer(player),
  });
}

export function buildTopLeagueMetaDescription(league, stats) {
  const name = league.name ?? 'League';
  const country = league.country ? ` (${league.country})` : '';
  const rivalBit =
    league.rivalries?.length > 0
      ? ` Rivalries: ${league.rivalries.slice(0, 2).join(', ')}.`
      : '';
  return `${name}${country}: ${stats.clubs} clubs, ${stats.players} players, ${stats.quizReady} with quiz clues.${rivalBit} Learn squads and play football quizzes on FootyCompass.`;
}

export function buildTopTeamMetaDescription(team, stats) {
  const bits = [
    `${team.name}${stats.leagueName ? ` (${stats.leagueName})` : ''}`,
    `${stats.rosterSize} players listed`,
  ];
  if (team.stadium) bits.push(`home: ${team.stadium}`);
  if (team.rivals?.length) bits.push(`rivals: ${team.rivals.slice(0, 2).join(', ')}`);
  if (stats.quizReady > 0) bits.push(`${stats.quizReady} quiz-ready`);
  return `${bits.join(' · ')}. Club profile, squad, and quizzes on FootyCompass.`;
}

export { resolveThemePoolCap } from './quizEcosystem.js';
