import { Link } from 'react-router-dom';
import { getClubQuizPlayHref } from '../data/clubQuizCategories';
import { getProfileExploreLead } from '../data/profileExploreEnhancements';

/**
 * @param {{
 *   variant: 'player' | 'team',
 *   entityId: string,
 *   teamId?: string,
 *   leagueId?: string,
 *   teamName?: string,
 *   leagueName?: string,
 *   quizReady?: boolean,
 *   lead?: string,
 * }} props
 */
export default function ProfileKeepExploring({
  variant,
  entityId,
  teamId = '',
  leagueId = '',
  teamName = '',
  leagueName = '',
  quizReady = false,
  lead = '',
}) {
  const exploreLead = lead || getProfileExploreLead(entityId, { teamId });
  const hasLinks = Boolean(teamId || leagueId);

  if (!exploreLead && !hasLinks) return null;

  const title = variant === 'team' ? 'Keep exploring this club' : 'Keep exploring';

  return (
    <section className="profile__section profile-keep-exploring" aria-labelledby={`keep-exploring-${entityId}`}>
      <h2 id={`keep-exploring-${entityId}`}>{title}</h2>
      {exploreLead ? <p className="profile-keep-exploring__lead">{exploreLead}</p> : null}
      <div className="profile-keep-exploring__actions">
        {teamId ? (
          <Link to={`/team/${teamId}`} className="btn btn--secondary btn--small">
            {teamName || 'Club'} squad
          </Link>
        ) : null}
        {leagueId ? (
          <Link to={`/league/${leagueId}`} className="btn btn--secondary btn--small">
            {leagueName || 'League'} guide
          </Link>
        ) : null}
        {quizReady && teamId ? (
          <Link to={`/quiz?team=${teamId}`} className="btn btn--secondary btn--small">
            Team player quiz
          </Link>
        ) : null}
        {leagueId ? (
          <Link to={`/quiz?league=${leagueId}`} className="btn btn--secondary btn--small">
            League player quiz
          </Link>
        ) : null}
        {leagueId ? (
          <Link
            to={getClubQuizPlayHref('stadium', { leagueId })}
            className="btn btn--secondary btn--small"
          >
            Stadium quiz
          </Link>
        ) : null}
        <Link to="/daily" className="btn btn--secondary btn--small">
          Daily challenge
        </Link>
        <Link to="/hubs" className="btn btn--secondary btn--small">
          Discovery hubs
        </Link>
      </div>
    </section>
  );
}
