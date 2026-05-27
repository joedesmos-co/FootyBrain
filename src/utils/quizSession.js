import { getQuizEligiblePlayers } from './quizEligibility.js';
import { formatCountryLabel, formatPosition } from './footballDisplay.js';
import { getQuizTypePoolHint, playerSupportsQuizVariant } from './quizVariants.js';
import { COUNTRY_SESSION_POOL_CAP } from '../data/worldCupQuizConstants.js';

/** Minimum players with clues for a fair session. */
export const QUIZ_MIN_SESSION_POOL = 3;

/** @deprecated Use QUIZ_MIN_SESSION_POOL — kept for existing imports. */
export const QUIZ_NATIONAL_TEAM_MIN_POOL = QUIZ_MIN_SESSION_POOL;

export {
  buildWhoAmIClueSteps,
  countPlayersForQuizType,
  getCareerPathTimeline,
  getQuizPromptForType,
  getQuizVariantClue,
  getQuizVariantContext,
  isProgressiveQuizType,
  usesCareerTimeline,
  QUIZ_TYPE_OPTIONS,
} from './quizVariants';

export const QUIZ_DIFFICULTY_OPTIONS = [
  { id: 'easy', label: 'Easy', description: 'Club, position, and nationality shown' },
  { id: 'medium', label: 'Medium', description: 'Position, national team, and one hint' },
  { id: 'hard', label: 'Hard', description: 'No free clues — reveal hints yourself' },
];

export const QUIZ_POOL_FOCUS_OPTIONS = [
  { id: 'all', label: 'All filters', description: 'Mix league, club, position, or national team' },
  { id: 'league', label: 'League only', description: 'Pick a league — clubs with quiz mode' },
  { id: 'club', label: 'Club only', description: 'Pick one club squad' },
  {
    id: 'national',
    label: 'National team only',
    description: 'Players with clues linked to one live national team',
  },
  {
    id: 'international',
    label: 'International (World Cup prep)',
    description:
      'Curated union across featured nations — capped lineup, no club or league filters',
  },
  { id: 'position', label: 'Position only', description: 'One role across all leagues' },
];

export const QUIZ_TIMED_PRESETS = [
  { id: 0, label: 'Off' },
  { id: 30, label: '30s' },
  { id: 45, label: '45s' },
  { id: 60, label: '60s' },
];

export function getInitialHintCount(difficulty) {
  if (difficulty === 'easy') return 0;
  if (difficulty === 'medium') return 1;
  return 0;
}

export function getClueFactsForQuestion(player, difficulty, getTeamName) {
  if (!player || difficulty === 'hard') return [];

  const clubName = getTeamName(player.teamId);
  return [
    difficulty === 'easy' && { label: 'Club', value: clubName },
    (difficulty === 'easy' || difficulty === 'medium') && {
      label: 'Position',
      value: formatPosition(player.position),
    },
    difficulty === 'easy' && {
      label: 'Nationality',
      value: formatCountryLabel(player.nationality),
    },
    difficulty === 'medium' && {
      label: 'National team',
      value: formatCountryLabel(player.nationalTeam),
    },
  ].filter(Boolean);
}

/** Normalised position buckets for the position-only filter. */
export const QUIZ_POSITION_BUCKETS = [
  { id: '', label: 'Select position…' },
  { id: 'goalkeeper', label: 'Goalkeeper', test: (p) => /goalkeeper/i.test(p.position) },
  {
    id: 'defender',
    label: 'Defenders',
    test: (p) => /defender|centre-back|center-back|full-back|back$/i.test(p.position),
  },
  {
    id: 'midfielder',
    label: 'Midfielders',
    test: (p) => /midfield/i.test(p.position),
  },
  {
    id: 'forward',
    label: 'Forwards / attack',
    test: (p) =>
      /striker|winger|forward|attack/i.test(p.position) &&
      !/midfield/i.test(p.position),
  },
];

