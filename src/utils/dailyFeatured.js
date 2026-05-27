import { getTodayKey } from '../hooks/useDailyChallenge';
import {
  getLiveNationalTeams,
  getMembershipForPlayer,
  getNationalTeamQuizReadyCount,
} from '../data/nationalTeamData';
import { isQuizEligiblePlayer } from './quizEligibility';

const INTERNATIONAL_PICKS_CYCLE = 3;
const MIN_LINKED_QUIZ_PER_NATION = 3;

function teamHasQuizReadyPlayer(teamId, allPlayers) {
  return allPlayers.some(
    (player) => player.teamId === teamId && isQuizEligiblePlayer(player),
  );
}

function dateToSeed(dateKey, salt = 0) {
  const base = dateKey.split('-').reduce((acc, part) => acc * 1000 + parseInt(part, 10), 0);
  return (base + salt) >>> 0;
}

function makeRng(seed) {
  let s = seed >>> 0;
  return function rng() {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function seededSample(arr, count, dateKey, salt) {
  if (count >= arr.length) return [...arr];
  const rng = makeRng(dateToSeed(dateKey, salt));
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy.slice(0, count);
}

/**
 * Players suitable for Today's Picks — editorial quiz profiles or approved drafts only.
 * Excludes browse-only squad listings (no quiz hints / pending editorial).
 */
export function getFeaturedPickPlayers(allPlayers) {
  const byId = new Map();
  for (const player of allPlayers) {
    if (isQuizEligiblePlayer(player)) {
      byId.set(player.id, player);
      continue;
    }
    if (player.dataStatus === 'generated-editorial-approved') {
      byId.set(player.id, player);
    }
  }
  return [...byId.values()];
}

/** Quiz-ready players with a live national-team membership (World Cup prep pool). */
export function getInternationalFeaturedPickPlayers(allPlayers) {
  // allPlayers should already be quiz-ready/editorial-ready (see getFeaturedPickPlayers).
  // We include only players with a live national-team membership AND a nation that is quiz-viable.
  return allPlayers.filter((player) => {
    const membership = getMembershipForPlayer(player.id);
    if (!membership) return false;
    return getNationalTeamQuizReadyCount(membership.nationalTeamId) >= MIN_LINKED_QUIZ_PER_NATION;
  });
}

function getEligibleNationalTeamsForPicks() {
  return getLiveNationalTeams().filter(
    (nationalTeam) =>
      getNationalTeamQuizReadyCount(nationalTeam.id) >= MIN_LINKED_QUIZ_PER_NATION,
  );
}

function pickTopNationalTeamsForPicks(limit = 12) {
  const eligible = getEligibleNationalTeamsForPicks();
  return eligible
    .map((team) => ({
      team,
      quizReady: getNationalTeamQuizReadyCount(team.id),
    }))
    .sort((a, b) => b.quizReady - a.quizReady)
    .slice(0, Math.max(2, limit))
    .map(({ team }) => team);
}

/**
 * ~1 in 3 calendar days surfaces international Today's Picks (2026 prep).
 */
export function isInternationalPicksDay(dateKey = getTodayKey()) {
  const dayNumber = parseInt(dateKey.replace(/-/g, ''), 10);
  return dayNumber % INTERNATIONAL_PICKS_CYCLE === 0;
}

/**
 * Deterministic featured players and clubs (or national teams) for a calendar day.
 * @returns {{
 *   mode: 'club' | 'international',
 *   players: import('../data/sampleData').players,
 *   teams: import('../data/sampleData').teams,
 *   nationalTeams: import('../data/nationalTeamData').nationalTeams,
 * }}
 */
export function getDailyFeatured(allPlayers, allTeams, allLeagues = [], dateKey = getTodayKey()) {
  const editorialTeams = allTeams.filter((team) =>
    teamHasQuizReadyPlayer(team.id, allPlayers),
  );

  // Keep World Cup prep as an occasional flavor, but make most days feel broad.
  const rng = makeRng(dateToSeed(dateKey, 7));
  const shouldUseInternational = rng() < 0.22; // ~1-2 days per week

  const eligibleNations = getEligibleNationalTeamsForPicks();
  const nationsForCards = eligibleNations.length
    ? seededSample(eligibleNations, 1, dateKey, 19)
    : [];

  const leaguesForCards = Array.isArray(allLeagues) && allLeagues.length
    ? seededSample(allLeagues, 1, dateKey, 23)
    : [];

  if (shouldUseInternational) {
    const intlPool = getInternationalFeaturedPickPlayers(allPlayers);
    const topNations = pickTopNationalTeamsForPicks();
    if (intlPool.length >= 3 && topNations.length >= 2) {
      return {
        mode: 'international',
        players: seededSample(intlPool, 3, dateKey, 11),
        teams: seededSample(editorialTeams, 2, dateKey, 29),
        leagues: leaguesForCards,
        nationalTeams: seededSample(topNations, 2, dateKey, 31),
      };
    }
  }

  return {
    mode: 'club',
    players: seededSample(allPlayers, 3, dateKey, 11),
    teams: seededSample(editorialTeams, 2, dateKey, 29),
    leagues: leaguesForCards,
    nationalTeams: nationsForCards,
  };
}

export function truncateNote(text, max = 88) {
  const trimmed = String(text ?? '').trim();
  if (trimmed.length <= max) return trimmed;
  return `${trimmed.slice(0, max - 1).trim()}…`;
}
