import { Link } from 'react-router-dom';
import TeamBadge from './TeamBadge';

export default function LeagueClubChip({ team, quizCount = 0, featured = false }) {
  return (
    <article
      className={`league-club-chip${featured ? ' league-club-chip--featured' : ''}`}
    >
      <Link to={`/team/${team.id}`} className="league-club-chip__link">
        <TeamBadge team={team} size="thumb" />
        <span className="league-club-chip__meta">
          <strong>{team.name}</strong>
          <span>
            {quizCount > 0
              ? `${quizCount} quiz-ready`
              : 'Browse squad'}
          </span>
        </span>
      </Link>
      {quizCount > 0 && (
        <Link
          to={`/quiz?team=${team.id}`}
          className="league-club-chip__quiz"
          aria-label={`Quiz on ${team.name}`}
        >
          Quiz
        </Link>
      )}
    </article>
  );
}