export function playerMatchesPositionBucket(player, bucketId) {
  if (!bucketId) return true;
  const bucket = QUIZ_POSITION_BUCKETS.find((b) => b.id === bucketId);
  return bucket?.test ? bucket.test(player) : true;
}

function filterByNationalTeam(pool, nationalTeamFilter) {
  if (!nationalTeamFilter) return pool;
  return pool.filter((player) => {
    if (player?._nationalTeamId) return player._nationalTeamId === nationalTeamFilter;
    // Fallback for legacy callers: match against nationalTeam string when present.
    // (This is less strict than membership linking, but avoids pulling the monolith on quiz paths.)
    return (
      String(player?.nationalTeam ?? '').toLowerCase() ===
      String(nationalTeamFilter ?? '').toLowerCase()
    );
  });
}

export function isInternationalQuizScope(poolFocus) {
  return poolFocus === 'international';
}

export function isNationalTeamQuizScope(poolFocus, nationalTeamFilter) {
  if (isInternationalQuizScope(poolFocus)) {
    return Boolean(nationalTeamFilter);
  }
  return poolFocus === 'national' || Boolean(nationalTeamFilter);
}

export function isClubQuizScope(poolFocus, teamFilter) {
  return poolFocus === 'club' && Boolean(teamFilter);
}

export function isNationalTeamQuizPoolViable(poolSize, poolFocus, nationalTeamFilter) {
  if (!isNationalTeamQuizScope(poolFocus, nationalTeamFilter)) {
    return poolSize > 0;
  }
  return poolSize >= QUIZ_MIN_SESSION_POOL;
}

/** Whether the active filters allow starting a quiz session. */
export function isQuizSessionPoolViable(
  poolSize,
  poolFocus,
  nationalTeamFilter,
  teamFilter = '',
) {
  if (isInternationalQuizScope(poolFocus)) {
    return poolSize >= QUIZ_MIN_SESSION_POOL;
  }
  if (isNationalTeamQuizScope(poolFocus, nationalTeamFilter)) {
    return poolSize >= QUIZ_MIN_SESSION_POOL;
  }
  if (isClubQuizScope(poolFocus, teamFilter)) {
    return poolSize >= QUIZ_MIN_SESSION_POOL;
  }
  return poolSize > 0;
}

/**
 * @param {import('../data/sampleData').players} allPlayers
 * @param {{ poolFocus: string, leagueFilter: string, teamFilter: string, positionFilter: string, nationalTeamFilter: string }} filters
 */
export function buildQuizPlayerPool(allPlayers, filters, quizType = 'classic', variantContext = {}) {
  const { poolFocus, leagueFilter, teamFilter, positionFilter, nationalTeamFilter } = filters;
  const eligible = getQuizEligiblePlayers(allPlayers);

  let pool;

  if (poolFocus === 'league') {
    if (!leagueFilter) return [];
    pool = eligible.filter((p) => p.leagueId === leagueFilter);
    if (nationalTeamFilter) {
      pool = pool.filter((p) => p._nationalTeamId === nationalTeamFilter);
    }
  } else if (poolFocus === 'club') {
    if (!teamFilter) return [];
    pool = eligible.filter((p) => p.teamId === teamFilter);
    if (nationalTeamFilter) {
      pool = pool.filter((p) => p._nationalTeamId === nationalTeamFilter);
    }
  } else if (poolFocus === 'national') {
    if (!nationalTeamFilter) return [];
    pool = filterByNationalTeam(eligible, nationalTeamFilter).slice(0, COUNTRY_SESSION_POOL_CAP);
  } else if (poolFocus === 'international') {
    pool = eligible.filter((p) => p._inInternationalPool === true);
    if (nationalTeamFilter) pool = pool.filter((p) => p._nationalTeamId === nationalTeamFilter);
  } else if (poolFocus === 'position') {
    if (!positionFilter) return [];
    pool = eligible.filter((p) => playerMatchesPositionBucket(p, positionFilter));
    if (nationalTeamFilter) pool = filterByNationalTeam(pool, nationalTeamFilter);
  } else {
    pool = eligible;
    pool = pool.filter((player) => {
      if (leagueFilter && player.leagueId !== leagueFilter) return false;
      if (teamFilter && player.teamId !== teamFilter) return false;
      if (positionFilter && !playerMatchesPositionBucket(player, positionFilter)) return false;
      return true;
    });
    if (nationalTeamFilter) pool = filterByNationalTeam(pool, nationalTeamFilter);
  }

  if (quizType === 'classic') return pool;
  return pool.filter((player) => playerSupportsQuizVariant(player, quizType, variantContext));
}

