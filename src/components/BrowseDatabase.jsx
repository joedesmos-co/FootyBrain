import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, NavLink, useSearchParams } from 'react-router-dom';
import { getManifestLeague, getManifestLeagues } from '../data/contentManifest';
import { hasExternalLeagueShard, useLeagueShard } from '../hooks/useLeagueShard';
import { getTodayKey } from '../hooks/useDailyCompletionStatus';
import { getDailyFeatured, getFeaturedPickPlayers } from '../utils/dailyFeatured';
import { BROWSE_SEARCH_RESULT_CAP, orderPlayersByQuery } from '../utils/playerSearch';
import { formatCountryLabel, getLeagueDisplayName } from '../utils/footballDisplay';
import { useQuizRegistry } from '../hooks/useQuizRegistry';
import { useSearchIndex } from '../hooks/useSearchIndex';
import DataTrustNotice from './DataTrustNotice';
import TodaysPicksSection from './HomeFeaturedSection';
import LeagueBadge from './LeagueBadge';
import { getInternationalQuizHref } from '../utils/worldCupQuizPools';
import PageFallback, { PageLoadingInline } from './PageFallback';
import PlayerAutocomplete from './PlayerAutocomplete';
import PlayerCard from './PlayerCard';

const manifestLeagues = getManifestLeagues();
const MAJOR_LEAGUE_IDS = ['premier-league', 'la-liga', 'bundesliga', 'serie-a', 'ligue-1'];
const BROWSE_RESULT_CAP = 60;

export default function BrowseDatabase() {
  const [searchParams] = useSearchParams();
  const rawTab = searchParams.get('tab') || 'players';
  const tab = rawTab === 'teams' ? 'clubs' : rawTab;
  const leagueParam = searchParams.get('league') || '';
  const [leagueFilter, setLeagueFilter] = useState('');
  const [teamFilter, setTeamFilter] = useState('');
  const [search, setSearch] = useState('');
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

  const browseLeagues = useMemo(() => {
    const { major, other, international } = leagueGroups;
    return [...major, ...other, ...international];
  }, [leagueGroups]);

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
    quizStatus,
    quizRegistry,
    search,
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
  const showLeagueClubPicker = Boolean(leagueFilter && !teamFilter && !search.trim());
  const playersListReady =
    searchIndexStatus === 'ready' || Boolean(bundled) || usesExternalShard;
  const showPlayerResults =
    showPlayersTab && !showLeagueClubPicker && (hasPlayerQuery || playersListReady);
  const isResultCapped =
    showPlayerResults && !search.trim() && filteredPlayers.length > BROWSE_RESULT_CAP;
  const displayedPlayers = isResultCapped
    ? filteredPlayers.slice(0, BROWSE_RESULT_CAP)
    : filteredPlayers;

  const handleLeagueChange = (value) => {
    setLeagueFilter(value);
    setTeamFilter('');
  };

  useEffect(() => {
    if (tab !== 'teams') return;
    let cancelled = false;
    Promise.resolve().then(() => {
      if (cancelled) return;
      if (leagueParam && leagueParam !== leagueFilter) {
        setLeagueFilter(leagueParam);
        setTeamFilter('');
        setSearch('');
      }
      if (!leagueParam && leagueFilter) {
        setLeagueFilter('');
        setTeamFilter('');
        setSearch('');
      }
    });
    return () => {
      cancelled = true;
    };
  }, [tab, leagueParam, leagueFilter]);

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
              <optgroup label="Other clubs">
                {leagueGroups.other.map((league) => (
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
            </select>
          </label>

          <label className="filter-field">
            <span>Club</span>
            <select
              value={teamFilter}
              onChange={(e) => setTeamFilter(e.target.value)}
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
            onChange={setSearch}
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
                  : `${filteredPlayers.length} player${filteredPlayers.length !== 1 ? 's' : ''} found`
                : isResultCapped
                  ? `Showing top ${BROWSE_RESULT_CAP} players — search or filter to narrow the list`
                  : playersListReady
                    ? `${filteredPlayers.length.toLocaleString()} players — search or pick a league or club`
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
        <div className="league-link-grid">
          {browseLeagues.map((league) => (
            <Link key={league.id} to={`/league/${league.id}`} className="league-link-card">
              <LeagueBadge league={league} />
              <span>
                <strong>{getLeagueDisplayName(league)}</strong>
                <small>{formatCountryLabel(league.country)} · Explore</small>
              </span>
            </Link>
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
            full squad ({scopedPlayers.length} players in this league).
          </p>
          <div className="league-link-grid">
            {teamsInLeague.map((team) => (
              <Link key={team.id} to={`/team/${team.id}`} className="league-link-card">
                <span>
                  <strong>{team.name}</strong>
                  <small>{team.country}</small>
                </span>
              </Link>
            ))}
          </div>
        </section>
      ) : showPlayerResults ? (
        <section className="browse-results" aria-label="Player results">
          {browseDataLoading ? (
            <PageFallback label="Loading players…" />
          ) : filteredPlayers.length > 0 ? (
            <>
              {isResultCapped && (
                <p className="browse-results__cap-notice">
                  Showing {BROWSE_RESULT_CAP} of {filteredPlayers.length} — pick a club or search
                  by name to narrow results.
                </p>
              )}
              <div className="card-grid">
                {displayedPlayers.map((player) => (
                  <PlayerCard key={player.id} player={player} />
                ))}
              </div>
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
                    setLeagueFilter('');
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
          <div className="league-link-grid">
            {leagueGroups.major.map((league) => (
              <Link
                key={league.id}
                to={`/browse?tab=clubs&league=${league.id}`}
                className="league-link-card"
              >
                <LeagueBadge league={league} />
                <span>
                  <strong>{getLeagueDisplayName(league)}</strong>
                  <small>{league.country}</small>
                </span>
              </Link>
            ))}
          </div>
          <h2 className="section-label section-label--compact">Other clubs</h2>
          <div className="league-link-grid">
            {leagueGroups.other.map((league) => (
              <Link
                key={league.id}
                to={`/browse?tab=clubs&league=${league.id}`}
                className="league-link-card"
              >
                <LeagueBadge league={league} />
                <span>
                  <strong>{getLeagueDisplayName(league)}</strong>
                  <small>{league.country}</small>
                </span>
              </Link>
            ))}
          </div>
          <h2 className="section-label section-label--compact">International clubs</h2>
          <div className="league-link-grid">
            {leagueGroups.international.map((league) => (
              <Link
                key={league.id}
                to={`/browse?tab=clubs&league=${league.id}`}
                className="league-link-card"
              >
                <LeagueBadge league={league} />
                <span>
                  <strong>{getLeagueDisplayName(league)}</strong>
                  <small>{league.country}</small>
                </span>
              </Link>
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
              <div className="league-link-grid">
                {teamsInLeague.map((team) => (
                  <Link key={team.id} to={`/team/${team.id}`} className="league-link-card">
                    <span>
                      <strong>{team.name}</strong>
                      <small>{team.country}</small>
                    </span>
                  </Link>
                ))}
              </div>
            </section>
          ) : null}
        </section>
      )}
    </div>
  );
}
