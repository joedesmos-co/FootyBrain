import { getPlayableQuizPlayers, getQuizEligiblePlayers } from './quizEligibility';

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

/**
 * @typedef {{
 *   players: any[],
 *   teams: any[],
 *   leagues: any[],
 *   national?: {
 *     nationalTeams?: any[],
 *     quizReadyPlayerIdsByNationalTeamId?: Record<string, string[]>,
 *   }
 * }} QuizRegistryPayload
 */

/**
 * Build eligible pools from the quiz registry (difficulty-weighted ecosystem).
 * @param {QuizRegistryPayload} registry
 */
function getEligiblePools(registry) {
  const quizReady = getPlayableQuizPlayers(registry?.players ?? [], 'medium');
  const editorial = getQuizEligiblePlayers(registry?.players ?? []);
  const teams = registry?.teams ?? [];
  const leagues = registry?.leagues ?? [];

  const byTeamId = new Map();
  const byLeagueId = new Map();
  const byPlayerId = new Map(quizReady.map((p) => [p.id, p]));

  for (const player of quizReady) {
    if (!byTeamId.has(player.teamId)) byTeamId.set(player.teamId, []);
    byTeamId.get(player.teamId).push(player);
    if (!byLeagueId.has(player.leagueId)) byLeagueId.set(player.leagueId, []);
    byLeagueId.get(player.leagueId).push(player);
  }

  const clubs = teams
    .map((team) => ({ team, players: byTeamId.get(team.id) ?? [] }))
    .filter(({ players }) => players.length >= DAILY_THEMED_MIN_POOL);

  const leaguePools = leagues
    .map((league) => ({ league, players: byLeagueId.get(league.id) ?? [] }))
    .filter(({ players }) => players.length >= DAILY_THEMED_MIN_POOL);

  const nationalTeams = registry?.national?.nationalTeams ?? [];
  const idsByTeam = registry?.national?.quizReadyPlayerIdsByNationalTeamId ?? {};

  const national = nationalTeams
    .map((nationalTeam) => ({
      nationalTeam,
      players: (idsByTeam[nationalTeam.id] ?? [])
        .map((id) => byPlayerId.get(id))
        .filter(Boolean),
    }))
    .filter(({ players }) => players.length >= DAILY_THEMED_MIN_POOL);

  return {
    national,
    clubs,
    leagues: leaguePools,
    sessionPlayers: quizReady,
    editorialPlayers: editorial,
  };
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
/**
 * Deterministic daily challenge for a date — same plan on every device/refresh.
 * @param {string} dateKey `YYYY-MM-DD`
 * @param {QuizRegistryPayload} registry
 */
export function generateDailyChallengeFromRegistry(dateKey, registry) {
  const cached = challengePlanByDate.get(dateKey);
  if (cached) return cached;

  const eligible = getEligiblePools(registry);
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
    const generalPool =
      eligible.editorialPlayers.length >= DAILY_QUESTION_COUNT
        ? eligible.editorialPlayers
        : eligible.sessionPlayers;
    const questions = seededSample(generalPool, DAILY_QUESTION_COUNT, dateKey, 804);
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
  return generateDailyQuestionsFromRegistry(dateKey, null);
}

/** @param {string} dateKey */
export function generateDailyQuestionsFromRegistry(dateKey, registry) {
  return generateDailyChallengeFromRegistry(dateKey, registry).questions;
}

/** Resolve display name for scope (e.g. after reload). */
export function getDailyChallengeScopeName(scope, registry) {
  if (!scope) return '';
  if (scope.type === 'club' && scope.teamId) {
    return (registry?.teams ?? []).find((t) => t.id === scope.teamId)?.name ?? scope.name ?? '';
  }
  if (scope.type === 'league' && scope.leagueId) {
    return (registry?.leagues ?? []).find((l) => l.id === scope.leagueId)?.name ?? scope.name ?? '';
  }
  if (scope.type === 'national-team' && scope.nationalTeamId) {
    return (
      (registry?.national?.nationalTeams ?? []).find((t) => t.id === scope.nationalTeamId)
        ?.displayName ?? scope.name ?? ''
    );
  }
  return scope.name ?? '';
}
