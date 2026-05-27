import {
  getLeagueSearchFields,
  getNationalTeamSearchFields,
  getPlayerSearchFields,
  getTeamSearchFields,
} from './searchAliases';
import {
  getPlayerSearchCandidates,
  playerSearchQuickScoreForEntry,
} from './playerSearchIndex';
import {
  getLeagueSearchCandidates,
  getNationalTeamSearchCandidates,
  getTeamSearchCandidates,
} from './entitySearchIndex';
import {
  detectSearchIntent,
  getSearchGroupOrder,
  scorePlayerIntentBoost,
} from './searchIntent';
import { getLeagueDisplayName } from './footballDisplay';
import { isWeakSearchScore, matchScoreForFields, normalizeForSearch } from './textSearch';

/** Skip full-player scan on single-character queries (teams/leagues still match). */
export const MIN_PLAYER_QUERY_LENGTH = 2;

/** Display order for grouped results in Universal Search. */
export const SEARCH_GROUP_ORDER = ['player', 'team', 'league', 'national-team'];

export const SEARCH_GROUP_LABELS = {
  player: 'Players',
  team: 'Clubs',
  league: 'Leagues',
  'national-team': 'National teams',
};

export const RESULT_TYPE_LABELS = {
  player: 'Player',
  team: 'Club',
  league: 'League',
  'national-team': 'National team',
};

const PER_TYPE_LIMITS = {
  player: 6,
  team: 4,
  league: 3,
  'national-team': 3,
};

/** Avoid allocating huge player match arrays on broad queries before sortAndCap. */
const PLAYER_MATCH_BUFFER = 48;

/** Short tokens that flood results unless the match is strong (exact / prefix / token). */
const AMBIGUOUS_SHORT_QUERIES = new Set([
  'la',
  'fc',
  'om',
  'us',
  'uk',
  'ac',
  'as',
  'de',
  'cf',
  'sc',
  'cd',
]);

/**
 * @typedef {'player' | 'team' | 'league' | 'national-team'} UniversalResultType
 */

function passesQueryScoreGate(normalizedQuery, score) {
  if (score <= 0) return false;
  if (normalizedQuery.length > 3) return true;
  if (isWeakSearchScore(score)) return false;
  if (AMBIGUOUS_SHORT_QUERIES.has(normalizedQuery)) return score >= 85;
  return score >= 75;
}

function compareResults(a, b) {
  if (b.score !== a.score) return b.score - a.score;
  if (a.type === 'player' && b.type === 'player') {
    return (b.player.importanceScore ?? 0) - (a.player.importanceScore ?? 0);
  }
  return a.name.localeCompare(b.name);
}

function sortAndCap(bucket, type) {
  return [...bucket].sort(compareResults).slice(0, PER_TYPE_LIMITS[type] ?? 4);
}

function pushCapped(bucket, entry, cap) {
  bucket.push(entry);
  if (bucket.length > cap) {
    bucket.sort(compareResults);
    bucket.length = cap;
  }
}

/**
 * Score all entity types into buckets (no global merge yet).
 * @param {string} query
 * @param {object} ctx
 */
