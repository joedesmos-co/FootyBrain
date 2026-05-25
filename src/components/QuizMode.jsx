import { useCallback, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { getTeamName, leagues, players, teams } from '../data/sampleData';
import { useProgression } from '../hooks/useProgression';

// TODO: Future Firebase sync — persist quiz session history and scores under
//       users/{uid}/quizSessions so progress carries across devices.

const difficultyOptions = [
  { id: 'easy', label: 'Easy', description: 'Club, position, and nationality' },
  { id: 'medium', label: 'Medium', description: 'Position, national team, and one hint' },
  { id: 'hard', label: 'Hard', description: 'One hint only' },
];

function getInitialHintCount(difficulty) {
  return difficulty === 'easy' ? 0 : 1;
}

function pickRandomPlayer(pool) {
  if (pool.length === 0) return null;
  return pool[Math.floor(Math.random() * pool.length)];
}

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
  // Allow last name only if unambiguous enough for casual quiz play
  const lastName = c.split(' ').pop();
  return g === lastName && lastName.length > 3;
}

// Session milestone: award XP bonuses after this many questions answered.
const SESSION_MILESTONE = 5;

export default function QuizMode() {
  const [searchParams] = useSearchParams();
  const requestedTeamId = searchParams.get('team') ?? '';
  const requestedLeagueId = searchParams.get('league') ?? '';
  const requestedTeam = useMemo(
    () => teams.find((team) => team.id === requestedTeamId),
    [requestedTeamId],
  );
  const requestedLeague = useMemo(
    () => (leagues.some((league) => league.id === requestedLeagueId) ? requestedLeagueId : ''),
    [requestedLeagueId],
  );
  const initialLeagueFilter = requestedTeam?.leagueId ?? requestedLeague;
  const initialTeamFilter = requestedTeam?.id ?? '';

  const [leagueFilter, setLeagueFilter] = useState(initialLeagueFilter);
  const [teamFilter, setTeamFilter] = useState(initialTeamFilter);
  const [difficulty, setDifficulty] = useState('medium');
  const [currentPlayer, setCurrentPlayer] = useState(null);
  const [hintsShown, setHintsShown] = useState(1);
  const [answer, setAnswer] = useState('');
  const [feedback, setFeedback] = useState(null);
  const [lastXpGain, setLastXpGain] = useState(0);
  const [score, setScore] = useState({
    correct: 0,
    incorrect: 0,
    totalAnswered: 0,
  });
  const [streak, setStreak] = useState(0);

  // Tracks whether the session milestone XP has been awarded for the current
  // filter combo. Resets when the user changes league or team filter.
  const sessionMilestoneRef = useRef(false);

  const progression = useProgression();

  const teamsInLeague = useMemo(() => {
    if (!leagueFilter) return teams;
    return teams.filter((t) => t.leagueId === leagueFilter);
  }, [leagueFilter]);

  const playerPool = useMemo(() => {
    return players.filter((player) => {
      if (leagueFilter && player.leagueId !== leagueFilter) return false;
      if (teamFilter && player.teamId !== teamFilter) return false;
      return true;
    });
  }, [leagueFilter, teamFilter]);

  const startQuestion = useCallback(() => {
    const next = pickRandomPlayer(playerPool);
    setCurrentPlayer(next);
    setHintsShown(getInitialHintCount(difficulty));
    setAnswer('');
    setFeedback(null);
    setLastXpGain(0);
  }, [difficulty, playerPool]);

  const resetCurrentQuestion = (nextDifficulty = difficulty) => {
    setCurrentPlayer(null);
    setHintsShown(getInitialHintCount(nextDifficulty));
    setAnswer('');
    setFeedback(null);
    setLastXpGain(0);
  };

  const handleLeagueChange = (value) => {
    setLeagueFilter(value);
    setTeamFilter('');
    resetCurrentQuestion();
    setScore({ correct: 0, incorrect: 0, totalAnswered: 0 });
    setStreak(0);
    sessionMilestoneRef.current = false;
  };

  const handleTeamChange = (value) => {
    setTeamFilter(value);
    resetCurrentQuestion();
    setScore({ correct: 0, incorrect: 0, totalAnswered: 0 });
    setStreak(0);
    sessionMilestoneRef.current = false;
  };

  const handleDifficultyChange = (value) => {
    setDifficulty(value);
    resetCurrentQuestion(value);
  };

  const handleCheckAnswer = (e) => {
    e.preventDefault();
    if (!currentPlayer || feedback || !answer.trim()) return;

    const isCorrect = answersMatch(answer, currentPlayer.name);
    const newStreak = isCorrect ? streak + 1 : 0;

    // Compute new session totals synchronously (score state hasn't updated yet).
    const newTotal = score.totalAnswered + 1;
    const newCorrect = score.correct + (isCorrect ? 1 : 0);

    // Build session milestone data if the threshold is hit for the first time
    // with the current filter. A single commit handles answer + milestone together.
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

    // One progression commit per answer — avoids any stale-state batching issues.
    const xpGained = progression.recordAnswer({
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
    setLastXpGain(isCorrect ? xpGained : 0);
  };

  const showAnotherHint = () => {
    if (!currentPlayer) return;
    setHintsShown((n) => Math.min(n + 1, currentPlayer.quizHints.length));
  };

  const visibleHints = currentPlayer
    ? currentPlayer.quizHints.slice(0, hintsShown)
    : [];

  const canShowMoreHints =
    currentPlayer && hintsShown < currentPlayer.quizHints.length;

  const currentPlayerClub = currentPlayer ? getTeamName(currentPlayer.teamId) : '';
  const clueFacts = currentPlayer
    ? [
      difficulty === 'easy' && { label: 'Club', value: currentPlayerClub },
      (difficulty === 'easy' || difficulty === 'medium') && {
        label: 'Position',
        value: currentPlayer.position,
      },
      difficulty === 'easy' && { label: 'Nationality', value: currentPlayer.nationality },
      difficulty === 'medium' && {
        label: 'National team',
        value: currentPlayer.nationalTeam,
      },
    ].filter(Boolean)
    : [];
  const currentDifficulty = difficultyOptions.find((option) => option.id === difficulty);

  return (
    <div className="page quiz">
      <header className="page-header">
        <h1>Quiz Mode</h1>
        <p>Guess the player from hints. Filters narrow the question pool.</p>
      </header>

      <section className="filters" aria-label="Quiz filters">
        <div className="filters__row">
          <label className="filter-field">
            <span>League</span>
            <select
              value={leagueFilter}
              onChange={(e) => handleLeagueChange(e.target.value)}
            >
              <option value="">All leagues</option>
              {leagues.map((league) => (
                <option key={league.id} value={league.id}>
                  {league.name}
                </option>
              ))}
            </select>
          </label>

          <label className="filter-field">
            <span>Team</span>
            <select
              value={teamFilter}
              onChange={(e) => handleTeamChange(e.target.value)}
            >
              <option value="">All teams</option>
              {teamsInLeague.map((team) => (
                <option key={team.id} value={team.id}>
                  {team.name}
                </option>
              ))}
            </select>
          </label>

          <label className="filter-field">
            <span>Difficulty</span>
            <select
              value={difficulty}
              onChange={(e) => handleDifficultyChange(e.target.value)}
            >
              {difficultyOptions.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        </div>
        <p className="filters__count">
          {playerPool.length} players in pool · {currentDifficulty.description}
        </p>
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
          <strong>{streak}</strong>
        </div>
      </section>

      <section className="quiz-panel">
        {!currentPlayer && playerPool.length === 0 && (
          <p className="empty-state">No players in this filter. Choose another league or team.</p>
        )}

        {!currentPlayer && playerPool.length > 0 && (
          <button type="button" className="btn btn--primary btn--large" onClick={startQuestion}>
            Start quiz
          </button>
        )}

        {currentPlayer && (
          <>
            <h2 className="quiz-panel__prompt">Guess the player</h2>

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
              <button
                type="button"
                className="btn btn--secondary"
                onClick={showAnotherHint}
              >
                Show another hint
              </button>
            )}

            <form className="quiz-form" onSubmit={handleCheckAnswer}>
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

            {feedback === 'correct' && (
              <article className="quiz-feedback quiz-feedback--correct" role="status">
                <div className="quiz-feedback__header">
                  <h3>Correct! It was {currentPlayer.name}.</h3>
                  {lastXpGain > 0 && (
                    <span className="quiz-feedback__xp" aria-label={`${lastXpGain} XP earned`}>
                      +{lastXpGain} XP
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
                    <dd>{currentPlayerClub}</dd>
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
