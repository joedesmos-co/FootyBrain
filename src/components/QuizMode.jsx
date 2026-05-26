import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  getLiveNationalTeams,
  getNationalTeamById,
  getNationalTeamQuizReadyCount,
  isLiveNationalTeamId,
} from '../data/nationalTeamData';
import { getTeamName, leagues, players, teams } from '../data/sampleData';
import CountryFlag from './CountryFlag';
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
  getPoolFocusHint,
  getQuizClubEmptyState,
  getQuizCountryEmptyState,
  getQuizInternationalEmptyState,
  getQuizPromptForType,
  getQuizVariantClue,
  isQuizSessionPoolViable,
  pickRandomPlayer,
  QUIZ_DIFFICULTY_OPTIONS,
  QUIZ_MIN_SESSION_POOL,
  QUIZ_POOL_FOCUS_OPTIONS,
  QUIZ_POSITION_BUCKETS,
  QUIZ_TIMED_PRESETS,
  QUIZ_TYPE_OPTIONS,
} from '../utils/quizSession';
import { isWorldCupQuizPrepParam } from '../data/worldCupQuizConstants';
import { getViableCountryQuizPoolMetas } from '../utils/nationalQuizPools';
import PlayerAutocomplete from './PlayerAutocomplete';

// TODO: Future Firebase sync — persist quiz session history and scores under
//       users/{uid}/quizSessions so progress carries across devices.

const SESSION_MILESTONE = 5;

