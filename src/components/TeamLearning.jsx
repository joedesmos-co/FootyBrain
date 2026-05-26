import { useMemo, useState } from 'react';
import { leagues, teams } from '../data/sampleData';
import TeamCard from './TeamCard';

export default function TeamLearning() {
  const [leagueFilter, setLeagueFilter] = useState('');
  const [search, setSearch] = useState('');

  const filteredTeams = useMemo(() => {
    const query = search.trim().toLowerCase();
    return teams.filter((team) => {
      if (leagueFilter && team.leagueId !== leagueFilter) return false;
      if (query && !team.name.toLowerCase().includes(query)) return false;
      return true;
    });
  }, [leagueFilter, search]);

  return (
    <div className="page teams-page">
      <header className="page-header">
        <h1>Team Learning</h1>
        <p>Club history, squads, rivals, and fan notes.</p>
      </header>

      <section className="filters" aria-label="Team filters">
        <div className="filters__row">
          <label className="filter-field">
            <span>League</span>
            <select
              value={leagueFilter}
              onChange={(e) => setLeagueFilter(e.target.value)}
            >
              <option value="">All leagues</option>
              {leagues.map((league) => (
                <option key={league.id} value={league.id}>
                  {league.name}
                </option>
              ))}
            </select>
          </label>

          <label className="filter-field filter-field--grow">
            <span>Search</span>
            <input
              type="search"
              placeholder="Search by team name…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </label>
        </div>
        <p className="filters__count">
          {filteredTeams.length} team{filteredTeams.length !== 1 ? 's' : ''} found
        </p>
      </section>

      {/* Future: fetchTeams() from API/Firebase */}
      <div className="team-grid">
        {filteredTeams.length > 0 ? (
          filteredTeams.map((team) => <TeamCard key={team.id} team={team} />)
        ) : (
          <section className="empty-state" aria-label="No matching teams">
            <p>No teams match your search.</p>
            <div className="empty-state__actions">
              <button
                type="button"
                className="btn btn--secondary"
                onClick={() => {
                  setLeagueFilter('');
                  setSearch('');
                }}
              >
                Clear filters
              </button>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
