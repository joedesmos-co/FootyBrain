import { Link } from 'react-router-dom';

/**
 * Loading / error gate for quiz surfaces that depend on the quiz registry.
 */
export default function QuizRegistryLoadState({
  status,
  onRetry,
  loadingLabel = 'Loading…',
  pageClass = '',
}) {
  if (status === 'loading') {
    return (
      <div className={`page ${pageClass}`.trim()}>
        <p className="page-loading" role="status" aria-live="polite" aria-busy="true">
          {loadingLabel}
        </p>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className={`page shell-error ${pageClass}`.trim()}>
        <header className="page-header">
          <h1>Quiz data unavailable</h1>
          <p>
            FootyBrain could not load quiz players. Check your connection and try again, or browse
            the database while offline recovery loads.
          </p>
        </header>
        <div className="empty-state__actions">
          <button type="button" className="btn btn--primary" onClick={onRetry}>
            Retry
          </button>
          <Link to="/" className="btn btn--secondary">
            Home
          </Link>
          <Link to="/browse" className="btn btn--secondary">
            Browse database
          </Link>
        </div>
      </div>
    );
  }

  return null;
}
