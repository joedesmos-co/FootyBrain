import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  OTHER_CLUBS_LEAGUE_ID,
} from '../utils/browseTaxonomy';
import { getOtherClubBrowseChipMode } from '../utils/externalClubBrowse';
import { formatCountryLabel, getLeagueDisplayName } from '../utils/footballDisplay';
import LeagueBadge from './LeagueBadge';
import NationalTeamBadge from './NationalTeamBadge';

const NATIONAL_TEAM_PREVIEW_COUNT = 8;
const OTHER_CLUBS_PAGE_SIZE = 24;
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

function BrowseClubChip({ team, rosterCount = 0, onBrowsePlayers }) {
  const mode = getOtherClubBrowseChipMode(team, rosterCount);

  if (mode === 'team') {
    return (
      <Link to={`/team/${team.id}`} className="browse-club-chip">
        <span className="browse-club-chip__name">{team.name}</span>
        {team.country ? (
          <span className="browse-club-chip__meta">{formatCountryLabel(team.country)}</span>
        ) : null}
      </Link>
    );
  }

  if (mode === 'players') {
    return (
      <button
        type="button"
        className="browse-club-chip browse-club-chip--action"
        onClick={() => onBrowsePlayers?.(OTHER_CLUBS_LEAGUE_ID, undefined, team.id)}
      >
        <span className="browse-club-chip__name">{team.name}</span>
        <span className="browse-club-chip__meta">View players</span>
      </button>
    );
  }

  return (
    <span className="browse-club-chip browse-club-chip--muted" aria-disabled="true">
      <span className="browse-club-chip__name">{team.name}</span>
      <span className="browse-club-chip__meta">Coming soon</span>
    </span>
  );
}

