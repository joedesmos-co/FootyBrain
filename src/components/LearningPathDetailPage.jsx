import { useLayoutEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import BreadcrumbNav from './BreadcrumbNav';
import { getCollectionById } from '../data/collectionsData';
import { getLearningPathById } from '../data/learningPathsData';
import { getCollectionQuizHref } from '../utils/collections';
import { resolveLearningPathSteps } from '../utils/learningPaths';
import { canonicalUrlForPath } from '../utils/brand.js';
import { getCanonicalUrl } from '../utils/jsonLd';
import {
  applyEntityNotFoundSeo,
  applyPageSeo,
  truncateMetaDescription,
} from '../utils/seoCtr.js';

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

  useLayoutEffect(() => {
    if (!path || steps.length === 0) {
      applyEntityNotFoundSeo({
        label: 'Learning path',
        canonicalUrl: canonicalUrlForPath(`/learning-paths/${pathId}`),
      });
      return undefined;
    }
    const canonical = getCanonicalUrl();
    if (!canonical) return undefined;
    const homeUrl = canonical.replace(/\/learning-paths\/[^/]+$/, '/');
    const pathsUrl = `${homeUrl.replace(/\/$/, '')}/learning-paths`;
    const title = `${path.title} — guided football learning path · FootyCompass`;
    const description = truncateMetaDescription(
      path.description
        ? `${path.description} Follow ${steps.length} steps through profiles, collections, and a quiz on FootyCompass.`
        : `Guided football study path: ${steps.length} steps through profiles and quizzes on FootyCompass.`,
    );
    applyPageSeo({
      title,
      description,
      canonicalUrl: canonical,
      robots: 'index,follow',
      breadcrumbs: [
        { name: 'Home', item: homeUrl },
        { name: 'Learning paths', item: pathsUrl },
        { name: path.title, item: canonical },
      ],
    });
    return undefined;
  }, [path, pathId, steps.length]);

  if (!path || steps.length === 0) {
    return (
      <div className="learning-paths-page">
        <BreadcrumbNav
          items={[
            { label: 'Home', to: '/' },
            { label: 'Learning paths', to: '/learning-paths' },
            { label: 'Path not found' },
          ]}
        />
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
      <BreadcrumbNav
        items={[
          { label: 'Home', to: '/' },
          { label: 'Learning paths', to: '/learning-paths' },
          { label: path.title },
        ]}
      />

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
