import { Fragment, useCallback, useEffect, useMemo, useState } from 'react';
import { Link, NavLink, useSearchParams } from 'react-router-dom';
import { getManifestLeague } from '../data/contentManifest';
import { hasExternalLeagueShard, useLeagueShard } from '../hooks/useLeagueShard';
import { getTodayKey } from '../hooks/useDailyCompletionStatus';
import { getDailyFeatured, getFeaturedPickPlayers } from '../utils/dailyFeatured';
import {
  buildBrowseLeagueTaxonomy,
  getBrowseNationalTeams,
  normalizeBrowseLeagueParam,
  normalizeOtherClubRegionParam,
  OTHER_CLUB_REGION_LABELS,
  OTHER_CLUB_REGION_ORDER,
  OTHER_CLUBS_LEAGUE_ID,
} from '../utils/browseTaxonomy';
import { BROWSE_SEARCH_RESULT_CAP, orderPlayersByQuery } from '../utils/playerSearch';
import {
  formatCountryLabel,
  getLeagueDisplayName,
  isExternalLeagueId,
} from '../utils/footballDisplay';
import { groupOtherClubTeamsForBrowse } from '../utils/externalClubGrouping';
import { useQuizRegistry } from '../hooks/useQuizRegistry';
import { useSearchIndex } from '../hooks/useSearchIndex';
import DataTrustNotice from './DataTrustNotice';
import TodaysPicksSection from './HomeFeaturedSection';
import LeagueBadge from './LeagueBadge';
import NationalTeamBadge from './NationalTeamBadge';
import { getInternationalQuizHref } from '../utils/worldCupQuizPools';
import BrowsePagination from './BrowsePagination';
import PageFallback, { PageLoadingInline } from './PageFallback';
import PlayerAutocomplete from './PlayerAutocomplete';
import PlayerCard from './PlayerCard';

const BROWSE_PAGE_SIZE = 60;
const browseLeagueTaxonomy = buildBrowseLeagueTaxonomy();
const browseNationalTeams = getBrowseNationalTeams();

function LeagueExploreCard({ league, tab, onNavigate }) {
  const browseHref =
    tab === 'clubs' ? `/browse?tab=clubs&league=${league.id}` : `/browse?league=${league.id}`;
  return (
    <Link to={browseHref} className="league-link-card" onClick={onNavigate}>
      <LeagueBadge league={league} />
      <span>
        <strong>{getLeagueDisplayName(league)}</strong>
        <small>{formatCountryLabel(league.country)} · Browse</small>
      </span>
    </Link>
  );
}

function NationalTeamExploreCard({ team, onNavigate }) {
  return (
    <Link to={`/national-team/${team.id}`} className="league-link-card" onClick={onNavigate}>
      <NationalTeamBadge nationalTeam={team} size="thumb" />
      <span>
        <strong>{team.displayName}</strong>
        <small>{team.confederation} · National squad</small>
      </span>
    </Link>
  );
}

function OtherClubRegionExploreCard({ regionId, tab, clubCount, onNavigate }) {
  const browseHref =
    tab === 'clubs'
      ? `/browse?tab=clubs&league=${OTHER_CLUBS_LEAGUE_ID}&region=${regionId}`
      : `/browse?league=${OTHER_CLUBS_LEAGUE_ID}&region=${regionId}`;
  return (
    <Link to={browseHref} className="league-link-card" onClick={onNavigate}>
      <span>
        <strong>{OTHER_CLUB_REGION_LABELS[regionId]}</strong>
        <small>
          {clubCount} club{clubCount !== 1 ? 's' : ''} · Browse
        </small>
      </span>
    </Link>
  );
}

function BrowseClubGrid({ teams }) {
  return (
    <div className="league-link-grid">
      {teams.map((team) => (
        <Link key={team.id} to={`/team/${team.id}`} className="league-link-card">
          <span>
            <strong>{team.name}</strong>
            <small>{team.country ? formatCountryLabel(team.country) : 'Club'}</small>
          </span>
        </Link>
      ))}
    </div>
  );
}