export function getPoolFocusHint(
  poolFocus,
  filters,
  poolSize,
  quizType = 'classic',
  hintContext = {},
) {
  const { leagueFilter, teamFilter, positionFilter, nationalTeamFilter } = filters;
  const nationalTeamName = hintContext.nationalTeamName ?? 'this national team';
  const nationalScoped = isNationalTeamQuizScope(poolFocus, nationalTeamFilter);

  if (isInternationalQuizScope(poolFocus)) {
    if (poolSize === 0) {
      const variantHint = getQuizTypePoolHint(quizType, poolSize, {
        teamFilter: filters.teamFilter,
      });
      if (variantHint) return variantHint;
      return 'Not enough players with clues in the featured international lineup yet.';
    }
    if (poolSize > 0 && poolSize < QUIZ_MIN_SESSION_POOL) {
      const variantHint = getQuizTypePoolHint(quizType, poolSize, {
        teamFilter: filters.teamFilter,
      });
      if (variantHint) return variantHint;
      const noun = poolSize === 1 ? 'player' : 'players';
      return `Only ${poolSize} ${noun} in the international lineup — need at least ${QUIZ_MIN_SESSION_POOL}.`;
    }
    if (nationalTeamFilter && poolSize > 0) {
      return `${poolSize} players ready (narrowed to ${hintContext.nationalTeamName ?? 'selected country'})`;
    }
  }

  if (nationalScoped) {
    if (poolFocus === 'national' && !nationalTeamFilter) {
      return 'Choose a national team to start.';
    }
    if (nationalTeamFilter && poolSize === 0) {
      const variantHint = getQuizTypePoolHint(quizType, poolSize, {
        teamFilter: filters.teamFilter,
      });
      if (variantHint) return variantHint;
      return `No players with clues are linked to ${nationalTeamName} yet. Profiles are still being filled in.`;
    }
    if (
      nationalTeamFilter &&
      poolSize > 0 &&
      poolSize < QUIZ_MIN_SESSION_POOL
    ) {
      const variantHint = getQuizTypePoolHint(quizType, poolSize, {
        teamFilter: filters.teamFilter,
      });
      if (variantHint) return variantHint;
      const noun = poolSize === 1 ? 'player' : 'players';
      return `Only ${poolSize} ${noun} for ${nationalTeamName} — need at least ${QUIZ_MIN_SESSION_POOL} for a fair session. Try another country or remove extra filters.`;
    }
  }

  if (poolFocus === 'club' && teamFilter && poolSize > 0 && poolSize < QUIZ_MIN_SESSION_POOL) {
    const variantHint = getQuizTypePoolHint(quizType, poolSize, { teamFilter });
    if (variantHint) return variantHint;
    const noun = poolSize === 1 ? 'player' : 'players';
    const teamName = hintContext.teamName ?? 'this club';
    return `Only ${poolSize} ${noun} for ${teamName} — need at least ${QUIZ_MIN_SESSION_POOL} for a fair session.`;
  }

  if (poolSize === 0) {
    const variantHint = getQuizTypePoolHint(quizType, poolSize, { teamFilter });
    if (variantHint) return variantHint;
    if (poolFocus === 'league' && !leagueFilter) return 'Choose a league to start.';
    if (poolFocus === 'club' && !teamFilter) return 'Choose a club to start.';
    if (poolFocus === 'position' && !positionFilter) return 'Choose a position group to start.';
    if (poolFocus === 'international') {
      return 'Not enough players with clues in the featured international lineup.';
    }
    return 'No players match this filter.';
  }
  return `${poolSize} players ready`;
}

