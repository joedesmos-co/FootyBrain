import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, NavLink, useSearchParams } from 'react-router-dom';
import { getManifestLeague, getManifestLeagues } from '../data/contentManifest';
import {
  countLinkedPlayers,
  getLiveNationalTeams,
  getNationalTeamQuizReadyCount,
  getViableLiveNationalTeams,
} from '../data/nationalTeamData';
import { hasExternalLeagueShard, useLeagueShard } from '../hooks/useLeagueShard';
import { getTodayKey } from '../hooks/useDailyCompletionStatus';
import { getDailyFeatured, getFeaturedPickPlayers } from '../utils/dailyFeatured';
import { BROWSE_SEARCH_RESULT_CAP, orderPlayersByQuery } from '../utils/playerSearch';
import { getLeagueDisplayName } from '../utils/footballDisplay';
import { useQuizRegistry } from '../hooks/useQuizRegistry';
import { useSearchIndex } from '../hooks/useSearchIndex';
import DataTrustNotice from './DataTrustNotice';
import TodaysPicksSection from './HomeFeaturedSection';
import LeagueBadge from './LeagueBadge';
import { getInternationalQuizHref } from '../utils/worldCupQuizPools';
import NationalTeamBadge from './NationalTeamBadge';
import PageFallback from './PageFallback';
import PlayerAutocomplete from './PlayerAutocomplete';
import PlayerCard from './PlayerCard';

const manifestLeagues = getManifestLeagues();

