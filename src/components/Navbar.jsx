import { NavLink } from 'react-router-dom';
import { useProgression } from '../hooks/useProgression';

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
  const { level, xpIntoLevel, xpForNextLevel } = useProgression();

  return (
    <header className="navbar">
      <NavLink to="/" className="navbar__brand">
        <span className="navbar__logo">⚽</span>
        <span className="navbar__title">FootyBrain</span>
      </NavLink>
      <nav className="navbar__links" aria-label="Main navigation">
        <NavLink to="/browse" className={({ isActive }) => (isActive ? 'active' : '')}>
          Browse
        </NavLink>
        <NavLink to="/teams" className={({ isActive }) => (isActive ? 'active' : '')}>
          Teams
        </NavLink>
        <NavLink to="/quiz" className={({ isActive }) => (isActive ? 'active' : '')}>
          Quiz
        </NavLink>
        <NavLink to="/saved" className={({ isActive }) => (isActive ? 'active' : '')}>
          Saved
        </NavLink>
        <NavXPWidget
          level={level}
          xpIntoLevel={xpIntoLevel}
          xpForNextLevel={xpForNextLevel}
        />
      </nav>
    </header>
  );
}
