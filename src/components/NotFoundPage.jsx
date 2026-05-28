import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <div className="page">
      <header className="page-header">
        <h1>Page not found</h1>
        <p>That page is not in FootyCompass yet. Try search or start from browse.</p>
      </header>
      <div className="empty-state__actions">
        <Link to="/" className="btn btn--primary">
          Home
        </Link>
        <Link to="/browse" className="btn btn--secondary">
          Browse players
        </Link>
        <Link to="/onboarding" className="btn btn--secondary">
          How it works
        </Link>
      </div>
    </div>
  );
}
