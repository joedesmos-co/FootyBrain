import { useEffect, useMemo } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { leagues, teams } from '../data/sampleData';
import { DATASET_META } from '../data/datasetMeta';
import {
  CLUB_QUIZ_CATEGORY_CATALOG,
  CLUB_QUIZ_MVP_CATEGORY_IDS,
  getClubQuizCategoryById,
  getClubQuizPlayHref,
} from '../data/clubQuizCategories';
import { CLUB_QUIZ_MIN_POOL, countClubQuizPool } from '../utils/clubQuizEngine';
import { canonicalUrlForPath, pageTitle } from '../utils/brand';
import { applyPageSeo, truncateMetaDescription } from '../utils/seoCtr.js';
import BreadcrumbNav from './BreadcrumbNav';

function useClubQuizLandingSeo({ title, description, canonical, faqs }) {
  useEffect(() => {
    applyPageSeo({
      title,
      description,
      canonicalUrl: canonical,
      robots: 'index,follow',
      faqs,
      webPageName: title,
    });
  }, [title, description, canonical, faqs]);
}

export function SeoClubQuizzesHub() {
  const { pathname } = useLocation();
  const canonical = canonicalUrlForPath(pathname);
  const title = pageTitle('Club football quizzes');
  const description = truncateMetaDescription(
    'Club knowledge quizzes: stadiums, leagues, rivalries, history, kits, and legends. Multiple choice or typing — free on FootyCompass.',
  );

  const counts = useMemo(() => {
    const out = {};
    for (const cat of CLUB_QUIZ_CATEGORY_CATALOG) {
      out[cat.id] = countClubQuizPool(teams, cat.id);
    }
    return out;
  }, []);

  useClubQuizLandingSeo({
    title,
    description,
    canonical,
    faqs: [
      {
        question: 'What is a club quiz on FootyCompass?',
        answer:
          'Club quizzes test stadiums, leagues, countries, rivalries, history, and kit cues — not player names from hints.',
      },
      {
        question: 'Which club quiz formats are available first?',
        answer: `MVP formats with the largest pools: ${CLUB_QUIZ_MVP_CATEGORY_IDS.map((id) => getClubQuizCategoryById(id)?.label).filter(Boolean).join(', ')}.`,
      },
      {
        question: 'Is club quiz data live?',
        answer: `Questions draw on club profiles and squads (last updated ${DATASET_META.dataAsOf}).`,
      },
    ],
  });

  return (
    <div className="page collections-page">
      <BreadcrumbNav
        items={[
          { label: 'Home', to: '/' },
          { label: 'Explore', to: '/hubs' },
          { label: 'Quizzes', to: '/hubs/quizzes' },
          { label: 'Club quizzes' },
        ]}
      />
      <header className="page-header">
        <h1>Club football quizzes</h1>
        <p className="page-header__lead">{description}</p>
        <p className="page-header__meta">Last updated: {DATASET_META.dataAsOf}</p>
        <div className="page-header__actions">
          <Link to="/club-quiz" className="btn btn--primary">
            Play club quiz
          </Link>
          <Link to="/quiz" className="btn btn--secondary">
            Player quizzes
          </Link>
        </div>
      </header>

      <section className="collections-page__section">
        <h2>Recommended MVP formats</h2>
        <p className="collections-page__section-desc">
          Start with stadium, league, rivalry, and country quizzes — highest pool depth and clearest
          learning loops.
        </p>
        <div className="club-quiz-hub__grid">
          {CLUB_QUIZ_CATEGORY_CATALOG.map((cat) => {
            const count = counts[cat.id] ?? 0;
            const viable = count >= CLUB_QUIZ_MIN_POOL;
            return (
              <article
                key={cat.id}
                className={`club-quiz-hub__card${cat.mvpTier === 1 ? ' club-quiz-hub__card--mvp' : ''}`}
              >
                <span className="club-quiz-hub__icon" aria-hidden="true">
                  {cat.icon}
                </span>
                <h3>
                  <Link to={`/hubs/quizzes/clubs/${cat.id}`}>{cat.label}</Link>
                </h3>
                <p>{cat.description}</p>
                <p className="club-quiz-hub__meta">
                  {viable ? `${count} clubs in pool` : 'Limited data — try another format'}
                  {cat.mvpTier === 1 ? ' · MVP' : ''}
                </p>
                {viable ? (
                  <Link to={getClubQuizPlayHref(cat.id)} className="btn btn--primary btn--small">
                    Play now
                  </Link>
                ) : (
                  <Link to={`/hubs/quizzes/clubs/${cat.id}`} className="btn btn--secondary btn--small">
                    Learn more
                  </Link>
                )}
              </article>
            );
          })}
        </div>
      </section>

      <section className="collections-page__section">
        <h2>By league</h2>
        <p className="collections-page__section-desc">
          Narrow club quizzes to one league for focused revision.
        </p>
        <ul className="hub-link-list">
          {leagues
            .filter((l) => l.id !== 'external')
            .map((league) => (
              <li key={league.id}>
                <Link to={`/club-quiz?category=stadium&league=${league.id}`}>
                  Stadium quiz · {league.name}
                </Link>
              </li>
            ))}
        </ul>
      </section>
    </div>
  );
}

