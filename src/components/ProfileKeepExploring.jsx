import { Link } from 'react-router-dom';
import { getProfileExploreLead } from '../data/profileExploreEnhancements';
import { buildKeepExploringLinks, buildStructuredExploreLead } from '../utils/topImportanceProfile';

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
 *   team?: object | null,
 *   league?: object | null,
 *   leagueTeams?: object[],
 *   nationalTeamId?: string,
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
  team = null,
  league = null,
  leagueTeams = [],
  nationalTeamId = '',
}) {
  const structuredLead = buildStructuredExploreLead({
    team,
    league,
    leagueId,
    quizReady,
    leagueTeams,
  });
  const exploreLead =
    lead || getProfileExploreLead(entityId, { teamId }) || structuredLead;

  const semanticLinks = buildKeepExploringLinks({
    team,
    league,
    leagueId,
    leagueName,
    leagueTeams,
    nationalTeamId,
    quizReady,
  });

  const defaultLinks = [];
  if (teamId && !semanticLinks.some((l) => l.to === `/team/${teamId}`)) {
    defaultLinks.push({ label: `${teamName || 'Club'} squad`, to: `/team/${teamId}` });
  }
  if (leagueId && !semanticLinks.some((l) => l.to === `/league/${leagueId}`)) {
    defaultLinks.push({ label: `${leagueName || 'League'} guide`, to: `/league/${leagueId}` });
  }

  const actionLinks = [...semanticLinks, ...defaultLinks].filter(
    (link, index, arr) => arr.findIndex((x) => x.to === link.to) === index,
  );

  if (!exploreLead && actionLinks.length === 0) return null;

  const title = variant === 'team' ? 'Keep exploring this club' : 'Keep exploring';

  return (
    <section
      className="profile__section profile-keep-exploring"
      aria-labelledby={`keep-exploring-${entityId}`}
    >
      <h2 id={`keep-exploring-${entityId}`}>{title}</h2>
      {exploreLead ? <p className="profile-keep-exploring__lead">{exploreLead}</p> : null}
      <div className="profile-keep-exploring__actions">
        {actionLinks.map((link) => (
          <Link key={link.to} to={link.to} className="btn btn--secondary btn--small">
            {link.label}
          </Link>
        ))}
      </div>
    </section>
  );
}
