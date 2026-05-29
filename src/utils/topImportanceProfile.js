/**
 * Top-importance thresholds and re-exports for profile depth (runtime).
 */

import { isQuizEligiblePlayer } from './quizPlayerRules.js';
import { buildRichTeamMetaDescription } from './clubProfileEditorial.js';
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
      `Derbies with ${ctx.team.rivals.slice(0, 2).join(' and ')} — open those club pages or try a rivalry quiz.`,
    );
  }

  if (ctx.team?.name && ctx.team?.identityTags?.length) {
    const blurb = buildClubIdentitySection(ctx.team, ctx.league?.name ?? 'their league', 0);
    if (blurb.length < 140) parts.push(blurb);
  }

  if (links.some((l) => l.to.includes('theme'))) {
    parts.push('League-themed quizzes are a strong follow-up after browsing the squad.');
  } else if (ctx.quizReady && ctx.team?.name) {
    parts.push(`Quiz the ${ctx.team.name} squad while names are still fresh.`);
  }

  return parts.slice(0, 2).join(' ');
}

/**
 * @param {object} player
 * @param {{ team?: object, teamName?: string, leagueName?: string, quizReady?: boolean }} ctx
 */
export function buildPlayerExploreLead(player, ctx = {}) {
  const parts = [];
  if (ctx.team?.rivals?.length) {
    parts.push(
      `${player.name} plays in a side that lists ${ctx.team.rivals.slice(0, 2).join(' and ')} as rivals — worth opening those club pages next.`,
    );
  } else if (ctx.quizReady && ctx.teamName) {
    parts.push(`Lock in ${player.name} by quizzing the ${ctx.teamName} squad, then browse ${ctx.leagueName ?? 'the league'} for similar roles.`);
  } else if (ctx.leagueName) {
    parts.push(`Browse ${ctx.leagueName} for players in the same position and league-themed quizzes.`);
  }
  return parts.slice(0, 2).join(' ');
}

/**
 * @param {object} league
 * @param {{ clubCount?: number, quizReady?: number }} stats
 */
export function buildLeagueExploreLead(league, stats = {}) {
  const parts = [];
  if (league?.rivalries?.length) {
    parts.push(
      `Feuds like ${league.rivalries.slice(0, 2).join(' and ')} are the usual fan entry point — club pages below spell out each side.`,
    );
  }
  if (league?.famousClubs?.length) {
    const names = league.famousClubs.slice(0, 2).map((c) => c.split(' — ')[0]);
    const clubBit =
      stats.clubs > 0 ? `, then browse all ${stats.clubs} clubs when you want depth` : '';
    parts.push(`Start with ${names.join(' and ')}${clubBit}.`);
  } else if (stats.quizReady > 0) {
    parts.push(`${stats.quizReady} players here have quiz clues — league quizzes work well after scanning featured clubs.`);
  }
  return parts.filter(Boolean).slice(0, 2).join(' ');
}

/**
 * @param {object} nationalTeam
 * @param {{ linkedCount?: number, quizReadyCount?: number, tournamentLine?: string }} ctx
 */
export function buildNationalExploreLead(nationalTeam, ctx = {}) {
  if (ctx.tournamentLine) return ctx.tournamentLine;
  const parts = [];
  const rivalIds = nationalTeam?.rivalIds ?? nationalTeam?.rivals ?? [];
  if (rivalIds.length) {
    parts.push(
      `Historic match-ups with ${rivalIds.slice(0, 2).map((r) => String(r).replace(/-/g, ' ')).join(' and ')} — open those national pages when you want rivalry context.`,
    );
  }
  if (ctx.quizReadyCount >= 8) {
    parts.push(
      `${ctx.quizReadyCount} squad members are in quizzes — national quizzes and World Cup prep routes are linked below.`,
    );
  } else if (ctx.linkedCount > 0) {
    parts.push(
      `${ctx.linkedCount} club players are linked to this pool — browse the squad, then try nationality and tournament quizzes.`,
    );
  }
  return parts.slice(0, 2).join(' ');
}

export {
  isTopTierPlayer,
  isTopTierClub,
  isTopTierLeague,
  isTopTierNationalTeam,
} from './topTierPages.js';

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
  return buildRichTeamMetaDescription(team, stats);
}

export { resolveThemePoolCap } from './quizEcosystem.js';