export function SeoClubQuizCategoryHub() {
  const { categoryId } = useParams();
  const { pathname } = useLocation();
  const category = getClubQuizCategoryById(categoryId);
  const canonical = canonicalUrlForPath(pathname);

  const poolSize = category ? countClubQuizPool(teams, category.id) : 0;
  const viable = poolSize >= CLUB_QUIZ_MIN_POOL;

  const title = category
    ? pageTitle(category.seoTitle)
    : pageTitle('Club quiz');
  const description = category?.seoDescription ?? 'Club football quiz on FootyCompass.';

  useClubQuizLandingSeo({
    title,
    description,
    canonical,
    faqs: category
      ? [
          {
            question: `How does the ${category.label} quiz work?`,
            answer: category.description,
          },
          {
            question: 'How many clubs are in the pool?',
            answer: viable
              ? `About ${poolSize} clubs qualify for this format.`
              : `Fewer than ${CLUB_QUIZ_MIN_POOL} clubs qualify — try stadium, league, or country quizzes instead.`,
          },
          {
            question: 'Is this the same as the player quiz?',
            answer:
              'No. Player quizzes use hints about individuals. Club quizzes use stadium, rivals, history, and kit facts from club profiles.',
          },
        ]
      : [],
  });

  if (!category) {
    return (
      <div className="page">
        <p>Unknown club quiz category.</p>
        <Link to="/hubs/quizzes/clubs">Back to club quizzes</Link>
      </div>
    );
  }

  return (
    <div className="page collections-page">
      <BreadcrumbNav
        items={[
          { label: 'Home', to: '/' },
          { label: 'Explore', to: '/hubs' },
          { label: 'Quizzes', to: '/hubs/quizzes' },
          { label: 'Club quizzes', to: '/hubs/quizzes/clubs' },
          { label: category.label },
        ]}
      />
      <header className="page-header">
        <h1>{category.label}</h1>
        <p className="page-header__lead">{category.description}</p>
        <p className="page-header__meta">
          Pool: {poolSize} clubs · Last updated {DATASET_META.dataAsOf}
        </p>
        <div className="page-header__actions">
          {viable ? (
            <Link to={getClubQuizPlayHref(category.id)} className="btn btn--primary">
              Play {category.label}
            </Link>
          ) : (
            <Link to="/club-quiz" className="btn btn--secondary">
              Browse other formats
            </Link>
          )}
          <Link to="/hubs/quizzes/clubs" className="btn btn--secondary">
            All club quizzes
          </Link>
        </div>
      </header>

      <section className="collections-page__section">
        <h2>Continue learning</h2>
        <ul className="hub-link-list">
          <li>
            <Link to="/teams">Browse clubs</Link>
          </li>
          <li>
            <Link to="/quiz">Player quizzes</Link>
          </li>
          <li>
            <Link to="/hubs/quizzes/themes">Themed player pools</Link>
          </li>
        </ul>
      </section>
    </div>
  );
}
