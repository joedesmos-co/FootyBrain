import { Link } from 'react-router-dom';
import { getCollectionQuizHref } from '../utils/collections';

export default function CollectionCard({ collection, progress }) {
  const itemCount = collection.items.length;
  const quizHref = getCollectionQuizHref(collection.quizLaunch, collection);

  return (
    <article className="collection-card">
      <header className="collection-card__header">
        <div className="collection-card__meta">
          <span className={`collection-tag collection-tag--${collection.difficulty.toLowerCase()}`}>
            {collection.difficulty}
          </span>
          {collection.tags.map((tag) => (
            <span key={tag} className="collection-tag collection-tag--muted">
              {tag}
            </span>
          ))}
        </div>
        <h2 className="collection-card__title">
          <Link to={`/collections/${collection.id}`}>{collection.title}</Link>
        </h2>
        <p className="collection-card__desc">{collection.description}</p>
      </header>

      <div className="collection-card__stats">
        <span>{itemCount} profiles</span>
        {progress && (
          <span className="collection-card__progress-label">
            {progress.collectionComplete
              ? 'Complete'
              : `${progress.learnedCount}/${progress.total} learned · ${progress.percent}%`}
          </span>
        )}
      </div>

      {progress && progress.total > 0 && (
        <div
          className="collection-card__bar"
          role="progressbar"
          aria-valuenow={progress.percent}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`${collection.title} progress`}
        >
          <div
            className="collection-card__bar-fill"
            style={{ width: `${progress.percent}%` }}
          />
        </div>
      )}

      <div className="collection-card__actions">
        <Link to={`/collections/${collection.id}`} className="btn btn--primary btn--small">
          Open collection
        </Link>
        <Link to={quizHref} className="btn btn--secondary btn--small">
          Quick quiz
        </Link>
      </div>
    </article>
  );
}
