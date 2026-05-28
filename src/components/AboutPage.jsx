import { Link } from 'react-router-dom';
import { DATASET_META } from '../data/datasetMeta';
import { SITE_NAME, SITE_TAGLINE } from '../utils/brand';
import BreadcrumbNav from './BreadcrumbNav';

export default function AboutPage() {
  return (
    <div className="page">
      <BreadcrumbNav items={[{ label: 'Home', to: '/' }, { label: 'About' }]} />
      <header className="page-header">
        <p className="page-header__eyebrow">About</p>
        <h1>About {SITE_NAME}</h1>
        <p>
          {SITE_NAME} is a football discovery and learning platform. It’s built to help you explore
          players, clubs, leagues, and national teams—and then test what you learned with quizzes.
        </p>
      </header>

      <section className="privacy-page__section" aria-labelledby="about-why-title">
        <h2 id="about-why-title">Why it exists</h2>
        <p>
          Football sites are great for news, stats, and fixtures. {SITE_NAME} is different: it’s for{' '}
          <strong>recognition and context</strong>—learning names, squads, rivalries, and “who plays
          where” fast, then reinforcing it with quizzes.
        </p>
        <p>
          Tagline: <strong>{SITE_TAGLINE}</strong>
        </p>
      </section>

      <section className="privacy-page__section" aria-labelledby="about-what-title">
        <h2 id="about-what-title">What you can do</h2>
        <ul className="tag-list" aria-label="Key actions">
          <li>Browse player profiles</li>
          <li>Explore club and league pages</li>
          <li>Study collections and learning paths</li>
          <li>Play quizzes by league, club, or nation</li>
          <li>Use daily challenges to build streaks</li>
        </ul>
        <div className="empty-state__actions">
          <Link to="/quiz" className="btn btn--primary">
            Play quizzes
          </Link>
          <Link to="/browse" className="btn btn--secondary">
            Browse players
          </Link>
          <Link to="/hubs" className="btn btn--secondary">
            Explore hubs
          </Link>
        </div>
      </section>

      <section className="privacy-page__section" aria-labelledby="about-data-title">
        <h2 id="about-data-title">Data and freshness</h2>
        <p>
          The app ships with a static snapshot of football data. Current dataset: <strong>as of {DATASET_META.dataAsOf}</strong>.
          It is not a live transfer feed.
        </p>
        <p>
          For how data is sourced and how editorial content is created, see{' '}
          <Link to="/editorial">Editorial policy &amp; data sources</Link>.
        </p>
      </section>

      <section className="privacy-page__section" aria-labelledby="about-trust-title">
        <h2 id="about-trust-title">Trust and transparency</h2>
        <p>
          <strong>Site owner</strong>: FootyCompass (independent football learning project). This is a
          product site, not an official club/league property.
        </p>
        <p>
          No accounts are required. Progress and favorites stay on your device by default. Read the{' '}
          <Link to="/privacy">Privacy Policy</Link> for details.
        </p>
        <p>
          If you spot an error or want a correction, email{' '}
          <a href="mailto:joedesmos.co@gmail.com">joedesmos.co@gmail.com</a>.
        </p>
      </section>
    </div>
  );
}

