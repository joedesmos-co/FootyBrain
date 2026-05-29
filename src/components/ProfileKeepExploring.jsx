import { Link } from 'react-router-dom';
import { getProfileExploreLead } from '../data/profileExploreEnhancements';
import { buildNationalTeamInternalLinks } from '../utils/internalLinking.js';
import {
  buildKeepExploringLinks,
  buildLeagueExploreLead,
  buildNationalExploreLead,
  buildPlayerExploreLead,
  buildStructuredExploreLead,
} from '../utils/topImportanceProfile';

/** Short hints for national-team study paths (no invented copy). */
const NATIONAL_LINK_HINTS = {
  '/world-cup': 'Tournament prep hub',
  '/national-teams': 'Every live pool',
  '/quiz?theme=world-cup': 'Curated WC questions',
  '/daily': 'One quick round',
  '/hubs': 'Leagues, quizzes, and guides',
};

const VARIANT_TITLES = {
  player: 'Keep exploring',
  team: 'Keep exploring this club',
  league: 'Keep exploring this league',
  national: 'Keep exploring this nation',
};

/**
 * @param {{
 *   variant: 'player' | 'team' | 'league' | 'national',
 *   entityId: string,
 *   premium?: boolean,
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
 *   player?: object | null,
 *   nationalTeam?: object | null,
 *   leagueStats?: { clubs?: number; quizReady?: number },
 *   nationalStats?: { linkedCount?: number; quizReadyCount?: number; tournamentLine?: string },
 *   squad?: object[],
 * }} props
 */
export default function ProfileKeepExploring({
  variant,
  entityId,
  premium = false,
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
  player = null,
  nationalTeam = null,
  leagueStats = {},
  nationalStats = {},
  squad = [],
}) {
  const structuredLead = buildStructuredExploreLead({
    team,
    league,
    leagueId,
    quizReady,
    leagueTeams,
  });

  let variantLead = '';
  if (variant === 'player' && player) {
    variantLead = buildPlayerExploreLead(player, { team, teamName, leagueName, quizReady });
  } else if (variant === 'league' && league) {
    variantLead = buildLeagueExploreLead(league, leagueStats);
  } else if (variant === 'national' && nationalTeam) {
    variantLead = buildNationalExploreLead(nationalTeam, nationalStats);
  }

  const exploreLead =
    lead ||
    getProfileExploreLead(entityId, { teamId }) ||
    variantLead ||
    structuredLead;

  const semanticLinks =
    variant === 'national' && nationalTeam
      ? buildNationalTeamInternalLinks({
          nationalTeam,
          quizReady,
          squad,
        }).map((link) => ({
          ...link,
          hint:
            NATIONAL_LINK_HINTS[link.to] ??
            (link.to.includes('/quiz?nationalTeam=')
              ? 'International name recall'
              : link.to.startsWith('/national-team/')
                ? 'Rivalry context'
                : link.to.startsWith('/league/')
                  ? 'Where most of the squad plays'
                  : link.to.includes('/hubs/players/')
                    ? 'Same nationality pool'
                    : ''),
        }))
      : buildKeepExploringLinks({
          team,
          league,
          leagueId,
          leagueName,
          leagueTeams,
          nationalTeamId,
          quizReady,
          nationality: player?.nationality ?? player?.nationalTeam,
        });

  const defaultLinks = [];
  if (variant !== 'national' && teamId && !semanticLinks.some((l) => l.to === `/team/${teamId}`)) {
    defaultLinks.push({
      label: `${teamName || 'Club'} squad`,
      to: `/team/${teamId}`,
      hint: 'Roster and club context',
    });
  }
  if (variant !== 'national' && leagueId && !semanticLinks.some((l) => l.to === `/league/${leagueId}`)) {
    defaultLinks.push({
      label: `${leagueName || 'League'} guide`,
      to: `/league/${leagueId}`,
      hint: 'Competition overview',
    });
  }

  const actionLinks = [...semanticLinks, ...defaultLinks].filter(
    (link, index, arr) => arr.findIndex((x) => x.to === link.to) === index,
  );

  if (!exploreLead && actionLinks.length === 0) return null;

  const title = VARIANT_TITLES[variant] ?? 'Keep exploring';

  return (
    <section
      className={`profile__section profile-keep-exploring${premium ? ' profile-keep-exploring--premium' : ''}`}
      aria-labelledby={`keep-exploring-${entityId}`}
    >
      <h2 id={`keep-exploring-${entityId}`}>{title}</h2>
      {exploreLead ? <p className="profile-keep-exploring__lead">{exploreLead}</p> : null}
      <div className="profile-keep-exploring__grid">
        {actionLinks.map((link) => (
          <Link key={link.to} to={link.to} className="profile-keep-exploring__chip">
            <strong>{link.label}</strong>
            {link.hint ? <span>{link.hint}</span> : null}
          </Link>
        ))}
      </div>
    </section>
  );
}
