import { getQuizEligiblePlayers } from './quizEligibility';

/** @typedef {'goalkeepers' | 'defenders' | 'midfielders' | 'forwards'} SquadPositionGroupId */

export const SQUAD_POSITION_GROUPS = [
  { id: 'goalkeepers', label: 'Goalkeepers' },
  { id: 'defenders', label: 'Defenders' },
  { id: 'midfielders', label: 'Midfielders' },
  { id: 'forwards', label: 'Forwards' },
];

/**
 * @param {string} position
 * @returns {SquadPositionGroupId}
 */
export function getPositionCategory(position) {
  const value = String(position ?? '').toLowerCase();

  if (value.includes('goalkeeper') || value === 'gk') return 'goalkeepers';
  if (
    value.includes('back') ||
    value.includes('defender') ||
    value.includes('centre-back') ||
    value.includes('center-back')
  ) {
    return 'defenders';
  }
  if (value.includes('midfield') || value.includes('midfielder')) return 'midfielders';
  if (value.includes('striker') || value.includes('winger') || value.includes('forward')) {
    return 'forwards';
  }

  return 'midfielders';
}

/**
 * @param {Array} players
 */
export function groupPlayersByPositionCategory(players) {
  const sorted = [...players].sort((a, b) => b.importanceScore - a.importanceScore);
  const buckets = Object.fromEntries(SQUAD_POSITION_GROUPS.map((group) => [group.id, []]));

  for (const player of sorted) {
    const category = getPositionCategory(player.position);
    buckets[category].push(player);
  }

  return SQUAD_POSITION_GROUPS.map((group) => ({
    ...group,
    players: buckets[group.id],
    avgScore: getGroupAverageScore(buckets[group.id]),
  })).filter((group) => group.players.length > 0);
}

function parseDateOfBirth(value) {
  if (!value) return null;
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value;

  const text = String(value).trim();
  const isoMatch = text.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (isoMatch) {
    const [, year, month, day] = isoMatch;
    return new Date(Number(year), Number(month) - 1, Number(day));
  }

  const parsed = new Date(text);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

/**
 * @param {object} player
 * @returns {number | null}
 */
export function resolvePlayerAge(player) {
  if (typeof player?.age === 'number' && player.age > 0 && player.age < 55) {
    return player.age;
  }

  const birthDate = parseDateOfBirth(player?.dateOfBirth);
  if (!birthDate) return null;

  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const beforeBirthday =
    today.getMonth() < birthDate.getMonth() ||
    (today.getMonth() === birthDate.getMonth() && today.getDate() < birthDate.getDate());

  if (beforeBirthday) age -= 1;
  return age > 0 && age < 55 ? age : null;
}

/**
 * @param {Array} players
 */
export function getSquadAverageAge(players) {
  const ages = players.map(resolvePlayerAge).filter((age) => age != null);
  if (ages.length === 0) {
    return { avg: null, known: 0, total: players.length };
  }

  const avg = ages.reduce((sum, age) => sum + age, 0) / ages.length;
  return {
    avg: Math.round(avg * 10) / 10,
    known: ages.length,
    total: players.length,
  };
}

/**
 * @param {Array} players
 * @param {number} [limit]
 */
export function getStrongestPositionLabels(players, limit = 2) {
  const ranked = SQUAD_POSITION_GROUPS.map((group) => {
    const bucket = players.filter((player) => getPositionCategory(player.position) === group.id);
    if (bucket.length === 0) return null;

    const avg =
      bucket.reduce((sum, player) => sum + (player.importanceScore ?? 0), 0) / bucket.length;

    return {
      id: group.id,
      code: squadGroupCountLabel(group.id),
      label: group.label,
      avg: Math.round(avg),
      count: bucket.length,
    };
  })
    .filter(Boolean)
    .sort((a, b) => b.avg - a.avg || b.count - a.count);

  return ranked.slice(0, limit);
}

/**
 * @param {Array} players
 */
function getGroupAverageScore(players) {
  if (!players?.length) return null;
  const avg =
    players.reduce((sum, player) => sum + (player.importanceScore ?? 0), 0) / players.length;
  return Math.round(avg);
}

/**
 * @param {Array} players
 */
export function getSquadSummary(players) {
  const counts = Object.fromEntries(SQUAD_POSITION_GROUPS.map((group) => [group.id, 0]));

  for (const player of players) {
    counts[getPositionCategory(player.position)] += 1;
  }

  const topPlayer =
    players.length > 0
      ? players.reduce((best, player) =>
          player.importanceScore > best.importanceScore ? player : best,
        )
      : null;

  const ageStats = getSquadAverageAge(players);

  return {
    total: players.length,
    topPlayer,
    counts,
    ageStats,
    quizReady: getQuizEligiblePlayers(players).length,
    strongestPositions: getStrongestPositionLabels(players),
  };
}

/**
 * @param {SquadPositionGroupId} groupId
 */
export function squadGroupCountLabel(groupId) {
  const labels = {
    goalkeepers: 'GK',
    defenders: 'DEF',
    midfielders: 'MID',
    forwards: 'FWD',
  };
  return labels[groupId] ?? groupId;
}
