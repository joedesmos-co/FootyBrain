import { lazy, Suspense, useCallback, useRef, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';

const UniversalSearch = lazy(() => import('./UniversalSearch'));

function isQuizSectionActive(pathname) {
  return (
    pathname === '/quiz' ||
    pathname.startsWith('/club-quiz') ||
    pathname === '/daily' ||
    pathname.startsWith('/hubs/quizzes')
  );
}

export default function Navbar() {
  const [searchOpen, setSearchOpen] = useState(false);
  const searchButtonRef = useRef(null);
  const { pathname } = useLocation();
  const quizNavActive = isQuizSectionActive(pathname);

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
          <span className="navbar__logo" aria-hidden="true">
            <img
              className="navbar__logo-img"
              src="/brand/footycompass-icon.svg"
              width="32"
              height="32"
              alt=""
              decoding="async"
              loading="eager"
            />
          </span>
          <span className="navbar__title">FootyCompass</span>
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
        <NavLink to="/" end className={({ isActive }) => (isActive ? 'active' : '')}>
          Home
        </NavLink>
        <NavLink to="/browse" className={({ isActive }) => (isActive ? 'active' : '')}>
          Browse
        </NavLink>
        <NavLink
          to="/quiz"
          className={() => (quizNavActive ? 'active' : '')}
        >
          Quiz
        </NavLink>
        <NavLink
          to="/collections"
          className={({ isActive }) => (isActive ? 'active' : '')}
          end
        >
          Collections
        </NavLink>
        <NavLink to="/hubs" className={({ isActive }) => (isActive ? 'active' : '')}>
          Explore
        </NavLink>
        <NavLink to="/profile" className={({ isActive }) => (isActive ? 'active' : '')}>
          Profile
        </NavLink>
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
