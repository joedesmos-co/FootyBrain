import { getClubQuizCategoryById } from '../data/clubQuizCategories.js';
import { formatCountryLabel, getLeagueDisplayName } from './footballDisplay.js';

function normalizeAnswer(text) {
  return String(text ?? '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/ø/g, 'o')
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ');
}

export const CLUB_QUIZ_MIN_POOL = 4;
export const CLUB_QUIZ_SESSION_MILESTONE = 5;

const TROPHY_SNIPPET_RE =
  /champions league|premier league|world cup|euro|uefa|libertadores|copa|invincibles|treble|title|trophy|cup winner|serie a|la liga|bundesliga|eredivisie|ligue 1/i;

const KIT_CUE_PATTERNS = [
  /\b([A-Z][a-z]+(?:\s+and\s+[a-z]+)?)\s+(?:shirts?|kit|colours?|colors?)\b/,
  /\b(?:wear[s]?|in)\s+([a-z]+(?:\s+[a-z]+)?)\s+(?:shirts?|kit)\b/i,
  /\b([A-Z][a-z]+(?:\s+[a-z]+)?)\s+is the colour\b/i,
];

/** @param {string} text */
export function normalizeClubAnswer(text) {
  let n = normalizeAnswer(text);
  n = n
    .replace(/\b(fc|cf|ac|sc|afc|cfc|bfc|sv|vfb|vfl|rb|cd|ud|sd|real|inter)\b/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  return n;
}

/** @param {string} guess @param {string} clubName */
export function clubAnswersMatch(guess, clubName) {
  const g = normalizeClubAnswer(guess);
  const c = normalizeClubAnswer(clubName);
  if (!g || !c) return false;
  if (g === c) return true;
  if (g.length >= 10 && (c.includes(g) || g.includes(c))) return true;
  return false;
}

function hashSeed(...parts) {
  const str = parts.join('|');
  let h = 0;
  for (let i = 0; i < str.length; i += 1) {
    h = (h * 31 + str.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

function shuffleWithSeed(items, seed) {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = (seed + i * 17) % (i + 1);
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function isEditorialClub(team) {
  return team?.leagueId && team.leagueId !== 'external';
}

function filterTeams(teams, { leagueId } = {}) {
  let pool = teams.filter(isEditorialClub);
  if (leagueId) pool = pool.filter((t) => t.leagueId === leagueId);
  return pool;
}

function teamsWithUniqueStadium(teams) {
  const seen = new Set();
  return teams.filter((t) => {
    const key = String(t.stadium ?? '')
      .trim()
      .toLowerCase();
    if (key.length < 4 || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function parseLegendName(line) {
  const raw = String(line ?? '').trim();
  if (!raw) return null;
  const m = raw.match(/^([^—–-]+)/);
  const name = (m ? m[1] : raw).trim();
  return name.length >= 4 ? name : null;
}

function extractKitCue(fanGuide) {
  const text = String(fanGuide ?? '');
  for (const re of KIT_CUE_PATTERNS) {
    const m = text.match(re);
    if (m?.[1]) {
      const cue = m[1].trim();
      if (cue.length >= 3 && cue.length <= 40) return cue;
    }
  }
  return null;
}

function extractTrophySnippet(shortHistory) {
  const text = String(shortHistory ?? '');
  const sentences = text.split(/(?<=[.!?])\s+/).filter((s) => s.length > 24);
  return (
    sentences.find((s) => TROPHY_SNIPPET_RE.test(s)) ??
    sentences.find((s) => TROPHY_SNIPPET_RE.test(s.slice(0, 120))) ??
    null
  );
}

function extractHistorySnippet(shortHistory) {
  const text = String(shortHistory ?? '').trim();
  if (text.length < 50) return null;
  const sentences = text.split(/(?<=[.!?])\s+/).filter((s) => s.length > 35);
  if (!sentences.length) return text.length <= 220 ? text : `${text.slice(0, 200).trimEnd()}…`;
  const withYear = sentences.find((s) => /\b(19|20)\d{2}\b/.test(s));
  return withYear ?? sentences[0];
}

function buildTeamNameIndex(teams) {
  const index = new Map();
  for (const team of teams) {
    index.set(normalizeClubAnswer(team.name), team);
  }
  return index;
}

function resolveRivalTeam(rivalName, teams, nameIndex) {
  const n = normalizeClubAnswer(rivalName);
  if (nameIndex.has(n)) return nameIndex.get(n);
  return (
    teams.find((t) => {
      const tn = normalizeClubAnswer(t.name);
      return tn.includes(n) || n.includes(tn);
    }) ?? null
  );
}

/**
 * @param {any[]} teams
 * @param {{ leagueId?: string }} [filters]
 */
export function getClubQuizEligibleTeams(teams, categoryId, filters = {}) {
  const pool = filterTeams(teams, filters);
  const cat = getClubQuizCategoryById(categoryId);
  if (!cat) return [];

  switch (cat.id) {
    case 'stadium':
      return teamsWithUniqueStadium(pool.filter((t) => String(t.stadium ?? '').trim().length > 4));
    case 'league':
      return pool.filter((t) => t.leagueId);
    case 'rivalry':
      return pool.filter((t) => Array.isArray(t.rivals) && t.rivals.length > 0);
    case 'country':
      return pool.filter((t) => String(t.country ?? '').trim().length > 1);
    case 'player-to-club':
      return pool.filter(
        (t) =>
          (Array.isArray(t.legends) && t.legends.length > 0) ||
          (Array.isArray(t.currentKeyPlayers) && t.currentKeyPlayers.length > 0),
      );
    case 'history':
      return pool.filter((t) => String(t.shortHistory ?? '').trim().length >= 50);
    case 'trophy':
      return pool.filter((t) => extractTrophySnippet(t.shortHistory));
    case 'kit':
      return pool.filter((t) => extractKitCue(t.fanGuide));
    default:
      return [];
  }
}

export function countClubQuizPool(teams, categoryId, filters = {}) {
  return getClubQuizEligibleTeams(teams, categoryId, filters).length;
}

export function getClubQuizChoiceCount(difficulty) {
  if (difficulty === 'hardcore') return 0;
  if (difficulty === 'nerd') return 6;
  return 4;
}

export function usesClubQuizMultipleChoice(difficulty) {
  return getClubQuizChoiceCount(difficulty) > 0;
}

function pickDistractorTeams(correctTeam, pool, count, seed, { preferSameLeague = false } = {}) {
  const others = pool.filter((t) => t.id !== correctTeam.id);
  const sameLeague = others.filter((t) => t.leagueId === correctTeam.leagueId);
  const bucket =
    preferSameLeague && sameLeague.length >= count ? sameLeague : others.length >= count ? others : pool;
  const shuffled = shuffleWithSeed(bucket.filter((t) => t.id !== correctTeam.id), seed);
  return shuffled.slice(0, count);
}

function buildChoices(correctTeam, pool, difficulty, seed) {
  const choiceCount = getClubQuizChoiceCount(difficulty);
  if (choiceCount === 0) return null;
  const distractors = pickDistractorTeams(correctTeam, pool, choiceCount - 1, seed, {
    preferSameLeague: difficulty === 'nerd' || difficulty === 'hard',
  });
  const choices = shuffleWithSeed([correctTeam, ...distractors], seed + 1).map((t) => ({
    id: t.id,
    label: t.name,
  }));
  return choices;
}

/**
 * @typedef {{
 *   id: string,
 *   categoryId: string,
 *   prompt: string,
 *   subPrompt?: string,
 *   choices: { id: string, label: string }[] | null,
 *   correctTeamId: string,
 *   correctChoiceId: string,
 *   correctLabel: string,
 *   explanation?: string,
 *   difficulty: string,
 * }} ClubQuizQuestion
 */

/**
 * @param {any[]} teams
 * @param {any[]} leagues
 * @param {string} categoryId
 * @param {{ difficulty?: string, leagueId?: string, excludeTeamIds?: string[], seed?: number }} opts
 * @returns {ClubQuizQuestion | null}
 */
export function generateClubQuizQuestion(teams, leagues, categoryId, opts = {}) {
  const {
    difficulty = 'medium',
    leagueId = '',
    excludeTeamIds = [],
    seed = Date.now(),
  } = opts;
  const pool = getClubQuizEligibleTeams(teams, categoryId, { leagueId }).filter(
    (t) => !excludeTeamIds.includes(t.id),
  );
  if (pool.length < CLUB_QUIZ_MIN_POOL) return null;

  const cat = getClubQuizCategoryById(categoryId);
  if (!cat) return null;

  const team = pool[seed % pool.length];
  const leagueById = new Map(leagues.map((l) => [l.id, l]));
  const nameIndex = buildTeamNameIndex(teams);

  /** @type {ClubQuizQuestion | undefined} */
  let question;

  switch (cat.id) {
    case 'stadium': {
      question = {
        id: `stadium-${team.id}-${seed}`,
        categoryId: cat.id,
        prompt: 'Which club plays at this stadium?',
        subPrompt:
          difficulty === 'easy'
            ? `${team.stadium} (${formatCountryLabel(team.country)})`
            : team.stadium,
        choices: buildChoices(team, pool, difficulty, seed),
        correctTeamId: team.id,
        correctChoiceId: team.id,
        correctLabel: team.name,
        explanation: `${team.name} — ${team.stadium}`,
        difficulty,
      };
      break;
    }
    case 'league': {
      const leagueName = getLeagueDisplayName(leagueById.get(team.leagueId) ?? { id: team.leagueId });
      const leagueChoices = shuffleWithSeed(
        leagues.filter((l) => l.id !== 'external'),
        seed,
      )
        .slice(0, getClubQuizChoiceCount(difficulty) - 1)
        .map((l) => ({ id: l.id, label: getLeagueDisplayName(l) }));
      const correctChoice = { id: team.leagueId, label: leagueName };
      const choices =
        difficulty === 'hardcore'
          ? null
          : shuffleWithSeed(
              [
                correctChoice,
                ...leagueChoices.filter((c) => c.id !== team.leagueId),
              ].slice(0, getClubQuizChoiceCount(difficulty)),
              seed + 2,
            );
      question = {
        id: `league-${team.id}-${seed}`,
        categoryId: cat.id,
        prompt: 'Which league is this club in?',
        subPrompt: team.name,
        choices,
        correctTeamId: team.id,
        correctChoiceId: team.leagueId,
        correctLabel: leagueName,
        explanation: `${team.name} play in ${leagueName}.`,
        difficulty,
      };
      break;
    }
    case 'country': {
      const countries = [
        ...new Set(
          pool.map((t) => formatCountryLabel(t.country)).filter((c) => c && c !== '—'),
        ),
      ];
      const correctCountry = formatCountryLabel(team.country);
      const countryChoiceId = `country-${normalizeClubAnswer(correctCountry)}`;
      const distractorCountries = shuffleWithSeed(
        countries.filter((c) => c !== correctCountry),
        seed,
      ).slice(0, getClubQuizChoiceCount(difficulty) - 1);
      const choices =
        difficulty === 'hardcore'
          ? null
          : shuffleWithSeed(
              [
                { id: countryChoiceId, label: correctCountry },
                ...distractorCountries.map((c) => ({
                  id: `country-${normalizeClubAnswer(c)}`,
                  label: c,
                })),
              ],
              seed + 1,
            );
      question = {
        id: `country-${team.id}-${seed}`,
        categoryId: cat.id,
        prompt: 'Which country is this club based in?',
        subPrompt: team.name,
        choices,
        correctTeamId: team.id,
        correctChoiceId: countryChoiceId,
        correctLabel: correctCountry,
        explanation: `${team.name} — ${correctCountry}`,
        difficulty,
      };
      break;
    }
    case 'rivalry': {
      const rivalName = team.rivals[seed % team.rivals.length];
      const rivalTeam = resolveRivalTeam(rivalName, teams, nameIndex);
      const askListedRival = seed % 2 === 0 && rivalTeam;
      if (askListedRival) {
        question = {
          id: `rivalry-listed-${team.id}-${seed}`,
          categoryId: cat.id,
          prompt: 'Which club lists this team among its rivals?',
          subPrompt: rivalTeam.name,
          choices: buildChoices(team, pool, difficulty, seed),
          correctTeamId: team.id,
          correctChoiceId: team.id,
          correctLabel: team.name,
          explanation: `${team.name} ↔ ${rivalTeam.name}`,
          difficulty,
        };
      } else {
        const correctRival =
          team.rivals.find((r) => normalizeClubAnswer(r) === normalizeClubAnswer(rivalName)) ??
          rivalName;
        const correctChoiceId = `rival-${normalizeClubAnswer(correctRival)}`;
        const rivalDistractors = shuffleWithSeed(
          [
            ...new Set(
              pool
                .flatMap((t) => (Array.isArray(t.rivals) ? t.rivals : []))
                .filter((r) => normalizeClubAnswer(r) !== normalizeClubAnswer(correctRival)),
            ),
          ],
          seed,
        ).slice(0, getClubQuizChoiceCount(difficulty) - 1);
        const choices =
          difficulty === 'hardcore'
            ? null
            : shuffleWithSeed(
                [
                  { id: correctChoiceId, label: correctRival },
                  ...rivalDistractors.map((r) => ({
                    id: `rival-${normalizeClubAnswer(r)}`,
                    label: r,
                  })),
                ],
                seed + 3,
              );
        question = {
          id: `rivalry-name-${team.id}-${seed}`,
          categoryId: cat.id,
          prompt: `Name a rival of ${team.name}`,
          subPrompt: 'Pick from the list',
          choices,
          correctTeamId: team.id,
          correctChoiceId,
          correctLabel: correctRival,
          explanation: `${team.name} — rivals include ${team.rivals.slice(0, 3).join(', ')}`,
          difficulty,
        };
      }
      break;
    }
    case 'player-to-club': {
      const lines = [
        ...(Array.isArray(team.legends) ? team.legends : []),
        ...(Array.isArray(team.currentKeyPlayers) ? team.currentKeyPlayers : []),
      ];
      const line = lines[seed % lines.length];
      const playerName = parseLegendName(line);
      if (!playerName) return null;
      question = {
        id: `player-club-${team.id}-${seed}`,
        categoryId: cat.id,
        prompt: 'Which club is this player associated with?',
        subPrompt: playerName,
        choices: buildChoices(team, pool, difficulty, seed),
        correctTeamId: team.id,
        correctChoiceId: team.id,
        correctLabel: team.name,
        explanation: line,
        difficulty,
      };
      break;
    }
    case 'history': {
      const snippet = extractHistorySnippet(team.shortHistory);
      if (!snippet) return null;
      question = {
        id: `history-${team.id}-${seed}`,
        categoryId: cat.id,
        prompt: 'Which club matches this history snippet?',
        subPrompt: snippet,
        choices: buildChoices(team, pool, difficulty, seed),
        correctTeamId: team.id,
        correctChoiceId: team.id,
        correctLabel: team.name,
        difficulty,
      };
      break;
    }
    case 'trophy': {
      const snippet = extractTrophySnippet(team.shortHistory);
      if (!snippet) return null;
      question = {
        id: `trophy-${team.id}-${seed}`,
        categoryId: cat.id,
        prompt: 'Which club matches this achievement clue?',
        subPrompt: snippet,
        choices: buildChoices(team, pool, difficulty, seed),
        correctTeamId: team.id,
        correctChoiceId: team.id,
        correctLabel: team.name,
        difficulty,
      };
      break;
    }
    case 'kit': {
      const cue = extractKitCue(team.fanGuide);
      if (!cue) return null;
      question = {
        id: `kit-${team.id}-${seed}`,
        categoryId: cat.id,
        prompt: 'Which club is known for these kit colours?',
        subPrompt: cue.charAt(0).toUpperCase() + cue.slice(1),
        choices: buildChoices(team, pool, difficulty, seed),
        correctTeamId: team.id,
        correctChoiceId: team.id,
        correctLabel: team.name,
        explanation: team.fanGuide ? truncateForExplanation(team.fanGuide) : undefined,
        difficulty,
      };
      break;
    }
    default:
      return null;
  }

  if (!question) return null;
  if (question.choices && question.choices.length < 2) return null;
  return question;
}

function truncateForExplanation(text, max = 160) {
  const t = String(text ?? '').trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max).trimEnd()}…`;
}

export function gradeClubQuizAnswer(question, answer, { choiceId } = {}) {
  if (!question) return false;
  if (question.choices?.length && choiceId) {
    return choiceId === question.correctChoiceId;
  }
  if (question.categoryId === 'league') {
    return (
      normalizeClubAnswer(answer) === normalizeClubAnswer(question.correctLabel) ||
      clubAnswersMatch(answer, question.correctLabel)
    );
  }
  if (question.categoryId === 'country') {
    return normalizeClubAnswer(answer) === normalizeClubAnswer(question.correctLabel);
  }
  return clubAnswersMatch(answer, question.correctLabel);
}

export function pickNextClubQuestionSeed(sessionIndex, lastId) {
  return hashSeed('club-quiz', sessionIndex, lastId ?? '', Date.now() % 10000);
}
