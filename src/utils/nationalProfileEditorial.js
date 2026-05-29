/**
 * National team profile synthesis — existing structured data only.
 */

import { FEATURED_NATIONAL_TEAM_IDS } from '../data/worldCupHubData.js';
import { getWorldCup2026RosterIds, getWorldCup2026RosterStatus } from '../data/worldCup2026Rosters.js';
import { getNationalTeamById } from '../data/nationalTeamData.js';
import { formatCountryLabel, formatPosition } from './footballDisplay.js';
import { getNationalityHubPath } from './internalLinking.js';
import {
  LINK_ALL_NATIONAL_TEAMS,
  LINK_INTERNATIONAL_PLAYER_QUIZ,
  LINK_PLAYERS_BY_NATIONALITY,
  linkNationalityPlayers,
} from './entityCopy.js';
import { isQuizEligiblePlayer } from './quizPlayerRules.js';

function truncate(text, max = 220) {
  const t = String(text ?? '').trim();
  if (t.length <= max) return t;
  const slice = t.slice(0, max);
  const last = slice.lastIndexOf(' ');
  return `${(last > max * 0.55 ? slice.slice(0, last) : slice).trimEnd()}…`;
}

/**
 * @param {object} nationalTeam
 * @param {{ linkedCount?: number, quizReadyCount?: number, squad?: object[] }} stats
 */
export function buildSquadIdentityContext(nationalTeam, stats = {}) {
  const { linkedCount = 0, quizReadyCount = 0, squad = [] } = stats;
  const parts = [];

  parts.push(
    `${nationalTeam.displayName} (${formatCountryLabel(nationalTeam.country)}) compete under ${nationalTeam.confederation ?? 'their confederation'} in FootyCompass.`,
  );

  if (nationalTeam.fifaRanking != null) {
    parts.push(`FIFA ranking in the dataset: ${nationalTeam.fifaRanking}.`);
  }

  parts.push(
    `${linkedCount} club players are linked to this national pool${quizReadyCount > 0 ? `; ${quizReadyCount} have quiz clues` : ''}.`,
  );

  const leagueCounts = new Map();
  for (const player of squad) {
    if (!player?.leagueId) continue;
    leagueCounts.set(player.leagueId, (leagueCounts.get(player.leagueId) ?? 0) + 1);
  }
  const topLeagues = [...leagueCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([id]) => id);
  if (topLeagues.length) {
    parts.push(
      `Most linked players currently appear in: ${topLeagues.join(', ').replace(/-/g, ' ')}.`,
    );
  }

  parts.push('This is a learning squad from club football—not an official tournament roster.');

  return parts.join(' ');
}

/**
 * @param {object} nationalTeam
 */
export function buildFootballCultureContext(nationalTeam) {
  const guide = String(nationalTeam?.fanGuide ?? '').trim();
  if (guide) return guide;

  const aliases = Array.isArray(nationalTeam?.searchAliases)
    ? nationalTeam.searchAliases.filter(Boolean)
    : [];
  if (aliases.length) {
    return `Fans and search often use names like ${aliases.slice(0, 3).join(', ')} for ${nationalTeam.displayName}.`;
  }

  return '';
}

/**
 * @param {object} nationalTeam
 */
export function buildRivalryContext(nationalTeam) {
  const ids = nationalTeam?.rivalIds ?? [];
  if (!ids.length) return '';

  const named = ids.map((id) => {
    const rival = getNationalTeamById(id);
    return rival?.displayName ?? id.replace(/-/g, ' ');
  });

  return `${nationalTeam.displayName} share listed rivalries with ${named.slice(0, 4).join(', ')} in the dataset—useful context for derby-style international quizzes and study paths.`;
}

/**
 * @param {object} nationalTeam
 */
export function buildTournamentRelevanceContext(nationalTeam) {
  const parts = [];
  const wcStatus = getWorldCup2026RosterStatus(nationalTeam.id);
  const isFeatured = FEATURED_NATIONAL_TEAM_IDS.includes(nationalTeam.id);

  if (isFeatured) {
    parts.push(
      `${nationalTeam.displayName} are featured on the FootyCompass World Cup 2026 prep page (study draw, collections, and nation quizzes).`,
    );
  }

  if (wcStatus.kind === 'roster') {
    const { rosterPlayerIds } = getWorldCup2026RosterIds(nationalTeam.id);
    parts.push(
      `World Cup 2026 overlay: ${rosterPlayerIds.length} player${rosterPlayerIds.length === 1 ? '' : 's'} tagged in the tournament roster list (dataset snapshot).`,
    );
  } else if (wcStatus.kind === 'projected') {
    const { projectedRosterPlayerIds } = getWorldCup2026RosterIds(nationalTeam.id);
    parts.push(
      `World Cup 2026 overlay: ${projectedRosterPlayerIds.length} projected roster name${projectedRosterPlayerIds.length === 1 ? '' : 's'} in the dataset.`,
    );
  } else if (isFeatured) {
    parts.push('World Cup 2026 squad list: still TBD in the dataset—browse the linked national pool meanwhile.');
  }

  return parts.join(' ');
}

/**
 * @param {object[]} squad
 * @param {number} [limit]
 */
