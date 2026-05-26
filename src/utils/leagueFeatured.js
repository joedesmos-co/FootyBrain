import { getQuizEligiblePlayers } from './quizEligibility';
import { parseFamousClubLabel } from './leagueIdentity';

function normalizeClubName(value) {
  return String(value ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function normalizePlayerName(value) {
  return normalizeClubName(value);
}

function parseFamousPlayerLabel(entry) {
  return String(entry ?? '')
    .split('—')[0]
    .trim();
}

/** Extra spotlight names when league hub copy is still thin after merge. */
const LEAGUE_SPOTLIGHT_EXTRAS = {
  mls: [
    'Lionel Messi',
    'Luis Suárez',
    'Rodrigo De Paul',
    'Marco Reus',
    'Jordan Morris',
    'Denis Bouanga',
    'Riqui Puig',
    'Aleksey Miranchuk',
  ],
  brasileirao: [
    'Neymar',
    'Hulk',
    'Memphis Depay',
    'Giorgian de Arrascaeta',
    'Gabriel Barbosa',
  ],
};

function nameTokens(value) {
  return normalizePlayerName(value).split(/\s+/).filter(Boolean);
}

function playerMatchesFamousLabel(player, famousLabel) {
  const playerTokens = nameTokens(player.name);
  const labelTokens = nameTokens(famousLabel);
  if (!playerTokens.length || !labelTokens.length) return false;

  if (playerTokens.join(' ') === labelTokens.join(' ')) return true;

  const shorter =
    playerTokens.length <= labelTokens.length ? playerTokens : labelTokens;
  const longer =
    playerTokens.length <= labelTokens.length ? labelTokens : playerTokens;

  // Avoid matching a single-token roster name to a multi-token famous label (e.g. Kevin → Kevin De Bruyne).
  if (shorter.length === 1 && longer.length > 1) return false;

  return shorter.every((token) => longer.includes(token));
}

function teamMatchesFamousLabel(team, famousLabel) {
  const teamNorm = normalizeClubName(team.name);
  const labelNorm = normalizeClubName(famousLabel);
  if (!teamNorm || !labelNorm) return false;
  return teamNorm === labelNorm || teamNorm.startsWith(labelNorm) || labelNorm.startsWith(teamNorm);
}

/**
 * @param {object} league
 * @param {object[]} leagueTeams
 * @param {object[]} leaguePlayers
 * @param {{ limit?: number }} [options]
 */
export function getLeagueFeaturedTeams(league, leagueTeams, leaguePlayers, options = {}) {
  const { limit = 6 } = options;
  const quizReady = getQuizEligiblePlayers(leaguePlayers);
  const quizCountByTeam = new Map();

  for (const player of quizReady) {
    quizCountByTeam.set(player.teamId, (quizCountByTeam.get(player.teamId) ?? 0) + 1);
  }

  const famousLabels = (league.famousClubs ?? []).map(parseFamousClubLabel);
  const famousTeamIds = new Set();

  for (const team of leagueTeams) {
    if (famousLabels.some((label) => teamMatchesFamousLabel(team, label))) {
      famousTeamIds.add(team.id);
    }
  }

  return [...leagueTeams]
    .map((team) => ({
      team,
      quizCount: quizCountByTeam.get(team.id) ?? 0,
      isFamous: famousTeamIds.has(team.id),
    }))
    .filter(({ quizCount, isFamous }) => quizCount > 0 || isFamous)
    .sort(
      (a, b) =>
        b.quizCount - a.quizCount ||
        Number(b.isFamous) - Number(a.isFamous) ||
        a.team.name.localeCompare(b.team.name),
    )
    .slice(0, limit)
    .map(({ team, quizCount }) => ({ team, quizCount }));
}

/**
 * League profile spotlight — prefer editorial famousPlayers, then importance score.
 * Keeps MLS marquees visible despite uniform generated importance scores.
 */
export function getLeagueSpotlightPlayers(league, leaguePlayers, options = {}) {
  const { limit = 6 } = options;
  const famousLabels = [
    ...(league.famousPlayers ?? []).map(parseFamousPlayerLabel),
    ...(LEAGUE_SPOTLIGHT_EXTRAS[league.id] ?? []),
  ];
  const picked = [];
  const pickedIds = new Set();

  for (const label of famousLabels) {
    const match = leaguePlayers.find(
      (player) => !pickedIds.has(player.id) && playerMatchesFamousLabel(player, label),
    );
    if (match) {
      picked.push(match);
      pickedIds.add(match.id);
    }
  }

  if (picked.length >= limit) return picked.slice(0, limit);

  const rest = [...leaguePlayers]
    .filter((player) => !pickedIds.has(player.id))
    .sort((a, b) => b.importanceScore - a.importanceScore);

  return [...picked, ...rest].slice(0, limit);
}

export function getLeagueTeamQuizCounts(leagueTeams, leaguePlayers) {
  const quizReady = getQuizEligiblePlayers(leaguePlayers);
  const counts = new Map();
  for (const player of quizReady) {
    counts.set(player.teamId, (counts.get(player.teamId) ?? 0) + 1);
  }
  return leagueTeams.map((team) => ({
    team,
    quizCount: counts.get(team.id) ?? 0,
  }));
}
