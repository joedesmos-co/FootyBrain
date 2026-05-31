import { useMemo, useState } from 'react';
import { getManifestLeagues } from '../data/contentManifest';
import { useSearchIndex } from '../hooks/useSearchIndex';
import TeamCard from './TeamCard';
import EmptyState from './ui/EmptyState';
import PageFallback from './PageFallback';

const leagues = getManifestLeagues();

export default function TeamLearning() {
  const [leagueFilter, setLeagueFilter] = useState('');
  const [search, setSearch] = useState('');
  const { index, status: indexStatus } = useSearchIndex();

  const filteredTeams = useMemo(() => {
    const query = search.trim().toLowerCase();
    const teams = indexStatus === 'ready' ? index.teams : [];
    return teams.filter((team) => {
      if (leagueFilter && team.leagueId !== leagueFilter) return false;
      if (query && !team.name.toLowerCase().includes(query)) return false;
      return true;
    });
  }, [leagueFilter, search, indexStatus, index]);

  return (
    <div className="page teams-page">
      <header className="page-header">
        <h1>Clubs</h1>
        <p>Squads, rivals, legends, and fan culture for every club.</p>
      </header>

      <section className="filters" aria-label="Club filters">
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
              placeholder="Search clubs…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </label>
        </div>
        <p className="filters__count">
          {indexStatus === 'loading'
            ? 'Loading clubs…'
            : `${filteredTeams.length} club${filteredTeams.length !== 1 ? 's' : ''} found`}
        </p>
      </section>

      {indexStatus === 'loading' ? (
        <PageFallback label="Loading clubs…" />
      ) : (
        <div className="team-grid">
          {filteredTeams.length > 0 ? (
            filteredTeams.map((team) => <TeamCard key={team.id} team={team} />)
          ) : (
            <EmptyState
              title="No clubs match your search. Try another league or spelling."
              actions={
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
              }
            />
          )}
        </div>
      )}
    </div>
  );
}