function BrowseTaxonomyHub({ tab, onNavigate, otherClubRegionCounts }) {
  return (
    <>
      <h3 className="section-label section-label--compact">European leagues</h3>
      <div className="league-link-grid">
        {browseLeagueTaxonomy.european.map((league) => (
          <LeagueExploreCard key={league.id} league={league} tab={tab} onNavigate={onNavigate} />
        ))}
      </div>

      <h3 className="section-label section-label--compact">American leagues</h3>
      <div className="league-link-grid">
        {browseLeagueTaxonomy.american.map((league) => (
          <LeagueExploreCard key={league.id} league={league} tab={tab} onNavigate={onNavigate} />
        ))}
      </div>

      <h3 className="section-label section-label--compact">National teams</h3>
      <p className="browse-results__cap-notice">
        Country squads — not club teams. Open a nation for its squad, rivals, and quizzes.
      </p>
      <div className="league-link-grid">
        {browseNationalTeams.map((team) => (
          <NationalTeamExploreCard key={team.id} team={team} onNavigate={onNavigate} />
        ))}
      </div>

      <h3 className="section-label section-label--compact">Other clubs</h3>
      <p className="browse-results__cap-notice">
        Smaller and imported clubs outside the main league hubs — pick a region to browse.
      </p>
      <div className="league-link-grid">
        {OTHER_CLUB_REGION_ORDER.map((regionId) => (
          <OtherClubRegionExploreCard
            key={regionId}
            regionId={regionId}
            tab={tab}
            clubCount={otherClubRegionCounts[regionId] ?? 0}
            onNavigate={onNavigate}
          />
        ))}
      </div>
    </>
  );
}

function BrowseLeagueClubSections({ teams, players, isOtherClubsLeague, otherClubRegion }) {
  if (!teams.length) {
    return <p className="empty-state">No clubs match this view yet.</p>;
  }

  if (!isOtherClubsLeague) {
    return <BrowseClubGrid teams={teams} />;
  }

  if (otherClubRegion) {
    return <BrowseClubGrid teams={teams} />;
  }

  const sections = groupOtherClubTeamsForBrowse(teams, players);

  return (
    <>
      {sections.map((section) => (
        <Fragment key={section.id}>
          <h3 className="section-label section-label--compact">{section.label}</h3>
          <BrowseClubGrid teams={section.teams} />
        </Fragment>
      ))}
    </>
  );
}

function BrowseOtherClubsRegionPicker({ tab, onNavigate, otherClubRegionCounts }) {
  return (
    <div className="league-link-grid">
      {OTHER_CLUB_REGION_ORDER.map((regionId) => (
        <OtherClubRegionExploreCard
          key={regionId}
          regionId={regionId}
          tab={tab}
          clubCount={otherClubRegionCounts[regionId] ?? 0}
          onNavigate={onNavigate}
        />
      ))}
    </div>
  );
}

