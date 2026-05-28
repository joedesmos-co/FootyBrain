import { lazy, Suspense } from 'react';
import { Link } from 'react-router-dom';
import { DATASET_META } from '../data/datasetMeta';
import { SITE_NAME } from '../utils/brand';
import PageFallback from './PageFallback';
import HomeTrustStrip from './HomeTrustStrip';
import HomePillars from './HomePillars';

const HomePopularNow = lazy(() => import('./HomePopularNow'));
const HomeSpotlight = lazy(() => import('./HomeSpotlight'));
const HomeBelowFold = lazy(() => import('./HomeBelowFold'));

export default function Home() {
  const playerCount = DATASET_META.playerCount.toLocaleString();
  const quizReady = (DATASET_META.quizEligibleCount ?? 518).toLocaleString();

  return (
    <div className="home">
      <section className="hero hero--home hero--redesign">
        <div className="hero__content">
          <p className="hero__eyebrow">Free football quizzes · Premier League, La Liga, MLS &amp; World Cup</p>
          <h1 className="hero__title hero__title--seo">
            Learn football players &amp; clubs — then quiz yourself
          </h1>
          <p className="hero__brand-line">
            <span className="hero__brand-name">{SITE_NAME}</span>
            <span className="hero__brand-sep" aria-hidden="true">
              ·
            </span>
            <span>{playerCount} profiles · {quizReady} quiz-ready</span>
          </p>
          <p className="hero__subcopy hero__subcopy--lead">
            <strong>Learn</strong> squads and stats, <strong>quiz</strong> on names and club knowledge,{' '}
            <strong>discover</strong> leagues, national teams, and World Cup 2026 prep — no account required.
          </p>

          <div className="hero__actions hero__actions--stack">
            <Link to="/quiz" className="btn btn--primary btn--large hero__cta-primary">
              Play player quiz
            </Link>
            <Link to="/club-quiz" className="btn btn--secondary btn--large hero__cta-secondary">
              Club football quiz
            </Link>
            <div className="hero__actions-row hero__actions-row--priority">
              <Link to="/daily" className="btn btn--secondary">
                Daily challenge
              </Link>
              <Link to="/browse" className="btn btn--secondary">
                Browse players
              </Link>
            </div>
          </div>

          <HomeTrustStrip />

          <dl className="hero__stats" aria-label="FootyCompass dataset scale">
            <div>
              <dt>{playerCount}</dt>
              <dd>Players</dd>
            </div>
            <div>
              <dt>{DATASET_META.teamCount}</dt>
              <dd>Clubs</dd>
            </div>
            <div>
              <dt>{DATASET_META.leagueCount}</dt>
              <dd>Leagues</dd>
            </div>
          </dl>
        </div>

        <div className="hero-visual" aria-hidden="true">
          <div className="hero-visual__pitch">
            <span className="hero-visual__line hero-visual__line--half" />
            <span className="hero-visual__line hero-visual__line--box" />
            <article className="floating-card floating-card--primary">
              <span className="floating-card__label">Player quiz</span>
              <strong>Guess from hints</strong>
              <span>Club · nation · role</span>
            </article>
            <article className="floating-card floating-card--club">
              <span className="floating-card__label">Club quiz</span>
              <strong>Stadiums &amp; rivals</strong>
              <span>League · history</span>
            </article>
            <article className="floating-card floating-card--quiz">
              <span className="floating-card__label">Daily</span>
              <strong>5 questions</strong>
              <span>Streak · XP</span>
            </article>
            <div className="squad-tile squad-tile--one" />
            <div className="squad-tile squad-tile--two" />
            <div className="squad-tile squad-tile--three" />
          </div>
        </div>
      </section>

      <HomePillars />

      <Suspense fallback={<PageFallback label="Loading popular picks…" />}>
        <HomePopularNow />
      </Suspense>

      <Suspense fallback={<PageFallback label="Loading featured spotlight…" />}>
        <HomeSpotlight />
      </Suspense>

      <Suspense fallback={<PageFallback label="Loading explore sections…" />}>
        <HomeBelowFold />
      </Suspense>
    </div>
  );
}
