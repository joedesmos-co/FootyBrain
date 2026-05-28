import { useMemo } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { players, teams } from '../data/sampleData';
import {
  QUIZ_THEME_CATALOG,
  QUIZ_THEME_CATEGORIES,
  getQuizThemeById,
  getQuizThemePlayHref,
} from '../data/quizThemes';
import { DATASET_META } from '../data/datasetMeta';
import { canonicalUrlForPath, pageTitle } from '../utils/brand';
import { buildThemedQuizPool } from '../utils/quizThemePools';
import { QUIZ_MIN_SESSION_POOL } from '../utils/quizSession';
import BreadcrumbNav from './BreadcrumbNav';
import { useEffect } from 'react';
import { applyPageSeo, truncateMetaDescription } from '../utils/seoCtr.js';

function useThemeLandingSeo({ title, description, canonical, faqs, itemList }) {
  useEffect(() => {
    applyPageSeo({
      title,
      description,
      canonicalUrl: canonical,
      robots: 'index,follow',
      faqs,
      itemList,
      webPageName: title,
    });
  }, [title, description, canonical, faqs, itemList]);
}

export function SeoQuizThemesHub() {
  const { pathname } = useLocation();
  const canonical = canonicalUrlForPath(pathname);
  const title = pageTitle('Themed football quizzes');
  const description = truncateMetaDescription(
    'Themed football player quizzes: wonderkids, legends, Premier League stars, World Cup squads, and more. See pool sizes and play free on FootyCompass.',
  );

  const poolContext = useMemo(() => ({ teams }), []);
  const counts = useMemo(() => {
    const out = {};
    for (const theme of QUIZ_THEME_CATALOG) {
      out[theme.id] = buildThemedQuizPool(players, theme.id, poolContext).length;
    }
    return out;
  }, [poolContext]);

  useThemeLandingSeo({
    title,
    description,
    canonical,
    faqs: [
      {
        question: 'What is a themed quiz on FootyCompass?',
        answer:
          'A themed quiz uses a curated pool of quiz-ready players (with hints) around a topic—like wonderkids, legends, or a specific league.',
      },
      {
        question: 'Do themed quizzes use live data?',
        answer: `Pools are built from the FootyCompass dataset snapshot (${DATASET_META.dataAsOf}), not live match feeds.`,
      },
    ],
  });

  return (
    <div className="page collections-page">
      <BreadcrumbNav
        items={[
          { label: 'Home', to: '/' },
          { label: 'Explore', to: '/hubs' },
          { label: 'Themed quizzes' },
        ]}
      />
      <header className="page-header">
        <p className="page-header__eyebrow">Quizzes</p>
        <h1>Themed football quizzes</h1>
        <p>
          Pick a topic, set difficulty, and play. Each theme uses quiz-ready players with real
          hints—no random obscure filler when the pool is too small.
        </p>
        <p className="page-header__meta">
          Last updated: <strong>{DATASET_META.dataAsOf}</strong>
        </p>
      </header>

      {QUIZ_THEME_CATEGORIES.map((category) => (
        <section key={category.id} className="collections-page__section" aria-label={category.label}>
          <h2 className="collections-section-title">{category.label}</h2>
          <ul className="card-grid quiz-theme-grid" aria-label={category.label}>
            {QUIZ_THEME_CATALOG.filter((t) => t.category === category.id).map((theme) => {
              const count = counts[theme.id] ?? 0;
              const viable = count >= QUIZ_MIN_SESSION_POOL;
              return (
                <li key={theme.id} className="player-card quiz-theme-card">
                  <span className="quiz-theme-card__icon" aria-hidden="true">
                    {theme.icon}
                  </span>
                  <h3>{theme.label}</h3>
                  <p>{theme.description}</p>
                  <p className="quiz-theme-card__meta">
                    {viable ? `${count} quiz-ready players` : `${count} players — needs more clues`}
                  </p>
                  <div className="quiz-theme-card__actions">
                    <Link
                      to={`/hubs/quizzes/theme/${theme.id}`}
                      className="btn btn--secondary btn--small"
                    >
                      Theme guide
                    </Link>
                    {viable ? (
                      <Link
                        to={getQuizThemePlayHref(theme.id)}
                        className="btn btn--primary btn--small"
                      >
                        Play now
                      </Link>
                    ) : (
                      <Link to="/quiz" className="btn btn--secondary btn--small">
                        Custom quiz
                      </Link>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </div>
  );
}

export function SeoQuizThemeHub() {
  const { themeId } = useParams();
  const theme = getQuizThemeById(themeId);
  const { pathname } = useLocation();
  const canonical = canonicalUrlForPath(pathname);

  const poolContext = useMemo(() => ({ teams }), []);
  const pool = useMemo(
    () => (theme ? buildThemedQuizPool(players, theme.id, poolContext) : []),
    [theme, poolContext],
  );
  const topPlayers = useMemo(() => pool.slice(0, 12), [pool]);

  const title = theme ? pageTitle(theme.seoTitle) : pageTitle('Themed quiz');
  const description = theme?.seoDescription ?? 'Themed football quiz on FootyCompass.';

  useThemeLandingSeo({
    title,
    description,
    canonical,
    faqs: theme
      ? [
          {
            question: `How do I play the ${theme.label} quiz?`,
            answer:
              'Open the play link to launch the quiz with this theme pre-selected. Adjust difficulty on the quiz page if you want a harder session.',
          },
          {
            question: 'Why is the player list capped?',
            answer:
              'Themes prioritize recognizable quiz-ready players so sessions stay fair and fun—not endless obscure names.',
          },
        ]
      : [],
  });

  if (!theme) {
    return (
      <div className="page">
        <BreadcrumbNav
          items={[
            { label: 'Home', to: '/' },
            { label: 'Explore', to: '/hubs' },
            { label: 'Themed quizzes', to: '/hubs/quizzes/themes' },
            { label: 'Not found' },
          ]}
        />
        <p className="empty-state">Theme not found.</p>
        <Link to="/hubs/quizzes/themes" className="btn btn--secondary">
          All themed quizzes
        </Link>
      </div>
    );
  }

  const viable = pool.length >= QUIZ_MIN_SESSION_POOL;

  return (
    <div className="page collections-page">
      <BreadcrumbNav
        items={[
          { label: 'Home', to: '/' },
          { label: 'Explore', to: '/hubs' },
          { label: 'Themed quizzes', to: '/hubs/quizzes/themes' },
          { label: theme.label },
        ]}
      />
      <header className="page-header">
        <p className="page-header__eyebrow">Themed quiz</p>
        <h1>{theme.label}</h1>
        <p>{theme.description}</p>
        <p className="page-header__meta">
          {viable
            ? `${pool.length} quiz-ready players · Last updated ${DATASET_META.dataAsOf}`
            : `Only ${pool.length} players in pool — try another theme or the main quiz`}
        </p>
      </header>

      <div className="empty-state__actions">
        {viable ? (
          <Link to={getQuizThemePlayHref(theme.id)} className="btn btn--primary">
            Play {theme.label} quiz
          </Link>
        ) : null}
        <Link to="/hubs/quizzes/themes" className="btn btn--secondary">
          All themes
        </Link>
        <Link to="/quiz" className="btn btn--secondary">
          Custom quiz setup
        </Link>
      </div>

      {topPlayers.length > 0 ? (
        <section className="collections-page__section" aria-labelledby="theme-players-title">
          <h2 id="theme-players-title" className="collections-section-title">
            Players in this pool
          </h2>
          <ul className="card-grid" aria-label="Sample players">
            {topPlayers.map((player) => (
              <li key={player.id} className="player-card">
                <h3>{player.name}</h3>
                <p>
                  {player.position} · importance {player.importanceScore}
                </p>
                <Link to={`/player/${player.id}`} className="btn btn--secondary btn--small">
                  Profile
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
