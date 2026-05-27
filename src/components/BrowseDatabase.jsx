import { Fragment, useCallback, useEffect, useMemo, useState } from 'react';
import { Link, NavLink, useSearchParams } from 'react-router-dom';
import { getManifestLeague, getManifestLeagues } from '../data/contentManifest';
import { hasExternalLeagueShard, useLeagueShard } from '../hooks/useLeagueShard';
import { getTodayKey } from '../hooks/useDailyCompletionStatus';
import { getDailyFeatured, getFeaturedPickPlayers } from '../utils/dailyFeatured';
import { BROWSE_SEARCH_RESULT_CAP, orderPlayersByQuery } from '../utils/playerSearch';
import {
  formatCountryLabel,
  getLeagueDisplayName,
  isExternalLeagueId,
} from '../utils/footballDisplay';
import { groupExternalClubTeams } from '../utils/externalClubGrouping';
import { useQuizRegistry } from '../hooks/useQuizRegistry';
import { useSearchIndex } from '../hooks/useSearchIndex';
import DataTrustNotice from './DataTrustNotice';
import TodaysPicksSection from './HomeFeaturedSection';
import LeagueBadge from './LeagueBadge';
import { getInternationalQuizHref } from '../utils/worldCupQuizPools';
import BrowsePagination from './BrowsePagination';
import PageFallback, { PageLoadingInline } from './PageFallback';
import PlayerAutocomplete from './PlayerAutocomplete';
import PlayerCard from './PlayerCard';

const manifestLeagues = getManifestLeagues();
const MAJOR_LEAGUE_IDS = ['premier-league', 'la-liga', 'bundesliga', 'serie-a', 'ligue-1'];
const BROWSE_PAGE_SIZE = 60;

function normalizeBrowseLeagueParam(value) {
  if (!value) return '';
  if (value === 'international') return 'external';
  return value;
}

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

function BrowseClubGrid({ teams }) {
  return (
    <div className="league-link-grid">
      {teams.map((team) => (
        <Link key={team.id} to={`/team/${team.id}`} className="league-link-card">
          <span>
            <strong>{team.name}</strong>
            <small>{team.country ? formatCountryLabel(team.country) : 'International'}</small>
          </span>
        </Link>
      ))}
    </div>
  );
}

function BrowseLeagueClubSections({ teams, players, isExternalLeague }) {
  if (!teams.length) {
    return <p className="empty-state">No clubs in this league yet.</p>;
  }

  if (!isExternalLeague) {
    return <BrowseClubGrid teams={teams} />;
  }

  const sections = groupExternalClubTeams(teams, players);

  return (
    <>
      <p className="browse-results__cap-notice">
        Imported clubs from around the world. Men&apos;s national squads (England, Brazil, etc.)
        live under <Link to="/world-cup">World Cup prep</Link> — not mixed in here as club teams.
      </p>
      {sections.map((section) => (
        <Fragment key={section.id}>
          <h3 className="section-label section-label--compact">{section.label}</h3>
          <BrowseClubGrid teams={section.teams} />
        </Fragment>
      ))}
    </>
  );
}