export default function BrowseDatabase() {
  const [searchParams, setSearchParams] = useSearchParams();
  const rawTab = searchParams.get('tab') || 'players';
  const tab = rawTab === 'teams' ? 'clubs' : rawTab;
  const leagueFilter = normalizeBrowseLeagueParam(searchParams.get('league') || '');
  const otherClubRegion = normalizeOtherClubRegionParam(searchParams.get('region'));
  const [teamFilter, setTeamFilter] = useState('');
  const [search, setSearch] = useState('');
  const [playerPage, setPlayerPage] = useState(1);
  const [skipClubPicker, setSkipClubPicker] = useState(false);
  const [bundled, setBundled] = useState(null);
  const { status: quizStatus, registry: quizRegistry } = useQuizRegistry();
  const { index: searchIndex, status: searchIndexStatus } = useSearchIndex();

  const isOtherClubsLeague = isExternalLeagueId(leagueFilter);
  const usesExternalShard = Boolean(leagueFilter) && hasExternalLeagueShard(leagueFilter);
  const shardState = useLeagueShard(usesExternalShard ? leagueFilter : null);
  const activeScopeLabel = useMemo(() => {
    if (isOtherClubsLeague) {
      if (otherClubRegion) {
        return `${OTHER_CLUB_REGION_LABELS[otherClubRegion]} · Other clubs`;
      }
      return 'Other clubs';
    }
    if (leagueFilter) {
      return getLeagueDisplayName(getManifestLeague(leagueFilter));
    }
    return 'league';
  }, [isOtherClubsLeague, otherClubRegion, leagueFilter]);

  useEffect(() => {
    if (usesExternalShard || searchIndexStatus !== 'error') return undefined;
    let cancelled = false;
    import('../data/sampleData.js').then((mod) => {
      if (!cancelled) {
        setBundled({
          players: mod.players,
          teams: mod.teams,
          getLeagueName: mod.getLeagueName,
          getTeamName: mod.getTeamName,
          getPlayersForLeague: mod.getPlayersForLeague,
          getPlayersForTeam: mod.getPlayersForTeam,
        });
      }
    });
    return () => {
      cancelled = true;
    };
  }, [usesExternalShard, searchIndexStatus]);

  const todayKey = getTodayKey();
  const leagueShard = shardState.status === 'ready' ? shardState.shard : null;
  const shardLoading = usesExternalShard && shardState.status === 'loading';

  const getLeagueName = useMemo(() => {
    if (usesExternalShard && leagueShard) return leagueShard.getLeagueName;
    if (bundled) return bundled.getLeagueName;
    return (id) => getLeagueDisplayName(getManifestLeague(id));
  }, [usesExternalShard, leagueShard, bundled]);

  const teamNameById = useMemo(() => {
    if (!searchIndex?.teams?.length) return null;
    return new Map(searchIndex.teams.map((t) => [t.id, t.name]));
  }, [searchIndex]);

  const getTeamName = useCallback(
    (id) => {
      if (usesExternalShard && leagueShard) return leagueShard.getTeamName(id);
      if (bundled) return bundled.getTeamName(id);
      if (teamNameById) return teamNameById.get(id) ?? 'Unknown';
      return 'Unknown';
    },
    [usesExternalShard, leagueShard, bundled, teamNameById],
  );

  const allTeamsInLeague = useMemo(() => {
    if (usesExternalShard && leagueShard) {
      return leagueShard.teams;
    }
    if (!leagueFilter) return searchIndex?.teams ?? [];
    return (searchIndex?.teams ?? []).filter((team) => team.leagueId === leagueFilter);
  }, [usesExternalShard, leagueShard, leagueFilter, searchIndex]);

  const otherClubPlayersForGrouping = useMemo(() => {
    if (!isOtherClubsLeague) return [];
    if (usesExternalShard && leagueShard) return leagueShard.players;
    if (searchIndexStatus === 'ready' && searchIndex?.players) {
      return searchIndex.players.filter((p) => p.leagueId === OTHER_CLUBS_LEAGUE_ID);
    }
    return [];
  }, [isOtherClubsLeague, usesExternalShard, leagueShard, searchIndexStatus, searchIndex]);

  const otherClubRegionCounts = useMemo(() => {
    const externalTeams = (searchIndex?.teams ?? []).filter(
      (team) => team.leagueId === OTHER_CLUBS_LEAGUE_ID,
    );
    const sections = groupOtherClubTeamsForBrowse(externalTeams, otherClubPlayersForGrouping);
    return Object.fromEntries(sections.map((section) => [section.id, section.teams.length]));
  }, [searchIndex, otherClubPlayersForGrouping]);

  const otherClubSections = useMemo(() => {
    if (!isOtherClubsLeague || !allTeamsInLeague.length) return [];
    return groupOtherClubTeamsForBrowse(allTeamsInLeague, otherClubPlayersForGrouping);
  }, [isOtherClubsLeague, allTeamsInLeague, otherClubPlayersForGrouping]);

  const teamsInLeague = useMemo(() => {
    if (!isOtherClubsLeague || !otherClubRegion) return allTeamsInLeague;
    const section = otherClubSections.find((entry) => entry.id === otherClubRegion);
    return section?.teams ?? [];
  }, [allTeamsInLeague, isOtherClubsLeague, otherClubRegion, otherClubSections]);

  const hasPlayerQuery = search.trim().length > 0 || Boolean(leagueFilter || teamFilter);

  const featuredPickPool = useMemo(() => {
    if (quizStatus !== 'ready' || !quizRegistry?.players) return [];
    return getFeaturedPickPlayers(quizRegistry.players);
  }, [quizStatus, quizRegistry]);

  const dailyFeatured = useMemo(() => {
    if (quizStatus !== 'ready' || !quizRegistry?.players || !quizRegistry?.teams) {
      return { mode: 'club', players: [], teams: [], leagues: [], nationalTeams: [] };
    }
    return getDailyFeatured(
      featuredPickPool,
      quizRegistry.teams,
      [...browseLeagueTaxonomy.european, ...browseLeagueTaxonomy.american],
      todayKey,
    );
  }, [quizStatus, quizRegistry, featuredPickPool, todayKey]);

  const intentContext = useMemo(
    () => ({
      teams: usesExternalShard && leagueShard ? leagueShard.teams : (searchIndex?.teams ?? []),
      getLeagueName,
    }),
    [usesExternalShard, leagueShard, searchIndex, getLeagueName],
  );

  const scopedPlayers = useMemo(() => {
    if (usesExternalShard && leagueShard) {
      let players = leagueShard.players;
      if (teamFilter) {
        players = players.filter((player) => player.teamId === teamFilter);
      } else if (isOtherClubsLeague && otherClubRegion) {
        const teamIds = new Set(teamsInLeague.map((team) => team.id));
        players = players.filter((player) => teamIds.has(player.teamId));
      }
      return players;
    }
    if (searchIndexStatus === 'ready' && searchIndex?.players) {
      let players = searchIndex.players;
      if (teamFilter) players = players.filter((p) => p.teamId === teamFilter);
      else if (leagueFilter) players = players.filter((p) => p.leagueId === leagueFilter);
      if (isOtherClubsLeague && otherClubRegion && !teamFilter) {
        const teamIds = new Set(teamsInLeague.map((team) => team.id));
        players = players.filter((player) => teamIds.has(player.teamId));
      }
      return players;
    }

    if (!bundled) return [];
    if (teamFilter) return bundled.getPlayersForTeam(teamFilter);
    if (leagueFilter) {
      let players = bundled.getPlayersForLeague(leagueFilter);
      if (isOtherClubsLeague && otherClubRegion) {
        const teamIds = new Set(teamsInLeague.map((team) => team.id));
        players = players.filter((player) => teamIds.has(player.teamId));
      }
      return players;
    }
    return bundled.players;
  }, [
    usesExternalShard,
    leagueShard,
    teamFilter,
    leagueFilter,
    searchIndexStatus,
    searchIndex,
    bundled,
    isOtherClubsLeague,
    otherClubRegion,
    teamsInLeague,
  ]);

  const filteredPlayers = useMemo(() => {
    if (search.trim()) {
      return orderPlayersByQuery(scopedPlayers, search, {
        getTeamName,
        getLeagueName,
        limit: BROWSE_SEARCH_RESULT_CAP,
      });
    }
    return [...scopedPlayers].sort(
      (a, b) => (b.importanceScore ?? 0) - (a.importanceScore ?? 0),
    );
  }, [scopedPlayers, search, getTeamName, getLeagueName]);

  const searchResultCapped =
    search.trim().length > 0 && filteredPlayers.length >= BROWSE_SEARCH_RESULT_CAP;

  const showPlayersTab = tab === 'players';
  const showClubsTab = tab === 'clubs';
  const showOtherClubsRegionPicker = Boolean(
    isOtherClubsLeague && !otherClubRegion && !teamFilter && !search.trim() && !skipClubPicker,
  );
  const showLeagueClubPicker = Boolean(
    leagueFilter &&
      !teamFilter &&
      !search.trim() &&
      !skipClubPicker &&
      !showOtherClubsRegionPicker,
  );
  const playersListReady =
    searchIndexStatus === 'ready' || Boolean(bundled) || usesExternalShard;
  const showPlayerResults =
    showPlayersTab && !showLeagueClubPicker && !showOtherClubsRegionPicker && (hasPlayerQuery || playersListReady);

  const totalFilteredPlayers = filteredPlayers.length;
  const totalPlayerPages = Math.max(1, Math.ceil(totalFilteredPlayers / BROWSE_PAGE_SIZE));
  const safePlayerPage = Math.min(Math.max(1, playerPage), totalPlayerPages);
  const playerPageStart = (safePlayerPage - 1) * BROWSE_PAGE_SIZE;
  const playerPageEnd = Math.min(safePlayerPage * BROWSE_PAGE_SIZE, totalFilteredPlayers);
  const displayedPlayers = filteredPlayers.slice(
    playerPageStart,
    playerPageStart + BROWSE_PAGE_SIZE,
  );

  const updateBrowseParams = (mutate) => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        mutate(next);
        return next;
      },
      { replace: true },
    );
  };

  const leagueSelectValue = otherClubRegion
    ? `${OTHER_CLUBS_LEAGUE_ID}:${otherClubRegion}`
    : leagueFilter;

  const handleLeagueChange = (value) => {
    setTeamFilter('');
    setSearch('');
    setSkipClubPicker(false);
    setPlayerPage(1);
    updateBrowseParams((next) => {
      if (!value) {
        next.delete('league');
        next.delete('region');
        return;
      }
      if (value.includes(':')) {
        const [league, region] = value.split(':');
        next.set('league', league);
        next.set('region', region);
        return;
      }
      next.set('league', value);
      next.delete('region');
    });
  };

  const handleTeamFilterChange = (value) => {
    setTeamFilter(value);
    setPlayerPage(1);
  };

  const handleSearchChange = (value) => {
    setSearch(value);
    setPlayerPage(1);
  };

  const resetLocalBrowseFilters = () => {
    setTeamFilter('');
    setSearch('');
    setSkipClubPicker(false);
    setPlayerPage(1);
  };

  const showPicks = !usesExternalShard && quizStatus === 'ready';
  const browseDataLoading =
    shardLoading ||
    (usesExternalShard && !leagueShard && !shardLoading) ||
    (!usesExternalShard && searchIndexStatus === 'loading' && !bundled);

  const indexLoading =
    !usesExternalShard && !bundled && searchIndexStatus === 'loading' && showPlayersTab;

  return (
    <div className="page browse">
      <header className="page-header">
        <h1>Browse</h1>
        <p>Explore players and clubs by league, nation, or region. Use search and filters to narrow results.</p>
        <DataTrustNotice compact />
        <nav className="compare-tabs" aria-label="Browse categories">
          <NavLink
            to="/browse"
            end
            className={`compare-tabs__tab${showPlayersTab ? ' compare-tabs__tab--active' : ''}`}
          >
            Players
          </NavLink>
          <NavLink
            to="/browse?tab=clubs"
            className={`compare-tabs__tab${showClubsTab ? ' compare-tabs__tab--active' : ''}`}
          >
            Clubs
          </NavLink>
        </nav>
      </header>

      {indexLoading && showPlayersTab ? <PageFallback label="Loading search…" /> : null}

      <section className="browse-secondary" aria-label="More to explore">
        <div className="browse-secondary__grid">
          <Link to="#browse-categories" className="browse-secondary__card">
            <strong>Browse categories</strong>
            <span>Leagues, nations, and other clubs</span>
          </Link>
          <Link to="/world-cup" className="browse-secondary__card">
            <strong>World Cup prep</strong>
            <span>Nations, groups, and picks</span>
          </Link>
          <Link to="/learning-paths" className="browse-secondary__card">
            <strong>Learning Paths</strong>
            <span>Guided checklists to study</span>
          </Link>
        </div>
      </section>

      {showPlayersTab && (
      <section className="filters" aria-label="Player filters">
        <div className="filters__row">
          <label className="filter-field">
            <span>League</span>
            <select
              value={leagueSelectValue}
              onChange={(e) => handleLeagueChange(e.target.value)}
            >
              <option value="">All leagues</option>
              <optgroup label="European leagues">
                {browseLeagueTaxonomy.european.map((league) => (
                  <option key={league.id} value={league.id}>
                    {getLeagueDisplayName(league)}
                  </option>
                ))}
              </optgroup>
              <optgroup label="American leagues">
                {browseLeagueTaxonomy.american.map((league) => (
                  <option key={league.id} value={league.id}>
                    {getLeagueDisplayName(league)}
                  </option>
                ))}
              </optgroup>
              <optgroup label="Other clubs">
                <option value={OTHER_CLUBS_LEAGUE_ID}>All other clubs</option>
                {OTHER_CLUB_REGION_ORDER.map((regionId) => (
                  <option
                    key={regionId}
                    value={`${OTHER_CLUBS_LEAGUE_ID}:${regionId}`}
                  >
                    {OTHER_CLUB_REGION_LABELS[regionId]}
                  </option>
                ))}
              </optgroup>
            </select>
          </label>

          <label className="filter-field">
            <span>Club</span>
            <select
              value={teamFilter}
              onChange={(e) => handleTeamFilterChange(e.target.value)}
              disabled={!leagueFilter || shardLoading}
            >
              <option value="">All clubs</option>
              {teamsInLeague.map((team) => (
                <option key={team.id} value={team.id}>
                  {team.name}
                </option>
              ))}
            </select>
          </label>

          <PlayerAutocomplete
            players={scopedPlayers}
            value={search}
            onChange={handleSearchChange}
            showNationalTeam
            navigateOnSelect
            intentContext={intentContext}
            label="Search"
            placeholder="Search players — name, partial match…"
            disabled={browseDataLoading}
            getTeamName={getTeamName}
            getLeagueName={getLeagueName}
          />
        </div>
        <p className="filters__count">
          {shardLoading
            ? `Loading ${activeScopeLabel}…`
            : browseDataLoading
              ? 'Loading players…'
              : hasPlayerQuery
                ? searchResultCapped
                  ? `Showing top ${BROWSE_SEARCH_RESULT_CAP} matches — narrow league or club to see more`
                  : totalFilteredPlayers === 0
                    ? '0 players found'
                    : `Showing ${playerPageStart + 1}–${playerPageEnd} of ${totalFilteredPlayers.toLocaleString()}`
                : playersListReady
                  ? totalFilteredPlayers === 0
                    ? '0 players'
                    : `Showing ${playerPageStart + 1}–${playerPageEnd} of ${totalFilteredPlayers.toLocaleString()} — search or pick a league or club`
                  : 'Players could not load. Try again in a moment.'}
        </p>
      </section>
      )}

      {showPlayersTab && (showPicks ? (
        <TodaysPicksSection
          featuredPlayers={dailyFeatured.players}
          featuredTeams={dailyFeatured.teams}
          featuredLeagues={dailyFeatured.leagues}
          featuredNationalTeams={dailyFeatured.nationalTeams}
          picksMode={dailyFeatured.mode}
        />
      ) : usesExternalShard ? null : (
        <PageLoadingInline label="Loading today's picks…" />
      ))}

      {showPlayersTab && (
      <aside className="learning-hub-cta learning-hub-cta--compact" aria-label="World Cup learning">
        <div className="learning-hub-cta__copy">
          <p className="learning-hub-cta__title">World Cup 2026 prep</p>
          <p>
            Study featured nations, groups, and collections—or jump into the international quiz.
          </p>
        </div>
        <div className="learning-hub-cta__actions">
          <Link to="/world-cup" className="btn btn--primary btn--small">
            World Cup hub
          </Link>
          <Link to={getInternationalQuizHref()} className="btn btn--secondary btn--small">
            International quiz
          </Link>
        </div>
      </aside>
      )}

      {showPlayersTab && (
      <section
        className="league-hub-strip"
        aria-labelledby="browse-categories-title"
        id="browse-categories"
      >
        <div className="league-hub-strip__header">
          <h2 id="browse-categories-title">Browse categories</h2>
          <p>European and American leagues, national squads, and other clubs by region.</p>
        </div>
        <BrowseTaxonomyHub
          tab={tab}
          onNavigate={resetLocalBrowseFilters}
          otherClubRegionCounts={otherClubRegionCounts}
        />
      </section>
      )}

      {showPlayersTab ? (
        shardLoading ? (
        <PageFallback label={`Loading ${activeScopeLabel}…`} />
        ) : showOtherClubsRegionPicker ? (
        <section className="browse-results" aria-label="Other clubs by region">
          <p className="browse-results__cap-notice">
            Pick a region to browse imported and smaller clubs. National squads are listed above
            under National teams.
          </p>
          <BrowseOtherClubsRegionPicker
            tab={tab}
            onNavigate={resetLocalBrowseFilters}
            otherClubRegionCounts={otherClubRegionCounts}
          />
        </section>
        ) : showLeagueClubPicker ? (
        <section className="browse-results" aria-label={`Clubs in ${activeScopeLabel}`}>
          <p className="browse-results__cap-notice">
            {teamsInLeague.length} clubs in {activeScopeLabel} — open a club to view its full squad
            ({scopedPlayers.length.toLocaleString()} players in this view).
          </p>
          <div className="browse-results__club-picker-actions">
            <button
              type="button"
              className="btn btn--secondary btn--small"
              onClick={() => {
                setSkipClubPicker(true);
                setPlayerPage(1);
              }}
            >
              Browse all players in this view
            </button>
            {!isOtherClubsLeague ? (
              <Link to={`/league/${leagueFilter}`} className="btn btn--secondary btn--small">
                Open league page
              </Link>
            ) : null}
            {isOtherClubsLeague && otherClubRegion ? (
              <Link
                to={`/browse?league=${OTHER_CLUBS_LEAGUE_ID}${tab === 'clubs' ? '&tab=clubs' : ''}`}
                className="btn btn--secondary btn--small"
              >
                All other-club regions
              </Link>
            ) : null}
          </div>
          <BrowseLeagueClubSections
            teams={teamsInLeague}
            players={otherClubPlayersForGrouping}
            isOtherClubsLeague={isOtherClubsLeague}
            otherClubRegion={otherClubRegion}
          />
        </section>
      ) : showPlayerResults ? (
        <section className="browse-results" aria-label="Player results">
          {browseDataLoading ? (
            <PageFallback label="Loading players…" />
          ) : filteredPlayers.length > 0 ? (
            <>
              <BrowsePagination
                page={safePlayerPage}
                pageSize={BROWSE_PAGE_SIZE}
                totalItems={totalFilteredPlayers}
                onPageChange={setPlayerPage}
              />
              <div className="card-grid">
                {displayedPlayers.map((player) => (
                  <PlayerCard key={player.id} player={player} />
                ))}
              </div>
              <BrowsePagination
                page={safePlayerPage}
                pageSize={BROWSE_PAGE_SIZE}
                totalItems={totalFilteredPlayers}
                onPageChange={setPlayerPage}
                className="browse-pagination--bottom"
              />
            </>
          ) : (
            <section className="empty-state" aria-label="No matching players">
              <p>No players match those filters. Try another league, club, or spelling.</p>
              <div className="empty-state__actions">
                <button
                  type="button"
                  className="btn btn--secondary"
                  onClick={() => {
                    setSearch('');
                    setTeamFilter('');
                    handleLeagueChange('');
                    setSkipClubPicker(false);
                  }}
                >
                  Clear filters
                </button>
              </div>
            </section>
          )}
        </section>
        ) : null
      ) : null}

      {showClubsTab && (
        <section className="browse-results" aria-label="Browse clubs">
          <p className="browse-results__cap-notice">
            Pick a league or region—or open any club page for squads and fan notes from{' '}
            <Link to="/teams">Clubs</Link>.
          </p>
          <BrowseTaxonomyHub
            tab="clubs"
            onNavigate={resetLocalBrowseFilters}
            otherClubRegionCounts={otherClubRegionCounts}
          />
          {leagueFilter ? (
            <section
              className="browse-results"
              aria-label={`Clubs in ${activeScopeLabel}`}
            >
              {showOtherClubsRegionPicker ? (
                <>
                  <p className="browse-results__cap-notice">Choose a region within other clubs.</p>
                  <BrowseOtherClubsRegionPicker
                    tab="clubs"
                    onNavigate={resetLocalBrowseFilters}
                    otherClubRegionCounts={otherClubRegionCounts}
                  />
                </>
              ) : (
                <>
                  <p className="browse-results__cap-notice">
                    {teamsInLeague.length} clubs in {activeScopeLabel} — open a club to view its
                    squad.
                  </p>
                  <BrowseLeagueClubSections
                    teams={teamsInLeague}
                    players={otherClubPlayersForGrouping}
                    isOtherClubsLeague={isOtherClubsLeague}
                    otherClubRegion={otherClubRegion}
                  />
                </>
              )}
            </section>
          ) : null}
        </section>
      )}
    </div>
  );
}
