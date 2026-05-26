import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
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
  const [leagueFilter, setLeagueFilter] = useState('');
  const [teamFilter, setTeamFilter] = useState('');
  const [search, setSearch] = useState('');
  const [bundled, setBundled] = useState(null);

  const usesExternalShard =
    Boolean(leagueFilter) && hasExternalLeagueShard(leagueFilter);
  const shardState = useLeagueShard(usesExternalShard ? leagueFilter : null);
  const activeLeagueName =
    (leagueFilter && getManifestLeague(leagueFilter)?.name) || 'league';

  const needsBundledData = Boolean(
    !usesExternalShard && (leagueFilter || teamFilter || search.trim()),
  );

  useEffect(() => {
    if (usesExternalShard) return undefined;
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
  }, [usesExternalShard]);

  const todayKey = getTodayKey();
  const leagueShard = shardState.status === 'ready' ? shardState.shard : null;
  const shardLoading = usesExternalShard && shardState.status === 'loading';

  const getLeagueName = useMemo(() => {
    if (usesExternalShard && leagueShard) return leagueShard.getLeagueName;
    if (bundled) return bundled.getLeagueName;
    return (id) => manifestLeagues.find((league) => league.id === id)?.name ?? 'Unknown';
  }, [usesExternalShard, leagueShard, bundled]);

  const getTeamName = useMemo(() => {
    if (usesExternalShard && leagueShard) return leagueShard.getTeamName;
    if (bundled) return bundled.getTeamName;
    return () => 'Unknown';
  }, [usesExternalShard, leagueShard, bundled]);

  const hasPlayerQuery = search.trim().length > 0 || Boolean(leagueFilter || teamFilter);

  const featuredPickPool = useMemo(() => {
    if (!bundled) return [];
    return getFeaturedPickPlayers(bundled.players);
  }, [bundled]);

  const dailyFeatured = useMemo(() => {
    if (!bundled) {
      return { mode: 'club', players: [], teams: [], nationalTeams: [] };
    }
    return getDailyFeatured(featuredPickPool, bundled.teams, todayKey);
  }, [bundled, featuredPickPool, todayKey]);

  const liveNationalTeams = useMemo(() => getLiveNationalTeams(), []);
  const viableNationalTeams = useMemo(() => getViableLiveNationalTeams(), []);

  const intentContext = useMemo(
    () => ({
      teams: usesExternalShard && leagueShard ? leagueShard.teams : (bundled?.teams ?? []),
      nationalTeams: liveNationalTeams,
      getLeagueName,
    }),
    [usesExternalShard, leagueShard, bundled, liveNationalTeams, getLeagueName],
  );

  const teamsInLeague = useMemo(() => {
    if (usesExternalShard && leagueShard) {
      return leagueShard.teams;
    }
    if (!leagueFilter) return bundled?.teams ?? [];
    return (bundled?.teams ?? []).filter((team) => team.leagueId === leagueFilter);
  }, [usesExternalShard, leagueShard, leagueFilter, bundled]);

  const scopedPlayers = useMemo(() => {
    if (usesExternalShard && leagueShard) {
      if (teamFilter) {
        return leagueShard.players.filter((player) => player.teamId === teamFilter);
      }
      return leagueShard.players;
    }
    if (!bundled) return [];
    if (teamFilter) return bundled.getPlayersForTeam(teamFilter);
    if (leagueFilter) return bundled.getPlayersForLeague(leagueFilter);
    return bundled.players;
  }, [usesExternalShard, leagueShard, teamFilter, leagueFilter, bundled]);

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

  const showPicks = bundled && !usesExternalShard;
  const browseDataLoading =
    shardLoading ||
    (needsBundledData && !bundled) ||
    (usesExternalShard && !leagueShard && !shardLoading);

  return (
    <div className="page browse">
      <header className="page-header">
        <h1>Browse Database</h1>
        <p>
          Filter by league or club, search by name, then open a profile.{' '}
          <Link to="/national-teams">Men&apos;s national teams</Link> are listed separately.
        </p>
        <DataTrustNotice compact />
      </header>

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
                  {league.name}
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
              : 'Search or choose a league/team to explore players.'}
        </p>
      </section>

      {showPicks ? (
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
      )}

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

      <section className="national-hub-strip" aria-labelledby="national-hubs-title">
        <div className="national-hub-strip__header">
          <h2 id="national-hubs-title">National team hubs</h2>
          <Link to="/national-teams" className="national-hub-strip__link">
            All {liveNationalTeams.length} nations
          </Link>
        </div>
        <p className="national-hub-strip__intro">
          Linked squads from the club database — one profile per player. Quiz-ready nations can
          launch a national-team quiz (minimum 3).
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
                  quiz-ready
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
                <strong>{league.name}</strong>
                <small>{league.country}</small>
              </span>
            </Link>
          ))}
        </div>
      </section>

      {shardLoading ? (
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
      )}
    </div>
  );
}
