import { useCallback, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { leagues, teams } from '../data/sampleData';
import {
  CLUB_QUIZ_CATEGORY_CATALOG,
  getClubQuizCategoryById,
  getClubQuizPlayHref,
} from '../data/clubQuizCategories';
import { useProgression } from '../hooks/useProgression';
import {
  getClubQuizCategoryHubHref,
  getRecommendedNextClubQuizzes,
} from '../utils/clubQuizRecommendations';
import {
  CLUB_QUIZ_MIN_POOL,
  CLUB_QUIZ_SESSION_MILESTONE,
  countClubQuizPool,
  generateClubQuizQuestion,
  gradeClubQuizAnswer,
  pickNextClubQuestionSeed,
  usesClubQuizMultipleChoice,
} from '../utils/clubQuizEngine';
import { getLeagueDisplayName } from '../utils/footballDisplay';
import { QUIZ_DIFFICULTY_OPTIONS } from '../utils/quizSession';
import BreadcrumbNav from './BreadcrumbNav';

function getStreakTier(value) {
  if (value >= 10) return 10;
  if (value >= 5) return 5;
  if (value >= 3) return 3;
  return 0;
}

function getStreakMilestoneLabel(value) {
  if (value === 10) return '10-streak — unstoppable';
  if (value === 5) return '5-streak — on fire';
  if (value === 3) return '3-streak — heating up';
  return null;
}

export default function ClubQuizMode() {
  const [searchParams, setSearchParams] = useSearchParams();
  const requestedCategoryId = searchParams.get('category') ?? '';
  const requestedLeagueId = searchParams.get('league') ?? '';
  const requestedDifficulty = searchParams.get('difficulty') ?? '';

  const activeCategory = useMemo(
    () => getClubQuizCategoryById(requestedCategoryId),
    [requestedCategoryId],
  );

  const initialDifficulty = QUIZ_DIFFICULTY_OPTIONS.some((o) => o.id === requestedDifficulty)
    ? requestedDifficulty
    : (activeCategory?.defaultDifficulty ?? 'medium');

  const [categoryId, setCategoryId] = useState(() => requestedCategoryId || activeCategory?.id || '');
  const [leagueFilter, setLeagueFilter] = useState(requestedLeagueId);
  const [difficulty, setDifficulty] = useState(initialDifficulty);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [textAnswer, setTextAnswer] = useState('');
  const [feedback, setFeedback] = useState(null);
  const [lastXpFeedback, setLastXpFeedback] = useState('');
  const [score, setScore] = useState({ correct: 0, incorrect: 0, totalAnswered: 0 });
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [sessionResults, setSessionResults] = useState([]);
  const [sessionEnded, setSessionEnded] = useState(false);
  const askedQuestionIdsRef = useRef([]);

  const sessionMilestoneRef = useRef(false);
  const questionIndexRef = useRef(0);
  const progression = useProgression();

  const leagueOptions = useMemo(
    () => leagues.filter((l) => l.id && l.id !== 'external'),
    [],
  );

  const poolSize = useMemo(
    () => (categoryId ? countClubQuizPool(teams, categoryId, { leagueId: leagueFilter }) : 0),
    [categoryId, leagueFilter],
  );

  const poolReady = poolSize >= CLUB_QUIZ_MIN_POOL;
  const useMcq = usesClubQuizMultipleChoice(difficulty);

  const resetQuestionState = useCallback(() => {
    setCurrentQuestion(null);
    setTextAnswer('');
    setFeedback(null);
  }, []);

  const resetSession = useCallback(() => {
    resetQuestionState();
    setScore({ correct: 0, incorrect: 0, totalAnswered: 0 });
    setStreak(0);
    setBestStreak(0);
    setSessionResults([]);
    setSessionEnded(false);
    askedQuestionIdsRef.current = [];
    sessionMilestoneRef.current = false;
    questionIndexRef.current = 0;
  }, [resetQuestionState]);

  const loadNextQuestion = useCallback(
    (overrideCategoryId) => {
      const activeId = overrideCategoryId || categoryId;
      const size = activeId
        ? countClubQuizPool(teams, activeId, { leagueId: leagueFilter })
        : 0;
      if (!activeId || size < CLUB_QUIZ_MIN_POOL) return;
      const seed = pickNextClubQuestionSeed(
        questionIndexRef.current,
        askedQuestionIdsRef.current.at(-1),
      );
      const q = generateClubQuizQuestion(teams, leagues, activeId, {
        difficulty,
        leagueId: leagueFilter,
        excludeTeamIds: [],
        seed,
      });
      questionIndexRef.current += 1;
      if (!q) return;
      setCurrentQuestion(q);
      setTextAnswer('');
      setFeedback(null);
      if (!askedQuestionIdsRef.current.includes(q.id)) {
        askedQuestionIdsRef.current.push(q.id);
      }
    },
    [categoryId, difficulty, leagueFilter],
  );

  const handleSelectCategory = useCallback(
    (nextCategoryId) => {
      resetSession();
      setCategoryId(nextCategoryId);
      const cat = getClubQuizCategoryById(nextCategoryId);
      const params = new URLSearchParams();
      params.set('category', nextCategoryId);
      if (cat?.defaultDifficulty) params.set('difficulty', cat.defaultDifficulty);
      if (leagueFilter) params.set('league', leagueFilter);
      setSearchParams(params, { replace: true });
      if (cat?.defaultDifficulty) setDifficulty(cat.defaultDifficulty);
    },
    [leagueFilter, resetSession, setSearchParams],
  );

  const finalizeAnswer = useCallback(
    ({ isCorrect, choiceId, answerText }) => {
      if (!currentQuestion || feedback) return;

      const newStreak = isCorrect ? streak + 1 : 0;
      const newBest = Math.max(bestStreak, newStreak);
      const newTotal = score.totalAnswered + 1;
      const newCorrect = score.correct + (isCorrect ? 1 : 0);
      const newIncorrect = score.incorrect + (isCorrect ? 0 : 1);

      let sessionMilestone = null;
      if (newTotal >= CLUB_QUIZ_SESSION_MILESTONE && !sessionMilestoneRef.current) {
        sessionMilestoneRef.current = true;
        sessionMilestone = {
          correct: newCorrect,
          total: newTotal,
          leagueId: leagueFilter || undefined,
        };
      }

      const xpResult = progression.recordAnswer({
        isCorrect,
        newSessionStreak: newStreak,
        sessionMilestone,
      });

      setStreak(newStreak);
      setBestStreak(newBest);
      setScore({ correct: newCorrect, incorrect: newIncorrect, totalAnswered: newTotal });
      setSessionResults((prev) => [
        ...prev,
        {
          question: currentQuestion,
          isCorrect,
          guess: answerText ?? choiceId ?? '',
        },
      ]);
      setFeedback({
        isCorrect,
        correctLabel: currentQuestion.correctLabel,
        teamId: currentQuestion.correctTeamId,
        explanation: currentQuestion.explanation,
      });
      setLastXpFeedback(
        isCorrect
          ? `+${xpResult.totalXp} XP${xpResult.streakBonus ? ' (streak bonus!)' : ''}`
          : '',
      );
    },
    [currentQuestion, feedback, streak, bestStreak, score, leagueFilter, progression],
  );

  const handleMcqPick = (choice) => {
    if (!currentQuestion || feedback) return;
    const isCorrect = gradeClubQuizAnswer(currentQuestion, '', { choiceId: choice.id });
    finalizeAnswer({ isCorrect, choiceId: choice.id, answerText: choice.label });
  };

  const handleTextSubmit = (event) => {
    event.preventDefault();
    if (!currentQuestion || feedback) return;
    const isCorrect = gradeClubQuizAnswer(currentQuestion, textAnswer);
    finalizeAnswer({ isCorrect, answerText: textAnswer });
  };

  const handleNext = () => {
    resetQuestionState();
    loadNextQuestion();
  };

  const handleEndSession = () => {
    setSessionEnded(true);
    resetQuestionState();
  };

  const handleStart = () => {
    const id = categoryId || requestedCategoryId || activeCategory?.id || '';
    if (id && id !== categoryId) setCategoryId(id);
    resetSession();
    loadNextQuestion(id);
  };

  const sessionSummary = useMemo(() => {
    if (!sessionEnded) return null;
    const total = sessionResults.length;
    const correctCount = sessionResults.filter((r) => r.isCorrect).length;
    const missed = sessionResults.filter((r) => !r.isCorrect).map((r) => r.question);
    const nextQuizzes = getRecommendedNextClubQuizzes({
      teams,
      currentCategoryId: categoryId,
      leagueId: leagueFilter,
      limit: 4,
    });
    return {
      total,
      correctCount,
      accuracy: total ? Math.round((correctCount / total) * 100) : 0,
      missed,
      nextQuizzes,
    };
  }, [sessionEnded, sessionResults, categoryId, leagueFilter]);

  const streakTier = getStreakTier(streak);
  const streakMilestoneLabel = getStreakMilestoneLabel(streak);
  const activeCat = getClubQuizCategoryById(categoryId);

  return (
    <div className="page quiz club-quiz">
      <BreadcrumbNav
        items={[
          { label: 'Home', to: '/' },
          { label: 'Club quizzes', to: '/hubs/quizzes/clubs' },
          ...(activeCat ? [{ label: activeCat.label }] : []),
        ]}
      />

      <header className="page-header">
        <h1>Club quiz</h1>
        <p className="page-header__lead">
          Club knowledge — stadiums, leagues, rivalries, history, and kits. Distinct from{' '}
          <Link to="/quiz">player quizzes</Link>.
        </p>
        {activeCat ? (
          <p className="quiz-active-theme">
            Mode: <strong>{activeCat.label}</strong>
            {' · '}
            <Link to={getClubQuizCategoryHubHref(activeCat.id)} className="quiz-active-theme__link">
              About this format
            </Link>
          </p>
        ) : null}
      </header>

      <section className="quiz-filters club-quiz__filters" aria-label="Club quiz settings">
        <div className="club-quiz__category-grid" role="list">
          {CLUB_QUIZ_CATEGORY_CATALOG.map((cat) => {
            const count = countClubQuizPool(teams, cat.id, { leagueId: leagueFilter });
            const viable = count >= CLUB_QUIZ_MIN_POOL;
            const isActive = categoryId === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                role="listitem"
                className={`club-quiz__category-card${isActive ? ' club-quiz__category-card--active' : ''}${!viable ? ' club-quiz__category-card--thin' : ''}`}
                disabled={!viable}
                onClick={() => handleSelectCategory(cat.id)}
              >
                <span className="club-quiz__category-icon" aria-hidden="true">
                  {cat.icon}
                </span>
                <span className="club-quiz__category-label">{cat.label}</span>
                <span className="club-quiz__category-meta">
                  {viable ? `${count} clubs` : 'Needs more data'}
                </span>
              </button>
            );
          })}
        </div>

        <div className="quiz-filters__row">
          <label className="quiz-filters__field">
            <span>League filter</span>
            <select
              value={leagueFilter}
              onChange={(e) => {
                resetSession();
                setLeagueFilter(e.target.value);
                const params = new URLSearchParams(searchParams);
                if (e.target.value) params.set('league', e.target.value);
                else params.delete('league');
                setSearchParams(params, { replace: true });
              }}
            >
              <option value="">All leagues</option>
              {leagueOptions.map((league) => (
                <option key={league.id} value={league.id}>
                  {getLeagueDisplayName(league)}
                </option>
              ))}
            </select>
          </label>
          <fieldset className="quiz-filters__difficulty">
            <legend>Difficulty</legend>
            <div className="quiz-difficulty-pills">
              {QUIZ_DIFFICULTY_OPTIONS.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  className={`quiz-difficulty-pill${difficulty === option.id ? ' quiz-difficulty-pill--active' : ''}`}
                  onClick={() => setDifficulty(option.id)}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </fieldset>
        </div>

        {categoryId ? (
          <p className="quiz-filters__focus-note">
            Pool: {poolSize} clubs
            {poolReady ? '' : ` (need ${CLUB_QUIZ_MIN_POOL}+ to start)`}
            {leagueFilter ? ` · ${getLeagueDisplayName({ id: leagueFilter })}` : ''}
          </p>
        ) : null}
      </section>

      <div className="quiz-scoreboard" aria-live="polite">
        <div>
          <span className="quiz-scoreboard__label">Score</span>
          <strong>
            {score.correct}/{score.totalAnswered}
          </strong>
        </div>
        <div
          className={`quiz-scoreboard__streak${streakTier ? ` quiz-scoreboard__streak--t${streakTier}` : ''}`}
        >
          <span className="quiz-scoreboard__label">Streak</span>
          <strong>{streak}</strong>
        </div>
        <div>
          <span className="quiz-scoreboard__label">Best</span>
          <strong>{bestStreak}</strong>
        </div>
        {lastXpFeedback ? (
          <div className="quiz-scoreboard__hot">
            <span className="quiz-scoreboard__label">XP</span>
            <strong>{lastXpFeedback}</strong>
          </div>
        ) : null}
      </div>

      {!currentQuestion && !sessionEnded && (
        <div className="quiz-panel__empty">
          <p>
            {categoryId
              ? poolReady
                ? 'Ready when you are — club questions use editorial data (stadiums, rivals, history).'
                : `Not enough clubs in this pool. Try another category or clear the league filter.`
              : 'Pick a club quiz category above to start.'}
          </p>
          <div className="quiz-panel__empty-actions">
            {categoryId && poolReady ? (
              <button type="button" className="btn btn--primary" onClick={handleStart}>
                Start club quiz
              </button>
            ) : null}
            <Link to="/hubs/quizzes/clubs" className="btn btn--secondary">
              Club quiz guides
            </Link>
            <Link to="/quiz" className="btn btn--secondary">
              Player quiz
            </Link>
          </div>
        </div>
      )}

      {currentQuestion && !sessionEnded ? (
        <section className="quiz-panel club-quiz__panel" aria-live="polite">
          <p className="quiz-panel__prompt">{currentQuestion.prompt}</p>
          {currentQuestion.subPrompt ? (
            <p className="club-quiz__sub-prompt">{currentQuestion.subPrompt}</p>
          ) : null}

          {streakMilestoneLabel ? (
            <p className="quiz-streak-indicator__milestone">{streakMilestoneLabel}</p>
          ) : null}

          {!feedback && useMcq && currentQuestion.choices?.length ? (
            <div className="club-quiz__choices" role="group" aria-label="Answer choices">
              {currentQuestion.choices.map((choice) => (
                <button
                  key={choice.id}
                  type="button"
                  className="club-quiz__choice-btn"
                  onClick={() => handleMcqPick(choice)}
                >
                  {choice.label}
                </button>
              ))}
            </div>
          ) : null}

          {!feedback && !useMcq ? (
            <form className="quiz-form club-quiz__form" onSubmit={handleTextSubmit}>
              <label className="sr-only" htmlFor="club-quiz-answer">
                Your answer
              </label>
              <input
                id="club-quiz-answer"
                type="text"
                className="quiz-form__input"
                value={textAnswer}
                onChange={(e) => setTextAnswer(e.target.value)}
                placeholder="Type club or league name…"
                autoComplete="off"
                autoCapitalize="words"
              />
              <button type="submit" className="btn btn--primary">
                Submit
              </button>
            </form>
          ) : null}

          {feedback ? (
            <div
              className={`quiz-feedback${feedback.isCorrect ? ' quiz-feedback--correct' : ' quiz-feedback--incorrect'}`}
            >
              <p className="quiz-feedback__title">
                {feedback.isCorrect ? 'Correct!' : 'Not quite'}
              </p>
              <p>
                Answer: <strong>{feedback.correctLabel}</strong>
              </p>
              {feedback.explanation ? (
                <p className="club-quiz__explanation">{feedback.explanation}</p>
              ) : null}
              <div className="quiz-feedback__actions">
                <Link to={`/team/${feedback.teamId}`} className="btn btn--secondary btn--small">
                  Open club profile
                </Link>
                <Link
                  to={getClubQuizPlayHref(categoryId, { leagueId: leagueFilter })}
                  className="btn btn--secondary btn--small"
                >
                  Same category
                </Link>
              </div>
              <div className="quiz-feedback__next">
                <button type="button" className="btn btn--primary" onClick={handleNext}>
                  Next question
                </button>
                <button type="button" className="btn btn--secondary" onClick={handleEndSession}>
                  End session
                </button>
              </div>
            </div>
          ) : null}
        </section>
      ) : null}

      {sessionEnded && sessionSummary ? (
        <section className="quiz-summary club-quiz__summary">
          <h2>Session summary</h2>
          <p>
            {sessionSummary.correctCount}/{sessionSummary.total} correct (
            {sessionSummary.accuracy}%)
          </p>
          {sessionSummary.missed.length > 0 ? (
            <div className="quiz-summary__missed-block">
              <h3 className="quiz-summary__subtitle">Clubs to revisit</h3>
              <ul className="quiz-summary__missed">
                {sessionSummary.missed.map((q) => (
                  <li key={q.id}>
                    <Link to={`/team/${q.correctTeamId}`} className="quiz-summary__missed-link">
                      {q.correctLabel}
                    </Link>
                    <span className="quiz-summary__missed-hint"> — {q.prompt}</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
          {sessionSummary.nextQuizzes.length > 0 ? (
            <div className="quiz-summary__next-quizzes">
              <h3 className="quiz-summary__subtitle">Try next</h3>
              <ul>
                {sessionSummary.nextQuizzes.map((rec) => (
                  <li key={rec.categoryId}>
                    <Link to={rec.href}>{rec.label}</Link>
                    <span className="quiz-summary__next-meta"> ({rec.poolSize} clubs)</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
          <div className="quiz-summary__actions">
            <button
              type="button"
              className="btn btn--primary"
              onClick={() => {
                setSessionEnded(false);
                handleStart();
              }}
            >
              Play again
            </button>
            <Link to="/daily" className="btn btn--secondary">
              Daily challenge
            </Link>
            <Link to="/hubs/quizzes/clubs" className="btn btn--secondary">
              All club quiz guides
            </Link>
          </div>
        </section>
      ) : null}

    </div>
  );
}
