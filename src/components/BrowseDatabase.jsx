import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  countLinkedPlayers,
  getLiveNationalTeams,
  getNationalTeamQuizReadyCount,
  getViableLiveNationalTeams,
} from '../data/nationalTeamData';
import {
  getLeagueName,
  getPlayersForLeague,
  getPlayersForTeam,
  getTeamName,
  leagues,
  players,
  teams,
} from '../data/sampleData';
import { getTodayKey } from '../hooks/useDailyChallenge';
import { getDailyFeatured, getFeaturedPickPlayers } from '../utils/dailyFeatured';
import { BROWSE_SEARCH_RESULT_CAP, orderPlayersByQuery } from '../utils/playerSearch';
import DataTrustNotice from './DataTrustNotice';
import TodaysPicksSection from './HomeFeaturedSection';
import LeagueBadge from './LeagueBadge';
import NationalTeamBadge from './NationalTeamBadge';
import PlayerAutocomplete from './PlayerAutocomplete';
import PlayerCard from './PlayerCard';

export default function BrowseDatabase() {
  const [leagueFilter, setLeagueFilter] = useState('');
  const [teamFilter, setTeamFilter] = useState('');
  const [search, setSearch] = useState('');
  const todayKey = getTodayKey();
  const hasPlayerQuery = search.trim().length > 0 || Boolean(leagueFilter || teamFilter);
  const featuredPickPool = useMemo(() => getFeaturedPickPlayers(players), []);
  const dailyFeatured = useMemo(
    () => getDailyFeatured(featuredPickPool, teams, todayKey),
    [featuredPickPool, todayKey],
  );
  const liveNationalTeams = useMemo(() => getLiveNationalTeams(), []);
  const viableNationalTeams = useMemo(() => getViableLiveNationalTeams(), []);
  const intentContext = useMemo(
    () => ({
      teams,
      nationalTeams: liveNationalTeams,
      getLeagueName,
    }),
    [liveNationalTeams],
  );

  const teamsInLeague = useMemo(() => {
    if (!leagueFilter) return teams;
    return teams.filter((t) => t.leagueId === leagueFilter);
  }, [leagueFilter]);

  const scopedPlayers = useMemo(() => {
    if (teamFilter) return getPlayersForTeam(teamFilter);
    if (leagueFilter) return getPlayersForLeague(leagueFilter);
    return players;
  }, [leagueFilter, teamFilter]);

  const filteredPlayers = useMemo(() => {
    if (!search.trim()) return scopedPlayers;
    return orderPlayersByQuery(scopedPlayers, search, {
      getTeamName,
      getLeagueName,
      limit: BROWSE_SEARCH_RESULT_CAP,
    });
  }, [scopedPlayers, search]);

  const searchResultCapped =
    search.trim().length > 0 && filteredPlayers.length >= BROWSE_SEARCH_RESULT_CAP;

  // Cap league-wide lists only; a selected club shows the full squad (~18–25).
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
              {leagues.map((league) => (
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
          />
        </div>
        <p className="filters__count">
          {hasPlayerQuery
            ? searchResultCapped
              ? `Showing top ${BROWSE_SEARCH_RESULT_CAP} matches — narrow league or team to see more`
              : `${filteredPlayers.length} player${filteredPlayers.length !== 1 ? 's' : ''} found`
            : 'Search or choose a league/team to explore players.'}
        </p>
      </section>

      <TodaysPicksSection
        featuredPlayers={dailyFeatured.players}
        featuredTeams={dailyFeatured.teams}
        featuredNationalTeams={dailyFeatured.nationalTeams}
        picksMode={dailyFeatured.mode}
      />

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
          {leagues.map((league) => (
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

      {/* Future: loading state while fetchPlayers(filters) resolves from API/Firebase */}
      {showLeagueClubPicker ? (
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
          {filteredPlayers.length > 0 ? (
            <>
              {isResultCapped && (
                <p className="browse-results__cap-notice">
                  Showing {BROWSE_RESULT_CAP} of {filteredPlayers.length} — pick a club or search by name to narrow results.
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
