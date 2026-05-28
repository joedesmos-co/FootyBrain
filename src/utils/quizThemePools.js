import { collections } from '../data/collectionsData';
import { getQuizThemeById, QUIZ_THEME_CATALOG } from '../data/quizThemes';
import { getPlayableQuizPlayers, getQuizEcosystemPlayers } from './quizEligibility';
import { pickWeightedFromQuizPool, resolveThemePoolCap } from './quizEcosystem';
import { pickRandomPlayer } from './quizSession';

const DEFAULT_POOL_CAP = 100;
const MIN_RECOGNIZABLE_IMPORTANCE = 52;

function playerIdsFromCollections(collectionIds) {
  const ids = new Set();
  for (const collectionId of collectionIds ?? []) {
    const collection = collections.find((c) => c?.id === collectionId);
    if (!collection?.items) continue;
    for (const item of collection.items) {
      if (item?.type === 'player' && item.id) ids.add(item.id);
    }
  }
  return ids;
}

function isForwardPosition(position) {
  return /striker|winger|forward|attack/i.test(String(position ?? '')) && !/midfield/i.test(position);
}

function normalizeClubName(value) {
  return String(value ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

export function getRecognizabilityScore(player) {
  let score = Number(player?.importanceScore) || 0;
  const hints = player?.quizHints?.length ?? 0;
  score += Math.min(hints, 6) * 2;
  if (player?.careerHistory?.length) score += 4;
  if (String(player?.quickFact ?? '').trim().length > 24) score += 3;
  return score;
}

/**
 * Rank by recognizability and cap pool size to avoid obscure filler dominating sessions.
 */
export function rankAndCapQuizPool(
  pool,
  {
    minImportance = MIN_RECOGNIZABLE_IMPORTANCE,
    cap = DEFAULT_POOL_CAP,
    difficulty = 'medium',
  } = {},
) {
  const ranked = [...pool]
    .filter((p) => (Number(p.importanceScore) || 0) >= minImportance)
    .sort((a, b) => getRecognizabilityScore(b) - getRecognizabilityScore(a));
  const limit = resolveThemePoolCap(ranked.length, cap);
  const sessionPool = getPlayableQuizPlayers(ranked, difficulty);
  const source = sessionPool.length >= Math.min(12, ranked.length) ? sessionPool : ranked;
  return source.slice(0, limit);
}

export function getPlayerRarity(player, pool) {
  const score = Number(player?.importanceScore) || 0;
  const poolScores = pool.map((p) => Number(p.importanceScore) || 0);
  const p90 = poolScores.length
    ? [...poolScores].sort((a, b) => a - b)[Math.floor(poolScores.length * 0.9)]
    : 90;

  if (score >= Math.max(90, p90)) {
    return { label: 'Household name', tone: 'common' };
  }
  if (score >= 82) {
    return { label: 'Well known', tone: 'uncommon' };
  }
  if (score >= 70) {
    return { label: 'Squad regular', tone: 'rare' };
  }
  return { label: 'Deep cut', tone: 'elite' };
}

function poolFromCollectionIds(players, collectionIds, difficulty = 'medium') {
  const ids = playerIdsFromCollections(collectionIds);
  const eligible = getQuizEcosystemPlayers(players);
  return rankAndCapQuizPool(eligible.filter((p) => ids.has(p.id)), {
    minImportance: 60,
    difficulty,
  });
}

function poolWonderkids(players, difficulty = 'medium') {
  const eligible = getQuizEcosystemPlayers(players);
  return rankAndCapQuizPool(
    eligible.filter((p) => typeof p.age === 'number' && p.age <= 23),
    { minImportance: 62, cap: 80, difficulty },
  );
}

function poolLegends(players, theme, difficulty = 'medium') {
  const fromCollections = poolFromCollectionIds(players, theme.collectionIds, difficulty);
  const eligible = getQuizEcosystemPlayers(players);
  const headline = eligible.filter((p) => (Number(p.importanceScore) || 0) >= 88);
  const merged = new Map();
  for (const p of [...fromCollections, ...headline]) merged.set(p.id, p);
  return rankAndCapQuizPool([...merged.values()], { minImportance: 80, cap: 90, difficulty });
}

function poolCultHeroes(players, difficulty = 'medium') {
  const eligible = getQuizEcosystemPlayers(players);
  return rankAndCapQuizPool(
    eligible.filter((p) => {
      const score = Number(p.importanceScore) || 0;
      return score >= 52 && score <= 78;
    }),
    { minImportance: 52, cap: 70, difficulty },
  );
}

function poolTopScorers(players, difficulty = 'medium') {
  const eligible = getQuizEcosystemPlayers(players);
  return rankAndCapQuizPool(
    eligible.filter((p) => isForwardPosition(p.position) && (Number(p.importanceScore) || 0) >= 78),
    { minImportance: 78, cap: 80, difficulty },
  );
}

function poolVeterans(players, difficulty = 'medium') {
  const eligible = getQuizEcosystemPlayers(players);
  return rankAndCapQuizPool(
    eligible.filter((p) => typeof p.age === 'number' && p.age >= 32),
    { minImportance: 65, cap: 90, difficulty },
  );
}

function poolDerbyRivalries(players, teams, difficulty = 'medium') {
  const eligible = getQuizEcosystemPlayers(players);
  const rivalryTeamIds = new Set();

  for (const team of teams ?? []) {
    if (!team?.rivals?.length) continue;
    rivalryTeamIds.add(team.id);
    for (const rivalLabel of team.rivals) {
      const norm = normalizeClubName(rivalLabel);
      const rival = (teams ?? []).find((t) => {
        const tn = normalizeClubName(t.name);
        return tn === norm || tn.includes(norm) || norm.includes(tn);
      });
      if (rival?.id) rivalryTeamIds.add(rival.id);
    }
  }

  return rankAndCapQuizPool(
    eligible.filter((p) => rivalryTeamIds.has(p.teamId)),
    { minImportance: 58, cap: 100, difficulty },
  );
}

function poolInternational(players, difficulty = 'medium') {
  const eligible = getQuizEcosystemPlayers(players);
  return rankAndCapQuizPool(
    eligible.filter((p) => p._inInternationalPool === true),
    { minImportance: 60, cap: 120, difficulty },
  );
}

/**
 * @param {any[]} allPlayers
 * @param {string} themeId
 * @param {{ teams?: any[], leagues?: any[], difficulty?: string }} [context]
 */
export function buildThemedQuizPool(allPlayers, themeId, context = {}) {
  const theme = getQuizThemeById(themeId);
  if (!theme) return [];
  const difficulty = context.difficulty ?? theme.defaultDifficulty ?? 'medium';
  const capOpts = (extra = {}) => ({ difficulty, ...extra });

  switch (theme.id) {
    case 'wonderkids':
      return poolWonderkids(allPlayers, difficulty);
    case 'legends':
      return poolLegends(allPlayers, theme, difficulty);
    case 'cult-heroes':
      return poolCultHeroes(allPlayers, difficulty);
    case 'top-scorers':
      return poolTopScorers(allPlayers, difficulty);
    case 'veterans':
      return poolVeterans(allPlayers, difficulty);
    case 'champions-league':
      return poolFromCollectionIds(allPlayers, theme.collectionIds, difficulty);
    case 'world-cup':
      return poolInternational(allPlayers, difficulty);
    case 'derby-rivalries':
      return poolDerbyRivalries(allPlayers, context.teams, difficulty);
    case 'premier-league':
    case 'la-liga':
    case 'serie-a':
    case 'bundesliga': {
      const leagueId = theme.preset?.leagueId;
      const eligible = getQuizEcosystemPlayers(allPlayers);
      return rankAndCapQuizPool(
        eligible.filter((p) => p.leagueId === leagueId),
        capOpts({ minImportance: 58, cap: 100 }),
      );
    }
    default:
      return [];
  }
}

export function countThemedQuizPool(allPlayers, themeId, context = {}) {
  return buildThemedQuizPool(allPlayers, themeId, context).length;
}

export function getAllThemePoolCounts(allPlayers, context = {}) {
  /** @type {Record<string, number>} */
  const counts = {};
  for (const theme of QUIZ_THEME_CATALOG) {
    counts[theme.id] = buildThemedQuizPool(allPlayers, theme.id, context).length;
  }
  return counts;
}

/**
 * Weighted pick favours recognizable players while keeping variety.
 */
export function pickWeightedQuizPlayer(pool, excludePlayerId = '', difficulty = 'medium') {
  const picked = pickWeightedFromQuizPool(pool, excludePlayerId, difficulty);
  if (picked) return picked;
  return pickRandomPlayer(pool, excludePlayerId);
}
