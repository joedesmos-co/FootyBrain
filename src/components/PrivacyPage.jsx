import { Link } from 'react-router-dom';
import { DATASET_META } from '../data/datasetMeta';

export default function PrivacyPage() {
  return (
    <div className="page privacy-page">
      <header className="page-header">
        <p className="page-header__eyebrow">Privacy Policy</p>
        <h1>Privacy Policy</h1>
        <p>
          FootyBrain is a frontend-only learning app. This page explains how data is handled today,
          including how we plan to approach analytics and future advertising (AdSense) in a
          privacy-respecting way.
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
          silhouettes or initials until official player photos are added.
        </p>
      </section>

      <section className="privacy-page__section">
        <h2>User data</h2>
        <p>
          There is <strong>no sign-in</strong> today, and FootyBrain does not ask you for personal
          information like your name, email, or password to use the app.
        </p>
        <p>
          Your quiz XP, daily challenge progress, favorites, preferences, and recently viewed pages
          may be stored in your browser&apos;s <strong>local storage</strong> so they persist on the
          same device and browser.
        </p>
        <p>
          This data stays on your device. It is <strong>not sold</strong> and not synced to
          FootyBrain servers in the current version.
        </p>
      </section>

      <section className="privacy-page__section">
        <h2>Cookies</h2>
        <p>
          FootyBrain itself does not need cookies for core functionality. Your browser may still
          store site data (such as local storage) to remember your progress.
        </p>
        <p>
          If we add analytics or advertising in the future, those services may use cookies or
          similar technologies to measure performance, prevent fraud, and (where enabled) personalize
          ads.
        </p>
        <p>
          You can usually control cookies and site storage via your browser settings. Clearing site
          data may remove saved progress on that device.
        </p>
      </section>

      <section className="privacy-page__section">
        <h2>Analytics and third parties</h2>
        <p>
          Today, FootyBrain aims to keep the app shell lightweight and does not bundle third-party
          advertising SDKs or heavy analytics trackers by default.
        </p>
        <p>
          If we enable privacy-conscious analytics in the future, it would be used to understand
          basic usage (like which pages are popular) so we can improve the experience and reliability.
        </p>
        <p>
          If you open external links, those sites have their own privacy policies.
        </p>
      </section>

      <section className="privacy-page__section">
        <h2>Advertising (AdSense readiness)</h2>
        <p>
          FootyBrain does not show ads today, and we do not include ad units in the app right now.
        </p>
        <p>
          If we integrate Google AdSense in the future, AdSense may collect information such as your
          IP address, browser/device details, and interactions with ads to serve, measure, and
          protect advertising. AdSense may also use cookies or similar identifiers.
        </p>
        <p>
          Where possible, we’ll prefer simpler, non-invasive setups and clear choices. You can learn
          more about Google’s advertising policies and controls in Google’s documentation.
        </p>
      </section>

      <section className="privacy-page__section">
        <h2>Contact</h2>
        <p>
          Questions or concerns? Email <a href="mailto:joedesmos.co@gmail.com">joedesmos.co@gmail.com</a>.
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
