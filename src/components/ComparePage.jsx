import { useEffect, useState } from 'react';
import { NavLink, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { getManifestLeagues } from '../data/leagueManifest';
import ClubCompare from './ClubCompare';
import PlayerCompare from './PlayerCompare';

export default function ComparePage() {
  const [leagueFilter, setLeagueFilter] = useState('');
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    if (location.pathname === '/compare-clubs') {
      navigate('/compare?tab=clubs', { replace: true });
    }
  }, [location.pathname, navigate]);

  const tab =
    location.pathname === '/compare-clubs' || searchParams.get('tab') === 'clubs'
      ? 'clubs'
      : 'players';

  return (
    <div className="page compare-page">
      <header className="page-header">
        <h1>Compare</h1>
        <p>Side-by-side player or club research from the database.</p>
        <nav className="compare-tabs" aria-label="Compare type">
          <NavLink
            to="/compare"
            end
            className={`compare-tabs__tab${tab === 'players' ? ' compare-tabs__tab--active' : ''}`}
          >
            Players
          </NavLink>
          <NavLink
            to="/compare?tab=clubs"
            className={`compare-tabs__tab${tab === 'clubs' ? ' compare-tabs__tab--active' : ''}`}
          >
            Clubs
          </NavLink>
        </nav>
        <div className="filters__row compare-page__filters">
          <label className="filter-field">
            <span>League</span>
            <select
              value={leagueFilter}
              onChange={(e) => setLeagueFilter(e.target.value)}
              aria-label="Filter compare by league"
            >
              <option value="">All leagues</option>
              {getManifestLeagues().map((league) => (
                <option key={league.id} value={league.id}>
                  {league.name}
                </option>
              ))}
            </select>
          </label>
        </div>
      </header>

      {tab === 'clubs' ? (
        <ClubCompare key={`clubs-${leagueFilter}`} embedded leagueFilter={leagueFilter} />
      ) : (
        <PlayerCompare
          key={`players-${leagueFilter}-${searchParams.get('left') ?? ''}-${searchParams.get('right') ?? ''}`}
          embedded
          leagueFilter={leagueFilter}
          initialLeftId={searchParams.get('left') ?? ''}
          initialRightId={searchParams.get('right') ?? ''}
        />
      )}
    </div>
  );
}
