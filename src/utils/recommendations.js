import { collections } from '../data/collectionsData';
import { KNOWLEDGE_LEVELS } from '../data/preferencesOptions';
import { getCollectionProgress } from './collectionProgress';
import { getCollectionQuizHref } from './collections';
import { getTeamById, getTeamName, leagues, players, teams } from '../data/sampleData';

const DIFFICULTY_BY_LEVEL = {
  beginner: ['Beginner'],
  casual: ['Beginner', 'Intermediate'],
  serious: ['Intermediate', 'Advanced'],
  expert: ['Advanced', 'Intermediate'],
};

const GOAL_TAG_BOOSTS = {
  players: ['Position', 'Forwards', 'Future', 'Youth', 'Tactics', 'Creators'],
  clubs: ['Club', 'Premier League'],
  leagues: ['League', 'England', 'Europe'],
  history: ['History', 'Europe', 'World Cup', 'Champions League'],
  quizzes: ['Tactics', 'Champions League'],
};

const LIMITS = {
  players: 4,
  teams: 4,
  leagues: 2,
  collections: 3,
  quizzes: 4,
};

function pickTop(scored, limit) {
  const byHref = new Map();
  for (const entry of scored.sort((a, b) => b.score - a.score)) {
    if (entry.score <= 0 && scored.length > 1) continue;
    const key = entry.rec.href;
    const existing = byHref.get(key);
    if (!existing || entry.score > existing.score) {
      byHref.set(key, entry);
    }
    if (byHref.size >= limit) break;
  }
  return [...byHref.values()].map((e) => e.rec);
}

function playerMeta(player) {
  return `${player.position} · ${getTeamName(player.teamId)}`;
}

function buildPlayerRec(player, reason) {
  return {
    type: 'player',
    id: player.id,
    title: player.name,
    href: `/player/${player.id}`,
    meta: playerMeta(player),
    reason,
  };
}

function buildTeamRec(team, reason) {
  return {
    type: 'team',
    id: team.id,
    title: team.name,
    href: `/team/${team.id}`,
    meta: team.country,
    reason,
  };
}

function buildLeagueRec(league, reason) {
  return {
    type: 'league',
    id: league.id,
    title: league.name,
    href: `/league/${league.id}`,
    meta: league.country,
    reason,
  };
}

function buildCollectionRec(collection, reason, metaExtra = '') {
  return {
    type: 'collection',
    id: collection.id,
    title: collection.title,
    href: `/collections/${collection.id}`,
    meta: metaExtra || `${collection.difficulty} · ${collection.items.length} items`,
    reason,
  };
}

function buildQuizRec(label, href, reason) {
  return {
    type: 'quiz',
    title: label,
    href,
    meta: 'Quiz mode',
    reason,
  };
}

function scorePlayers(context) {
  const { preferences, favorites } = context;
  const prefs = preferences;
  const scored = [];
  const savedSet = new Set(favorites.players);
  const savedTeamSet = new Set(favorites.teams);

  for (const player of players) {
    let score = player.importanceScore / 20;
    let reason = 'Standout player worth knowing';

    if (savedSet.has(player.id)) {
      score += 12;
      reason = `Because you saved ${player.name}`;
    }
    if (savedTeamSet.has(player.teamId)) {
      score += 8;
      const team = getTeamById(player.teamId);
      reason = `Because you saved ${team?.name ?? 'this club'}`;
    }
    if (prefs?.favoriteClubIds.includes(player.teamId)) {
      score += 7;
      reason = `Recommended from your favorite club · ${getTeamName(player.teamId)}`;
    }
    if (prefs?.favoriteLeagueIds.includes(player.leagueId)) {
      score += 5;
      const league = leagues.find((l) => l.id === player.leagueId);
      reason = `Recommended from your favorite league · ${league?.name ?? 'league'}`;
    }
    if (prefs?.learningGoals.includes('players')) {
      score += 2;
      if (reason.startsWith('High-impact')) {
        reason = 'Matches your goal to learn players';
      }
    }

    scored.push({ score, rec: buildPlayerRec(player, reason) });
  }

  return scored;
}