export default function BrowseDatabase() {
  const [searchParams, setSearchParams] = useSearchParams();
  const rawTab = searchParams.get('tab') || 'players';
  const tab = rawTab === 'teams' ? 'clubs' : rawTab;
  const leagueFilter = normalizeBrowseLeagueParam(searchParams.get('league') || '');
  const [teamFilter, setTeamFilter] = useState('');
  const [search, setSearch] = useState('');
  const [playerPage, setPlayerPage] = useState(1);
  const [skipClubPicker, setSkipClubPicker] = useState(false);
  const [bundled, setBundled] = useState(null);
  const { status: quizStatus, registry: quizRegistry } = useQuizRegistry();
  const { index: searchIndex, status: searchIndexStatus } = useSearchIndex();

  const usesExternalShard =
    Boolean(leagueFilter) && hasExternalLeagueShard(leagueFilter);
  const shardState = useLeagueShard(usesExternalShard ? leagueFilter : null);
  const activeLeagueName =
    (leagueFilter && getLeagueDisplayName(getManifestLeague(leagueFilter))) || 'league';

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
    return (id) => manifestLeagues.find((league) => league.id === id)?.name ?? 'Unknown';
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

  const hasPlayerQuery = search.trim().length > 0 || Boolean(leagueFilter || teamFilter);

  const featuredPickPool = useMemo(() => {
    if (quizStatus !== 'ready' || !quizRegistry?.players) return [];
    return getFeaturedPickPlayers(quizRegistry.players);
  }, [quizStatus, quizRegistry]);

  const dailyFeatured = useMemo(() => {
    if (quizStatus !== 'ready' || !quizRegistry?.players || !quizRegistry?.teams) {
      return { mode: 'club', players: [], teams: [], leagues: [], nationalTeams: [] };
    }
    return getDailyFeatured(featuredPickPool, quizRegistry.teams, manifestLeagues, todayKey);
  }, [quizStatus, quizRegistry, featuredPickPool, todayKey]);

  const intentContext = useMemo(
    () => ({
      teams: usesExternalShard && leagueShard ? leagueShard.teams : (searchIndex?.teams ?? []),
      getLeagueName,
    }),
    [usesExternalShard, leagueShard, searchIndex, getLeagueName],
  );

  const teamsInLeague = useMemo(() => {
    if (usesExternalShard && leagueShard) {
      return leagueShard.teams;
    }
    if (!leagueFilter) return searchIndex?.teams ?? [];
    return (searchIndex?.teams ?? []).filter((team) => team.leagueId === leagueFilter);
  }, [usesExternalShard, leagueShard, leagueFilter, searchIndex]);

  const leagueGroups = useMemo(() => {
    const major = [];
    const other = [];
    const international = [];
    for (const league of manifestLeagues) {
      if (league.id === 'external') {
        international.push(league);
      } else if (MAJOR_LEAGUE_IDS.includes(league.id)) {
        major.push(league);
      } else {
        other.push(league);
      }
    }
    return { major, other, international };
  }, []);

  const isExternalLeague = isExternalLeagueId(leagueFilter);

  const scopedPlayers = useMemo(() => {
    if (usesExternalShard && leagueShard) {
      if (teamFilter) {
        return leagueShard.players.filter((player) => player.teamId === teamFilter);
      }
      return leagueShard.players;
    }
    // Default to the lightweight search index for browse/search without loading sampleData.
    if (searchIndexStatus === 'ready' && searchIndex?.players) {
      if (teamFilter) return searchIndex.players.filter((p) => p.teamId === teamFilter);
      if (leagueFilter) return searchIndex.players.filter((p) => p.leagueId === leagueFilter);
      return searchIndex.players;
    }

    if (!bundled) return [];
    if (teamFilter) return bundled.getPlayersForTeam(teamFilter);
    if (leagueFilter) return bundled.getPlayersForLeague(leagueFilter);
    return bundled.players;
  }, [
    usesExternalShard,
    leagueShard,
    teamFilter,
    leagueFilter,
    searchIndexStatus,
    searchIndex,
    bundled,
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
  const showLeagueClubPicker = Boolean(
    leagueFilter && !teamFilter && !search.trim() && !skipClubPicker,
  );
  const playersListReady =
    searchIndexStatus === 'ready' || Boolean(bundled) || usesExternalShard;
  const showPlayerResults =
    showPlayersTab && !showLeagueClubPicker && (hasPlayerQuery || playersListReady);

  const totalFilteredPlayers = filteredPlayers.length;
  const totalPlayerPages = Math.max(1, Math.ceil(totalFilteredPlayers / BROWSE_PAGE_SIZE));
  const safePlayerPage = Math.min(Math.max(1, playerPage), totalPlayerPages);
  const playerPageStart = (safePlayerPage - 1) * BROWSE_PAGE_SIZE;
  const playerPageEnd = Math.min(safePlayerPage * BROWSE_PAGE_SIZE, totalFilteredPlayers);
  const displayedPlayers = filteredPlayers.slice(
    playerPageStart,
    playerPageStart + BROWSE_PAGE_SIZE,
  );

  const handleLeagueChange = (value) => {
    setTeamFilter('');
    setSearch('');
    setSkipClubPicker(false);
    setPlayerPage(1);
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        if (value) next.set('league', value);
        else next.delete('league');
        return next;
      },
      { replace: true },
    );
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
        <p>Explore players and clubs. Use search and filters to open any profile.</p>
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
          <Link to="#leagues" className="browse-secondary__card">
            <strong>Explore leagues</strong>
            <span>Quick league hubs and quizzes</span>
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
              value={leagueFilter}
              onChange={(e) => handleLeagueChange(e.target.value)}
            >
              <option value="">All leagues</option>
              <optgroup label="Major leagues">
                {leagueGroups.major.map((league) => (
                  <option key={league.id} value={league.id}>
                    {getLeagueDisplayName(league)}
                  </option>
                ))}
              </optgroup>
              <optgroup label="International clubs">
                {leagueGroups.international.map((league) => (
                  <option key={league.id} value={league.id}>
                    {getLeagueDisplayName(league)}
                  </option>
                ))}
              </optgroup>
              <optgroup label="Other clubs">
                {leagueGroups.other.map((league) => (
                  <option key={league.id} value={league.id}>
                    {getLeagueDisplayName(league)}
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
            ? `Loading ${activeLeagueName}…`
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
      <section className="league-hub-strip" aria-labelledby="league-hubs-title" id="leagues">
        <div className="league-hub-strip__header">
          <h2 id="league-hubs-title">Leagues</h2>
          <p>Pick a league to explore clubs, rivalries, and standout players.</p>
        </div>
        <h3 className="section-label section-label--compact">Major leagues</h3>
        <div className="league-link-grid">
          {leagueGroups.major.map((league) => (
            <LeagueExploreCard
              key={league.id}
              league={league}
              tab={tab}
              onNavigate={resetLocalBrowseFilters}
            />
          ))}
        </div>
        <h3 className="section-label section-label--compact">International clubs</h3>
        <div className="league-link-grid">
          {leagueGroups.international.map((league) => (
            <LeagueExploreCard
              key={league.id}
              league={league}
              tab={tab}
              onNavigate={resetLocalBrowseFilters}
            />
          ))}
        </div>
        <h3 className="section-label section-label--compact">Other clubs</h3>
        <div className="league-link-grid">
          {leagueGroups.other.map((league) => (
            <LeagueExploreCard
              key={league.id}
              league={league}
              tab={tab}
              onNavigate={resetLocalBrowseFilters}
            />
          ))}
        </div>
      </section>
      )}

      {showPlayersTab ? (
        shardLoading ? (
        <PageFallback label={`Loading ${activeLeagueName}…`} />
        ) : showLeagueClubPicker ? (
        <section className="browse-results" aria-label={`Clubs in ${getLeagueName(leagueFilter)}`}>
          <p className="browse-results__cap-notice">
            {teamsInLeague.length} clubs in {getLeagueName(leagueFilter)} — open a club to view its
            full squad ({scopedPlayers.length.toLocaleString()} players in this league).
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
              Browse all players in this league
            </button>
            <Link to={`/league/${leagueFilter}`} className="btn btn--secondary btn--small">
              Open league page
            </Link>
          </div>
          <BrowseLeagueClubSections
            teams={teamsInLeague}
            players={scopedPlayers}
            isExternalLeague={isExternalLeague}
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
            Pick a league to browse its clubs—or open any club page for squads, rivals, and fan
            notes from <Link to="/teams">Clubs</Link>.
          </p>
          <h2 className="section-label section-label--compact">Major leagues</h2>
          <div className="league-link-grid">
            {leagueGroups.major.map((league) => (
              <LeagueExploreCard
                key={league.id}
                league={league}
                tab="clubs"
                onNavigate={resetLocalBrowseFilters}
              />
            ))}
          </div>
          <h2 className="section-label section-label--compact">International clubs</h2>
          <div className="league-link-grid">
            {leagueGroups.international.map((league) => (
              <LeagueExploreCard
                key={league.id}
                league={league}
                tab="clubs"
                onNavigate={resetLocalBrowseFilters}
              />
            ))}
          </div>
          <h2 className="section-label section-label--compact">Other clubs</h2>
          <div className="league-link-grid">
            {leagueGroups.other.map((league) => (
              <LeagueExploreCard
                key={league.id}
                league={league}
                tab="clubs"
                onNavigate={resetLocalBrowseFilters}
              />
            ))}
          </div>
          {leagueFilter ? (
            <section
              className="browse-results"
              aria-label={`Clubs in ${getLeagueName(leagueFilter)}`}
            >
              <p className="browse-results__cap-notice">
                {teamsInLeague.length} clubs in {getLeagueName(leagueFilter)} — open a club to view its
                squad.
              </p>
              <BrowseLeagueClubSections
                teams={teamsInLeague}
                players={scopedPlayers}
                isExternalLeague={isExternalLeague}
              />
            </section>
          ) : null}
        </section>
      )}
    </div>
  );
}