export default function QuizMode() {
  const [searchParams] = useSearchParams();
  const requestedTeamId = searchParams.get('team') ?? '';
  const requestedLeagueId = searchParams.get('league') ?? '';
  const requestedNationalTeamId = searchParams.get('nationalTeam') ?? '';
  const requestedPoolFocus = searchParams.get('poolFocus') ?? '';
  const worldCupPrep = isWorldCupQuizPrepParam(searchParams.get('worldCup'));
  const liveNationalTeams = useMemo(() => getLiveNationalTeams(), []);
  const requestedTeam = useMemo(
    () => teams.find((team) => team.id === requestedTeamId),
    [requestedTeamId],
  );
  const requestedLeague = useMemo(
    () => (leagues.some((league) => league.id === requestedLeagueId) ? requestedLeagueId : ''),
    [requestedLeagueId],
  );
  const requestedNationalTeam = useMemo(
    () =>
      isLiveNationalTeamId(requestedNationalTeamId) ? requestedNationalTeamId : '',
    [requestedNationalTeamId],
  );

  const initialPoolFocus =
    requestedPoolFocus === 'international'
      ? 'international'
      : requestedNationalTeam
        ? 'national'
        : requestedTeam
          ? 'club'
          : requestedLeague
            ? 'league'
            : 'all';
  const initialLeagueFilter = requestedNationalTeam ? '' : (requestedTeam?.leagueId ?? requestedLeague);
  const initialTeamFilter = requestedNationalTeam ? '' : (requestedTeam?.id ?? '');
  const initialNationalTeamFilter = requestedNationalTeam;

  const [poolFocus, setPoolFocus] = useState(initialPoolFocus);
  const [leagueFilter, setLeagueFilter] = useState(initialLeagueFilter);
  const [teamFilter, setTeamFilter] = useState(initialTeamFilter);
  const [nationalTeamFilter, setNationalTeamFilter] = useState(initialNationalTeamFilter);
  const [positionFilter, setPositionFilter] = useState('');
  const [difficulty, setDifficulty] = useState('medium');
  const [quizType, setQuizType] = useState('classic');
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

  const sessionMilestoneRef = useRef(false);
  const lastQuestionPlayerIdRef = useRef(null);
  const handleTimeoutRef = useRef(() => {});
  const progression = useProgression();

  const filterState = useMemo(
    () => ({ poolFocus, leagueFilter, teamFilter, positionFilter, nationalTeamFilter }),
    [poolFocus, leagueFilter, teamFilter, positionFilter, nationalTeamFilter],
  );

  const viableCountryQuizMetas = useMemo(
    () => (poolFocus === 'international' ? getViableCountryQuizPoolMetas() : []),
    [poolFocus],
  );

  const selectedNationalTeam = useMemo(
    () => (nationalTeamFilter ? getNationalTeamById(nationalTeamFilter) : null),
    [nationalTeamFilter],
  );

  const teamsInLeague = useMemo(() => {
    if (!leagueFilter) return teams;
    return teams.filter((t) => t.leagueId === leagueFilter);
  }, [leagueFilter]);

  const playerPool = useMemo(
    () => buildQuizPlayerPool(players, filterState, quizType),
    [filterState, quizType],
  );

  const ambiguousLastNames = useMemo(
    () => buildAmbiguousLastNames(playerPool),
    [playerPool],
  );

  const resetSessionStats = useCallback(() => {
    setScore({ correct: 0, incorrect: 0, totalAnswered: 0 });
    setStreak(0);
    setBestStreak(0);
    sessionMilestoneRef.current = false;
  }, []);

  const initialHintsForQuestion = useCallback(
    (nextDifficulty = difficulty) =>
      quizType === 'classic' ? getInitialHintCount(nextDifficulty) : 1,
    [quizType, difficulty],
  );

  const resetCurrentQuestion = useCallback((nextDifficulty = difficulty) => {
    setCurrentPlayer(null);
    setHintsShown(initialHintsForQuestion(nextDifficulty));
    setAnswer('');
    setFeedback(null);
    setLastXpFeedback('');
    setMilestoneMessage('');
    setAchievementToast('');
    setSecondsLeft(null);
    setTimedOut(false);
  }, [difficulty, initialHintsForQuestion]);

  const startQuestion = useCallback(() => {
    const next = pickRandomPlayer(playerPool, lastQuestionPlayerIdRef.current ?? '');
    lastQuestionPlayerIdRef.current = next?.id ?? null;
    setCurrentPlayer(next);
    setHintsShown(initialHintsForQuestion(difficulty));
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
    ],
  );

  const handleCheckAnswer = (e) => {
    e.preventDefault();
    if (!currentPlayer || feedback || !answer.trim()) return;
    setTimedOut(false);
    const isCorrect = answersMatch(answer, currentPlayer.name, ambiguousLastNames);
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
    if (poolFocus !== 'club') setTeamFilter('');
    resetCurrentQuestion();
    resetSessionStats();
  };

  const handleTeamChange = (value) => {
    setTeamFilter(value);
    if (value) {
      const team = teams.find((t) => t.id === value);
      if (team) setLeagueFilter(team.leagueId);
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
    setQuizType(value);
    resetCurrentQuestion();
    resetSessionStats();
  };

  const handleTimedChange = (value) => {
    const seconds = Number(value);
    setTimeLimitSeconds(seconds);
    resetCurrentQuestion();
  };

  const showAnotherHint = () => {
    if (!currentPlayer) return;
    setHintsShown((n) => Math.min(n + 1, currentPlayer.quizHints.length));
  };

  const visibleHints = currentPlayer ? currentPlayer.quizHints.slice(0, hintsShown) : [];

  const canShowMoreHints =
    currentPlayer && hintsShown < currentPlayer.quizHints.length;

  const currentPlayerClub = currentPlayer ? getTeamName(currentPlayer.teamId) : '';
  const isClassicQuiz = quizType === 'classic';
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
    [teamFilter],
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
  );
  const scopedEmptyState = countryEmptyState ?? clubEmptyState ?? internationalEmptyState;
  const showWorldCupPrepNotice = worldCupPrep || poolFocus === 'international';
  const canStartQuiz = isQuizSessionPoolViable(
    playerPool.length,
    poolFocus,
    nationalTeamFilter,
    teamFilter,
  );
  const questionPrompt = getQuizPromptForType(quizType);
  const timedLabel =
    QUIZ_TIMED_PRESETS.find((preset) => preset.id === timeLimitSeconds)?.label ?? 'Off';

  return (
    <div className="page quiz">
      <header className="page-header">
        <h1>Quiz Mode</h1>
        <p>Guess players from clues. Narrow the pool, pick a difficulty, optionally race the clock.</p>
      </header>

      {showWorldCupPrepNotice && (
        <aside className="quiz-wc-prep" aria-label="World Cup quiz prep">
          <p className="quiz-wc-prep__title">World Cup prep</p>
          <p>
            Curated international and country pools only — no live fixtures or brackets. Same
            quiz-ready rules as club and national sessions.
          </p>
        </aside>
      )}

      <section className="filters quiz-filters" aria-label="Quiz setup">
        <label className="filter-field filter-field--wide">
          <span>Pool focus</span>
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
              : `Country focus uses quiz-ready players with a live national-team membership only (minimum ${QUIZ_MIN_SESSION_POOL} to start).`}
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
                  const quizCount = getNationalTeamQuizReadyCount(team.id);
                  const isTooSmallForNationalMode =
                    poolFocus === 'national' && quizCount < QUIZ_MIN_SESSION_POOL;
                  return (
                    <option key={team.id} value={team.id} disabled={isTooSmallForNationalMode}>
                      {team.displayName} ({quizCount} quiz-ready
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
                {leagues.map((league) => (
                  <option key={league.id} value={league.id}>
                    {league.name}
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
            <span>Quiz type</span>
            <select value={quizType} onChange={(e) => handleQuizTypeChange(e.target.value)}>
              {QUIZ_TYPE_OPTIONS.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

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
                    {meta.displayName} ({meta.sessionCap} in pool)
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}

        <p className="quiz-filters__focus-note">{currentQuizType?.description}</p>

        <p className="filters__count">
          {poolHint}
          {isClassicQuiz ? ` · ${currentDifficulty?.description}` : ''}
          {timeLimitSeconds > 0 ? ` · ${timedLabel} per question` : ''}
        </p>
        {ambiguousLastNames.size > 0 && playerPool.length > 0 && (
          <p className="quiz-filters__focus-note" role="note">
            Shared surnames in this pool — use each player&apos;s full name (last name alone
            won&apos;t count).
          </p>
        )}
      </section>

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
        <div>
          <span className="quiz-scoreboard__label">Streak</span>
          <strong className={streak >= 3 ? 'quiz-scoreboard__hot' : undefined}>{streak}</strong>
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

      <section className="quiz-panel">
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
            {countryEmptyState?.showSquadLink && selectedNationalTeam && (
              <p className="quiz-panel__empty-actions">
                <Link to={`/national-team/${selectedNationalTeam.id}`}>
                  View {selectedNationalTeam.displayName} squad
                </Link>
                {' · '}
                <Link to="/national-teams">All national teams</Link>
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
              </p>
            )}
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

            {variantClue && (
              <article
                className={`quiz-variant-clue quiz-variant-clue--${variantClue.kind}`}
                aria-label="Main clue"
              >
                <span className="quiz-variant-clue__label">{variantClue.label}</span>
                <p className="quiz-variant-clue__value">{variantClue.value}</p>
              </article>
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

            <form className="quiz-form" onSubmit={handleCheckAnswer}>
              <PlayerAutocomplete
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
              />

              {!feedback && (
                <button type="submit" className="btn btn--primary" disabled={!answer.trim()}>
                  Check answer
                </button>
              )}
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

            {feedback === 'correct' && (
              <article className="quiz-feedback quiz-feedback--correct" role="status">
                <div className="quiz-feedback__header">
                  <h3>Correct! It was {currentPlayer.name}.</h3>
                  {streak > 1 && (
                    <span className="quiz-feedback__streak">{streak} in a row</span>
                  )}
                  {lastXpFeedback && (
                    <span className="quiz-feedback__xp" aria-label={lastXpFeedback}>
                      {lastXpFeedback}
                    </span>
                  )}
                </div>
                <dl className="quiz-feedback__details">
                  <div>
                    <dt>Club</dt>
                    <dd>{currentPlayerClub}</dd>
                  </div>
                  <div>
                    <dt>National team</dt>
                    <dd className="football-meta-line">
                      <CountryFlag label={currentPlayer.nationalTeam} />
                      {currentPlayer.nationalTeam || '—'}
                    </dd>
                  </div>
                </dl>
                <p>{currentPlayer.quickFact}</p>
                <Link to={`/player/${currentPlayer.id}`} className="quiz-feedback__link">
                  Learn this player
                </Link>
              </article>
            )}

            {feedback === 'incorrect' && (
              <article className="quiz-feedback quiz-feedback--incorrect" role="status">
                <h3>
                  {timedOut ? "Time's up!" : 'Not quite.'} The answer was {currentPlayer.name}.
                </h3>
                <dl className="quiz-feedback__details">
                  <div>
                    <dt>Club</dt>
                    <dd>{currentPlayerClub}</dd>
                  </div>
                  <div>
                    <dt>National team</dt>
                    <dd className="football-meta-line">
                      <CountryFlag label={currentPlayer.nationalTeam} />
                      {currentPlayer.nationalTeam || '—'}
                    </dd>
                  </div>
                </dl>
                <p>{currentPlayer.quickFact}</p>
                <Link to={`/player/${currentPlayer.id}`} className="quiz-feedback__link">
                  Learn this player
                </Link>
              </article>
            )}

            {feedback && (
              <button type="button" className="btn btn--primary" onClick={startQuestion}>
                Next question
              </button>
            )}
          </>
        )}
      </section>
    </div>
  );
}