function scoreTeams(context) {
  const { preferences, favorites, progression } = context;
  const prefs = preferences;
  const scored = [];
  const doneTeams = new Set(progression.completedTeamQuizzes);

  for (const team of teams) {
    let score = 1;
    let reason = 'Explore club history and squad';

    if (favorites.teams.includes(team.id)) {
      score += 12;
      reason = `Because you saved ${team.name}`;
    }
    if (prefs?.favoriteClubIds.includes(team.id)) {
      score += 9;
      reason = 'Recommended from your favorite club';
    }
    if (prefs?.favoriteLeagueIds.includes(team.leagueId)) {
      score += 6;
      const league = leagues.find((l) => l.id === team.leagueId);
      reason = `Recommended from your favorite league · ${league?.name ?? ''}`.trim();
    }
    if (prefs?.learningGoals.includes('clubs')) {
      score += 2;
    }
    if (!doneTeams.has(team.id) && (favorites.teams.includes(team.id) || prefs?.favoriteClubIds.includes(team.id))) {
      score += 3;
      reason = `Study ${team.name} — team quiz not completed yet`;
    }

    scored.push({ score, rec: buildTeamRec(team, reason) });
  }

  return scored;
}

function scoreLeagues(context) {
  const { preferences, progression } = context;
  const prefs = preferences;
  const scored = [];
  const doneLeagues = new Set(progression.completedLeagueQuizzes);

  for (const league of leagues) {
    let score = 1;
    let reason = 'Learn league structure and famous clubs';

    if (prefs?.favoriteLeagueIds.includes(league.id)) {
      score += 10;
      reason = 'Recommended from your favorite league';
    }
    if (prefs?.learningGoals.includes('leagues')) {
      score += 3;
      if (!prefs?.favoriteLeagueIds.includes(league.id)) {
        reason = 'Matches your goal to study leagues';
      }
    }
    if (!doneLeagues.has(league.id) && prefs?.favoriteLeagueIds.includes(league.id)) {
      score += 4;
      reason = `Study ${league.name} — league quiz not completed yet`;
    }

    scored.push({ score, rec: buildLeagueRec(league, reason) });
  }

  return scored;
}

function scoreCollections(context) {
  const { preferences, collectionState, favorites, recentViews = [] } = context;
  const prefs = preferences;
  const scored = [];
  const recentSet = new Set(recentViews.map((v) => `${v.type}:${v.id}`));
  const savedPlayers = new Set(favorites?.players ?? []);
  const savedTeams = new Set(favorites?.teams ?? []);

  for (const collection of collections) {
    const progress = getCollectionProgress(
      collection.id,
      collection.items.length,
      collectionState,
    );

    if (progress.collectionComplete) continue;

    let score = 2;
    let reason = 'Curated learning path';

    if (progress.learnedCount > 0) {
      score += 8 + progress.percent / 10;
      if (progress.percent >= 50) {
        reason = "You're close to finishing this collection";
      } else {
        reason = 'Continue this collection';
      }
    }

    if (prefs) {
      const allowed = prefs.knowledgeLevel
        ? DIFFICULTY_BY_LEVEL[prefs.knowledgeLevel] ?? []
        : [];
      if (allowed.includes(collection.difficulty)) score += 2;

      for (const goal of prefs.learningGoals) {
        const tags = GOAL_TAG_BOOSTS[goal] ?? [];
        if (collection.tags.some((t) => tags.includes(t))) score += 1;
      }

      for (const item of collection.items) {
        if (item.type === 'league' && prefs.favoriteLeagueIds.includes(item.id)) {
          score += 4;
          reason = 'Recommended from your favorite league';
        }
        if (item.type === 'team' && prefs.favoriteClubIds.includes(item.id)) {
          score += 4;
          reason = `Recommended from your favorite club`;
        }
      }
    }

    for (const item of collection.items) {
      if (item.type === 'player' && savedPlayers.has(item.id)) {
        score += 6;
        reason = 'Because you saved a player in this collection';
        break;
      }
      if (item.type === 'team' && savedTeams.has(item.id)) {
        score += 5;
        reason = 'Because you saved a club in this collection';
        break;
      }
      if (recentSet.has(`${item.type}:${item.id}`)) {
        score += 4;
        reason = 'Because it connects to something you viewed recently';
        break;
      }
    }

    const meta =
      progress.learnedCount > 0
        ? `${progress.learnedCount}/${progress.total} learned · ${progress.percent}%`
        : `${collection.difficulty} · ${collection.items.length} items`;

    scored.push({ score, rec: buildCollectionRec(collection, reason, meta) });
  }

  return scored;
}