/**
 * Structured empty copy for international-only World Cup prep sessions.
 * @returns {{ title: string, message: string, showSquadLink: boolean } | null}
 */
export function getQuizInternationalEmptyState(
  poolFocus,
  poolSize,
  quizType = 'classic',
  variantContext = {},
) {
  if (!isInternationalQuizScope(poolFocus)) return null;

  const variantHint = getQuizTypePoolHint(quizType, poolSize, variantContext);

  if (poolSize === 0) {
    return {
      title: 'International lineup not ready',
      message:
        variantHint ??
        'Featured nations need more players with clues before an international session can start.',
      showSquadLink: false,
    };
  }

  if (poolSize > 0 && poolSize < QUIZ_MIN_SESSION_POOL) {
    const noun = poolSize === 1 ? 'player' : 'players';
    return {
      title: 'International lineup too small',
      message:
        variantHint ??
        `Only ${poolSize} ${noun} available (minimum ${QUIZ_MIN_SESSION_POOL}). Try a single-country quiz or check back as squads grow.`,
      showSquadLink: false,
    };
  }

  return null;
}

/**
 * Structured empty copy when country filter blocks starting a session.
 * @returns {{ title: string, message: string, showSquadLink: boolean } | null}
 */
export function getQuizCountryEmptyState(
  poolFocus,
  filters,
  poolSize,
  hintContext = {},
  quizType = 'classic',
) {
  const { nationalTeamFilter } = filters;
  const nationalTeamName = hintContext.nationalTeamName ?? 'this country';
  if (!isNationalTeamQuizScope(poolFocus, nationalTeamFilter)) return null;

  if (poolFocus === 'national' && !nationalTeamFilter) {
    return {
      title: 'Choose a country',
      message:
        'Pick a live national team. The quiz uses players with clues and a linked squad membership.',
      showSquadLink: false,
    };
  }

  if (!nationalTeamFilter) return null;

  const variantHint = getQuizTypePoolHint(quizType, poolSize, {
    teamFilter: filters.teamFilter,
  });

  if (poolSize === 0) {
    return {
      title: `No quiz players for ${nationalTeamName}`,
      message:
        variantHint ??
        'No linked players have an approved editorial quiz profile yet. Browse the full squad or try another country.',
      showSquadLink: true,
    };
  }

  if (poolSize > 0 && poolSize < QUIZ_MIN_SESSION_POOL) {
    const noun = poolSize === 1 ? 'player' : 'players';
    return {
      title: `${nationalTeamName} needs more players with clues`,
      message:
        variantHint ??
        `Only ${poolSize} ${noun} linked (minimum ${QUIZ_MIN_SESSION_POOL}). Pick another country or check back later.`,
      showSquadLink: true,
    };
  }

  return null;
}

/**
 * Structured empty copy when a club filter has too few quiz-ready players.
 * @returns {{ title: string, message: string, showSquadLink: boolean } | null}
 */
