import { useMemo, useState } from 'react';
import { leagues, players, teams } from '../data/sampleData';
import PlayerCard from './PlayerCard';

export default function BrowseDatabase() {
  const [leagueFilter, setLeagueFilter] = useState('');
  const [teamFilter, setTeamFilter] = useState('');
  const [search, setSearch] = useState('');

  const teamsInLeague = useMemo(() => {
    if (!leagueFilter) return teams;
    return teams.filter((t) => t.leagueId === leagueFilter);
  }, [leagueFilter]);

  const filteredPlayers = useMemo(() => {
    const query = search.trim().toLowerCase();
    return players.filter((player) => {
      if (leagueFilter && player.leagueId !== leagueFilter) return false;
      if (teamFilter && player.teamId !== teamFilter) return false;
      if (query && !player.name.toLowerCase().includes(query)) return false;
      return true;
    });
  }, [leagueFilter, teamFilter, search]);

  const handleLeagueChange = (value) => {
    setLeagueFilter(value);
    setTeamFilter('');
  };

  return (
    <div className="page browse">
      <header className="page-header">
        <h1>Browse Database</h1>
        <p>Filter players by league and club. Tap a card for the full profile.</p>
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

          <label className="filter-field filter-field--grow">
            <span>Search</span>
            <input
              type="search"
              placeholder="Search by player name…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </label>
        </div>
        <p className="filters__count">
          {filteredPlayers.length} player{filteredPlayers.length !== 1 ? 's' : ''} found
        </p>
      </section>

      {/* Future: loading state while fetchPlayers(filters) resolves from API/Firebase */}
      <div className="card-grid">
        {filteredPlayers.length > 0 ? (
          filteredPlayers.map((player) => (
            <PlayerCard key={player.id} player={player} />
          ))
        ) : (
          <p className="empty-state">No players match your filters. Try adjusting league or team.</p>
        )}
      </div>
    </div>
  );
}
