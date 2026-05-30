import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { canonicalUrlForPath } from '../utils/brand';
import { applyPageSeo, buildQuizSeoFromSearchParams } from '../utils/seoCtr.js';
import { getQuizThemeById, QUIZ_THEME_CATALOG } from '../data/quizThemes';
import { getRecommendedNextQuizzes } from '../utils/quizRecommendations';
import {
  buildThemedQuizPool,
  getAllThemePoolCounts,
  getPlayerRarity,
  pickWeightedQuizPlayer,
} from '../utils/quizThemePools';
import { useQuizRegistry } from '../hooks/useQuizRegistry';
import { useProgression } from '../hooks/useProgression';
import {
  formatMilestoneMessage,
  formatQuizXpFeedback,
} from '../utils/progressionFeedback';
import { getAchievementById } from '../data/achievements';
import {
  answersMatch,
  buildAmbiguousLastNames,
  buildQuizPlayerPool,
  getClueFactsForQuestion,
  getInitialHintCount,
  getMaxVisibleQuizHints,
  getWrongAnswerTip,
  getPoolFocusHint,
  requiresFullNameMatch,
  getQuizClubEmptyState,
  getQuizCountryEmptyState,
  getQuizInternationalEmptyState,
  buildWhoAmIClueSteps,
  countPlayersForQuizType,
  getCareerPathTimeline,
  getQuizPromptForType,
  getQuizVariantClue,
  getQuizVariantContext,
  isProgressiveQuizType,
  isQuizSessionPoolViable,
  usesCareerTimeline,
  QUIZ_DIFFICULTY_OPTIONS,
  QUIZ_MIN_SESSION_POOL,
  QUIZ_POOL_FOCUS_OPTIONS,
  QUIZ_POSITION_BUCKETS,
  QUIZ_TIMED_PRESETS,
  QUIZ_TYPE_OPTIONS,
} from '../utils/quizSession';
import { isWorldCupQuizPrepParam } from '../data/worldCupQuizConstants';
import { formatPosition, getLeagueDisplayName } from '../utils/footballDisplay';
import PlayerAutocomplete from './PlayerAutocomplete';
import QuizRegistryLoadState from './QuizRegistryLoadState';
import ShareButton from './ShareButton';
import QuizSubNav from './QuizSubNav';
import { getCollectionsFeaturingEntity } from '../utils/collectionDiscovery';
import {
  buildMissedPlayerStudyCards,
  getMissedLearningIntro,
} from '../utils/quizMissedLearning';
import {
  getIncorrectMomentumCopy,
  getNextQuestionButtonLabel,
  getOneMoreQuizNudge,
  getSessionEncouragement,
  getSessionEndHeadline,
  getStreakMilestoneCopy,
  getStreakMilestoneLabel,
  getStreakTier,
  scrollPageTop,
  scrollQuizPanelIntoView,
} from '../utils/quizUiPolish';
import QuizFeedbackActions from './QuizFeedbackActions';
import QuizPlayerFeedback from './QuizPlayerFeedback';

// TODO: Future Firebase sync — persist quiz session history and scores under
//       users/{uid}/quizSessions so progress carries across devices.

const SESSION_MILESTONE = 5;

function computeSessionCategoryInsights(sessionResults, getTeamName, leagueById) {
  const buckets = new Map();

  for (const { player, isCorrect } of sessionResults) {
    const categories = [
      {
        key: `pos:${player.position}`,
        label: formatPosition(player.position) || 'By position',
      },
      {
        key: `league:${player.leagueId}`,
        label: leagueById?.get(player.leagueId)?.name ?? 'By league',
      },
      {
        key: `club:${player.teamId}`,
        label: getTeamName(player.teamId),
      },
    ];

    for (const cat of categories) {
      const prev = buckets.get(cat.key) || { label: cat.label, correct: 0, total: 0 };
      buckets.set(cat.key, {
        label: cat.label,
        correct: prev.correct + (isCorrect ? 1 : 0),
        total: prev.total + 1,
      });
    }
  }

  const stats = [...buckets.values()].filter((row) => row.total >= 2);
  if (stats.length === 0) return { strongest: null, weakest: null };

  stats.sort((a, b) => b.correct / b.total - a.correct / b.total);
  const strongest = stats[0];
  const weakest =
    stats.length > 1 && stats[stats.length - 1].label !== strongest.label
      ? stats[stats.length - 1]
      : null;

  return { strongest, weakest };
}

export default function QuizMode() {
  const quizRegistry = useQuizRegistry();
  if (quizRegistry.status !== 'ready' || !quizRegistry.registry) {
    return (
      <QuizRegistryLoadState
        status={quizRegistry.status}
        onRetry={quizRegistry.retry}
        loadingLabel="Loading quiz…"
        pageClass="quiz-page"
      />
    );
  }

  return (
    <QuizModeLoaded
      registry={quizRegistry.registry}
      teamById={quizRegistry.teamById}
      leagueById={quizRegistry.leagueById}
    />
  );
}

