import { Link } from 'react-router-dom';
import {
  collections,
  getAdvancedFootballCollections,
  getNationalTeamLearningCollections,
  getWorldCupCollections,
} from '../data/collectionsData';
import { getWorldCupLearningPaths, learningPaths } from '../data/learningPathsData';
import { useCollectionProgress } from '../hooks/useCollectionProgress';
import CollectionCard from './CollectionCard';
import LearningPathCard from './LearningPathCard';
import BreadcrumbNav from './BreadcrumbNav';

export default function CollectionsPage() {
  const { getProgress } = useCollectionProgress();
  const nationalTeamLearningCollections = getNationalTeamLearningCollections();
  const nationalTeamLearningIds = new Set(nationalTeamLearningCollections.map((c) => c.id));
  const worldCupCollections = getWorldCupCollections().filter(
    (c) => c.id !== 'world-cup-stars' && !nationalTeamLearningIds.has(c.id),
  );
  const advancedCollections = getAdvancedFootballCollections();
  const worldCupPaths = getWorldCupLearningPaths();
  const featuredCollectionIds = new Set([
    ...worldCupCollections.map((c) => c.id),
    ...nationalTeamLearningCollections.map((c) => c.id),
    ...advancedCollections.map((c) => c.id),
  ]);
  const otherCollections = collections.filter((c) => !featuredCollectionIds.has(c.id));

  return (
    <div className="collections-page">
      <BreadcrumbNav
        items={[
          { label: 'Home', to: '/' },
          { label: 'Collections & paths' },
        ]}
      />
      <header className="page-header">
        <p className="page-header__eyebrow">Study tools</p>
        <h1>Collections & paths</h1>
        <p>
          <strong>Learning paths</strong> chain a collection, profile pages, and a quiz.
          <strong> Collections</strong> are standalone study lists you can complete in any order.
        </p>
      </header>

      <section className="collections-page__section" aria-labelledby="world-cup-prep-heading">
        <div className="collections-page__section-head">
          <h2 id="world-cup-prep-heading" className="collections-section-title">
            World Cup prep
          </h2>
          <Link to="/world-cup" className="collections-page__section-link">
            World Cup hub
          </Link>
          <Link to="/national-teams" className="collections-page__section-link">
            National teams
          </Link>
        </div>
        <p className="collections-page__section-desc">
          2026 study lists and country paths—built from live squads and featured players.
        </p>
        <ul className="learning-paths-grid learning-paths-grid--compact">
          {worldCupPaths.map((path) => (
            <li key={path.id}>
              <LearningPathCard path={path} />
            </li>
          ))}
        </ul>
        <h3 className="collections-subsection-title">National team learning</h3>
        <p className="collections-page__section-desc">
          Curated international lists — legends, golden generations, captains, midfielders, and
          tournament stars. Open profiles, compare players, then finish with the linked national-team
          quiz.
        </p>
        <ul className="collections-grid collections-grid--compact">
          {nationalTeamLearningCollections.map((collection) => (
            <li key={collection.id}>
              <CollectionCard
                collection={collection}
                progress={getProgress(collection.id, collection.items.length)}
              />
            </li>
          ))}
        </ul>
        <h3 className="collections-subsection-title">More World Cup prep</h3>
        <ul className="collections-grid collections-grid--compact">
          {worldCupCollections.map((collection) => (
            <li key={collection.id}>
              <CollectionCard
                collection={collection}
                progress={getProgress(collection.id, collection.items.length)}
              />
            </li>
          ))}
        </ul>
      </section>

      <section className="collections-page__section" aria-labelledby="advanced-football-heading">
        <h2 id="advanced-football-heading" className="collections-section-title">
          Advanced football roles
        </h2>
        <p className="collections-page__section-desc">
          Curated tactical lists — press-resistant mids, playmakers, modern full-backs, and more.
          Study each player, save favorites, compare from <Link to="/compare">Compare</Link>, then
          take the linked quiz.
        </p>
        <ul className="collections-grid collections-grid--compact">
          {advancedCollections.map((collection) => (
            <li key={collection.id}>
              <CollectionCard
                collection={collection}
                progress={getProgress(collection.id, collection.items.length)}
              />
            </li>
          ))}
        </ul>
      </section>

      <section className="collections-page__section" aria-labelledby="learning-paths-heading">
        <div className="collections-page__section-head">
          <h2 id="learning-paths-heading" className="collections-section-title">
            All learning paths
          </h2>
          <Link to="/learning-paths" className="collections-page__section-link">
            View all paths
          </Link>
        </div>
        <ul className="learning-paths-grid learning-paths-grid--compact">
          {learningPaths.map((path) => (
            <li key={path.id}>
              <LearningPathCard path={path} />
            </li>
          ))}
        </ul>
      </section>

      <section className="collections-page__section" aria-labelledby="all-collections-heading">
        <h2 id="all-collections-heading" className="collections-section-title">
          All collections
        </h2>
        <ul className="collections-grid">
          {otherCollections.map((collection) => (
            <li key={collection.id}>
              <CollectionCard
                collection={collection}
                progress={getProgress(collection.id, collection.items.length)}
              />
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
