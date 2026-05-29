import { Link } from 'react-router-dom';
import CountryFlag from './CountryFlag';

/**
 * Shared post-answer feedback for player-name quizzes (daily + player quiz surfaces).
 *
 * @param {{
 *   variant: 'correct' | 'incorrect',
 *   player: object,
 *   clubLabel: string,
 *   profileLabel?: string,
 *   streak?: number,
 *   streakTier?: number,
 *   milestone?: string,
 *   momentumLine?: string,
 *   xpLine?: string,
 * }} props
 */
export default function QuizPlayerFeedback({
  variant,
  player,
  clubLabel,
  profileLabel = 'View player profile',
  streak = 0,
  streakTier = 0,
  milestone = '',
  momentumLine = '',
  xpLine = '',
}) {
  const isCorrect = variant === 'correct';

  return (
    <article
      className={`quiz-feedback quiz-feedback--pop quiz-feedback--${isCorrect ? 'correct' : 'incorrect'}${isCorrect && streakTier ? ` quiz-feedback--streak-t${streakTier}` : ''}`}
      role="status"
    >
      <div
        className={`quiz-feedback__banner quiz-feedback__banner--${isCorrect ? 'success' : 'miss'}`}
      >
        <span className="quiz-feedback__icon" aria-hidden="true">
          {isCorrect ? '✓' : '×'}
        </span>
        <div className="quiz-feedback__banner-copy">
          <h3>{isCorrect ? 'Correct' : 'Not quite'}</h3>
          <p className="quiz-feedback__answer-name">{player.name}</p>
        </div>
        {isCorrect && streak > 1 ? (
          <span className={`quiz-feedback__streak quiz-feedback__streak--t${streakTier}`}>
            {streak} streak
          </span>
        ) : null}
      </div>
      {milestone ? <p className="quiz-feedback__milestone">{milestone}</p> : null}
      {xpLine ? (
        <p className="quiz-feedback__xp" aria-label={xpLine}>
          {xpLine}
        </p>
      ) : null}
      {momentumLine ? <p className="quiz-feedback__momentum">{momentumLine}</p> : null}
      <dl className="quiz-feedback__details">
        <div>
          <dt>Club</dt>
          <dd>{clubLabel}</dd>
        </div>
        <div>
          <dt>National team</dt>
          <dd className="football-meta-line">
            <CountryFlag label={player.nationalTeam} />
            {player.nationalTeam || '—'}
          </dd>
        </div>
      </dl>
      {player.quickFact ? <p className="quiz-feedback__fact">{player.quickFact}</p> : null}
      <Link
        to={`/player/${player.id}`}
        className="btn btn--secondary btn--small quiz-feedback__cta"
      >
        {profileLabel}
      </Link>
    </article>
  );
}
