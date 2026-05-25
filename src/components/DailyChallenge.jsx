import { useState } from 'react';
import { Link } from 'react-router-dom';
import { getTeamName } from '../data/sampleData';
import { getDailyCompletionBonus, useDailyChallenge } from '../hooks/useDailyChallenge';
import { useProgression } from '../hooks/useProgression';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function normalizeAnswer(text) {
  return text
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/ø/g, 'o')
    .replace(/\s+/g, ' ');
}

function answersMatch(guess, correctName) {
  const g = normalizeAnswer(guess);
  const c = normalizeAnswer(correctName);
  if (g === c) return true;
  const lastName = c.split(' ').pop();
  return g === lastName && lastName.length > 3;
}

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
function ProgressPips({ total, current, results }) {
  return (
    <div className="daily-progress" aria-hidden="true">
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
function CompletionScreen({ todayKey, questions, results, totalXp, dailyStreak }) {
  const correct = results.filter((r) => r.isCorrect).length;
  const total = questions.length;
  const perfect = correct === total;

  return (
    <div className="daily-complete">
      <div className="daily-complete__hero">
        <div className="daily-complete__icon" aria-hidden="true">
          {perfect ? '🏆' : correct >= 3 ? '⭐' : '📚'}
        </div>
        <h1 className="daily-complete__title">
          {perfect ? 'Perfect score!' : 'Challenge complete!'}
        </h1>
        <p className="daily-complete__date">{formatDateKey(todayKey)}</p>
      </div>

      <div className="daily-complete__stats" aria-label="Today's results">
        <div className="daily-complete__stat">
          <span className="daily-complete__stat-value">{correct}/{total}</span>
          <span className="daily-complete__stat-label">Correct</span>
        </div>
        <div className="daily-complete__stat">
          <span className="daily-complete__stat-value daily-complete__xp">+{totalXp} XP</span>
          <span className="daily-complete__stat-label">Earned</span>
        </div>
        <div className="daily-complete__stat">
          <span className="daily-complete__stat-value">
            {dailyStreak >= 2 ? '🔥 ' : ''}{dailyStreak}
          </span>
          <span className="daily-complete__stat-label">Day streak</span>
        </div>
      </div>

      <section aria-label="Question results" className="daily-complete__results">
        <h2 className="section-label">Results</h2>
        <ol className="daily-complete__list">
          {questions.map((player, i) => {
            const result = results[i];
            const club = getTeamName(player.teamId);
            const isCorrect = result?.isCorrect ?? false;
            return (
              <li
                key={player.id}
                className={`daily-result-item${isCorrect ? ' daily-result-item--correct' : ' daily-result-item--incorrect'}`}
              >
                <span className="daily-result-item__icon" aria-label={isCorrect ? 'Correct' : 'Incorrect'}>
                  {isCorrect ? '✓' : '✗'}
                </span>
                <div className="daily-result-item__body">
                  <strong className="daily-result-item__name">{player.name}</strong>
                  <span className="daily-result-item__sub">{club} · {player.nationalTeam}</span>
                </div>
                {!isCorrect && (
                  <Link to={`/player/${player.id}`} className="daily-result-item__learn">
                    Learn →
                  </Link>
                )}
              </li>
            );
          })}
        </ol>
      </section>

      <div className="daily-complete__actions">
        <Link to="/profile" className="btn btn--secondary">View profile</Link>
        <Link to="/quiz" className="btn btn--primary">Play Quiz Mode</Link>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main page component
// ---------------------------------------------------------------------------
export default function DailyChallenge() {
  const daily = useDailyChallenge();
  const progression = useProgression();

  const { todayKey, questions, isCompleted, completionData } = daily;

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
  const currentClub = currentPlayer ? getTeamName(currentPlayer.teamId) : '';
  const visibleHints = currentPlayer
    ? currentPlayer.quizHints.slice(0, hintsShown)
    : [];
  const canShowMoreHints =
    currentPlayer && hintsShown < currentPlayer.quizHints.length;

  // ── Handlers ───────────────────────────────────────────────────────────────
  const handleCheck = (e) => {
    e.preventDefault();
    if (!currentPlayer || feedback || !answer.trim()) return;
    const isCorrect = answersMatch(answer, currentPlayer.name);
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

      setCompletionXp(totalXp);
      setPhase('complete');
    } else {
      setCurrentIndex((i) => i + 1);
      setAnswer('');
      setFeedback(null);
      setHintsShown(1);
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
        <CompletionScreen
          todayKey={todayKey}
          questions={questions}
          results={displayResults}
          totalXp={completionXp}
          dailyStreak={daily.dailyStreak}
        />
      </div>
    );
  }

  // ── Quiz screen ────────────────────────────────────────────────────────────
  return (
    <div className="page daily-page">
      <header className="daily-header">
        <div>
          <h1 className="daily-header__title">Daily Challenge</h1>
          <p className="daily-header__date">{formatDateKey(todayKey)}</p>
        </div>
        <ProgressPips
          total={questions.length}
          current={currentIndex}
          results={results}
        />
      </header>

      <section className="daily-question-panel" aria-label={`Question ${currentIndex + 1} of ${questions.length}`}>
        <p className="daily-question-panel__label">
          Question {currentIndex + 1} of {questions.length} — Guess the player
        </p>

        {/* Clue facts — medium difficulty: position + national team */}
        <dl className="quiz-clues" aria-label="Clues">
          <div>
            <dt>Position</dt>
            <dd>{currentPlayer?.position}</dd>
          </div>
          <div>
            <dt>National team</dt>
            <dd>{currentPlayer?.nationalTeam}</dd>
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
          <label className="filter-field">
            <span>Your answer</span>
            <input
              type="text"
              placeholder="Type player name…"
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              disabled={!!feedback}
              autoComplete="off"
            />
          </label>
          {!feedback && (
            <button
              type="submit"
              className="btn btn--primary"
              disabled={!answer.trim()}
            >
              Check answer
            </button>
          )}
        </form>

        {/* Feedback */}
        {feedback === 'correct' && (
          <article className="quiz-feedback quiz-feedback--correct" role="status">
            <div className="quiz-feedback__header">
              <h3>Correct! It was {currentPlayer.name}.</h3>
            </div>
            <dl className="quiz-feedback__details">
              <div>
                <dt>Club</dt>
                <dd>{currentClub}</dd>
              </div>
              <div>
                <dt>National team</dt>
                <dd>{currentPlayer.nationalTeam}</dd>
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
            <h3>Not quite. The answer was {currentPlayer.name}.</h3>
            <dl className="quiz-feedback__details">
              <div>
                <dt>Club</dt>
                <dd>{currentClub}</dd>
              </div>
              <div>
                <dt>National team</dt>
                <dd>{currentPlayer.nationalTeam}</dd>
              </div>
            </dl>
            <p>{currentPlayer.quickFact}</p>
            <Link to={`/player/${currentPlayer.id}`} className="quiz-feedback__link">
              Learn this player
            </Link>
          </article>
        )}

        {feedback && (
          <button type="button" className="btn btn--primary" onClick={handleNext}>
            {currentIndex < questions.length - 1 ? 'Next question' : 'See results'}
          </button>
        )}
      </section>
    </div>
  );
}
