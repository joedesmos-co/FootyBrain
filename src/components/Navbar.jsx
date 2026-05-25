import { NavLink } from 'react-router-dom';

export default function Navbar() {
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
      </nav>
    </header>
  );
}