export function buildNationalKeyPlayerCards(squad, limit = 8) {
  const sorted = [...squad].sort(
    (a, b) => (Number(b.importanceScore) || 0) - (Number(a.importanceScore) || 0),
  );
  return sorted.slice(0, limit).map((player) => ({
    player,
    note:
      String(player?.quickFact ?? '').trim().length >= 12
        ? truncate(player.quickFact, 72)
        : formatPosition(player.position),
    quizReady: isQuizEligiblePlayer(player),
  }));
}

/**
 * @param {{
 *   nationalTeam: object,
 *   squad?: object[],
 *   linkedCount?: number,
 *   quizReadyCount?: number,
 * }} ctx
 */
export function buildStructuredNationalProfile(ctx) {
  const { nationalTeam, squad = [], linkedCount = 0, quizReadyCount = 0 } = ctx;
  const history = String(nationalTeam?.shortHistory ?? '').trim();

  return {
    hasAuthoritativeHistory: Boolean(history),
    history,
    squadIdentity: buildSquadIdentityContext(nationalTeam, {
      linkedCount,
      quizReadyCount,
      squad,
    }),
    footballCulture: buildFootballCultureContext(nationalTeam),
    rivalry: buildRivalryContext(nationalTeam),
    tournament: buildTournamentRelevanceContext(nationalTeam),
    keyPlayers: buildNationalKeyPlayerCards(squad),
    isWorldCupFeatured: FEATURED_NATIONAL_TEAM_IDS.includes(nationalTeam.id),
  };
}

/**
 * @param {object} nationalTeam
 * @param {{ quizReady?: boolean, squad?: object[] }} opts
 */
export function buildNationalQuizDiscoveryLinks(nationalTeam, opts = {}) {
  const { quizReady = false, squad = [] } = opts;
  /** @type {{ label: string, to: string, hint?: string }[]} */
  const links = [];

  const add = (label, to, hint) => {
    if (!to) return;
    links.push({ label, to, hint });
  };

  if (quizReady) {
    add(
      `${nationalTeam.displayName} quiz`,
      `/quiz?nationalTeam=${nationalTeam.id}&poolFocus=national&worldCup=prep`,
      'National pool with World Cup prep mode',
    );
  }

  add('World Cup 2026 prep', '/world-cup', 'Featured nations and draw');
  add('World Cup player quiz', '/quiz?theme=world-cup', 'International themed pool');
  add(
    LINK_INTERNATIONAL_PLAYER_QUIZ,
    '/quiz?poolFocus=international&worldCup=prep',
    'Multi-nation pool',
  );

  const natPath = getNationalityHubPath(nationalTeam.country ?? nationalTeam.displayName);
  if (natPath) {
    add(
      linkNationalityPlayers(nationalTeam.country ?? nationalTeam.displayName),
      natPath,
      'Browse by nationality',
    );
  }

  add(LINK_ALL_NATIONAL_TEAMS, '/national-teams');
  add(LINK_PLAYERS_BY_NATIONALITY, '/hubs/players/by-nationality');

  if (nationalTeam.rivalIds?.length) {
    for (const rivalId of nationalTeam.rivalIds.slice(0, 2)) {
      const rival = getNationalTeamById(rivalId);
      if (rival?.id) {
        add(`Rival: ${rival.displayName}`, `/national-team/${rival.id}`);
      }
    }
  }

  const leagueCounts = new Map();
  for (const player of squad) {
    if (!player?.leagueId) continue;
    leagueCounts.set(player.leagueId, (leagueCounts.get(player.leagueId) ?? 0) + 1);
  }
  const topLeague = [...leagueCounts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0];
  if (topLeague) {
    add('Top league in pool', `/league/${topLeague}`, 'Where most linked players play');
    add('League quiz guide', `/hubs/quizzes/league/${topLeague}`);
  }

  add('Daily challenge', '/daily');

  const seen = new Set();
  return links.filter((l) => {
    if (seen.has(l.to)) return false;
    seen.add(l.to);
    return true;
  });
}

/**
 * @param {object} nationalTeam
 * @param {{ linkedCount?: number, quizReady?: number, canQuiz?: boolean, squad?: object[] }} ctx
 */
export function buildRichNationalTeamMetaDescription(nationalTeam, ctx = {}) {
  const profile = buildStructuredNationalProfile({
    nationalTeam,
    squad: ctx.squad ?? [],
    linkedCount: ctx.linkedCount ?? 0,
    quizReadyCount: ctx.quizReady ?? 0,
  });

  const bits = [
    `${nationalTeam.displayName} national team`,
    nationalTeam.confederation ? nationalTeam.confederation : null,
    ctx.linkedCount != null ? `${ctx.linkedCount} linked players` : null,
    ctx.quizReady > 0 ? `${ctx.quizReady} quiz-ready` : null,
    profile.isWorldCupFeatured ? 'World Cup 2026 featured' : null,
  ].filter(Boolean);

  const hook = truncate(
    profile.hasAuthoritativeHistory
      ? profile.history
      : profile.footballCulture || profile.squadIdentity,
    100,
  );

  const quizBit = ctx.canQuiz
    ? 'Play the nation quiz on FootyCompass.'
    : 'Browse squad profiles and international quizzes.';

  return `${bits.join(' · ')}. ${hook} ${quizBit} Not an official federation roster.`;
}
