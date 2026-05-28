import { lazy, Suspense } from 'react';
import { Link } from 'react-router-dom';
import { DATASET_META } from '../data/datasetMeta';
import { SITE_DESCRIPTION_SHORT, SITE_NAME, SITE_TAGLINE } from '../utils/brand';
import PageFallback from './PageFallback';
import HomeStartHere from './HomeStartHere';

const HomeSpotlight = lazy(() => import('./HomeSpotlight'));
const HomeBelowFold = lazy(() => import('./HomeBelowFold'));

export default function Home() {
  return (
    <div className="home">
      <section className="hero hero--home">
        <div className="hero__content">
          <p className="hero__eyebrow">Football players · clubs · leagues · quizzes</p>
          <h1 className="hero__title">{SITE_NAME}</h1>
          <p className="hero__tagline">{SITE_TAGLINE}</p>
          <p className="hero__subcopy">
            {SITE_DESCRIPTION_SHORT} Search by name, jump into a club or league, then test yourself with
            player quizzes.
          </p>
          <div className="hero__actions">
            <Link to="/quiz" className="btn btn--primary btn--large hero__cta-primary">
              Play a player quiz
            </Link>
            <div className="hero__actions-row">
              <Link to="/browse" className="btn btn--secondary">
                Browse players
              </Link>
              <Link to="/hubs" className="btn btn--secondary">
                Explore hubs
              </Link>
            </div>
          </div>
          <dl className="hero__stats" aria-label="FootyCompass at a glance">
            <div>
              <dt>{DATASET_META.playerCount}</dt>
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
          <div className="hero__proof" aria-label="Social proof">
            <p className="hero__proof-line">
              Built for fast discovery: profiles + quizzes + collections. No accounts.
            </p>
            <p className="hero__proof-note">
              Social proof placeholder: “Loved by football nerds” · “Great for learning squads”
            </p>
          </div>
        </div>

        <div className="hero-visual" aria-hidden="true">
          <div className="hero-visual__pitch">
            <span className="hero-visual__line hero-visual__line--half" />
            <span className="hero-visual__line hero-visual__line--box" />
            <article className="floating-card floating-card--primary">
              <span className="floating-card__label">Player</span>
              <strong>Guess from hints</strong>
              <span>Club · nation · role</span>
            </article>
            <article className="floating-card floating-card--club">
              <span className="floating-card__label">Club</span>
              <strong>Squad &amp; rivals</strong>
              <span>Legends · history</span>
            </article>
            <article className="floating-card floating-card--quiz">
              <span className="floating-card__label">Quiz</span>
              <strong>Career path</strong>
              <span>Who am I? · classic</span>
            </article>
            <div className="squad-tile squad-tile--one" />
            <div className="squad-tile squad-tile--two" />
            <div className="squad-tile squad-tile--three" />
          </div>
        </div>
      </section>

      <HomeStartHere />

      <Suspense fallback={<PageFallback label="Loading featured picks…" />}>
        <HomeSpotlight />
      </Suspense>

      <Suspense fallback={<PageFallback label="Loading explore sections…" />}>
        <HomeBelowFold />
      </Suspense>
    </div>
  );
}