export default function BrowseDatabase() {
  const [searchParams] = useSearchParams();
  const tab = searchParams.get('tab') || 'players';
  const leagueParam = searchParams.get('league') || '';
  const [leagueFilter, setLeagueFilter] = useState('');
  const [teamFilter, setTeamFilter] = useState('');
  const [search, setSearch] = useState('');
  const [bundled, setBundled] = useState(null);
  const [forceFullDb, setForceFullDb] = useState(false);
  const { status: quizStatus, registry: quizRegistry } = useQuizRegistry();
  const { index: searchIndex, status: searchIndexStatus } = useSearchIndex();

  const usesExternalShard =
    Boolean(leagueFilter) && hasExternalLeagueShard(leagueFilter);
  const shardState = useLeagueShard(usesExternalShard ? leagueFilter : null);
  const activeLeagueName =
    (leagueFilter && getLeagueDisplayName(getManifestLeague(leagueFilter))) || 'league';

  // Only load bundled sampleData if the user explicitly requests the full database.
  const needsBundledData = Boolean(!usesExternalShard && forceFullDb);

  useEffect(() => {
    if (usesExternalShard) return undefined;
    if (!needsBundledData) return undefined;
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
  }, [usesExternalShard, needsBundledData]);

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
      return { mode: 'club', players: [], teams: [], nationalTeams: [] };
    }
    return getDailyFeatured(featuredPickPool, quizRegistry.teams, todayKey);
  }, [quizStatus, quizRegistry, featuredPickPool, todayKey]);

  const liveNationalTeams = useMemo(() => getLiveNationalTeams(), []);
  const viableNationalTeams = useMemo(() => getViableLiveNationalTeams(), []);

  const intentContext = useMemo(
    () => ({
      teams: usesExternalShard && leagueShard ? leagueShard.teams : (searchIndex?.teams ?? []),
      nationalTeams: liveNationalTeams,
      getLeagueName,
    }),
    [usesExternalShard, leagueShard, searchIndex, liveNationalTeams, getLeagueName],
  );

  const teamsInLeague = useMemo(() => {
    if (usesExternalShard && leagueShard) {
      return leagueShard.teams;
    }
    if (!leagueFilter) return searchIndex?.teams ?? [];
    return (searchIndex?.teams ?? []).filter((team) => team.leagueId === leagueFilter);
  }, [usesExternalShard, leagueShard, leagueFilter, searchIndex]);

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

    // Fallback: if index isn't ready yet, show the quiz spotlight pool (fast) until full DB is requested.
    if (!leagueFilter && !teamFilter && !search.trim() && quizStatus === 'ready' && quizRegistry?.players) {
      return quizRegistry.players;
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
    if (!search.trim()) return scopedPlayers;
    return orderPlayersByQuery(scopedPlayers, search, {
      getTeamName,
      getLeagueName,
      limit: BROWSE_SEARCH_RESULT_CAP,
    });
  }, [scopedPlayers, search, getTeamName, getLeagueName]);

  const searchResultCapped =
    search.trim().length > 0 && filteredPlayers.length >= BROWSE_SEARCH_RESULT_CAP;

  const BROWSE_RESULT_CAP = 60;
  const showLeagueClubPicker = Boolean(leagueFilter && !teamFilter && !search.trim());
  const showPlayerResults = hasPlayerQuery && !showLeagueClubPicker;
  const isResultCapped =
    showPlayerResults &&
    !search.trim() &&
    !teamFilter &&
    filteredPlayers.length > BROWSE_RESULT_CAP;
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
    (needsBundledData && !bundled) ||
    (usesExternalShard && !leagueShard && !shardLoading);

  const indexLoading =
    !usesExternalShard &&
    !needsBundledData &&
    !bundled &&
    searchIndexStatus === 'loading' &&
    (leagueFilter || teamFilter || search.trim());

  const showPlayersTab = tab === 'players';
  const showTeamsTab = tab === 'teams';
  const showLeaguesTab = tab === 'leagues';
  const showNationalTeamsTab = tab === 'national-teams';
  const showWorldCupTab = tab === 'world-cup';

  return (
    <div className="page browse">
      <header className="page-header">
        <h1>Browse</h1>
        <p>Explore the FootyBrain database by category. Use filters and search to open profiles.</p>
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
            to="/browse?tab=teams"
            className={`compare-tabs__tab${showTeamsTab ? ' compare-tabs__tab--active' : ''}`}
          >
            Clubs/Teams
          </NavLink>
          <NavLink
            to="/browse?tab=leagues"
            className={`compare-tabs__tab${showLeaguesTab ? ' compare-tabs__tab--active' : ''}`}
          >
            Leagues
          </NavLink>
          <NavLink
            to="/browse?tab=national-teams"
            className={`compare-tabs__tab${showNationalTeamsTab ? ' compare-tabs__tab--active' : ''}`}
          >
            National teams
          </NavLink>
          <NavLink
            to="/browse?tab=world-cup"
            className={`compare-tabs__tab${showWorldCupTab ? ' compare-tabs__tab--active' : ''}`}
          >
            World Cup
          </NavLink>
        </nav>
      </header>

      {indexLoading && showPlayersTab ? <PageFallback label="Loading search index…" /> : null}

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
              {manifestLeagues.map((league) => (
                <option key={league.id} value={league.id}>
                  {getLeagueDisplayName(league)}
                </option>
              ))}
            </select>
          </label>

          <label className="filter-field">
            <span>Team</span>
            <select
              value={teamFilter}
              onChange={(e) => setTeamFilter(e.target.value)}
              disabled={!leagueFilter || shardLoading}
            >
              <option value="">All teams</option>
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
            ? `Loading ${activeLeagueName} data…`
            : hasPlayerQuery
              ? searchResultCapped
                ? `Showing top ${BROWSE_SEARCH_RESULT_CAP} matches — narrow league or team to see more`
                : `${filteredPlayers.length} player${filteredPlayers.length !== 1 ? 's' : ''} found`
              : searchIndexStatus === 'ready'
                ? 'Search or choose a league/team to explore players.'
                : bundled
                  ? 'Search or choose a league/team to explore players.'
                  : 'Showing featured quiz players. Load the full list to browse everyone.'}
        </p>
        {!bundled && !usesExternalShard && !leagueFilter && !teamFilter && !search.trim() ? (
          <button
            type="button"
            className="btn btn--secondary btn--small"
            onClick={() => setForceFullDb(true)}
          >
            Load full list
          </button>
        ) : null}
      </section>
      )}

      {showPlayersTab && (showPicks ? (
        <TodaysPicksSection
          featuredPlayers={dailyFeatured.players}
          featuredTeams={dailyFeatured.teams}
          featuredNationalTeams={dailyFeatured.nationalTeams}
          picksMode={dailyFeatured.mode}
        />
      ) : usesExternalShard ? null : (
        <p className="page-loading browse-picks-loading" role="status" aria-live="polite">
          Loading today&apos;s picks…
        </p>
      ))}

      {(showPlayersTab || showWorldCupTab) && (
      <aside className="learning-hub-cta learning-hub-cta--compact" aria-label="World Cup learning">
        <div className="learning-hub-cta__copy">
          <p className="learning-hub-cta__title">World Cup 2026 prep</p>
          <p>
            Study featured nations, groups, and collections — or jump into the international quiz
            pool.
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

      {(showPlayersTab || showNationalTeamsTab) && (
      <section className="national-hub-strip" aria-labelledby="national-hubs-title">
        <div className="national-hub-strip__header">
          <h2 id="national-hubs-title">National team hubs</h2>
          <Link to="/national-teams" className="national-hub-strip__link">
            All {liveNationalTeams.length} nations
          </Link>
        </div>
        <p className="national-hub-strip__intro">
          Player pools built from club squads — one profile per player. Some nations unlock a quiz
          once enough players have clues.
        </p>
        <div className="national-hub-strip__grid">
          {viableNationalTeams.map((team) => (
            <Link
              key={team.id}
              to={`/national-team/${team.id}`}
              className="national-hub-strip__card"
            >
              <NationalTeamBadge nationalTeam={team} size="thumb" />
              <span>
                <strong>{team.displayName}</strong>
                <small>
                  {countLinkedPlayers(team.id)} linked · {getNationalTeamQuizReadyCount(team.id)}{' '}
                  with quiz mode
                </small>
              </span>
            </Link>
          ))}
        </div>
        {viableNationalTeams.length < liveNationalTeams.length && (
          <p className="national-hub-strip__note">
            {liveNationalTeams.length - viableNationalTeams.length} more nations are listed on{' '}
            <Link to="/national-teams">National teams</Link> with thinner quiz pools.
          </p>
        )}
      </section>
      )}

      {(showPlayersTab || showLeaguesTab) && (
      <section className="league-hub-strip" aria-labelledby="league-hubs-title">
        <div className="league-hub-strip__header">
          <h2 id="league-hubs-title">League learning hubs</h2>
          <p>League hubs — clubs, rivalries, and league quizzes.</p>
        </div>
        <div className="league-link-grid">
          {manifestLeagues.map((league) => (
            <Link key={league.id} to={`/league/${league.id}`} className="league-link-card">
              <LeagueBadge league={league} />
              <span>
                <strong>{getLeagueDisplayName(league)}</strong>
                <small>{league.country}</small>
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
          {needsBundledData && !bundled ? (
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
              <p>No players match. Try another league, team, or spelling.</p>
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
      ) : (
        <p className="empty-state browse-results-empty">
          Search or choose a league/team to explore players.
        </p>
      )
      ) : null}

      {showTeamsTab && (
        <section className="browse-results" aria-label="Browse clubs">
          <p className="browse-results__cap-notice">
            Pick a league to browse clubs. For curated club learning pages, use{' '}
            <Link to="/teams">Team Learning</Link>.
          </p>
          <div className="league-link-grid">
            {manifestLeagues.map((league) => (
              <Link
                key={league.id}
                to={`/browse?tab=teams&league=${league.id}`}
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
