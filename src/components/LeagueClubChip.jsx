import { Link } from 'react-router-dom';
import { formatClubIdentityTags } from '../utils/clubIdentity';
import TeamBadge from './TeamBadge';

export default function LeagueClubChip({ team, quizCount = 0, featured = false }) {
  const identityTag = formatClubIdentityTags(team.identityTags)[0];

  return (
    <article
      className={`league-club-chip${featured ? ' league-club-chip--featured' : ''}`}
    >
      <Link to={`/team/${team.id}`} className="league-club-chip__link">
        <TeamBadge team={team} size="thumb" />
        <span className="league-club-chip__meta">
          <strong>{team.name}</strong>
          <span className="league-club-chip__detail">
            {identityTag ? (
              <span className="league-club-chip__identity">{identityTag.label}</span>
            ) : null}
            {quizCount > 0
              ? `${quizCount} with quiz mode`
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
