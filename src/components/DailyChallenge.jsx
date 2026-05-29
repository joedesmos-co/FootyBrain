import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { canonicalUrlForPath } from '../utils/brand';
import {
  applyPageSeo,
  buildDailySeoDescription,
  buildDailySeoTitle,
} from '../utils/seoCtr.js';
import { getLeagueDisplayName } from '../utils/footballDisplay';
import QuizRegistryLoadState from './QuizRegistryLoadState';
import { useDailyCompletionStatus } from '../hooks/useDailyCompletionStatus';
import { getDailyCompletionBonus, useDailyChallenge } from '../hooks/useDailyChallenge';
import { useProgression } from '../hooks/useProgression';
import { answersMatch, buildAmbiguousLastNames } from '../utils/quizSession';
import CountryFlag from './CountryFlag';
import PlayerAutocomplete from './PlayerAutocomplete';
import PositionLabel from './PositionLabel';
import BreadcrumbNav from './BreadcrumbNav';
import QuizSubNav from './QuizSubNav';
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
  getStreakTier,
  scrollQuizPanelIntoView,
} from '../utils/quizUiPolish';
import QuizPlayerFeedback from './QuizPlayerFeedback';
import QuizFeedbackActions from './QuizFeedbackActions';

function formatDateKey(dateKey) {
  const [y, m, d] = dateKey.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

// ---------------------------------------------------------------------------
// Progress pip strip (● ● ○ ○ ○)
// ---------------------------------------------------------------------------
function consecutiveCorrectAtEnd(results) {
  let count = 0;
  for (let i = results.length - 1; i >= 0; i -= 1) {
    if (results[i].isCorrect) count += 1;
    else break;
  }
  return count;
}

function ProgressPips({ total, current, results }) {
  return (
    <div
      className="daily-progress"
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={total}
      aria-valuenow={results.length}
      aria-label={`Daily progress: ${results.length} of ${total} answered`}
    >
      {Array.from({ length: total }, (_, i) => {
        let state = 'pending';
        if (i < results.length) {
          state = results[i].isCorrect ? 'correct' : 'incorrect';
        } else if (i === current) {
          state = 'active';
        }
        return (
          <span
            key={i}
            className={`daily-progress__pip daily-progress__pip--${state}`}
            aria-hidden="true"
          />
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Completion screen — shown after all 5 questions or on reload if already done
// ---------------------------------------------------------------------------
function CompletionScreen({
  todayKey,
  questions,
  results,
  totalXp,
  dailyStreak,
  challengeLabel,
  challengeScope,
}) {
  const correct = results.filter((r) => r.isCorrect).length;
  const total = questions.length;
  const perfect = correct === total;
  const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0;
  const missed = questions.filter((player, i) => !results[i]?.isCorrect);
  const missedCards = buildMissedPlayerStudyCards(missed, { limit: 5 });
  const missedIntro = getMissedLearningIntro(missed.length);
  const encouragement = getSessionEncouragement(accuracy, dailyStreak, missed.length);

  const scopeLabel =
    challengeScope?.name && challengeScope.type !== 'general'
      ? challengeScope.type === 'league'
        ? getLeagueDisplayName({
            id: challengeScope.leagueId,
            name: challengeScope.name,
          })
        : challengeScope.name
      : null;

  return (
    <article className="info-card quiz-summary daily-complete" aria-label="Daily challenge summary">
      <p className="daily-complete__date">{formatDateKey(todayKey)}</p>
      <h2 className="quiz-summary__title">
        {perfect ? 'Perfect daily run' : getSessionEndHeadline(accuracy, perfect)}
      </h2>
      <p className="quiz-summary__nudge">{getOneMoreQuizNudge(accuracy, dailyStreak)}</p>
      {challengeLabel ? (
        <p className="daily-challenge-label daily-challenge-label--complete">
          {challengeLabel}
          {scopeLabel ? (
            <span className="daily-challenge-label__scope"> · {scopeLabel}</span>
          ) : null}
        </p>
      ) : null}
      <p className="quiz-summary__encourage">{encouragement}</p>

      <div className="quiz-summary__hero">
        <p className="quiz-summary__score">
          <span className="quiz-summary__score-value">{correct}</span>
          <span className="quiz-summary__score-sep">/</span>
          <span className="quiz-summary__score-total">{total}</span>
        </p>
        <p className="quiz-summary__accuracy">{accuracy}% today</p>
        <p className="quiz-summary__meta">
          +{totalXp} XP
          {dailyStreak >= 2
            ? ` · ${dailyStreak}-day return streak`
            : dailyStreak === 1
              ? ' · day 1 of your streak'
              : ''}
        </p>
      </div>

      {missedCards.length > 0 ? (
        <div className="quiz-summary__missed-block" id="daily-missed-players">
          <h3 className="quiz-summary__subtitle">Study missed players</h3>
          {missedIntro ? <p className="quiz-summary__missed-intro">{missedIntro}</p> : null}
          <ul className="quiz-summary__missed">
            {missedCards.map((card) => (
              <li key={card.id}>
                <Link to={card.profileHref} className="quiz-summary__missed-link quiz-summary__missed-link--study">
                  <span className="quiz-summary__missed-name">{card.name}</span>
                  <span className="quiz-summary__missed-tip">{card.tip}</span>
                  <span className="quiz-summary__missed-cta">Profile &amp; hints →</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <p className="quiz-summary__perfect">Perfect score — see you tomorrow for a new lineup.</p>
      )}

      <section className="quiz-summary__next" aria-labelledby="daily-next-title">
        <h3 id="daily-next-title" className="quiz-summary__subtitle">
          Keep playing
        </h3>
        <ul className="quiz-summary__next-list">
          <li>
            <Link to="/quiz" className="quiz-summary__next-link">
              <strong>Free play quiz</strong>
              <span>Pick league, club, or theme — build a longer streak</span>
            </Link>
          </li>
          <li>
            <Link to="/club-quiz?category=stadium" className="quiz-summary__next-link">
              <strong>Club stadium quiz</strong>
              <span>Switch to club knowledge for variety</span>
            </Link>
          </li>
        </ul>
      </section>

      <div className="quiz-summary__actions">
        <Link to="/quiz" className="btn btn--primary btn--large">
          Play another quiz
        </Link>
        <Link
          to="/club-quiz?category=stadium"
          className="btn btn--secondary btn--large quiz-summary__follow-up"
        >
          One more: club stadium quiz
        </Link>
        <Link to="/profile" className="btn btn--secondary">
          View progress
        </Link>
      </div>
    </article>
  );
}

// ---------------------------------------------------------------------------
// Main page component
// ---------------------------------------------------------------------------
export default function DailyChallenge() {
  const daily = useDailyChallenge();
  const { refresh: refreshDailyNav } = useDailyCompletionStatus();
  const progression = useProgression();

  const {
    todayKey,
    questions,
    challengeLabel,
    challengeScope,
    isCompleted,
    completionData,
    quizRegistryStatus,
    quizRegistry,
    quizRegistryRetry,
  } = daily;

  useEffect(() => {
    const scopeLabel =
      challengeScope?.name && challengeScope.type !== 'general'
        ? challengeScope.type === 'league'
          ? getLeagueDisplayName({
              id: challengeScope.leagueId,
              name: challengeScope.name,
            })
          : challengeScope.name
        : null;
    applyPageSeo({
      title: buildDailySeoTitle({
        dateLabel: formatDateKey(todayKey),
        scopeLabel,
      }),
      description: buildDailySeoDescription({
        scopeLabel,
        questionCount: questions.length || 5,
      }),
      canonicalUrl: canonicalUrlForPath('/daily'),
      robots: 'index,follow',
    });
  }, [todayKey, challengeScope, questions.length]);

  // ── Quiz state (only active while answering questions) ─────────────────────
  const [currentIndex, setCurrentIndex] = useState(0);
  const [results, setResults] = useState([]); // [{ isCorrect, player }]
  const [answer, setAnswer] = useState('');
  const [feedback, setFeedback] = useState(null); // 'correct' | 'incorrect' | null
  const [hintsShown, setHintsShown] = useState(1);
  const [phase, setPhase] = useState(isCompleted ? 'complete' : 'quiz');
  const [completionXp, setCompletionXp] = useState(completionData?.xpEarned ?? 0);

  // ── Derived ────────────────────────────────────────────────────────────────
  const currentPlayer = questions[currentIndex] ?? null;
  const currentClub = currentPlayer ? (currentPlayer.teamName ?? 'Unknown') : '';
  const visibleHints = currentPlayer
    ? currentPlayer.quizHints.slice(0, hintsShown)
    : [];
  const canShowMoreHints =
    currentPlayer && hintsShown < currentPlayer.quizHints.length;

  const answerStreak = (() => {
    if (feedback !== 'correct') return 0;
    let streak = 1;
    for (let i = results.length - 1; i >= 0; i -= 1) {
      if (results[i].isCorrect) streak += 1;
      else break;
    }
    return streak;
  })();

  const runBestStreak = useMemo(() => {
    let best = 0;
    let current = 0;
    for (const r of results) {
      if (r.isCorrect) {
        current += 1;
        best = Math.max(best, current);
      } else {
        current = 0;
      }
    }
    if (feedback === 'correct') best = Math.max(best, answerStreak);
    return best;
  }, [results, feedback, answerStreak]);

  const nextQuestionLabel = getNextQuestionButtonLabel(
    answerStreak,
    feedback === 'correct' ? 'correct' : 'incorrect',
    {
      bestStreak: runBestStreak,
      isLast: currentIndex >= questions.length - 1,
    },
  );

  useEffect(() => {
    if (feedback) scrollQuizPanelIntoView();
  }, [feedback]);

  // Fixed set for today's 5 questions — blocks last-name shortcuts when two players share a surname
  const ambiguousLastNames = buildAmbiguousLastNames(questions);

  // ── Handlers ───────────────────────────────────────────────────────────────
  const handleCheck = (e) => {
    e.preventDefault();
    if (!currentPlayer || feedback || !answer.trim()) return;
    const isCorrect = answersMatch(answer, currentPlayer.name, ambiguousLastNames);
    setFeedback(isCorrect ? 'correct' : 'incorrect');
  };

  const handleNext = () => {
    if (!feedback) return;
    const isCorrect = feedback === 'correct';
    const newResults = [...results, { isCorrect, player: currentPlayer }];
    setResults(newResults);

    if (newResults.length === questions.length) {
      // All questions answered — award XP and complete in one atomic operation
      const correctCount = newResults.filter((r) => r.isCorrect).length;
      const bonusXp = getDailyCompletionBonus(correctCount, questions.length);

      const totalXp = progression.recordDailyChallenge({
        results: newResults.map((r) => r.isCorrect),
        bonusXp,
      });

      daily.markCompleted({
        score: correctCount,
        xpEarned: totalXp,
        questionResults: newResults.map((r) => r.isCorrect),
      });
      refreshDailyNav();

      setCompletionXp(totalXp);
      setPhase('complete');
    } else {
      setCurrentIndex((i) => i + 1);
      setAnswer('');
      setFeedback(null);
      setHintsShown(1);
      scrollQuizPanelIntoView();
    }
  };

  // ── Completion screen ──────────────────────────────────────────────────────
  if (phase === 'complete') {
    // When returning to this page after already completing:
    // reconstruct results from stored questionResults so the screen is fully populated.
    const displayResults =
      results.length > 0
        ? results
        : (completionData?.questionResults ?? []).map((isCorrect, i) => ({
            isCorrect,
            player: questions[i],
          }));

    return (
      <div className="page daily-page">
        <BreadcrumbNav items={[{ label: 'Home', to: '/' }, { label: 'Daily challenge' }]} />
        <CompletionScreen
          todayKey={todayKey}
          questions={questions}
          results={displayResults}
          totalXp={completionXp}
          dailyStreak={daily.dailyStreak}
          challengeLabel={challengeLabel}
          challengeScope={challengeScope}
        />
      </div>
    );
  }

  // ── Quiz screen ────────────────────────────────────────────────────────────
  if (quizRegistryStatus !== 'ready' || !quizRegistry) {
    return (
      <QuizRegistryLoadState
        status={quizRegistryStatus}
        onRetry={quizRegistryRetry}
        loadingLabel="Loading daily challenge…"
        pageClass="daily-page"
      />
    );
  }

  return (
    <div className="page daily-page">
      <BreadcrumbNav items={[{ label: 'Home', to: '/' }, { label: 'Daily challenge' }]} />
      <QuizSubNav />
      <header className="daily-header">
        <div>
          <h1 className="daily-header__title">Daily Challenge</h1>
          <p className="daily-header__date">{formatDateKey(todayKey)}</p>
          {challengeLabel && (
            <p className="daily-challenge-label" role="status">
              <span className="daily-challenge-label__type">{challengeLabel}</span>
              {challengeScope?.name && challengeScope.type !== 'general' && (
                <span className="daily-challenge-label__scope">
                  {' '}
                  —{' '}
                  {challengeScope.type === 'national-team' ? (
                    <Link to={`/national-team/${challengeScope.nationalTeamId}`}>
                      {challengeScope.name}
                    </Link>
                  ) : challengeScope.type === 'club' ? (
                    <Link to={`/team/${challengeScope.teamId}`}>{challengeScope.name}</Link>
                  ) : challengeScope.type === 'league' ? (
                    <Link to={`/league/${challengeScope.leagueId}`}>
                      {getLeagueDisplayName({
                        id: challengeScope.leagueId,
                        name: challengeScope.name,
                      })}
                    </Link>
                  ) : (
                    challengeScope.name
                  )}
                </span>
              )}
            </p>
          )}
        </div>
        <ProgressPips
          total={questions.length}
          current={currentIndex}
          results={results}
        />
      </header>

      <section
        className="quiz-panel daily-question-panel"
        aria-label={`Question ${currentIndex + 1} of ${questions.length}`}
      >
        <p className="daily-question-panel__label">
          Question {currentIndex + 1} of {questions.length} — Guess the player
        </p>

        {/* Clue facts — medium difficulty: position + national team */}
        <dl className="quiz-clues" aria-label="Clues">
          <div>
            <dt>Position</dt>
            <dd>
              <PositionLabel position={currentPlayer?.position} />
            </dd>
          </div>
          <div>
            <dt>National team</dt>
            <dd className="football-meta-line">
              <CountryFlag label={currentPlayer?.nationalTeam} />
              {currentPlayer?.nationalTeam || '—'}
            </dd>
          </div>
        </dl>

        {/* Hints */}
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
          <button
            type="button"
            className="btn btn--secondary"
            onClick={() => setHintsShown((n) => Math.min(n + 1, currentPlayer.quizHints.length))}
          >
            Show another hint
          </button>
        )}

        {/* Answer form */}
        <form className="quiz-form" onSubmit={handleCheck}>
          <PlayerAutocomplete
            players={questions}
            value={answer}
            onChange={setAnswer}
            onSelect={(player) => setAnswer(player.name)}
            label="Your answer"
            placeholder="Type player name…"
            disabled={!!feedback}
            excludeIds={currentPlayer ? [currentPlayer.id] : []}
            maxResults={5}
            showNationalTeam
            showClubWhenAmbiguous
            getTeamName={(id) =>
              (quizRegistry?.teams ?? []).find((t) => t.id === id)?.name ?? 'Unknown'
            }
            getLeagueName={(id) => {
              const league = (quizRegistry?.leagues ?? []).find((l) => l.id === id);
              return league
                ? getLeagueDisplayName(league)
                : getLeagueDisplayName({ id, name: 'Unknown' });
            }}
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
        </form>

        {feedback === 'correct' ? (
          <QuizPlayerFeedback
            variant="correct"
            player={currentPlayer}
            clubLabel={currentClub}
            profileLabel="Learn this player"
            streak={answerStreak}
            streakTier={getStreakTier(answerStreak)}
            milestone={getStreakMilestoneCopy(answerStreak)}
          />
        ) : null}

        {feedback === 'incorrect' ? (
          <QuizPlayerFeedback
            variant="incorrect"
            player={currentPlayer}
            clubLabel={currentClub}
            profileLabel="Learn this player"
            momentumLine={getIncorrectMomentumCopy(
              Math.max(runBestStreak, consecutiveCorrectAtEnd(results)),
            )}
          />
        ) : null}

        {feedback ? (
          <QuizFeedbackActions>
            <button type="button" className="btn btn--primary btn--large" onClick={handleNext}>
              {nextQuestionLabel}
            </button>
          </QuizFeedbackActions>
        ) : null}
      </section>
    </div>
  );
}
