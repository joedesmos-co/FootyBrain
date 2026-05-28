import { Link } from 'react-router-dom';
import { DATASET_META } from '../data/datasetMeta';

export default function PrivacyPage() {
  return (
    <div className="page privacy-page">
      <header className="page-header">
        <p className="page-header__eyebrow">Privacy Policy</p>
        <h1>Privacy Policy</h1>
        <p>
          FootyCompass is a frontend-only football discovery app. This page explains what data is
          stored on your device, what we collect (if anything) when you browse, and how advertising
          and analytics work if enabled.
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
        <h2>User data (stored on your device)</h2>
        <p>
          There is <strong>no sign-in</strong> today, and FootyCompass does not ask you for personal
          information like your name, email, or password to use the app.
        </p>
        <p>
          Your quiz XP, daily challenge progress, favorites, preferences, and recently viewed pages
          may be stored in your browser&apos;s <strong>local storage</strong> (and in some cases{' '}
          <strong>session storage</strong>) so they persist on the same device and browser.
        </p>
        <p>
          This data stays on your device. It is <strong>not sold</strong> and not synced to
          FootyCompass servers in the current version.
        </p>
      </section>

      <section className="privacy-page__section">
        <h2>Cookies</h2>
        <p>
          FootyCompass itself does not need cookies for core functionality. Your browser may still
          store site data (such as local storage) to remember your progress.
        </p>
        <p>
          If we enable analytics or advertising, those services may use cookies or similar
          technologies to measure performance, prevent fraud, and (where enabled) personalize ads.
        </p>
        <p>
          You can usually control cookies and site storage via your browser settings. Clearing site
          data may remove saved progress on that device.
        </p>
      </section>

      <section className="privacy-page__section">
        <h2>Analytics and third parties</h2>
        <p>
          FootyCompass aims to keep the app shell lightweight. We do not require analytics for the
          core experience.
        </p>
        <p>
          If enabled, analytics may collect information such as page views, basic device/browser
          details, approximate location (e.g. country/region), and crash/performance metrics. We use
          this to understand what’s working and improve reliability.
        </p>
        <p>
          If you open external links, those sites have their own privacy policies.
        </p>
      </section>

      <section className="privacy-page__section">
        <h2>Advertising (Google AdSense)</h2>
        <p>
          FootyCompass may show ads via <strong>Google AdSense</strong>.
        </p>
        <p>
          Google may use cookies or similar identifiers to serve ads, including interest-based
          (personalized) advertising where allowed. Google may also use information such as your IP
          address, browser/device details, and interactions with ads to deliver, measure, and protect
          advertising.
        </p>
        <p>
          You can control ad personalization in Google’s settings and via your browser’s cookie
          controls. Where available, we aim to provide clear choices and keep the experience
          understandable.
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
