/**
 * Optional quiz clue variants — reuse editorial player fields only.
 */

import { formatCountryLabel, formatPosition } from './footballDisplay.js';

export const QUIZ_TYPE_OPTIONS = [
  {
    id: 'classic',
    label: 'Classic',
    description: 'Difficulty tiers and revealable hints',
    icon: '⚽',
  },
  {
    id: 'career',
    label: 'Career path',
    description: 'Guess from previous clubs and years',
    icon: '↗',
  },
  {
    id: 'who-am-i',
    label: 'Who am I?',
    description: 'Reveal clues one at a time',
    icon: '?',
    progressive: true,
  },
  {
    id: 'club-legends',
    label: 'Club legends',
    description: 'Famous players from one club',
    icon: '★',
    requiresClub: true,
  },
  {
    id: 'nationality',
    label: 'Nationality',
    description: 'Guess from country or national team',
    icon: '🌍',
  },
  {
    id: 'playstyle',
    label: 'Playstyle',
    description: 'Guess from playing style summary',
    icon: '✦',
  },
  {
    id: 'club-history',
    label: 'Club history',
    description: 'Former clubs (not current team)',
    icon: '◷',
  },
];

const CURRENT_SQUAD_RE = /current squad|present/i;
const CLUB_LEGEND_IMPORTANCE_MIN = 78;

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

function legendNameMatchesPlayer(legendName, playerName) {
  const legend = String(legendName ?? '').trim().toLowerCase();
  const player = String(playerName ?? '').trim().toLowerCase();
  if (!legend || !player) return false;
  if (legend === player) return true;
  const legendLast = legend.split(/\s+/).pop();
  const playerLast = player.split(/\s+/).pop();
  return Boolean(legendLast && playerLast && legendLast === playerLast);
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

/**
 * @param {object} [context] — { teamFilter, teamLegends }
 */
export function playerSupportsQuizVariant(player, quizType, context = {}) {
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
    case 'who-am-i':
      return buildWhoAmIClueSteps(player).length >= 3;
    case 'club-legends': {
      if (!context.teamFilter) return false;
      const score = player.importanceScore ?? 0;
      if (score >= CLUB_LEGEND_IMPORTANCE_MIN) return true;
      const legends = context.teamLegends ?? [];
      return legends.some((name) => legendNameMatchesPlayer(name, player.name));
    }
    case 'playstyle':
      return String(player.playingStyle ?? '').trim().length >= 24;
    case 'club-history':
      return getUsableCareerStops(player).length >= 2;
    default:
      return true;
  }
}

export function countPlayersForQuizType(players, quizType, context = {}) {
  if (!Array.isArray(players)) return 0;
  if (quizType === 'classic') return players.length;
  return players.filter((p) => playerSupportsQuizVariant(p, quizType, context)).length;
}

export function getQuizVariantContext(filterState, teams = []) {
  const teamFilter = filterState?.teamFilter ?? '';
  const team = teamFilter ? teams.find((t) => t.id === teamFilter) : null;
  return {
    teamFilter,
    teamLegends: team?.legends ?? [],
  };
}

export function buildWhoAmIClueSteps(player, getTeamName = () => '', getLeagueName = () => '') {
  if (!player) return [];
  const steps = [];
  if (player.position) {
    steps.push({ label: 'Position', value: formatPosition(player.position) });
  }
  const nation = player.nationalTeam || player.nationality;
  if (nation) {
    steps.push({
      label: player.nationalTeam ? 'National team' : 'Nation',
      value: formatCountryLabel(nation),
    });
  }
  const club = getTeamName(player.teamId);
  if (club && club !== 'Unknown') {
    steps.push({ label: 'Club', value: club });
  }
  const league = getLeagueName(player.leagueId);
  if (league && league !== 'Unknown') {
    steps.push({ label: 'League', value: league });
  }
  return steps;
}

/** Career stops for timeline display (career order in data). */
export function getCareerPathTimeline(player, limit = 6) {
  return careerEntries(player)
    .slice(0, limit)
    .map((stop) => formatCareerStop(stop));
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
    case 'who-am-i':
      return 'Who am I?';
    case 'club-legends':
      return 'Name the club legend';
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
    case 'who-am-i':
      return null;
    case 'club-legends': {
      const club = getTeamName?.(player.teamId) ?? '';
      return {
        label: 'Club legend',
        value: club ? `A famous ${club} player` : 'A famous player from this club',
        kind: 'legend',
      };
    }
    default:
      return null;
  }
}

export function getQuizTypePoolHint(quizType, poolSize, context = {}) {
  if (quizType === 'club-legends' && !context.teamFilter) {
    return 'Pick a club below to play Club legends.';
  }
  if (quizType === 'classic' || poolSize > 0) return null;
  const label = getQuizVariantLabel(quizType);
  return `Not enough ${label.toLowerCase()} data for this filter. Try Classic or widen the pool.`;
}

export function isProgressiveQuizType(quizType) {
  return quizType === 'who-am-i';
}

export function usesCareerTimeline(quizType) {
  return quizType === 'career';
}
