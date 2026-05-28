import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { DATASET_META } from '../data/datasetMeta';
import { canonicalUrlForPath, SITE_NAME } from '../utils/brand';
import { applyPageSeo } from '../utils/seoCtr.js';
import {
  mailtoContact,
  SITE_CONTACT_EMAIL,
  TRUST_PAGE_LAST_REVIEWED,
} from '../utils/siteTrust.js';
import BreadcrumbNav from './BreadcrumbNav';
import TrustPageChrome from './TrustPageChrome';

export default function PrivacyPage() {
  useEffect(() => {
    applyPageSeo({
      title: `Privacy policy · ${SITE_NAME}`,
      description: `Privacy policy for ${SITE_NAME}: local storage, cookies, Google AdSense, analytics, your choices, and how to contact us. Last reviewed ${TRUST_PAGE_LAST_REVIEWED}.`,
      canonicalUrl: canonicalUrlForPath('/privacy'),
      robots: 'index,follow',
    });
  }, []);

  return (
    <div className="page privacy-page">
      <BreadcrumbNav items={[{ label: 'Home', to: '/' }, { label: 'Privacy' }]} />
      <header className="page-header">
        <p className="page-header__eyebrow">Privacy Policy</p>
        <h1>Privacy Policy</h1>
        <p>
          {SITE_NAME} is a frontend football discovery and learning app. This policy explains what
          data is stored on your device, what third parties may process when you browse, and your
          choices—especially around advertising.
        </p>
        <p className="page-header__meta">
          Last reviewed: <time dateTime={TRUST_PAGE_LAST_REVIEWED}>{TRUST_PAGE_LAST_REVIEWED}</time>
        </p>
      </header>

      <TrustPageChrome showContact={false} />

      <section className="privacy-page__section" aria-labelledby="priv-data-title">
        <h2 id="priv-data-title">Football data on the site</h2>
        <p>
          Player, club, league, and national-team information ships as a <strong>static snapshot</strong>{' '}
          bundled with the app (as of {DATASET_META.dataAsOf}). It is not a live transfer feed or an
          official rights-holder database. See{' '}
          <Link to="/editorial">Editorial policy &amp; data sources</Link> for methodology.
        </p>
        <p>
          Player photos use licensed or placeholder visuals only where available. Many cards show
          silhouettes or initials until official player photos are added.
        </p>
      </section>

      <section className="privacy-page__section" aria-labelledby="priv-local-title">
        <h2 id="priv-local-title">Information we collect directly</h2>
        <p>
          There is <strong>no sign-in</strong> today. {SITE_NAME} does not ask for your name, email,
          or password to use core features.
        </p>
        <p>
          Quiz XP, daily challenge progress, favorites, preferences, and recently viewed pages may
          be stored in your browser&apos;s <strong>local storage</strong> (and sometimes{' '}
          <strong>session storage</strong>) on the same device. This data stays on your device and is
          not sold by {SITE_NAME} in the current version.
        </p>
      </section>

      <section className="privacy-page__section" aria-labelledby="priv-cookies-title">
        <h2 id="priv-cookies-title">Cookies &amp; similar technologies</h2>
        <p>
          Core browsing does not require cookies. Your browser may still store site data (local
          storage) to remember progress.
        </p>
        <p>
          If we enable analytics or advertising, those providers may set cookies or use similar
          identifiers to measure traffic, prevent fraud, and (where permitted) personalize ads.
        </p>
        <p>
          You can control cookies and site data in your browser settings. Clearing site data may
          reset saved progress on that device.
        </p>
      </section>

      <section className="privacy-page__section" aria-labelledby="priv-analytics-title">
        <h2 id="priv-analytics-title">Analytics</h2>
        <p>
          {SITE_NAME} aims to keep the app shell lightweight. Analytics, if enabled, may collect
          page views, basic device/browser information, approximate region, and performance metrics
          to improve reliability. We do not require analytics to play quizzes or browse profiles.
        </p>
        <p>External links you open are governed by those sites&apos; policies.</p>
      </section>

      <section className="privacy-page__section" aria-labelledby="priv-ads-title">
        <h2 id="priv-ads-title">Advertising (Google AdSense)</h2>
        <p>
          {SITE_NAME} may show ads through <strong>Google AdSense</strong>. Google and its partners
          may use cookies and similar technologies to serve and measure ads, including
          interest-based advertising where allowed.
        </p>
        <p>
          Google may process information such as your IP address, browser/device details, and ad
          interactions. Learn more in{' '}
          <a href="https://policies.google.com/technologies/ads" rel="noopener noreferrer">
            How Google uses data in advertising
          </a>{' '}
          and manage personalization at{' '}
          <a href="https://www.google.com/settings/ads" rel="noopener noreferrer">
            Google Ads Settings
          </a>
          .
        </p>
        <p>
          Our AdSense authorized sellers file is at{' '}
          <a href="/ads.txt" rel="noopener">
            /ads.txt
          </a>
          .
        </p>
      </section>

      <section className="privacy-page__section" aria-labelledby="priv-choices-title">
        <h2 id="priv-choices-title">Your choices (EEA/UK &amp; California)</h2>
        <p>
          Depending on where you live, you may have rights to access, delete, or object to certain
          processing performed by advertising partners. Use browser controls, Google&apos;s ad
          settings, and (where offered) consent tools on this site.
        </p>
        <p>
          We do not sell personal information for money in the sense of California CPRA
          &quot;sale&quot; as operated by {SITE_NAME} directly; third-party ad tech may still use
          data for advertising as described above.
        </p>
      </section>

      <section className="privacy-page__section" aria-labelledby="priv-children-title">
        <h2 id="priv-children-title">Children</h2>
        <p>
          {SITE_NAME} is a general-audience football site and is not directed at children under 13.
          We do not knowingly collect personal information from children. If you believe a child
          provided personal data via email, contact us and we will delete it.
        </p>
      </section>

      <section className="privacy-page__section" aria-labelledby="priv-changes-title">
        <h2 id="priv-changes-title">Changes to this policy</h2>
        <p>
          We may update this page when features, vendors, or legal requirements change. The
          &quot;Last reviewed&quot; date at the top reflects the latest editorial pass.
        </p>
      </section>

      <section className="privacy-page__section" aria-labelledby="priv-contact-title">
        <h2 id="priv-contact-title">Contact</h2>
        <p>
          Privacy questions or data requests:{' '}
          <a href={mailtoContact('FootyCompass privacy')}>{SITE_CONTACT_EMAIL}</a>.
        </p>
      </section>

      <div className="empty-state__actions">
        <Link to="/about" className="btn btn--secondary">
          About
        </Link>
        <Link to="/" className="btn btn--primary">
          Home
        </Link>
      </div>
    </div>
  );
}
