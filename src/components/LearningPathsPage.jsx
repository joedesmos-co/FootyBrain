import { Link } from 'react-router-dom';
import {
  getCountryLearningPaths,
  getWorldCupLearningPaths,
  learningPaths,
} from '../data/learningPathsData';
import LearningPathCard from './LearningPathCard';

export default function LearningPathsPage() {
  const worldCupPaths = getWorldCupLearningPaths();
  const countryPaths = getCountryLearningPaths();
  const generalPaths = learningPaths.filter(
    (path) => !path.tags?.includes('World Cup') && !path.tags?.includes('National teams'),
  );

  return (
    <div className="learning-paths-page">
      <header className="page-header">
        <p className="page-header__eyebrow">Study flows</p>
        <h1>Learning paths</h1>
        <p>
          Short, ordered routes through the database—each path chains a collection, profile
          pages, and a quiz. No accounts required.
        </p>
        <p className="learning-paths-page__back">
          <Link to="/collections">← All collections</Link>
        </p>
      </header>

      <section className="learning-paths-page__section" aria-labelledby="wc-paths-heading">
        <h2 id="wc-paths-heading" className="collections-section-title">
          World Cup prep
        </h2>
        <p className="learning-paths-page__section-desc">
          2026 contender routes using live national-team pages and linked quiz pools.
        </p>
        <ul className="learning-paths-grid">
          {worldCupPaths.map((path) => (
            <li key={path.id}>
              <LearningPathCard path={path} />
            </li>
          ))}
        </ul>
      </section>

      <section className="learning-paths-page__section" aria-labelledby="country-paths-heading">
        <h2 id="country-paths-heading" className="collections-section-title">
          Country paths
        </h2>
        <ul className="learning-paths-grid">
          {countryPaths.map((path) => (
            <li key={path.id}>
              <LearningPathCard path={path} />
            </li>
          ))}
        </ul>
      </section>

      <section className="learning-paths-page__section" aria-labelledby="general-paths-heading">
        <h2 id="general-paths-heading" className="collections-section-title">
          Club &amp; league paths
        </h2>
        <ul className="learning-paths-grid">
          {generalPaths.map((path) => (
            <li key={path.id}>
              <LearningPathCard path={path} />
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
