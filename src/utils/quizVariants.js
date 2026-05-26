/**
 * Optional quiz clue variants — reuse editorial player fields only.
 */

export const QUIZ_TYPE_OPTIONS = [
  {
    id: 'classic',
    label: 'Classic',
    description: 'Difficulty-based clues plus revealable hints (default)',
  },
  {
    id: 'nationality',
    label: 'Nationality',
    description: 'Guess the player from their national team or country',
  },
  {
    id: 'career',
    label: 'Career path',
    description: 'Guess from clubs and years in their career history',
  },
  {
    id: 'playstyle',
    label: 'Playstyle',
    description: 'Guess from their FootyBrain playing style summary',
  },
  {
    id: 'club-history',
    label: 'Club history',
    description: 'Guess from former clubs (not their current team)',
  },
];

const CURRENT_SQUAD_RE = /current squad|present/i;

function careerEntries(player) {
  return Array.isArray(player?.careerHistory)
    ? player.careerHistory.filter((entry) => String(entry?.club ?? '').trim())
    : [];
}

function isCurrentSquadEntry(entry) {
  return CURRENT_SQUAD_RE.test(String(entry?.years ?? ''));
}

function formatCareerStop(entry) {
  const club = String(entry.club).trim();
  const years = String(entry.years ?? '').trim();
  if (!years || isCurrentSquadEntry(entry)) return club;
  return `${club} (${years})`;
}

/**
 * @param {object} player
 * @param {string} [currentClubName]
 */
export function getUsableCareerStops(player, currentClubName = '') {
  const currentNorm = currentClubName.trim().toLowerCase();
  return careerEntries(player).filter((entry) => {
    const club = String(entry.club).trim();
    if (!club) return false;
    if (currentNorm && club.toLowerCase() === currentNorm) return false;
    return true;
  });
}

export function playerSupportsQuizVariant(player, quizType) {
  if (!player || quizType === 'classic') return true;

  switch (quizType) {
    case 'nationality':
      return Boolean(
        String(player.nationalTeam ?? '').trim() || String(player.nationality ?? '').trim(),
      );
    case 'career': {
      const stops = careerEntries(player);
      const meaningful = stops.filter((e) => !isCurrentSquadEntry(e) || stops.length === 1);
      return meaningful.length >= 2;
    }
    case 'playstyle':
      return String(player.playingStyle ?? '').trim().length >= 24;
    case 'club-history':
      return getUsableCareerStops(player).length >= 2;
    default:
      return true;
  }
}

export function getQuizVariantLabel(quizType) {
  return QUIZ_TYPE_OPTIONS.find((o) => o.id === quizType)?.label ?? 'Classic';
}

export function getQuizPromptForType(quizType) {
  switch (quizType) {
    case 'nationality':
      return 'Guess from nationality';
    case 'career':
      return 'Guess from career path';
    case 'playstyle':
      return 'Guess from playstyle';
    case 'club-history':
      return 'Guess from club history';
    default:
      return 'Guess the player';
  }
}

/**
 * Primary clue card for non-classic quiz types.
 * @returns {{ label: string, value: string, kind?: string } | null}
 */
export function getQuizVariantClue(player, quizType, getTeamName) {
  if (!player || quizType === 'classic') return null;

  switch (quizType) {
    case 'nationality': {
      const value =
        String(player.nationalTeam ?? '').trim() ||
        String(player.nationality ?? '').trim();
      if (!value) return null;
      return {
        label: player.nationalTeam ? 'National team' : 'Nationality',
        value,
        kind: 'nationality',
      };
    }
    case 'career': {
      const stops = careerEntries(player)
        .slice(0, 5)
        .map(formatCareerStop)
        .filter(Boolean);
      if (stops.length < 2) return null;
      return {
        label: 'Career path',
        value: stops.join(' → '),
        kind: 'path',
      };
    }
    case 'playstyle': {
      const raw = String(player.playingStyle ?? '').trim();
      if (raw.length < 24) return null;
      const value = raw.length > 240 ? `${raw.slice(0, 237).trimEnd()}…` : raw;
      return { label: 'Playing style', value, kind: 'text' };
    }
    case 'club-history': {
      const currentClub = getTeamName?.(player.teamId) ?? '';
      const former = getUsableCareerStops(player, currentClub)
        .filter((e) => !isCurrentSquadEntry(e))
        .slice(0, 4)
        .map((e) => String(e.club).trim());
      if (former.length < 2) {
        const fallback = getUsableCareerStops(player, currentClub)
          .slice(0, 4)
          .map((e) => String(e.club).trim());
        if (fallback.length < 2) return null;
        return {
          label: 'Club history',
          value: fallback.join(' · '),
          kind: 'clubs',
        };
      }
      return {
        label: 'Former clubs',
        value: former.join(' · '),
        kind: 'clubs',
      };
    }
    default:
      return null;
  }
}

export function getQuizTypePoolHint(quizType, poolSize) {
  if (quizType === 'classic' || poolSize > 0) return null;
  const label = getQuizVariantLabel(quizType);
  return `No quiz-ready players with enough ${label.toLowerCase()} data for this filter. Try Classic or widen the pool.`;
}