function BrowseClubGrid({ teams, rosterCountByTeamId, onBrowsePlayers, compact = false }) {
  return (
    <div className={`browse-club-grid${compact ? ' browse-club-grid--compact' : ''}`}>
      {teams.map((team) => (
        <BrowseClubChip
          key={team.id}
          team={team}
          rosterCount={rosterCountByTeamId?.get(team.id) ?? 0}
          onBrowsePlayers={onBrowsePlayers}
        />
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
            <BrowseClubGrid teams={teams} compact onBrowsePlayers={onBrowsePlayers} />
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
  regionLabel,
  teams,
  clubCount,
  expanded,
  onToggle,
  onBrowsePlayers,
  indexReady,
  rosterCountByTeamId,
}) {
  const regionKey = hubKeyOtherRegion(regionId);
  const [regionSearch, setRegionSearch] = useState('');
  const [visibleCount, setVisibleCount] = useState(OTHER_CLUBS_PAGE_SIZE);

  const filteredTeams = useMemo(() => {
    const query = regionSearch.trim().toLowerCase();
    if (!query) return teams;
    return teams.filter((team) => {
      const name = (team.name ?? '').toLowerCase();
      const country = (team.country ?? '').toLowerCase();
      return name.includes(query) || country.includes(query);
    });
  }, [teams, regionSearch]);

  const visibleTeams = filteredTeams.slice(0, visibleCount);
  const hasMore = filteredTeams.length > visibleCount;

  return (
    <li className="browse-accordion__item">
      <button
        type="button"
        className={`browse-accordion__trigger league-link-card${expanded ? ' browse-accordion__trigger--expanded' : ''}`}
        aria-expanded={expanded}
        onClick={() => onToggle(regionKey)}
      >
        <span className="browse-accordion__trigger-text">
          <strong>{regionLabel}</strong>
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
            <>
              {teams.length > 12 ? (
                <label className="browse-other-search">
                  <span className="visually-hidden">Search clubs in {regionLabel}</span>
                  <input
                    type="search"
                    className="browse-other-search__input"
                    placeholder={`Search ${regionLabel.toLowerCase()}…`}
                    value={regionSearch}
                    onChange={(event) => {
                      setRegionSearch(event.target.value);
                      setVisibleCount(OTHER_CLUBS_PAGE_SIZE);
                    }}
                    autoComplete="off"
                  />
                </label>
              ) : null}
              {filteredTeams.length === 0 ? (
                <p className="browse-accordion__empty">No clubs match your search.</p>
              ) : (
                <BrowseClubGrid
                  teams={visibleTeams}
                  rosterCountByTeamId={rosterCountByTeamId}
                  onBrowsePlayers={onBrowsePlayers}
                  compact
                />
              )}
              {hasMore ? (
                <button
                  type="button"
                  className="btn btn--secondary btn--small browse-other-show-more"
                  onClick={() => setVisibleCount((count) => count + OTHER_CLUBS_PAGE_SIZE)}
                >
                  Show more ({filteredTeams.length - visibleCount} remaining)
                </button>
              ) : null}
              {regionSearch && filteredTeams.length > 0 && filteredTeams.length <= visibleCount ? (
                <p className="browse-taxonomy__hint">
                  Showing {filteredTeams.length} club{filteredTeams.length !== 1 ? 's' : ''} matching
                  &ldquo;{regionSearch.trim()}&rdquo;
                </p>
              ) : null}
            </>
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

function NationalTeamCompactLink({ team }) {
  return (
    <Link to={`/national-team/${team.id}`} className="browse-nation-link">
      <NationalTeamBadge nationalTeam={team} size="thumb" />
      <span className="browse-nation-link__name">{team.displayName}</span>
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
 *   otherClubRosterCountByTeamId: Map<string, number>,
 *   indexReady: boolean,
 *   onBrowsePlayers: (leagueId: string, regionId?: string, teamId?: string) => void,
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
  otherClubRosterCountByTeamId,
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

      <section
        className="browse-taxonomy__section browse-taxonomy__section--nations"
        aria-labelledby="browse-national-teams"
      >
        <div className="browse-nations-panel">
          <div className="browse-nations-panel__head">
            <div>
              <h3 id="browse-national-teams" className="section-label section-label--compact">
                National teams
              </h3>
              <p className="browse-nations-panel__note">
                Country squads — not clubs.
              </p>
            </div>
            {nationalTeams.length > NATIONAL_TEAM_PREVIEW_COUNT ? (
              <button
                type="button"
                className="btn btn--secondary btn--small"
                onClick={() => setShowAllNationalTeams((open) => !open)}
                aria-expanded={showAllNationalTeams}
              >
                {showAllNationalTeams
                  ? 'Show top 8'
                  : `Show all (${nationalTeams.length})`}
              </button>
            ) : null}
          </div>
          <div
            className={
              showAllNationalTeams
                ? 'browse-nation-list browse-nation-list--expanded'
                : 'browse-nation-list browse-nation-list--preview'
            }
          >
            {visibleNationalTeams.map((team) => (
              <NationalTeamCompactLink key={team.id} team={team} />
            ))}
          </div>
          {!showAllNationalTeams && nationalTeams.length > NATIONAL_TEAM_PREVIEW_COUNT ? (
            <p className="browse-taxonomy__hint browse-taxonomy__hint--tight">
              Top {nationalPreview.length} nations shown.
            </p>
          ) : null}
        </div>
      </section>

      <section className="browse-taxonomy__section" aria-labelledby="browse-other-clubs">
        <h3 id="browse-other-clubs" className="section-label section-label--compact">
          Other clubs
        </h3>
        <p className="browse-results__cap-notice">
          Smaller and imported clubs outside the main league hubs — expand a region to browse.
        </p>
        <ul className="browse-accordion">
          {otherClubSections.map((section) => (
            <BrowseOtherRegionAccordionItem
              key={section.id}
              regionId={section.id}
              regionLabel={section.label}
              teams={section.teams}
              clubCount={section.teams.length}
              expanded={expandedKey === hubKeyOtherRegion(section.id)}
              onToggle={toggleExpanded}
              onBrowsePlayers={onBrowsePlayers}
              indexReady={indexReady}
              rosterCountByTeamId={otherClubRosterCountByTeamId}
            />
          ))}
        </ul>
      </section>
    </div>
  );
}
