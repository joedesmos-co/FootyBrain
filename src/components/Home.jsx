import { lazy, Suspense } from 'react';
import { Link } from 'react-router-dom';
import { DATASET_META } from '../data/datasetMeta';
import PageFallback from './PageFallback';

const HomeBelowFold = lazy(() => import('./HomeBelowFold'));

export default function Home() {
  return (
    <div className="home">
      <section className="hero">
        <div className="hero__content">
          <p className="hero__eyebrow">Men&apos;s football learning</p>
          <h1 className="hero__title">FootyBrain</h1>
          <p className="hero__tagline">Learn the game. Know the players.</p>
          <p className="hero__copy">
            Browse players and clubs, study curated collections, compare sides, and test yourself
            in quizzes—saved progress stays on this device.
          </p>
          <div className="hero__actions">
            <Link to="/browse" className="btn btn--primary btn--large">
              Open database
            </Link>
            <Link to="/onboarding" className="btn btn--secondary btn--large">
              How it works
            </Link>
          </div>
          <dl className="hero__stats" aria-label="FootyBrain sample data">
            <div>
              <dt>{DATASET_META.playerCount}</dt>
              <dd>Players</dd>
            </div>
            <div>
              <dt>{DATASET_META.teamCount}</dt>
              <dd>Teams</dd>
            </div>
            <div>
              <dt>{DATASET_META.leagueCount}</dt>
              <dd>Leagues</dd>
            </div>
          </dl>
          <p className="hero__data-note">
            Dataset snapshot {DATASET_META.dataAsOf} · {DATASET_META.quizEligibleCount} quiz-ready
          </p>
        </div>

        <div className="hero-visual" aria-hidden="true">
          <div className="hero-visual__pitch">
            <span className="hero-visual__line hero-visual__line--half" />
            <span className="hero-visual__line hero-visual__line--box" />
            <article className="floating-card floating-card--primary">
              <span className="floating-card__label">Player card</span>
              <strong>Bukayo Saka</strong>
              <span>RW · Arsenal · 92</span>
            </article>
            <article className="floating-card floating-card--club">
              <span className="floating-card__label">Club profile</span>
              <strong>Arsenal</strong>
              <span>Squad · League · History</span>
            </article>
            <article className="floating-card floating-card--quiz">
              <span className="floating-card__label">Quiz clue</span>
              <strong>Right winger</strong>
              <span>England · Premier League</span>
            </article>
            <div className="squad-tile squad-tile--one" />
            <div className="squad-tile squad-tile--two" />
            <div className="squad-tile squad-tile--three" />
          </div>
        </div>
      </section>

      <Suspense fallback={<PageFallback label="Loading league hubs…" />}>
        <HomeBelowFold />
      </Suspense>
    </div>
  );
}
