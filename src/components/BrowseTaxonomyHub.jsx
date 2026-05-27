import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  OTHER_CLUB_REGION_LABELS,
  OTHER_CLUB_REGION_ORDER,
  OTHER_CLUBS_LEAGUE_ID,
} from '../utils/browseTaxonomy';
import { formatCountryLabel, getLeagueDisplayName } from '../utils/footballDisplay';
import LeagueBadge from './LeagueBadge';
import NationalTeamBadge from './NationalTeamBadge';

const NATIONAL_TEAM_PREVIEW_COUNT = 8;
const NATIONAL_PREVIEW_IDS = [
  'england',
  'brazil',
  'france',
  'germany',
  'spain',
  'argentina',
  'united-states',
  'mexico',
  'switzerland',
  'portugal',
  'netherlands',
  'italy',
];

function hubKeyLeague(leagueId) {
  return `league:${leagueId}`;
}

function hubKeyOtherRegion(regionId) {
  return `other:${regionId}`;
}

function BrowseClubGrid({ teams, compact = false }) {
  return (
    <div className={`browse-club-grid${compact ? ' browse-club-grid--compact' : ''}`}>
      {teams.map((team) => (
        <Link key={team.id} to={`/team/${team.id}`} className="browse-club-chip">
          <span className="browse-club-chip__name">{team.name}</span>
          {team.country ? (
            <span className="browse-club-chip__meta">{formatCountryLabel(team.country)}</span>
          ) : null}
        </Link>
      ))}
    </div>
  );
}

function BrowseLeagueAccordionItem({
  league,
  teams,
  expanded,
  onToggle,
  onBrowsePlayers,
  indexReady,
}) {
  const leagueKey = hubKeyLeague(league.id);
  const clubCount = teams.length;

  return (
    <li className="browse-accordion__item">
      <button
        type="button"
        className={`browse-accordion__trigger league-link-card${expanded ? ' browse-accordion__trigger--expanded' : ''}`}
        aria-expanded={expanded}
        onClick={() => onToggle(leagueKey)}
      >
        <LeagueBadge league={league} />
        <span className="browse-accordion__trigger-text">
          <strong>{getLeagueDisplayName(league)}</strong>
          <small>
            {formatCountryLabel(league.country)} · {clubCount} club{clubCount !== 1 ? 's' : ''}
          </small>
        </span>
        <span className="browse-accordion__chevron" aria-hidden="true">
          {expanded ? '−' : '+'}
        </span>
      </button>
      {expanded ? (
        <div className="browse-accordion__panel" id={`browse-panel-${league.id}`}>
          {!indexReady ? (
            <p className="browse-accordion__loading">Loading clubs…</p>
          ) : clubCount === 0 ? (
            <p className="browse-accordion__empty">No clubs listed for this league yet.</p>
          ) : (
            <BrowseClubGrid teams={teams} compact />
          )}
          <div className="browse-accordion__actions">
            <Link to={`/league/${league.id}`} className="btn btn--secondary btn--small">
              View league page
            </Link>
            <button
              type="button"
              className="btn btn--secondary btn--small"
              onClick={() => onBrowsePlayers(league.id)}
            >
              Browse players
            </button>
          </div>
        </div>
      ) : null}
    </li>
  );
}

function BrowseOtherRegionAccordionItem({
  regionId,
  teams,
  clubCount,
  expanded,
  onToggle,
  onBrowsePlayers,
  indexReady,
}) {
  const regionKey = hubKeyOtherRegion(regionId);

  return (
    <li className="browse-accordion__item">
      <button
        type="button"
        className={`browse-accordion__trigger league-link-card${expanded ? ' browse-accordion__trigger--expanded' : ''}`}
        aria-expanded={expanded}
        onClick={() => onToggle(regionKey)}
      >
        <span className="browse-accordion__trigger-text">
          <strong>{OTHER_CLUB_REGION_LABELS[regionId]}</strong>
          <small>
            {clubCount} club{clubCount !== 1 ? 's' : ''}
          </small>
        </span>
        <span className="browse-accordion__chevron" aria-hidden="true">
          {expanded ? '−' : '+'}
        </span>
      </button>
      {expanded ? (
        <div className="browse-accordion__panel" id={`browse-panel-other-${regionId}`}>
          {!indexReady ? (
            <p className="browse-accordion__loading">Loading clubs…</p>
          ) : teams.length === 0 ? (
            <p className="browse-accordion__empty">No clubs in this group yet.</p>
          ) : (
            <BrowseClubGrid teams={teams} compact />
          )}
          <div className="browse-accordion__actions">
            <Link
              to={`/league/${OTHER_CLUBS_LEAGUE_ID}`}
              className="btn btn--secondary btn--small"
            >
              View other clubs
            </Link>
            <button
              type="button"
              className="btn btn--secondary btn--small"
              onClick={() => onBrowsePlayers(OTHER_CLUBS_LEAGUE_ID, regionId)}
            >
              Browse players
            </button>
          </div>
        </div>
      ) : null}
    </li>
  );
}

function NationalTeamExploreCard({ team }) {
  return (
    <Link to={`/national-team/${team.id}`} className="browse-nation-chip">
      <NationalTeamBadge nationalTeam={team} size="thumb" />
      <span className="browse-nation-chip__name">{team.displayName}</span>
    </Link>
  );
}

