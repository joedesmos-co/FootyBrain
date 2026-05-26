import { Link } from 'react-router-dom';
import { getLearningPathStepCount } from '../utils/learningPaths';

export default function LearningPathCard({ path }) {
  const stepCount = getLearningPathStepCount(path);

  return (
    <article className="learning-path-card">
      <header className="learning-path-card__header">
        <div className="learning-path-card__meta">
          <span className={`collection-tag collection-tag--${path.difficulty.toLowerCase()}`}>
            {path.difficulty}
          </span>
          {path.tags.map((tag) => (
            <span key={tag} className="collection-tag collection-tag--muted">
              {tag}
            </span>
          ))}
        </div>
        <h2 className="learning-path-card__title">
          <Link to={`/learning-paths/${path.id}`}>{path.title}</Link>
        </h2>
        <p className="learning-path-card__desc">{path.description}</p>
      </header>
      <p className="learning-path-card__stats">
        {stepCount} steps · collection + profiles + quiz
      </p>
      <div className="learning-path-card__actions">
        <Link to={`/learning-paths/${path.id}`} className="btn btn--primary btn--small">
          View path
        </Link>
        {path.collectionId ? (
          <Link
            to={`/collections/${path.collectionId}`}
            className="btn btn--secondary btn--small"
          >
            Open collection
          </Link>
        ) : null}
      </div>
    </article>
  );
}
