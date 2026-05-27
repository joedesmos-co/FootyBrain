import { Link } from 'react-router-dom';
import { DATASET_META } from '../data/datasetMeta';

export default function PrivacyPage() {
  return (
    <div className="page privacy-page">
      <header className="page-header">
        <p className="page-header__eyebrow">Friends &amp; Family beta</p>
        <h1>Privacy</h1>
        <p>
          FootyBrain is a frontend-only learning app. This page explains how data is handled today
          — before accounts, Firebase, or live soccer APIs are added.
        </p>
      </header>

      <section className="privacy-page__section">
        <h2>Football data</h2>
        <p>
          Player, club, league, and national-team information ships as a <strong>static snapshot</strong>{' '}
          bundled with the app (as of {DATASET_META.dataAsOf}). It is not a live transfer feed or
          official rights-holder database.
        </p>
        <p>
          Player photos use licensed or placeholder visuals only where available. Many cards show
          silhouettes or initials until editorial image assets are added.
        </p>
      </section>

      <section className="privacy-page__section">
        <h2>No accounts</h2>
        <p>
          There is <strong>no sign-in</strong>, no Firebase authentication, and no server-side
          profile for you yet. FootyBrain does not collect your name, email, or password on this
          beta build.
        </p>
      </section>

      <section className="privacy-page__section">
        <h2>Data on your device</h2>
        <p>
          Quiz XP, daily challenge progress, favorites, preferences, and recently viewed items may
          be stored in your browser&apos;s <strong>local storage</strong> so they persist between
          visits on the same device and browser.
        </p>
        <p>
          That information stays on your device. It is <strong>not sold</strong> and not synced to
          FootyBrain servers in this beta (there is no backend sync yet).
        </p>
        <p>
          Clearing site data in your browser removes saved progress. Private or blocked storage may
          limit what can be saved.
        </p>
      </section>

      <section className="privacy-page__section">
        <h2>Analytics and third parties</h2>
        <p>
          This beta does not include advertising trackers or product analytics SDKs in the app shell.
          If you open external links, those sites have their own policies.
        </p>
      </section>

      <section className="privacy-page__section">
        <h2>Questions</h2>
        <p>
          For Friends &amp; Family testers: ask the person who shared the beta link. A fuller
          privacy policy may be published before a wider public launch.
        </p>
      </section>

      <div className="empty-state__actions">
        <Link to="/" className="btn btn--primary">
          Home
        </Link>
        <Link to="/onboarding" className="btn btn--secondary">
          How it works
        </Link>
      </div>
    </div>
  );
}