function collectSearchBuckets(query, ctx) {
  const trimmed = query.trim();
  const normalizedQuery = normalizeForSearch(trimmed);
  const {
    players,
    teams,
    leagues,
    nationalTeams = [],
    getTeamName,
    getLeagueName,
    getMembership = null,
  } = ctx;

  const buckets = {
    player: [],
    team: [],
    league: [],
    'national-team': [],
  };

  if (!normalizedQuery) return { buckets, intent: { kind: 'neutral' } };

  const intent = detectSearchIntent(normalizedQuery, ctx);
  const countryIntent =
    intent.kind === 'country' || intent.kind === 'country-soft';
  const clubIntent = intent.kind === 'club';

  for (const nationalTeam of getNationalTeamSearchCandidates(nationalTeams, normalizedQuery)) {
    const base = matchScoreForFields(getNationalTeamSearchFields(nationalTeam), normalizedQuery);
    if (!passesQueryScoreGate(normalizedQuery, base)) continue;
    let score = base + 4;
    if (countryIntent && nationalTeam.id === intent.nationalTeamId) score += 14;
    const nameNorm = normalizeForSearch(nationalTeam.displayName);
    if (nameNorm === normalizedQuery || nameNorm.startsWith(normalizedQuery)) {
      score += 6;
    }
    buckets['national-team'].push({
      type: 'national-team',
      id: nationalTeam.id,
      name: nationalTeam.displayName,
      subtitle: [nationalTeam.confederation, 'National team'].filter(Boolean).join(' · '),
      path: `/national-team/${nationalTeam.id}`,
      score,
      nationalTeam,
    });
  }

  for (const league of getLeagueSearchCandidates(leagues, normalizedQuery)) {
    const score = matchScoreForFields(getLeagueSearchFields(league), normalizedQuery);
    if (!passesQueryScoreGate(normalizedQuery, score)) continue;
    buckets.league.push({
      type: 'league',
      id: league.id,
      name: getLeagueDisplayName(league),
      subtitle: league.country,
      path: `/league/${league.id}`,
      score,
      league: { ...league, name: getLeagueDisplayName(league) },
    });
  }

  for (const team of getTeamSearchCandidates(teams, normalizedQuery, getLeagueName)) {
    const leagueName = getLeagueName(team.leagueId);
    let score = matchScoreForFields(getTeamSearchFields(team, getLeagueName), normalizedQuery);
    if (!passesQueryScoreGate(normalizedQuery, score)) continue;
    if (clubIntent && team.id === intent.teamId) score += 14;
    buckets.team.push({
      type: 'team',
      id: team.id,
      name: team.name,
      subtitle: `${leagueName} · ${team.country}`,
      path: `/team/${team.id}`,
      score,
      team,
    });
  }

  if (trimmed.length >= MIN_PLAYER_QUERY_LENGTH) {
    const helpers = { getTeamName, getLeagueName };
    const candidateEntries = getPlayerSearchCandidates(players, normalizedQuery);

    for (const entry of candidateEntries) {
      const player = entry.player;

      const nameScore = playerSearchQuickScoreForEntry(entry, normalizedQuery);
      let score = nameScore;
      if (score === 0) {
        score = matchScoreForFields(getPlayerSearchFields(player, helpers), normalizedQuery);
        if (normalizedQuery.length <= 3 && isWeakSearchScore(score)) continue;
      }
      if (!passesQueryScoreGate(normalizedQuery, score)) continue;

      const teamName = getTeamName(player.teamId);
      const leagueName = getLeagueName(player.leagueId);
      const nationLabel = player.nationalTeam || player.nationality;
      const subtitle = [nationLabel, teamName, leagueName, player.position]
        .filter(Boolean)
        .join(' · ');

      let adjusted = score + scorePlayerIntentBoost(player, intent, getMembership);
      if (nameScore > 0) adjusted += 2;
      if (normalizedQuery.length <= 3 && nameScore === 0) adjusted -= 8;

      pushCapped(
        buckets.player,
        {
          type: 'player',
          id: player.id,
          name: player.name,
          subtitle,
          path: `/player/${player.id}`,
          score: adjusted,
          player,
        },
        PLAYER_MATCH_BUFFER,
      );
    }
  }

  return { buckets, intent };
}

/**
 * Grouped universal search for the modal UI.
 * @returns {{ groups: Array<{ type: string, label: string, results: object[] }>, flatResults: object[] }}
 */
export function searchUniversalGrouped(query, ctx) {
  const trimmed = query.trim();
  if (!trimmed) return { groups: [], flatResults: [] };

  const { buckets, intent } = collectSearchBuckets(query, ctx);
  const groups = [];
  const flatResults = [];
  let flatIndex = 0;

  for (const type of getSearchGroupOrder(intent)) {
    const results = sortAndCap(buckets[type], type);
    if (results.length === 0) continue;
    for (const result of results) {
      result.flatIndex = flatIndex;
      flatIndex += 1;
      flatResults.push(result);
    }
    groups.push({
      type,
      label: SEARCH_GROUP_LABELS[type],
      results,
    });
  }

  return { groups, flatResults };
}

/**
 * Flat ranked list (legacy / simple consumers).
 * @param {string} query
 * @param {object} ctx
 */
export function searchUniversal(query, ctx) {
  return searchUniversalGrouped(query, ctx).flatResults;
}
