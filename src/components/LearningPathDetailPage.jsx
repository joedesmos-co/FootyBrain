import { useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getCollectionById } from '../data/collectionsData';
import { getLearningPathById } from '../data/learningPathsData';
import { getCollectionQuizHref } from '../utils/collections';
import { resolveLearningPathSteps } from '../utils/learningPaths';
import { getCanonicalUrl } from '../utils/jsonLd';
import { setSeoMeta } from '../utils/seoMeta';

export default function LearningPathDetailPage() {
  const { pathId } = useParams();
  const path = getLearningPathById(pathId);
  const steps = path ? resolveLearningPathSteps(path) : [];
  const primaryCollection = path?.collectionId
    ? getCollectionById(path.collectionId)
    : null;
  const primaryQuizHref = primaryCollection
    ? getCollectionQuizHref(primaryCollection.quizLaunch)
    : null;

  useEffect(() => {
    if (!path || steps.length === 0) return;
    const canonical = getCanonicalUrl();
    if (!canonical) return;
    const title = `${path.title} · Learning path · FootyCompass`;
    const description = path.description
      ? path.description
      : 'A step-by-step learning flow through collections, profiles, and a quiz.';
    setSeoMeta({
      title,
      description,
      canonicalUrl: canonical,
      og: { title, description, url: canonical, type: 'website' },
      twitter: { title, description },
    });
  }, [path, steps.length]);

  if (!path || steps.length === 0) {
    return (
      <div className="learning-paths-page">
        <header className="page-header">
          <h1>Path not found</h1>
          <p>
            <Link to="/learning-paths">Back to learning paths</Link>
          </p>
        </header>
      </div>
    );
  }

  return (
    <div className="learning-paths-page learning-paths-page--detail">
      <nav className="collections-breadcrumb" aria-label="Breadcrumb">
        <Link to="/learning-paths">Learning paths</Link>
        <span aria-hidden="true"> / </span>
        <span>{path.title}</span>
      </nav>

      <header className="learning-path-detail__header">
        <div className="learning-path-detail__meta">
          <span className={`collection-tag collection-tag--${path.difficulty.toLowerCase()}`}>
            {path.difficulty}
          </span>
          {path.tags.map((tag) => (
            <span key={tag} className="collection-tag collection-tag--muted">
              {tag}
            </span>
          ))}
        </div>
        <h1>{path.title}</h1>
        <p className="learning-path-detail__desc">{path.description}</p>
        <p className="learning-path-detail__flow">
          Study flow: <strong>collection → profiles → quiz</strong> (optional extra collection at
          the end).
        </p>
        <div className="learning-path-detail__actions">
          <Link to={steps[0].href} className="btn btn--primary">
            Start step 1
          </Link>
          {primaryCollection ? (
            <Link
              to={`/collections/${primaryCollection.id}`}
              className="btn btn--secondary"
            >
              Open main collection
            </Link>
          ) : null}
          {primaryQuizHref ? (
            <Link to={primaryQuizHref} className="btn btn--secondary">
              Jump to quiz
            </Link>
          ) : null}
        </div>
      </header>

      <section aria-labelledby="learning-path-steps-title">
        <h2 id="learning-path-steps-title" className="collections-section-title">
          Path steps
        </h2>
        <ol className="learning-path-steps">
          {steps.map((step) => (
            <li
              key={`${step.index}-${step.type}-${step.collectionId ?? step.id ?? ''}`}
              className="learning-path-step"
            >
              <span className="learning-path-step__order" aria-hidden="true">
                {step.index + 1}
              </span>
              <div className="learning-path-step__body">
                <span className="learning-path-step__kind">{step.kindLabel}</span>
                <h3 className="learning-path-step__title">{step.title}</h3>
                <p className="learning-path-step__hint">{step.hint}</p>
                <Link to={step.href} className="btn btn--primary btn--small">
                  {step.ctaLabel}
                </Link>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <footer className="learning-path-detail__footer">
        <Link to="/learning-paths" className="btn btn--secondary">
          All paths
        </Link>
        <Link to="/collections" className="btn btn--secondary">
          Browse collections
        </Link>
      </footer>
    </div>
  );
}
