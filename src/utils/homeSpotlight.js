import { getTodayKey } from '../hooks/useDailyChallenge';
import { getManifestLeague } from '../data/contentManifest';
import { QUIZ_TYPE_OPTIONS } from './quizVariants';
import { getFeaturedPickPlayers, truncateNote } from './dailyFeatured';
import { isQuizEligiblePlayer } from './quizEligibility';

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

function seededPick(arr, dateKey, salt) {
  if (!arr.length) return null;
  const rng = makeRng(dateToSeed(dateKey, salt));
  return arr[Math.floor(rng() * arr.length)];
}

function teamHasQuizReadyPlayer(teamId, players) {
  return players.some((p) => p.teamId === teamId && isQuizEligiblePlayer(p));
}

/**
 * Five spotlight slides (player, club, league, rivalry, quiz) — deterministic per day + refresh salt.
 * @param {number} [refreshSalt] — bump when user taps refresh
 * @returns {Array<object>}
 */
export function getHomeSpotlightSlides(
  allPlayers,
  allTeams,
  allLeagues = [],
  dateKey = getTodayKey(),
  refreshSalt = 0,
) {
  const seedKey = `${dateKey}:${refreshSalt}`;
  const pickPlayers = getFeaturedPickPlayers(allPlayers);
  const quizPlayers = pickPlayers
    .filter(isQuizEligiblePlayer)
    .sort((a, b) => (b.importanceScore ?? 0) - (a.importanceScore ?? 0));

  const editorialTeams = allTeams.filter((team) =>
    teamHasQuizReadyPlayer(team.id, allPlayers),
  );
  const rivalryTeams = editorialTeams.filter((t) => Array.isArray(t.rivals) && t.rivals.length > 0);
  const leagues = Array.isArray(allLeagues) ? allLeagues : [];

  const slides = [];

  const player = seededPick(quizPlayers.length ? quizPlayers : pickPlayers, seedKey, 41);
  if (player) {
    slides.push({
      kind: 'player',
      label: 'Featured player',
      title: player.name,
      meta: [player.position, player._teamName].filter(Boolean).join(' · '),
      note: truncateNote(player.quickFact, 72),
      to: `/player/${player.id}`,
      player,
    });
  }

  const team = seededPick(editorialTeams, seedKey, 43);
  if (team) {
    const leagueName = getManifestLeague(team.leagueId)?.name ?? '';
    slides.push({
      kind: 'club',
      label: 'Featured club',
      title: team.name,
      meta: [leagueName, team.country].filter(Boolean).join(' · '),
      note: truncateNote(team.fanGuide || team.shortHistory, 72),
      to: `/team/${team.id}`,
      team,
    });
  }

  const league = seededPick(leagues, seedKey, 47);
  if (league) {
    slides.push({
      kind: 'league',
      label: 'Featured league',
      title: league.name,
      meta: league.country ?? '',
      note: truncateNote(league.description || league.styleOfPlay, 72),
      to: `/league/${league.id}`,
      league,
    });
  }

  const rivalryTeam = seededPick(rivalryTeams, seedKey, 53);
  if (rivalryTeam) {
    const opponent = rivalryTeam.rivals[0];
    slides.push({
      kind: 'rivalry',
      label: 'Rivalry',
      title: `${rivalryTeam.name} vs ${opponent}`,
      meta: rivalryTeam.country ?? '',
      note: truncateNote(rivalryTeam.fanGuide, 72),
      to: `/team/${rivalryTeam.id}`,
      team: rivalryTeam,
    });
  }

  const quizTypes = QUIZ_TYPE_OPTIONS.filter((o) => o.id !== 'club-legends');
  const quizType = seededPick(quizTypes, seedKey, 59) ?? QUIZ_TYPE_OPTIONS[0];
  const quizTeam = team ?? seededPick(editorialTeams, seedKey, 61);
  const quizHref = quizTeam
    ? `/quiz?team=${quizTeam.id}&poolFocus=club`
    : '/quiz';
  slides.push({
    kind: 'quiz',
    label: 'Featured quiz',
    title: quizType.label,
    meta: quizTeam?.name ?? 'All clubs',
    note: quizType.description,
    to: quizHref,
    quizType,
  });

  return slides;
}
