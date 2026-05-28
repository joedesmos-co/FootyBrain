import { Link } from 'react-router-dom';
import { DATASET_META } from '../data/datasetMeta';
import { SITE_NAME } from '../utils/brand';
import BreadcrumbNav from './BreadcrumbNav';

export default function EditorialPolicyPage() {
  return (
    <div className="page">
      <BreadcrumbNav items={[{ label: 'Home', to: '/' }, { label: 'Editorial policy' }]} />
      <header className="page-header">
        <p className="page-header__eyebrow">Transparency</p>
        <h1>Editorial policy &amp; data sources</h1>
        <p>
          This page explains what data {SITE_NAME} uses, how editorial content is created, and how to
          request corrections.
        </p>
      </header>

      <section className="privacy-page__section" aria-labelledby="ed-sources-title">
        <h2 id="ed-sources-title">Data sources (snapshot)</h2>
        <p>
          {SITE_NAME} ships with a <strong>static snapshot</strong> of player/club/league/national-team
          data bundled with the app. Current dataset snapshot: <strong>{DATASET_META.dataAsOf}</strong>.
        </p>
        <p>
          We do not claim official rights-holder status and the app is not a live transfer feed.
          Names and facts may drift over time as squads and clubs change.
        </p>
      </section>

      <section className="privacy-page__section" aria-labelledby="ed-originality-title">
        <h2 id="ed-originality-title">What is original content?</h2>
        <p>
          Many parts of {SITE_NAME} are editorial: quiz hints, quick facts, learning paths, curated
          collections, “fan guide” summaries, and discovery hubs. These are written to help users learn
          and recognize players—not to replicate a stats database.
        </p>
      </section>

      <section className="privacy-page__section" aria-labelledby="ed-quality-title">
        <h2 id="ed-quality-title">Quality standards</h2>
        <ul className="tag-list" aria-label="Quality standards">
          <li>Prefer clear, user-focused descriptions over jargon</li>
          <li>Avoid unsafe claims (e.g. live injuries/transfers) unless in the snapshot</li>
          <li>Keep quizzes fair (no trick duplicates where possible)</li>
          <li>Be transparent about what is verified vs. “prep mode”</li>
        </ul>
      </section>

      <section className="privacy-page__section" aria-labelledby="ed-corrections-title">
        <h2 id="ed-corrections-title">Corrections</h2>
        <p>
          If you spot an error (wrong club, nationality, hint, or duplicate), email{' '}
          <a href="mailto:joedesmos.co@gmail.com">joedesmos.co@gmail.com</a> with:
        </p>
        <ul className="tag-list" aria-label="Correction request fields">
          <li>Link to the page (player/club/league)</li>
          <li>What looks wrong</li>
          <li>What it should be</li>
          <li>Optional: source link(s) or evidence</li>
        </ul>
      </section>

      <section className="privacy-page__section" aria-labelledby="ed-identity-title">
        <h2 id="ed-identity-title">Who we are</h2>
        <p>
          {SITE_NAME} is maintained by an independent builder and is intended as a learning and
          discovery experience. If you have partnership or press questions, use{' '}
          <a href="mailto:joedesmos.co@gmail.com">joedesmos.co@gmail.com</a>.
        </p>
      </section>

      <section className="privacy-page__section" aria-labelledby="ed-ads-title">
        <h2 id="ed-ads-title">Advertising &amp; monetization</h2>
        <p>
          If ads are shown, they may be served via Google AdSense. See the{' '}
          <Link to="/privacy">Privacy Policy</Link> for cookies, personalization, and data handling.
        </p>
      </section>
    </div>
  );
}

