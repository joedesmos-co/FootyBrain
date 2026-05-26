import { lazy, Suspense, useCallback, useRef, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useDailyCompletionStatus } from '../hooks/useDailyCompletionStatus';
import { useProgression } from '../hooks/useProgression';

const UniversalSearch = lazy(() => import('./UniversalSearch'));

function NavXPWidget({ level, xpIntoLevel, xpForNextLevel }) {
  const progress = xpForNextLevel > 0
    ? Math.round((xpIntoLevel / xpForNextLevel) * 100)
    : 0;

  return (
    <NavLink
      to="/profile"
      className={({ isActive }) => `nav-xp-link${isActive ? ' active' : ''}`}
      aria-label={`Profile — Level ${level}, ${xpIntoLevel} of ${xpForNextLevel} XP`}
    >
      <span className="nav-xp__level">Lv.{level}</span>
      {/* Purely visual — the NavLink's aria-label describes level + XP for AT */}
      <div className="nav-xp__bar" aria-hidden="true">
        <div className="nav-xp__fill" style={{ width: `${progress}%` }} />
      </div>
    </NavLink>
  );
}

export default function Navbar() {
  const [searchOpen, setSearchOpen] = useState(false);
  const searchButtonRef = useRef(null);
  const { level, xpIntoLevel, xpForNextLevel } = useProgression();
  const { isCompleted: dailyCompleted } = useDailyCompletionStatus();

  const handleSearchClose = useCallback(() => {
    setSearchOpen(false);
    searchButtonRef.current?.focus();
  }, []);

  return (
    <header className="navbar">
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>
      <div className="navbar__start">
        <NavLink to="/" className="navbar__brand">
          <span className="navbar__logo">⚽</span>
          <span className="navbar__title">FootyBrain</span>
        </NavLink>
        <button
          ref={searchButtonRef}
          type="button"
          className="navbar__search-btn"
          aria-label="Search players, clubs, leagues, and national teams"
          aria-expanded={searchOpen}
          aria-haspopup="dialog"
          onClick={() => setSearchOpen(true)}
        >
          <span className="navbar__search-icon" aria-hidden="true">
            ⌕
          </span>
          <span className="navbar__search-text">Search</span>
        </button>
      </div>
      <nav className="navbar__links" aria-label="Main navigation">
        <NavLink to="/browse" className={({ isActive }) => (isActive ? 'active' : '')}>
          Browse
        </NavLink>
        <NavLink to="/national-teams" className={({ isActive }) => (isActive ? 'active' : '')}>
          Nations
        </NavLink>
        <NavLink to="/world-cup" className={({ isActive }) => (isActive ? 'active' : '')}>
          World Cup
        </NavLink>
        <NavLink to="/compare" className={({ isActive }) => (isActive ? 'active' : '')}>
          Compare
        </NavLink>
        <NavLink
          to="/collections"
          className={({ isActive }) => (isActive ? 'active' : '')}
          end
        >
          Collections
        </NavLink>
        <NavLink to="/quiz" className={({ isActive }) => (isActive ? 'active' : '')}>
          Quiz
        </NavLink>
        <NavLink to="/saved" className={({ isActive }) => (isActive ? 'active' : '')}>
          Saved
        </NavLink>
        <NavLink
          to="/daily"
          className={({ isActive }) => `nav-daily-link${isActive ? ' active' : ''}${dailyCompleted ? ' nav-daily-link--done' : ''}`}
          aria-label={dailyCompleted ? 'Daily Challenge — completed' : 'Daily Challenge — new challenge available'}
        >
          Daily
          {!dailyCompleted && <span className="nav-daily-dot" aria-hidden="true" />}
        </NavLink>
        <NavXPWidget
          level={level}
          xpIntoLevel={xpIntoLevel}
          xpForNextLevel={xpForNextLevel}
        />
      </nav>
      {searchOpen && (
        <Suspense
          fallback={
            <p className="page-loading page-loading--overlay" role="status" aria-live="polite">
              Opening search…
            </p>
          }
        >
          <UniversalSearch open onClose={handleSearchClose} />
        </Suspense>
      )}
    </header>
  );
}
