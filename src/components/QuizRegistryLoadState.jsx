import { Link } from 'react-router-dom';
import { PageLoadingInline } from './PageFallback';

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
        <PageLoadingInline label={loadingLabel} />
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className={`page shell-error ${pageClass}`.trim()}>
        <header className="page-header">
          <h1>Quizzes unavailable right now</h1>
          <p>
            We could not load quiz players. Check your connection and try again, or browse players
            and clubs while things catch up.
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
            Browse players
          </Link>
        </div>
      </div>
    );
  }

  return null;
}