function QuizModeLoaded({ registry, teamById, leagueById }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const requestedThemeId = searchParams.get('theme') ?? '';
  const activeTheme = useMemo(
    () => getQuizThemeById(requestedThemeId),
    [requestedThemeId],
  );
  const requestedTeamId = searchParams.get('team') ?? '';
  const requestedLeagueId = searchParams.get('league') ?? '';
  const requestedNationalTeamId = searchParams.get('nationalTeam') ?? '';
  const requestedPoolFocus = searchParams.get('poolFocus') ?? '';
  const worldCupPrep = isWorldCupQuizPrepParam(searchParams.get('worldCup'));
  const teams = useMemo(() => registry?.teams ?? [], [registry]);
  const leagues = useMemo(() => registry?.leagues ?? [], [registry]);
  const players = useMemo(() => registry?.players ?? [], [registry]);
  const liveNationalTeams = useMemo(() => registry?.national?.nationalTeams ?? [], [registry]);
  const liveNationalTeamIds = useMemo(
    () => new Set(registry?.national?.liveNationalTeamIds ?? []),
    [registry],
  );
  const getTeamName = useCallback(
    (teamId) => teamById?.get(teamId)?.name ?? 'Unknown',
    [teamById],
  );
  const getLeagueName = useCallback(
    (leagueId) => leagueById?.get(leagueId)?.name ?? 'Unknown',
    [leagueById],
  );

  const requestedTeam = useMemo(
    () => teams.find((team) => team.id === requestedTeamId),
    [requestedTeamId, teams],
  );
  const requestedLeague = useMemo(
    () => (leagues.some((league) => league.id === requestedLeagueId) ? requestedLeagueId : ''),
    [requestedLeagueId, leagues],
  );
  const requestedNationalTeam = useMemo(
    () =>
      liveNationalTeamIds.has(requestedNationalTeamId) ? requestedNationalTeamId : '',
    [requestedNationalTeamId, liveNationalTeamIds],
  );

  const themePreset = activeTheme?.preset;

  const initialPoolFocus =
    requestedPoolFocus === 'international'
      ? 'international'
      : themePreset?.poolFocus
        ? themePreset.poolFocus
        : requestedNationalTeam
          ? 'national'
          : requestedTeam
            ? 'club'
            : requestedLeague
              ? 'league'
              : 'all';
  const initialLeagueFilter = requestedNationalTeam
    ? ''
    : (themePreset?.leagueId ?? requestedTeam?.leagueId ?? requestedLeague);
  const initialTeamFilter = requestedNationalTeam || themePreset?.leagueId ? '' : (requestedTeam?.id ?? '');
  const initialNationalTeamFilter = themePreset?.nationalTeamId ?? requestedNationalTeam;

  const requestedDifficulty = searchParams.get('difficulty');
  const initialDifficulty = QUIZ_DIFFICULTY_OPTIONS.some((o) => o.id === requestedDifficulty)
    ? requestedDifficulty
    : activeTheme?.defaultDifficulty ?? 'medium';

  const [poolFocus, setPoolFocus] = useState(initialPoolFocus);
  const [leagueFilter, setLeagueFilter] = useState(initialLeagueFilter);
  const [teamFilter, setTeamFilter] = useState(initialTeamFilter);
  const [nationalTeamFilter, setNationalTeamFilter] = useState(initialNationalTeamFilter);
  const [positionFilter, setPositionFilter] = useState('');
  const [difficulty, setDifficulty] = useState(initialDifficulty);
  const [quizType, setQuizType] = useState('classic');
  const [revealedStep, setRevealedStep] = useState(0);
  const [timeLimitSeconds, setTimeLimitSeconds] = useState(0);
  const [currentPlayer, setCurrentPlayer] = useState(null);
  const [hintsShown, setHintsShown] = useState(1);
  const [answer, setAnswer] = useState('');
  const [feedback, setFeedback] = useState(null);
  const [lastXpFeedback, setLastXpFeedback] = useState('');
  const [milestoneMessage, setMilestoneMessage] = useState('');
  const [achievementToast, setAchievementToast] = useState('');
  const [secondsLeft, setSecondsLeft] = useState(null);
  const [score, setScore] = useState({
    correct: 0,
    incorrect: 0,
    totalAnswered: 0,
  });
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [timedOut, setTimedOut] = useState(false);
  const [sessionResults, setSessionResults] = useState(() => []);
  const [sessionEnded, setSessionEnded] = useState(false);

  const sessionMilestoneRef = useRef(false);
  const lastQuestionPlayerIdRef = useRef(null);
  const askedPlayerIdsRef = useRef(new Set());
  const handleTimeoutRef = useRef(() => {});
  const progression = useProgression();

  const filterState = useMemo(
    () => ({ poolFocus, leagueFilter, teamFilter, positionFilter, nationalTeamFilter }),
    [poolFocus, leagueFilter, teamFilter, positionFilter, nationalTeamFilter],
  );

  const themePoolContext = useMemo(() => ({ teams, difficulty }), [teams, difficulty]);
  const themePoolCounts = useMemo(
    () => getAllThemePoolCounts(players, themePoolContext),
    [players, themePoolContext],
  );

  const viableCountryQuizMetas = useMemo(
    () => {
      if (poolFocus !== 'international') return [];
      const idsByTeam = registry?.national?.quizReadyPlayerIdsByNationalTeamId ?? {};
      const teams = registry?.national?.nationalTeams ?? [];
      return teams
        .map((team) => ({
          nationalTeamId: team.id,
          displayName: team.displayName,
          quizReadyCount: (idsByTeam[team.id] ?? []).length,
          isViable: (idsByTeam[team.id] ?? []).length >= QUIZ_MIN_SESSION_POOL,
        }))
        .filter((meta) => meta.isViable);
    },
    [poolFocus, registry],
  );

  const selectedNationalTeam = useMemo(
    () =>
      nationalTeamFilter
        ? (registry?.national?.nationalTeams ?? []).find((t) => t.id === nationalTeamFilter) ??
          null
        : null,
    [nationalTeamFilter, registry],
  );

  const leaguesForFilter = useMemo(() => {
    const leagueIdsWithQuizPlayers = new Set(players.map((p) => p.leagueId).filter(Boolean));
    return leagues.filter(
      (league) => league.id === 'external' || leagueIdsWithQuizPlayers.has(league.id),
    );
  }, [leagues, players]);

  const teamsInLeague = useMemo(() => {
    if (!leagueFilter) return teams;
    return teams.filter((t) => t.leagueId === leagueFilter);
  }, [leagueFilter, teams]);

  const variantContext = useMemo(
    () => getQuizVariantContext(filterState, teams),
    [filterState, teams],
  );

  const basePoolForModes = useMemo(
    () => buildQuizPlayerPool(players, filterState, 'classic', {}, difficulty),
    [players, filterState, difficulty],
  );

  const modeCounts = useMemo(() => {
    const counts = {};
    for (const option of QUIZ_TYPE_OPTIONS) {
      counts[option.id] = countPlayersForQuizType(
        basePoolForModes,
        option.id,
        variantContext,
      );
    }
    return counts;
  }, [basePoolForModes, variantContext]);

  const themedSourcePool = useMemo(() => {
    if (!activeTheme) return null;
    return buildThemedQuizPool(players, activeTheme.id, themePoolContext);
  }, [activeTheme, players, themePoolContext]);

  const playerPool = useMemo(() => {
    const source = themedSourcePool ?? players;
    return buildQuizPlayerPool(source, filterState, quizType, variantContext, difficulty);
  }, [themedSourcePool, players, filterState, quizType, variantContext, difficulty]);

  const ambiguousLastNames = useMemo(
    () => buildAmbiguousLastNames(playerPool),
    [playerPool],
  );

  useEffect(() => {
    const seo = buildQuizSeoFromSearchParams(searchParams, { poolSize: playerPool.length });
    applyPageSeo({
      ...seo,
      canonicalUrl: canonicalUrlForPath('/quiz'),
      robots: 'index,follow',
    });
  }, [searchParams, playerPool.length]);

  const resetSessionStats = useCallback(() => {
    setScore({ correct: 0, incorrect: 0, totalAnswered: 0 });
    setStreak(0);
    setBestStreak(0);
    setSessionResults([]);
    setSessionEnded(false);
    sessionMilestoneRef.current = false;
    askedPlayerIdsRef.current = new Set();
    lastQuestionPlayerIdRef.current = null;
  }, []);

  const initialHintsForQuestion = useCallback(
    (nextDifficulty = difficulty) =>
      quizType === 'classic' ? getInitialHintCount(nextDifficulty) : 0,
    [quizType, difficulty],
  );

  const resetCurrentQuestion = useCallback((nextDifficulty = difficulty) => {
    setCurrentPlayer(null);
    setHintsShown(initialHintsForQuestion(nextDifficulty));
    setRevealedStep(0);
    setAnswer('');
    setFeedback(null);
    setLastXpFeedback('');
    setMilestoneMessage('');
    setAchievementToast('');
    setSecondsLeft(null);
    setTimedOut(false);
  }, [difficulty, initialHintsForQuestion]);

  const startQuestion = useCallback(() => {
    const next = pickWeightedQuizPlayer(
      playerPool,
      lastQuestionPlayerIdRef.current ?? '',
      difficulty,
      askedPlayerIdsRef.current,
    );
    if (next?.id) askedPlayerIdsRef.current.add(next.id);
    lastQuestionPlayerIdRef.current = next?.id ?? null;
    setCurrentPlayer(next);
    setHintsShown(initialHintsForQuestion(difficulty));
    setRevealedStep(0);
    setAnswer('');
    setFeedback(null);
    setTimedOut(false);
    setLastXpFeedback('');
    setMilestoneMessage('');
    setAchievementToast('');
    if (timeLimitSeconds > 0) {
      setSecondsLeft(timeLimitSeconds);
    } else {
      setSecondsLeft(null);
    }
    scrollQuizPanelIntoView();
  }, [difficulty, initialHintsForQuestion, playerPool, timeLimitSeconds]);

  const recordAnswer = useCallback(
    (isCorrect) => {
      if (!currentPlayer || feedback) return;

      const newStreak = isCorrect ? streak + 1 : 0;
      const newBest = Math.max(bestStreak, newStreak);
      const newTotal = score.totalAnswered + 1;
      const newCorrect = score.correct + (isCorrect ? 1 : 0);

      let sessionMilestone = null;
      if (newTotal >= SESSION_MILESTONE && !sessionMilestoneRef.current) {
        sessionMilestoneRef.current = true;
        sessionMilestone = {
          teamId: teamFilter || undefined,
          leagueId: leagueFilter || undefined,
          correct: newCorrect,
          total: newTotal,
        };
      }

      const xpResult = progression.recordAnswer({
        isCorrect,
        newSessionStreak: newStreak,
        sessionMilestone,
      });

      setFeedback(isCorrect ? 'correct' : 'incorrect');
      setScore((s) => ({
        correct: s.correct + (isCorrect ? 1 : 0),
        incorrect: s.incorrect + (isCorrect ? 0 : 1),
        totalAnswered: s.totalAnswered + 1,
      }));
      setSessionResults((prev) => [
        ...prev,
        { player: currentPlayer, isCorrect, timedOut: Boolean(timedOut) },
      ]);
      setStreak(newStreak);
      setBestStreak(newBest);
      setLastXpFeedback(isCorrect ? formatQuizXpFeedback(xpResult) : '');
      setMilestoneMessage(formatMilestoneMessage(xpResult) ?? '');
      const firstUnlock = xpResult.newAchievementIds?.[0];
      if (firstUnlock) {
        const achievement = getAchievementById(firstUnlock);
        setAchievementToast(
          achievement ? `Achievement: ${achievement.label}` : `Achievement unlocked`,
        );
      } else {
        setAchievementToast('');
      }
      setSecondsLeft(null);
    },
    [
      bestStreak,
      currentPlayer,
      feedback,
      leagueFilter,
      progression,
      score.correct,
      score.totalAnswered,
      streak,
      teamFilter,
      timedOut,
    ],
  );

  const handleCheckAnswer = (e) => {
    e.preventDefault();
    if (!currentPlayer || feedback || !answer.trim()) return;
    setTimedOut(false);
    const isCorrect = answersMatch(answer, currentPlayer.name, ambiguousLastNames, {
      requireFullName: requiresFullNameMatch(difficulty),
    });
    recordAnswer(isCorrect);
  };

  const handleTimeout = useCallback(() => {
    if (!currentPlayer || feedback) return;
    setTimedOut(true);
    recordAnswer(false);
  }, [currentPlayer, feedback, recordAnswer]);

  useEffect(() => {
    handleTimeoutRef.current = handleTimeout;
  }, [handleTimeout]);

  useEffect(() => {
    if (!timeLimitSeconds || !currentPlayer || feedback) {
      return undefined;
    }

    let remaining = timeLimitSeconds;
    const intervalId = window.setInterval(() => {
      remaining -= 1;
      if (remaining <= 0) {
        window.clearInterval(intervalId);
        setSecondsLeft(0);
        handleTimeoutRef.current();
        return;
      }
      setSecondsLeft(remaining);
    }, 1000);

    return () => window.clearInterval(intervalId);
  }, [currentPlayer, feedback, timeLimitSeconds]);

  const handlePoolFocusChange = (value) => {
    setPoolFocus(value);
    if (value === 'league') {
      setTeamFilter('');
      setPositionFilter('');
    } else if (value === 'club') {
      setPositionFilter('');
    } else if (value === 'national') {
      setLeagueFilter('');
      setTeamFilter('');
      setPositionFilter('');
    } else if (value === 'international') {
      setLeagueFilter('');
      setTeamFilter('');
      setPositionFilter('');
    } else if (value === 'position') {
      setLeagueFilter('');
      setTeamFilter('');
      setNationalTeamFilter('');
    }
    if (quizType === 'club-legends' && value !== 'club' && value !== 'all') {
      setQuizType('classic');
    }
    resetCurrentQuestion();
    resetSessionStats();
  };

  const handleNationalTeamChange = (value) => {
    setNationalTeamFilter(value);
    resetCurrentQuestion();
    resetSessionStats();
  };

  const handleLeagueChange = (value) => {
    setLeagueFilter(value);
    if (poolFocus !== 'club') {
      setTeamFilter('');
      if (quizType === 'club-legends') setQuizType('classic');
    }
    resetCurrentQuestion();
    resetSessionStats();
  };

  const handleTeamChange = (value) => {
    setTeamFilter(value);
    if (value) {
      const team = teams.find((t) => t.id === value);
      if (team) setLeagueFilter(team.leagueId);
    } else if (quizType === 'club-legends') {
      setQuizType('classic');
    }
    resetCurrentQuestion();
    resetSessionStats();
  };

  const handlePositionChange = (value) => {
    setPositionFilter(value);
    resetCurrentQuestion();
    resetSessionStats();
  };

  const handleDifficultyChange = (value) => {
    setDifficulty(value);
    resetCurrentQuestion(value);
  };

  const handleQuizTypeChange = (value) => {
    const option = QUIZ_TYPE_OPTIONS.find((o) => o.id === value);
    if (option?.requiresClub && !teamFilter) return;
    if (value === 'club-legends' && poolFocus !== 'club') {
      setPoolFocus('club');
    }
    setQuizType(value);
    setRevealedStep(0);
    resetCurrentQuestion();
    resetSessionStats();
  };

  const handleTimedChange = (value) => {
    const seconds = Number(value);
    setTimeLimitSeconds(seconds);
    resetCurrentQuestion();
  };

  const handleClearFilters = useCallback(() => {
    resetCurrentQuestion();
    resetSessionStats();
    setPoolFocus('all');
    setLeagueFilter('');
    setTeamFilter('');
    setNationalTeamFilter('');
    setPositionFilter('');
    setDifficulty('medium');
    setQuizType('classic');
    setTimeLimitSeconds(0);
    setSearchParams({}, { replace: true });
  }, [resetCurrentQuestion, resetSessionStats, setSearchParams]);

  const handleSelectTheme = useCallback(
    (themeId) => {
      resetCurrentQuestion();
      resetSessionStats();
      const theme = getQuizThemeById(themeId);
      const preset = theme?.preset;
      if (preset?.poolFocus) setPoolFocus(preset.poolFocus);
      else setPoolFocus('all');
      if (preset?.leagueId) {
        setLeagueFilter(preset.leagueId);
        setTeamFilter('');
        setNationalTeamFilter('');
      } else if (preset?.nationalTeamId) {
        setNationalTeamFilter(preset.nationalTeamId);
        setLeagueFilter('');
        setTeamFilter('');
        setPoolFocus('national');
      } else if (!preset) {
        setLeagueFilter('');
        setTeamFilter('');
        setNationalTeamFilter('');
      }
      if (theme?.defaultDifficulty) setDifficulty(theme.defaultDifficulty);
      const params = new URLSearchParams();
      params.set('theme', themeId);
      if (theme?.defaultDifficulty) params.set('difficulty', theme.defaultDifficulty);
      if (preset?.poolFocus) params.set('poolFocus', preset.poolFocus);
      if (preset?.leagueId) params.set('league', preset.leagueId);
      if (preset?.nationalTeamId) params.set('nationalTeam', preset.nationalTeamId);
      if (preset?.worldCup) params.set('worldCup', 'prep');
      setSearchParams(params, { replace: true });
    },
    [resetCurrentQuestion, resetSessionStats, setSearchParams],
  );

  const maxQuizHints = getMaxVisibleQuizHints(difficulty);

  const showAnotherHint = () => {
    if (!currentPlayer) return;
    setHintsShown((n) =>
      Math.min(n + 1, currentPlayer.quizHints.length, maxQuizHints),
    );
  };

  const revealNextWhoAmIClue = () => {
    setRevealedStep((step) => step + 1);
  };

  const isWhoAmI = isProgressiveQuizType(quizType);
  const whoAmISteps = useMemo(() => {
    if (!currentPlayer || !isWhoAmI) return [];
    return buildWhoAmIClueSteps(currentPlayer, getTeamName, getLeagueName);
  }, [currentPlayer, isWhoAmI, getTeamName, getLeagueName]);

  const careerTimeline = useMemo(() => {
    if (!currentPlayer || !usesCareerTimeline(quizType)) return [];
    return getCareerPathTimeline(currentPlayer);
  }, [currentPlayer, quizType]);

  const currentPlayerClub = currentPlayer ? getTeamName(currentPlayer.teamId) : '';
  const isClassicQuiz = quizType === 'classic';

  const visibleHints =
    isClassicQuiz && currentPlayer
      ? currentPlayer.quizHints.slice(0, Math.min(hintsShown, maxQuizHints))
      : [];

  const canShowMoreHints =
    isClassicQuiz &&
    currentPlayer &&
    hintsShown < Math.min(currentPlayer.quizHints.length, maxQuizHints);

  const playerRarity =
    currentPlayer && playerPool.length > 0
      ? getPlayerRarity(currentPlayer, playerPool)
      : null;

  const canRevealWhoAmI =
    isWhoAmI &&
    whoAmISteps.length > 0 &&
    revealedStep < whoAmISteps.length - 1 &&
    !feedback;
  const clueFacts = isClassicQuiz
    ? getClueFactsForQuestion(currentPlayer, difficulty, getTeamName)
    : [];
  const variantClue = !isClassicQuiz
    ? getQuizVariantClue(currentPlayer, quizType, getTeamName)
    : null;
  const currentDifficulty = QUIZ_DIFFICULTY_OPTIONS.find((option) => option.id === difficulty);
  const currentQuizType = QUIZ_TYPE_OPTIONS.find((option) => option.id === quizType);
  const currentPoolFocus = QUIZ_POOL_FOCUS_OPTIONS.find((option) => option.id === poolFocus);
  const selectedTeam = useMemo(
    () => (teamFilter ? teams.find((team) => team.id === teamFilter) : null),
    [teamFilter, teams],
  );
  const poolHint = getPoolFocusHint(poolFocus, filterState, playerPool.length, quizType, {
    nationalTeamName: selectedNationalTeam?.displayName,
    teamName: selectedTeam?.name,
  });
  const countryEmptyState = getQuizCountryEmptyState(
    poolFocus,
    filterState,
    playerPool.length,
    { nationalTeamName: selectedNationalTeam?.displayName },
    quizType,
  );
  const clubEmptyState = getQuizClubEmptyState(
    poolFocus,
    filterState,
    playerPool.length,
    { teamName: selectedTeam?.name },
    quizType,
  );
  const internationalEmptyState = getQuizInternationalEmptyState(
    poolFocus,
    playerPool.length,
    quizType,
    variantContext,
  );
  const scopedEmptyState = countryEmptyState ?? clubEmptyState ?? internationalEmptyState;
  const showWorldCupPrepNotice = worldCupPrep || poolFocus === 'international';
  const canStartQuiz = isQuizSessionPoolViable(
    playerPool.length,
    poolFocus,
    nationalTeamFilter,
    teamFilter,
  );
  const isThinPool =
    playerPool.length > 0 &&
    playerPool.length < QUIZ_MIN_SESSION_POOL &&
    (poolFocus === 'club' || poolFocus === 'national' || poolFocus === 'international');
  const questionPrompt = getQuizPromptForType(quizType);
  const timedLabel =
    QUIZ_TIMED_PRESETS.find((preset) => preset.id === timeLimitSeconds)?.label ?? 'Off';
  const timedHelp =
    timeLimitSeconds > 0 ? `Timed mode gives ${timedLabel} per question.` : '';

  const streakTier = getStreakTier(streak);
  const streakMilestoneLabel = getStreakMilestoneLabel(streak);

  const sessionSummary = useMemo(() => {
    if (sessionResults.length === 0) return null;
    const correctCount = sessionResults.filter((r) => r.isCorrect).length;
    const total = sessionResults.length;
    const accuracy = total > 0 ? Math.round((correctCount / total) * 100) : 0;
    const insights = computeSessionCategoryInsights(sessionResults, getTeamName, leagueById);
    const missed = sessionResults.filter((r) => !r.isCorrect).map((r) => r.player);
    const nextQuizzes = getRecommendedNextQuizzes({
      themeId: requestedThemeId,
      leagueFilter,
      teamFilter,
      nationalTeamFilter,
      difficulty,
      accuracy,
      bestStreak,
      missedCount: missed.length,
      players,
      teams,
    });
    const missedCards = buildMissedPlayerStudyCards(missed, { getTeamName, limit: 8 });
    const encouragement = getSessionEncouragement(accuracy, bestStreak, missed.length);
    const missedIntro = getMissedLearningIntro(missed.length);
    const collectionLinks = teamFilter
      ? getCollectionsFeaturingEntity('team', teamFilter, 2)
      : leagueFilter
        ? getCollectionsFeaturingEntity('league', leagueFilter, 2)
        : nationalTeamFilter
          ? getCollectionsFeaturingEntity('national-team', nationalTeamFilter, 2)
          : [];
    return {
      correctCount,
      total,
      accuracy,
      insights,
      missed,
      missedCards,
      missedIntro,
      nextQuizzes,
      encouragement,
      collectionLinks,
    };
  }, [
    sessionResults,
    getTeamName,
    leagueById,
    requestedThemeId,
    leagueFilter,
    teamFilter,
    nationalTeamFilter,
    difficulty,
    players,
    teams,
    bestStreak,
  ]);

  const handlePlayAgain = useCallback(() => {
    setSessionEnded(false);
    resetCurrentQuestion();
    scrollPageTop();
    startQuestion();
  }, [resetCurrentQuestion, startQuestion]);

  const nextQuestionLabel = getNextQuestionButtonLabel(
    streak,
    feedback === 'correct' ? 'correct' : 'incorrect',
    { bestStreak },
  );

  useEffect(() => {
    if (feedback) scrollQuizPanelIntoView();
  }, [feedback]);

  return (
    <div className="page quiz">
      <QuizSubNav />

      <header className="page-header">
        <h1>Player quiz</h1>
        <p className="page-header__lead">
          Guess the player from hints — pick a league, club, or nation, set difficulty, and build a
          streak. End a session anytime to review misses and what to study next.
        </p>
      </header>

      {activeTheme ? (
        <aside className="quiz-active-theme" aria-label="Active themed quiz">
          <p className="quiz-active-theme__title">
            <span aria-hidden="true">{activeTheme.icon}</span> {activeTheme.label}
          </p>
          <p>{activeTheme.description}</p>
          <p className="quiz-active-theme__meta">
            {playerPool.length} players in pool
            {themedSourcePool ? ` (from ${themedSourcePool.length} themed)` : ''}
          </p>
          <Link to={`/hubs/quizzes/theme/${activeTheme.id}`} className="quiz-active-theme__link">
            Theme guide
          </Link>
        </aside>
      ) : null}

      {showWorldCupPrepNotice && (
        <aside className="quiz-wc-prep" aria-label="World Cup quiz prep">
          <p className="quiz-wc-prep__title">World Cup prep</p>
          <p>
            Curated international and country lineups only — no live fixtures or brackets. Same
            quiz rules as club and national sessions.
          </p>
        </aside>
      )}

      <section className="quiz-themes-picker" aria-label="Themed quiz pools">
        <div className="quiz-themes-picker__head">
          <h2 className="quiz-themes-picker__title">Themed pools</h2>
          <Link to="/hubs/quizzes/themes" className="collections-page__section-link">
            Browse all themes
          </Link>
        </div>
        <div className="quiz-theme-grid quiz-theme-grid--compact">
          {QUIZ_THEME_CATALOG.map((theme) => {
            const count = themePoolCounts[theme.id] ?? 0;
            const viable = count >= QUIZ_MIN_SESSION_POOL;
            const isActive = requestedThemeId === theme.id;
            return (
              <button
                key={theme.id}
                type="button"
                className={`quiz-theme-card quiz-theme-card--btn${isActive ? ' quiz-theme-card--active' : ''}${!viable ? ' quiz-theme-card--thin' : ''}`}
                onClick={() => handleSelectTheme(theme.id)}
                aria-pressed={isActive}
              >
                <span className="quiz-theme-card__icon" aria-hidden="true">
                  {theme.icon}
                </span>
                <span className="quiz-theme-card__title">{theme.label}</span>
                <span className="quiz-theme-card__meta">
                  {viable ? `${count} ready` : `${count} in pool`}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      <details className="quiz-filters-details">
        <summary className="quiz-filters-details__summary">
          <span className="quiz-filters-details__label">Customize quiz</span>
          <span className="quiz-filters-details__hint">
            {currentDifficulty?.label ?? 'Medium'}
            {playerPool.length > 0 ? ` · ${playerPool.length} in pool` : ''}
          </span>
        </summary>
        <section className="filters quiz-filters quiz-filters-details__body" aria-label="Quiz setup">
        <div className="quiz-mode-picker" role="radiogroup" aria-label="Quiz type">
          <p className="quiz-mode-picker__label">Quiz type</p>
          <div className="quiz-mode-grid">
            {QUIZ_TYPE_OPTIONS.map((option) => {
              const count = modeCounts[option.id] ?? 0;
              const needsClub = Boolean(option.requiresClub) && !teamFilter;
              const insufficient =
                option.id !== 'classic' && count < QUIZ_MIN_SESSION_POOL && !needsClub;
              if (insufficient) return null;
              const isActive = quizType === option.id;
              const disabled = needsClub;
              return (
                <button
                  key={option.id}
                  type="button"
                  role="radio"
                  aria-checked={isActive}
                  aria-disabled={disabled || undefined}
                  disabled={disabled}
                  className={`quiz-mode-card${isActive ? ' quiz-mode-card--active' : ''}${disabled ? ' quiz-mode-card--disabled' : ''}`}
                  onClick={() => handleQuizTypeChange(option.id)}
                >
                  <span className="quiz-mode-card__icon" aria-hidden="true">
                    {option.icon ?? '⚽'}
                  </span>
                  <span className="quiz-mode-card__title">{option.label}</span>
                  <span className="quiz-mode-card__desc">{option.description}</span>
                  {needsClub ? (
                    <span className="quiz-mode-card__meta">Pick a club</span>
                  ) : count > 0 ? (
                    <span className="quiz-mode-card__meta">{count} ready</span>
                  ) : null}
                </button>
              );
            })}
          </div>
        </div>

        <label className="filter-field filter-field--wide">
          <span>Quiz focus</span>
          <select value={poolFocus} onChange={(e) => handlePoolFocusChange(e.target.value)}>
            {QUIZ_POOL_FOCUS_OPTIONS.map((option) => (
              <option key={option.id} value={option.id}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <p className="quiz-filters__focus-note">{currentPoolFocus?.description}</p>
        {(poolFocus === 'national' || poolFocus === 'international') && (
          <p className="quiz-filters__focus-note">
            {poolFocus === 'international'
              ? `International union across featured nations (minimum ${QUIZ_MIN_SESSION_POOL} to start). Optionally narrow to one country.`
              : `Country focus uses players with clues and a live national-team membership only (minimum ${QUIZ_MIN_SESSION_POOL} to start).`}
          </p>
        )}

        <div className="filters__row">
          {(poolFocus === 'all' ||
            poolFocus === 'national' ||
            poolFocus === 'international' ||
            poolFocus === 'league' ||
            poolFocus === 'club') &&
            liveNationalTeams.length > 0 && (
            <label className="filter-field">
              <span>Country</span>
              <select
                value={nationalTeamFilter}
                onChange={(e) => handleNationalTeamChange(e.target.value)}
              >
                <option value="">
                  {poolFocus === 'national'
                    ? 'Select country…'
                    : poolFocus === 'international'
                      ? 'All featured nations'
                      : 'Any country'}
                </option>
                {liveNationalTeams.map((team) => {
                  const idsByTeam =
                    registry?.national?.quizReadyPlayerIdsByNationalTeamId ?? {};
                  const quizCount = (idsByTeam[team.id] ?? []).length;
                  const isTooSmallForNationalMode =
                    poolFocus === 'national' && quizCount < QUIZ_MIN_SESSION_POOL;
                  return (
                    <option key={team.id} value={team.id} disabled={isTooSmallForNationalMode}>
                      {team.displayName} ({quizCount} player{quizCount === 1 ? '' : 's'}
                      {isTooSmallForNationalMode ? ` — needs ${QUIZ_MIN_SESSION_POOL}` : ''})
                    </option>
                  );
                })}
              </select>
            </label>
          )}

          {(poolFocus === 'all' || poolFocus === 'league' || poolFocus === 'club') && (
            <label className="filter-field">
              <span>League</span>
              <select
                value={leagueFilter}
                onChange={(e) => handleLeagueChange(e.target.value)}
                disabled={poolFocus === 'club' && Boolean(teamFilter)}
              >
                <option value="">
                  {poolFocus === 'league' ? 'Select league…' : 'All leagues'}
                </option>
                {leaguesForFilter.map((league) => (
                  <option key={league.id} value={league.id}>
                    {getLeagueDisplayName(league)}
                  </option>
                ))}
              </select>
            </label>
          )}

          {(poolFocus === 'all' || poolFocus === 'club') && (
            <label className="filter-field">
              <span>Team</span>
              <select
                value={teamFilter}
                onChange={(e) => handleTeamChange(e.target.value)}
              >
                <option value="">
                  {poolFocus === 'club' ? 'Select club…' : 'All teams'}
                </option>
                {teamsInLeague.map((team) => (
                  <option key={team.id} value={team.id}>
                    {team.name}
                  </option>
                ))}
              </select>
            </label>
          )}

          {(poolFocus === 'all' || poolFocus === 'position') && (
            <label className="filter-field">
              <span>Position</span>
              <select
                value={positionFilter}
                onChange={(e) => handlePositionChange(e.target.value)}
              >
                {QUIZ_POSITION_BUCKETS.map((bucket) => (
                  <option key={bucket.id || 'any'} value={bucket.id}>
                    {poolFocus === 'position' && !bucket.id
                      ? 'Select position group…'
                      : bucket.label}
                  </option>
                ))}
              </select>
            </label>
          )}

          <label className="filter-field">
            <span>Difficulty</span>
            <select
              value={difficulty}
              onChange={(e) => handleDifficultyChange(e.target.value)}
              disabled={!isClassicQuiz}
            >
              {QUIZ_DIFFICULTY_OPTIONS.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label className="filter-field">
            <span>Timed mode</span>
            <select
              value={timeLimitSeconds}
              onChange={(e) => handleTimedChange(e.target.value)}
            >
              {QUIZ_TIMED_PRESETS.map((preset) => (
                <option key={preset.id} value={preset.id}>
                  {preset.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        {poolFocus === 'international' && viableCountryQuizMetas.length > 0 && (
          <div className="quiz-wc-country-links" aria-label="Quick country quizzes">
            <p className="quiz-filters__focus-note">Or start a single-country session:</p>
            <ul className="quiz-wc-country-links__list">
              {viableCountryQuizMetas.map((meta) => (
                <li key={meta.nationalTeamId}>
                  <Link
                    to={`/quiz?nationalTeam=${meta.nationalTeamId}&poolFocus=national&worldCup=prep`}
                    className="quiz-wc-country-links__link"
                  >
                    {meta.displayName} ({meta.sessionCap} ready)
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}

        <p className="filters__count">
          {poolHint}
          {isClassicQuiz ? ` · ${currentDifficulty?.description}` : ''}
          {timeLimitSeconds > 0 ? ` · ${timedLabel} per question` : ''}
        </p>
        {timedHelp ? <p className="quiz-filters__focus-note">{timedHelp}</p> : null}
        {ambiguousLastNames.size > 0 && playerPool.length > 0 && (
          <p className="quiz-filters__focus-note" role="note">
            Shared surnames in this quiz — use each player&apos;s full name (last name alone
            won&apos;t count).
          </p>
        )}
        </section>
      </details>

      <section className="quiz-scoreboard" aria-label="Quiz session score">
        <div>
          <span className="quiz-scoreboard__label">Correct</span>
          <strong>{score.correct}</strong>
        </div>
        <div>
          <span className="quiz-scoreboard__label">Incorrect</span>
          <strong>{score.incorrect}</strong>
        </div>
        <div>
          <span className="quiz-scoreboard__label">Answered</span>
          <strong>{score.totalAnswered}</strong>
        </div>
        <div
          className={`quiz-scoreboard__streak${streakTier ? ` quiz-scoreboard__streak--t${streakTier}` : ''}`}
        >
          <span className="quiz-scoreboard__label">Streak</span>
          <strong>{streak}</strong>
          {streakTier >= 3 ? (
            <span className="quiz-scoreboard__streak-badge" aria-hidden="true">
              {streakTier >= 10 ? '★' : streakTier >= 5 ? '▲' : '●'}
            </span>
          ) : null}
        </div>
        <div>
          <span className="quiz-scoreboard__label">Best streak</span>
          <strong>{bestStreak}</strong>
        </div>
        {timeLimitSeconds > 0 && currentPlayer && !feedback && secondsLeft !== null && (
          <div className="quiz-scoreboard__timer" aria-live="polite">
            <span className="quiz-scoreboard__label">Time</span>
            <strong className={secondsLeft <= 10 ? 'quiz-scoreboard__timer--urgent' : undefined}>
              {secondsLeft}s
            </strong>
          </div>
        )}
      </section>

      {(currentPlayer || score.totalAnswered > 0) && !sessionEnded ? (
        <div
          className={`quiz-streak-indicator quiz-streak-indicator--t${streakTier}`}
          role="status"
          aria-live="polite"
          aria-label={`Current streak: ${streak}`}
        >
          <div className="quiz-streak-indicator__track" aria-hidden="true">
            <span
              className="quiz-streak-indicator__fill"
              style={{ width: `${Math.min(100, (streak / 10) * 100)}%` }}
            />
          </div>
          <div className="quiz-streak-indicator__copy">
            <span className="quiz-streak-indicator__label">Streak</span>
            <strong className="quiz-streak-indicator__value">{streak}</strong>
            {streakMilestoneLabel ? (
              <span className="quiz-streak-indicator__milestone">{streakMilestoneLabel}</span>
            ) : (
              <span className="quiz-streak-indicator__hint">Best: {bestStreak}</span>
            )}
          </div>
        </div>
      ) : null}

      <section className="quiz-panel">
        {sessionEnded && sessionSummary && !currentPlayer && (
          <article className="info-card quiz-summary" aria-label="Session summary">
            <h2 className="quiz-summary__title">
              {getSessionEndHeadline(
                sessionSummary.accuracy,
                sessionSummary.correctCount === sessionSummary.total,
              )}
            </h2>
            <p className="quiz-summary__nudge">
              {getOneMoreQuizNudge(sessionSummary.accuracy, bestStreak)}
            </p>
            {sessionSummary.encouragement ? (
              <p className="quiz-summary__encourage">{sessionSummary.encouragement}</p>
            ) : null}
            <div className="quiz-summary__hero">
              <p className="quiz-summary__score">
                <span className="quiz-summary__score-value">{sessionSummary.correctCount}</span>
                <span className="quiz-summary__score-sep">/</span>
                <span className="quiz-summary__score-total">{sessionSummary.total}</span>
              </p>
              <p className="quiz-summary__accuracy">{sessionSummary.accuracy}% accuracy</p>
              <p className="quiz-summary__meta">
                Best streak {bestStreak} · {score.incorrect} miss
                {score.incorrect !== 1 ? 'es' : ''}
              </p>
            </div>

            {(sessionSummary.insights.strongest || sessionSummary.insights.weakest) && (
              <div className="quiz-summary__insights" aria-label="Category breakdown">
                {sessionSummary.insights.strongest ? (
                  <div className="quiz-summary__insight quiz-summary__insight--strong">
                    <span className="quiz-summary__insight-label">Strongest</span>
                    <strong>{sessionSummary.insights.strongest.label}</strong>
                    <span>
                      {Math.round(
                        (sessionSummary.insights.strongest.correct /
                          sessionSummary.insights.strongest.total) *
                          100,
                      )}
                      % ({sessionSummary.insights.strongest.correct}/
                      {sessionSummary.insights.strongest.total})
                    </span>
                  </div>
                ) : null}
                {sessionSummary.insights.weakest ? (
                  <div className="quiz-summary__insight quiz-summary__insight--weak">
                    <span className="quiz-summary__insight-label">Needs work</span>
                    <strong>{sessionSummary.insights.weakest.label}</strong>
                    <span>
                      {Math.round(
                        (sessionSummary.insights.weakest.correct /
                          sessionSummary.insights.weakest.total) *
                          100,
                      )}
                      % ({sessionSummary.insights.weakest.correct}/
                      {sessionSummary.insights.weakest.total})
                    </span>
                  </div>
                ) : null}
              </div>
            )}

            {sessionSummary.missedCards?.length > 0 ? (
              <div className="quiz-summary__missed-block" id="quiz-missed-players">
                <h3 className="quiz-summary__subtitle">Study missed players</h3>
                {sessionSummary.missedIntro ? (
                  <p className="quiz-summary__missed-intro">{sessionSummary.missedIntro}</p>
                ) : null}
                <ul className="quiz-summary__missed">
                  {sessionSummary.missedCards.map((card) => (
                    <li key={`miss-${card.id}`}>
                      <Link
                        to={card.profileHref}
                        className="quiz-summary__missed-link quiz-summary__missed-link--study"
                      >
                        <span className="quiz-summary__missed-name">{card.name}</span>
                        {card.club ? (
                          <span className="quiz-summary__missed-meta">{card.club}</span>
                        ) : null}
                        <span className="quiz-summary__missed-tip">{card.tip}</span>
                        <span className="quiz-summary__missed-cta">Profile &amp; hints →</span>
                      </Link>
                    </li>
                  ))}
                </ul>
                <p className="quiz-summary__missed-replay">
                  <Link to={`/quiz?difficulty=easy${requestedThemeId ? `&theme=${requestedThemeId}` : ''}`}>
                    Replay on Easy
                  </Link>
                  {' · '}
                  <Link to="/daily">Daily challenge</Link>
                </p>
              </div>
            ) : (
              <p className="quiz-summary__perfect">Perfect run — no misses this session.</p>
            )}

            {sessionSummary.nextQuizzes?.length > 0 ? (
              <section className="quiz-summary__next" aria-labelledby="quiz-next-title">
                <h3 id="quiz-next-title" className="quiz-summary__subtitle">
                  Recommended next quiz
                </h3>
                <ul className="quiz-summary__next-list">
                  {sessionSummary.nextQuizzes.map((rec) => (
                    <li key={rec.id}>
                      <Link to={rec.href} className="quiz-summary__next-link">
                        <strong>{rec.label}</strong>
                        <span>{rec.reason}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}

            {sessionSummary.collectionLinks?.length > 0 ? (
              <section className="quiz-summary__next" aria-labelledby="quiz-collections-title">
                <h3 id="quiz-collections-title" className="quiz-summary__subtitle">
                  Continue in collections
                </h3>
                <ul className="quiz-summary__next-list">
                  {sessionSummary.collectionLinks.map((collection) => (
                    <li key={collection.id}>
                      <Link to={collection.to} className="quiz-summary__next-link">
                        <strong>{collection.title}</strong>
                        <span>{collection.difficulty} · curated study path</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}

            <div className="quiz-summary__actions">
              <button type="button" className="btn btn--primary btn--large" onClick={handlePlayAgain}>
                Play again
              </button>
              {sessionSummary.nextQuizzes[0] ? (
                <Link
                  to={sessionSummary.nextQuizzes[0].href}
                  className="btn btn--secondary btn--large quiz-summary__follow-up"
                >
                  One more: {sessionSummary.nextQuizzes[0].label}
                </Link>
              ) : null}
              <Link to="/daily" className="btn btn--secondary">
                Daily challenge
              </Link>
              {sessionSummary.missed.length > 0 ? (
                <a href="#quiz-missed-players" className="btn btn--secondary">
                  Review misses
                </a>
              ) : null}
              <ShareButton
                className="btn btn--secondary"
                title="FootyCompass quiz results"
                text={`I scored ${sessionSummary.correctCount}/${sessionSummary.total} (${sessionSummary.accuracy}% accuracy) on FootyCompass.`}
                url={typeof window !== 'undefined' ? window.location.href : undefined}
                copiedLabel="Copied result link"
                sharedLabel="Shared results"
              >
                Share results
              </ShareButton>
              <Link to="/collections" className="btn btn--secondary">
                Browse collections
              </Link>
              <button type="button" className="btn btn--secondary" onClick={handleClearFilters}>
                New quiz setup
              </button>
            </div>
          </article>
        )}

        {!currentPlayer && !canStartQuiz && (
          <div
            className={`quiz-panel__empty${scopedEmptyState ? ' quiz-panel__empty--country' : ''}`}
          >
            {scopedEmptyState ? (
              <>
                <h2 className="quiz-panel__empty-title">{scopedEmptyState.title}</h2>
                <p className="empty-state" role="status">
                  {scopedEmptyState.message}
                </p>
              </>
            ) : (
              <p className="empty-state" role="status">
                {poolHint}
              </p>
            )}
            {isThinPool ? (
              <p className="quiz-panel__empty-actions" role="note">
                Need {QUIZ_MIN_SESSION_POOL}+ players with clues to start a fair session.
              </p>
            ) : null}
            {countryEmptyState?.showSquadLink && selectedNationalTeam && (
              <p className="quiz-panel__empty-actions">
                <Link to={`/national-team/${selectedNationalTeam.id}`}>
                  View {selectedNationalTeam.displayName} squad
                </Link>
                {' · '}
                <Link to="/national-teams">All national teams</Link>
                {' · '}
                <button type="button" className="btn btn--secondary btn--small" onClick={handleClearFilters}>
                  Clear filters
                </button>
              </p>
            )}
            {clubEmptyState?.showSquadLink && selectedTeam && (
              <p className="quiz-panel__empty-actions">
                <Link to={`/team/${selectedTeam.id}`}>View {selectedTeam.name} squad</Link>
                {selectedTeam.leagueId && (
                  <>
                    {' · '}
                    <Link to={`/quiz?league=${selectedTeam.leagueId}`}>League quiz</Link>
                  </>
                )}
                {' · '}
                <button type="button" className="btn btn--secondary btn--small" onClick={handleClearFilters}>
                  Clear filters
                </button>
              </p>
            )}
            {!countryEmptyState?.showSquadLink && !clubEmptyState?.showSquadLink ? (
              <p className="quiz-panel__empty-actions">
                <button type="button" className="btn btn--secondary btn--small" onClick={handleClearFilters}>
                  Clear filters
                </button>
              </p>
            ) : null}
          </div>
        )}

        {!currentPlayer && canStartQuiz && (
          <button type="button" className="btn btn--primary btn--large" onClick={startQuestion}>
            Start quiz
          </button>
        )}

        {currentPlayer && (
          <>
            <div className="quiz-panel__top">
              <h2 className="quiz-panel__prompt">{questionPrompt}</h2>
              {playerRarity ? (
                <span
                  className={`quiz-rarity quiz-rarity--${playerRarity.tone}`}
                  title="Rarity in this pool"
                >
                  {playerRarity.label}
                </span>
              ) : null}
              {!isClassicQuiz && (
                <span className="quiz-panel__variant-badge">{currentQuizType?.label}</span>
              )}
              {timeLimitSeconds > 0 && !feedback && secondsLeft !== null && (
                <span
                  className={`quiz-panel__timer${secondsLeft <= 10 ? ' quiz-panel__timer--urgent' : ''}`}
                  aria-label={`${secondsLeft} seconds remaining`}
                >
                  {secondsLeft}s
                </span>
              )}
            </div>

            {variantClue && !isWhoAmI && (
              <article
                className={`quiz-variant-clue quiz-variant-clue--${variantClue.kind}`}
                aria-label="Main clue"
              >
                <span className="quiz-variant-clue__label">{variantClue.label}</span>
                {usesCareerTimeline(quizType) && careerTimeline.length >= 2 ? (
                  <ol className="quiz-career-timeline">
                    {careerTimeline.map((stop) => (
                      <li key={stop}>{stop}</li>
                    ))}
                  </ol>
                ) : (
                  <p className="quiz-variant-clue__value">{variantClue.value}</p>
                )}
              </article>
            )}

            {isWhoAmI && whoAmISteps.length > 0 && (
              <ol className="quiz-progressive-clues" aria-label="Revealed clues">
                {whoAmISteps.slice(0, revealedStep + 1).map((step) => (
                  <li key={step.label}>
                    <span className="quiz-progressive-clues__label">{step.label}</span>
                    <span className="quiz-progressive-clues__value">{step.value}</span>
                  </li>
                ))}
              </ol>
            )}

            {clueFacts.length > 0 && (
              <dl className="quiz-clues" aria-label="Quiz clues">
                {clueFacts.map((fact) => (
                  <div key={fact.label}>
                    <dt>{fact.label}</dt>
                    <dd>{fact.value}</dd>
                  </div>
                ))}
              </dl>
            )}

            {visibleHints.length > 0 && (
              <ol className="quiz-hints">
                {visibleHints.map((hint, index) => (
                  <li key={index}>
                    <span className="quiz-hints__label">Hint {index + 1}</span>
                    {hint}
                  </li>
                ))}
              </ol>
            )}

            {canShowMoreHints && !feedback && (
              <button type="button" className="btn btn--secondary" onClick={showAnotherHint}>
                Show another hint
              </button>
            )}

            {canRevealWhoAmI && (
              <button type="button" className="btn btn--secondary" onClick={revealNextWhoAmIClue}>
                Reveal next clue
              </button>
            )}

            <form className="quiz-form" onSubmit={handleCheckAnswer}>
              <div className="quiz-form__answer">
                <PlayerAutocomplete
                  searchPool={players}
                  players={playerPool}
                  value={answer}
                  onChange={setAnswer}
                  onSelect={(player) => setAnswer(player.name)}
                  label="Your answer"
                  placeholder="Type player name…"
                  disabled={!!feedback}
                  excludeIds={currentPlayer ? [currentPlayer.id] : []}
                  maxResults={6}
                  showClubWhenAmbiguous
                  getTeamName={getTeamName}
                  getLeagueName={(leagueId) => leagueById?.get(leagueId)?.name ?? 'Unknown'}
                />

                {!feedback && (
                  <button
                    type="submit"
                    className="btn btn--primary btn--large quiz-form__submit"
                    disabled={!answer.trim()}
                  >
                    Check answer
                  </button>
                )}
              </div>
            </form>

            {milestoneMessage && (
              <p className="quiz-milestone-banner" role="status">
                {milestoneMessage}
              </p>
            )}

            {achievementToast && (
              <p className="quiz-achievement-toast" role="status">
                {achievementToast}
              </p>
            )}

            {feedback === 'correct' && currentPlayer ? (
              <QuizPlayerFeedback
                variant="correct"
                player={currentPlayer}
                clubLabel={currentPlayerClub}
                streak={streak}
                streakTier={streakTier}
                milestone={getStreakMilestoneCopy(streak) || ''}
                xpLine={lastXpFeedback || ''}
              />
            ) : null}

            {feedback === 'incorrect' && currentPlayer ? (
              <QuizPlayerFeedback
                variant="incorrect"
                player={currentPlayer}
                clubLabel={currentPlayerClub}
                profileLabel={`View ${currentPlayer.name}`}
                timedOut={timedOut}
                momentumLine={getIncorrectMomentumCopy(bestStreak)}
                tip={
                  getWrongAnswerTip({
                    guess: answer,
                    correctName: currentPlayer.name,
                    ambiguousLastNames,
                    timedOut,
                    requireFullName: requiresFullNameMatch(difficulty),
                  })?.tip ?? ''
                }
              />
            ) : null}

            {feedback ? (
              <QuizFeedbackActions>
                <button type="button" className="btn btn--primary btn--large" onClick={startQuestion}>
                  {nextQuestionLabel}
                </button>
                <button
                  type="button"
                  className="btn btn--secondary"
                  onClick={() => setSessionEnded(true)}
                >
                  End session
                </button>
              </QuizFeedbackActions>
            ) : null}
          </>
        )}
      </section>
    </div>
  );
}