export function getQuizClubEmptyState(
  poolFocus,
  filters,
  poolSize,
  hintContext = {},
  quizType = 'classic',
) {
  const { teamFilter } = filters;
  if (!isClubQuizScope(poolFocus, teamFilter)) return null;

  const teamName = hintContext.teamName ?? 'this club';
  const variantHint = getQuizTypePoolHint(quizType, poolSize, { teamFilter });

  if (poolSize === 0) {
    return {
      title: `No quiz players for ${teamName}`,
      message:
        variantHint ??
        'No approved editorial quiz profiles for this squad yet. Browse the full roster or pick another club.',
      showSquadLink: true,
    };
  }

  if (poolSize > 0 && poolSize < QUIZ_MIN_SESSION_POOL) {
    const noun = poolSize === 1 ? 'player' : 'players';
    return {
      title: `${teamName} needs more players with clues`,
      message:
        variantHint ??
        `Only ${poolSize} ${noun} (minimum ${QUIZ_MIN_SESSION_POOL}). Try a league-wide quiz or check back later.`,
      showSquadLink: true,
    };
  }

  return null;
}

/**
 * @param {import('../data/sampleData').players} pool
 * @param {string} [excludePlayerId] — avoid immediate repeat when pool has 2+ players
 */
export function pickRandomPlayer(pool, excludePlayerId = '') {
  if (pool.length === 0) return null;
  if (pool.length === 1) return pool[0];
  if (!excludePlayerId) return pool[Math.floor(Math.random() * pool.length)];

  let candidate = pool[0];
  for (let attempt = 0; attempt < 8; attempt += 1) {
    candidate = pool[Math.floor(Math.random() * pool.length)];
    if (candidate.id !== excludePlayerId) return candidate;
  }
  return candidate;
}

export function normalizeAnswer(text) {
  return text
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/ø/g, 'o')
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ');
}

const LAST_NAME_SUFFIX_TOKENS = new Set(['jr', 'sr', 'ii', 'iii', 'iv']);

function getNormalizedLastNameToken(normalizedFullName) {
  const parts = normalizedFullName.split(' ').filter(Boolean);
  if (parts.length === 0) return '';
  const last = parts[parts.length - 1];
  if (LAST_NAME_SUFFIX_TOKENS.has(last) && parts.length >= 2) {
    return parts[parts.length - 2];
  }
  return last;
}

export function buildAmbiguousLastNames(pool) {
  const counts = {};
  for (const p of pool) {
    const last = getNormalizedLastNameToken(normalizeAnswer(p.name));
    if (last.length > 3) counts[last] = (counts[last] ?? 0) + 1;
  }
  return new Set(Object.keys(counts).filter((k) => counts[k] > 1));
}

export function answersMatch(guess, correctName, ambiguousLastNames = new Set()) {
  const g = normalizeAnswer(guess);
  const c = normalizeAnswer(correctName);
  if (g === c) return true;
  const lastName = getNormalizedLastNameToken(c);
  return g === lastName && lastName.length > 3 && !ambiguousLastNames.has(lastName);
}

/**
 * Lightweight explanation for wrong answers (does not change matching rules).
 * @param {{ guess: string, correctName: string, ambiguousLastNames?: Set<string>, timedOut?: boolean }} params
 * @returns {{ title?: string, tip?: string } | null}
 */
export function getWrongAnswerTip({
  guess,
  correctName,
  ambiguousLastNames = new Set(),
  timedOut = false,
}) {
  if (timedOut) {
    return { title: "Time's up", tip: 'Tip: timed mode gives a fixed time per question.' };
  }
  const g = normalizeAnswer(guess);
  const c = normalizeAnswer(correctName);
  if (!g || !c) return null;

  const lastName = getNormalizedLastNameToken(c);
  if (g === lastName && lastName.length > 3 && ambiguousLastNames.has(lastName)) {
    return {
      title: 'Surname shortcut blocked',
      tip: 'Tip: multiple players share that surname in this pool — use the full name.',
    };
  }

  if (g.replace(/\s+/g, '') === c.replace(/\s+/g, '')) {
    return { tip: 'Tip: spacing and punctuation are ignored — try the player’s full name.' };
  }

  if (g.length <= 3) {
    return { tip: 'Tip: use more of the name (short guesses rarely match).' };
  }

  return { tip: 'Tip: try the full name (spelling matters).' };
}