function scoreQuizzes(context) {
  const { preferences, favorites, progression } = context;
  const prefs = preferences;
  const scored = [];
  const doneTeams = new Set(progression.completedTeamQuizzes);
  const doneLeagues = new Set(progression.completedLeagueQuizzes);
  const accuracy =
    progression.totalAnswered > 0
      ? progression.totalCorrect / progression.totalAnswered
      : null;

  if (accuracy !== null && accuracy < 0.55 && progression.totalAnswered >= 5) {
    scored.push({
      score: 9,
      rec: buildQuizRec('Practice quiz', '/quiz', 'Build accuracy — recent quiz performance'),
    });
  }

  for (const teamId of favorites.teams) {
    const team = getTeamById(teamId);
    if (!team || doneTeams.has(teamId)) continue;
    scored.push({
      score: 11,
      rec: buildQuizRec(`Quiz · ${team.name}`, `/quiz?team=${teamId}`, `Because you saved ${team.name}`),
    });
  }

  if (prefs) {
    for (const teamId of prefs.favoriteClubIds) {
      const team = getTeamById(teamId);
      if (!team || doneTeams.has(teamId)) continue;
      scored.push({
        score: 10,
        rec: buildQuizRec(
          `Quiz · ${team.name}`,
          `/quiz?team=${teamId}`,
          'Recommended from your favorite club',
        ),
      });
    }
    for (const leagueId of prefs.favoriteLeagueIds) {
      const league = leagues.find((l) => l.id === leagueId);
      if (!league || doneLeagues.has(leagueId)) continue;
      scored.push({
        score: 9,
        rec: buildQuizRec(
          `Quiz · ${league.name}`,
          `/quiz?league=${leagueId}`,
          'Recommended from your favorite league',
        ),
      });
    }
  }

  const topColEntries = scoreCollections(context)
    .sort((a, b) => b.score - a.score)
    .slice(0, 2);
  for (const entry of topColEntries) {
    const col = collections.find((c) => c.id === entry.rec.id);
    if (!col) continue;
    const href = getCollectionQuizHref(col.quizLaunch);
    scored.push({
      score: 7 + entry.score / 5,
      rec: buildQuizRec(`Quiz · ${col.title}`, href, 'Quiz linked to a collection for you'),
    });
  }

  if (prefs?.learningGoals.includes('quizzes') || !prefs) {
    scored.push({
      score: 5,
      rec: buildQuizRec('Daily challenge', '/daily', 'Quick daily practice'),
    });
  }

  if (scored.length === 0) {
    scored.push({
      score: 1,
      rec: buildQuizRec('Start a quiz', '/quiz', 'Test what you know'),
    });
  }

  return scored;
}

function hasPersonalizationSignals(context) {
  const { preferences, favorites, progression, collectionState } = context;
  if (preferences?.completed) return true;
  if (favorites.players.length > 0 || favorites.teams.length > 0) return true;
  if (progression.totalAnswered > 0) return true;
  if (collectionState.learned.length > 0 || collectionState.viewed.length > 0) {
    return true;
  }
  return false;
}

/**
 * Local learning recommendations from preferences, saves, quiz stats, and collection progress.
 */
export function getLearningRecommendations(context) {
  const playerScored = scorePlayers(context);
  const teamScored = scoreTeams(context);
  const leagueScored = scoreLeagues(context);
  const collectionScored = scoreCollections(context);
  const quizScored = scoreQuizzes(context);

  let collectionResults = pickTop(collectionScored, LIMITS.collections);
  if (collectionResults.length === 0) {
    collectionResults = collections
      .filter((c) => {
        const p = getCollectionProgress(c.id, c.items.length, context.collectionState);
        return !p.collectionComplete;
      })
      .slice(0, LIMITS.collections)
      .map((c) =>
        buildCollectionRec(c, 'Curated learning path', `${c.difficulty} · ${c.items.length} items`),
      );
  }

  return {
    players: pickTop(playerScored, LIMITS.players),
    teams: pickTop(teamScored, LIMITS.teams),
    leagues: pickTop(leagueScored, LIMITS.leagues),
    collections: collectionResults,
    quizzes: pickTop(quizScored, LIMITS.quizzes),
    hasSignals: hasPersonalizationSignals(context),
    knowledgeLabel: context.preferences?.knowledgeLevel
      ? KNOWLEDGE_LEVELS.find((l) => l.id === context.preferences.knowledgeLevel)?.label ?? ''
      : '',
  };
}
