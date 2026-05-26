import {
  getLiveNationalTeams,
  getNationalTeamById,
  getQuizEligiblePlayersForNationalTeam,
} from '../data/nationalTeamData';
import { getLeagueName, getTeamName, leagues, teams } from '../data/sampleData';
import {
  getQuizEligiblePlayersForLeague,
  getQuizEligiblePlayersForTeam,
  getQuizEligibleRegistry,
} from './quizEligibility';

export const DAILY_QUESTION_COUNT = 5;

/** Minimum quiz-ready players required for a themed daily (club, league, or nation). */
export const DAILY_THEMED_MIN_POOL = 5;

export const DAILY_CHALLENGE_LABELS = {
  club: 'Club challenge',
  league: 'League challenge',
  'national-team': 'National team challenge',
  general: 'Daily challenge',
};

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

function seededSample(arr, n, dateKey, salt) {
  if (n >= arr.length) return [...arr];
  const rng = makeRng(dateToSeed(dateKey, salt));
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy.slice(0, n);
}

function buildEligibleNationalTeams() {
  return getLiveNationalTeams()
    .map((nationalTeam) => ({
      nationalTeam,
      players: getQuizEligiblePlayersForNationalTeam(nationalTeam.id),
    }))
    .filter(({ players }) => players.length >= DAILY_THEMED_MIN_POOL);
}

function buildEligibleClubs() {
  return teams
    .map((team) => ({
      team,
      players: getQuizEligiblePlayersForTeam(team.id),
    }))
    .filter(({ players }) => players.length >= DAILY_THEMED_MIN_POOL);
}

function buildEligibleLeagues() {
  return leagues
    .map((league) => ({
      league,
      players: getQuizEligiblePlayersForLeague(league.id),
    }))
    .filter(({ players }) => players.length >= DAILY_THEMED_MIN_POOL);
}

/** Built once — daily challenge generation reused this on every /daily mount. */
let eligiblePoolsCache = null;

function getEligiblePools() {
  if (!eligiblePoolsCache) {
    eligiblePoolsCache = {
      national: buildEligibleNationalTeams(),
      clubs: buildEligibleClubs(),
      leagues: buildEligibleLeagues(),
    };
  }
  return eligiblePoolsCache;
}

const challengePlanByDate = new Map();
const CHALLENGE_PLAN_CACHE_MAX = 14;

/**
 * Deterministic themed kind for a calendar day. National-team days are occasional (~18% when eligible).
 */
function pickChallengeKind(dateKey, eligible) {
  const rng = makeRng(dateToSeed(dateKey, 501));
  const roll = rng();

  if (eligible.national.length && roll < 0.18) return 'national-team';
  if (roll < 0.58 && eligible.clubs.length) return 'club';
  if (roll < 0.88 && eligible.leagues.length) return 'league';
  if (eligible.clubs.length) return 'club';
  if (eligible.leagues.length) return 'league';
  if (eligible.national.length) return 'national-team';
  return 'general';
}

function pickIndex(length, dateKey, salt) {
  if (length < 1) return 0;
  const rng = makeRng(dateToSeed(dateKey, salt));
  return Math.floor(rng() * length);
}

/**
 * @typedef {'club' | 'league' | 'national-team' | 'general'} DailyChallengeKind
 * @typedef {{
 *   kind: DailyChallengeKind,
 *   label: string,
 *   questions: import('../data/sampleData').players,
 *   scope: {
 *     type: DailyChallengeKind,
 *     name: string,
 *     teamId?: string,
 *     leagueId?: string,
 *     nationalTeamId?: string,
 *   },
 * }} DailyChallengePlan
 */

/**
 * Deterministic daily challenge for a date — same plan on every device/refresh.
 * @param {string} dateKey `YYYY-MM-DD`
 * @returns {DailyChallengePlan}
 */
export function generateDailyChallenge(dateKey) {
  const cached = challengePlanByDate.get(dateKey);
  if (cached) return cached;

  const eligible = getEligiblePools();
  const kind = pickChallengeKind(dateKey, eligible);

  let plan;

  if (kind === 'national-team') {
    const pick = eligible.national[pickIndex(eligible.national.length, dateKey, 601)];
    const questions = seededSample(pick.players, DAILY_QUESTION_COUNT, dateKey, 801);
    plan = {
      kind,
      label: DAILY_CHALLENGE_LABELS['national-team'],
      questions,
      scope: {
        type: 'national-team',
        nationalTeamId: pick.nationalTeam.id,
        name: pick.nationalTeam.displayName,
      },
    };
  } else if (kind === 'club') {
    const pick = eligible.clubs[pickIndex(eligible.clubs.length, dateKey, 602)];
    const questions = seededSample(pick.players, DAILY_QUESTION_COUNT, dateKey, 802);
    plan = {
      kind,
      label: DAILY_CHALLENGE_LABELS.club,
      questions,
      scope: {
        type: 'club',
        teamId: pick.team.id,
        name: pick.team.name,
      },
    };
  } else if (kind === 'league') {
    const pick = eligible.leagues[pickIndex(eligible.leagues.length, dateKey, 603)];
    const questions = seededSample(pick.players, DAILY_QUESTION_COUNT, dateKey, 803);
    plan = {
      kind,
      label: DAILY_CHALLENGE_LABELS.league,
      questions,
      scope: {
        type: 'league',
        leagueId: pick.league.id,
        name: pick.league.name,
      },
    };
  } else {
    const questions = seededSample(getQuizEligibleRegistry(), DAILY_QUESTION_COUNT, dateKey, 804);
    plan = {
      kind: 'general',
      label: DAILY_CHALLENGE_LABELS.general,
      questions,
      scope: {
        type: 'general',
        name: 'All leagues',
      },
    };
  }

  cacheChallengePlan(dateKey, plan);
  return plan;
}

function cacheChallengePlan(dateKey, plan) {
  challengePlanByDate.set(dateKey, plan);
  if (challengePlanByDate.size > CHALLENGE_PLAN_CACHE_MAX) {
    const oldest = challengePlanByDate.keys().next().value;
    challengePlanByDate.delete(oldest);
  }
}

/** @param {string} dateKey */
export function generateDailyQuestions(dateKey) {
  return generateDailyChallenge(dateKey).questions;
}

/** Resolve display name for scope (e.g. after reload). */
export function getDailyChallengeScopeName(scope) {
  if (!scope) return '';
  if (scope.type === 'club' && scope.teamId) return getTeamName(scope.teamId);
  if (scope.type === 'league' && scope.leagueId) return getLeagueName(scope.leagueId);
  if (scope.type === 'national-team' && scope.nationalTeamId) {
    return getNationalTeamById(scope.nationalTeamId)?.displayName ?? scope.name;
  }
  return scope.name ?? '';
}