/**
 * @param {{
 *   europeanLeagues: object[],
 *   americanLeagues: object[],
 *   nationalTeams: object[],
 *   teamsByLeagueId: Record<string, object[]>,
 *   otherClubSections: Array<{ id: string, label: string, teams: object[] }>,
 *   indexReady: boolean,
 *   onBrowsePlayers: (leagueId: string, regionId?: string) => void,
 *   expandedKey: string | null,
 *   onExpandedChange: (key: string | null) => void,
 * }} props
 */
export default function BrowseTaxonomyHub({
  europeanLeagues,
  americanLeagues,
  nationalTeams,
  teamsByLeagueId,
  otherClubSections,
  indexReady,
  onBrowsePlayers,
  expandedKey,
  onExpandedChange,
}) {
  const [showAllNationalTeams, setShowAllNationalTeams] = useState(false);

  const toggleExpanded = (key) => {
    onExpandedChange(expandedKey === key ? null : key);
  };

  const nationalPreview = useMemo(() => {
    const byId = new Map(nationalTeams.map((team) => [team.id, team]));
    const featured = NATIONAL_PREVIEW_IDS.map((id) => byId.get(id)).filter(Boolean);
    const seed = featured.length >= NATIONAL_TEAM_PREVIEW_COUNT
      ? featured
      : [...featured, ...nationalTeams.filter((t) => !featured.includes(t))];
    return seed.slice(0, NATIONAL_TEAM_PREVIEW_COUNT);
  }, [nationalTeams]);

  const visibleNationalTeams = showAllNationalTeams ? nationalTeams : nationalPreview;
  const otherClubByRegion = useMemo(
    () => Object.fromEntries(otherClubSections.map((section) => [section.id, section.teams])),
    [otherClubSections],
  );

  return (
    <div className="browse-taxonomy">
      <section className="browse-taxonomy__section" aria-labelledby="browse-european-leagues">
        <h3 id="browse-european-leagues" className="section-label section-label--compact">
          European leagues
        </h3>
        <ul className="browse-accordion">
          {europeanLeagues.map((league) => (
            <BrowseLeagueAccordionItem
              key={league.id}
              league={league}
              teams={teamsByLeagueId[league.id] ?? []}
              expanded={expandedKey === hubKeyLeague(league.id)}
              onToggle={toggleExpanded}
              onBrowsePlayers={onBrowsePlayers}
              indexReady={indexReady}
            />
          ))}
        </ul>
      </section>

      <section className="browse-taxonomy__section" aria-labelledby="browse-american-leagues">
        <h3 id="browse-american-leagues" className="section-label section-label--compact">
          American leagues
        </h3>
        <ul className="browse-accordion">
          {americanLeagues.map((league) => (
            <BrowseLeagueAccordionItem
              key={league.id}
              league={league}
              teams={teamsByLeagueId[league.id] ?? []}
              expanded={expandedKey === hubKeyLeague(league.id)}
              onToggle={toggleExpanded}
              onBrowsePlayers={onBrowsePlayers}
              indexReady={indexReady}
            />
          ))}
        </ul>
      </section>

      <section className="browse-taxonomy__section" aria-labelledby="browse-national-teams">
        <div className="browse-taxonomy__section-head">
          <h3 id="browse-national-teams" className="section-label section-label--compact">
            National teams
          </h3>
          <button
            type="button"
            className="btn btn--secondary btn--small"
            onClick={() => setShowAllNationalTeams((open) => !open)}
            aria-expanded={showAllNationalTeams}
          >
            {showAllNationalTeams
              ? 'Hide national teams'
              : `Show all national teams (${nationalTeams.length})`}
          </button>
        </div>
        <p className="browse-results__cap-notice">
          Country squads — not club teams. Open a nation for its squad, rivals, and quizzes.
        </p>
        <div className="browse-nation-grid">
          {visibleNationalTeams.map((team) => (
            <NationalTeamExploreCard key={team.id} team={team} />
          ))}
        </div>
        {!showAllNationalTeams && nationalTeams.length > NATIONAL_TEAM_PREVIEW_COUNT ? (
          <p className="browse-taxonomy__hint">
            Showing {nationalPreview.length} of {nationalTeams.length} live nations.
          </p>
        ) : null}
      </section>

      <section className="browse-taxonomy__section" aria-labelledby="browse-other-clubs">
        <h3 id="browse-other-clubs" className="section-label section-label--compact">
          Other clubs
        </h3>
        <p className="browse-results__cap-notice">
          Smaller and imported clubs outside the main league hubs — expand a region to browse.
        </p>
        <ul className="browse-accordion">
          {OTHER_CLUB_REGION_ORDER.map((regionId) => (
            <BrowseOtherRegionAccordionItem
              key={regionId}
              regionId={regionId}
              teams={otherClubByRegion[regionId] ?? []}
              clubCount={(otherClubByRegion[regionId] ?? []).length}
              expanded={expandedKey === hubKeyOtherRegion(regionId)}
              onToggle={toggleExpanded}
              onBrowsePlayers={onBrowsePlayers}
              indexReady={indexReady}
            />
          ))}
        </ul>
      </section>
    </div>
  );
}
