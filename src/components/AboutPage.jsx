import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { DATASET_META } from '../data/datasetMeta';
import { canonicalUrlForPath, SITE_NAME, SITE_TAGLINE } from '../utils/brand';
import { applyPageSeo } from '../utils/seoCtr.js';
import { buildOrganizationJsonLd, mailtoContact, SITE_CONTACT_EMAIL } from '../utils/siteTrust.js';
import { upsertJsonLdScript } from '../utils/jsonLd';
import BreadcrumbNav from './BreadcrumbNav';
import TrustPageChrome from './TrustPageChrome';

export default function AboutPage() {
  useEffect(() => {
    const canonical = canonicalUrlForPath('/about');
    applyPageSeo({
      title: `About ${SITE_NAME} · Football learning & quizzes`,
      description: `About FootyCompass: who we are, how the dataset works, editorial standards, contact, and what this site is (and is not). Independent football discovery — not a news wire.`,
      canonicalUrl: canonical,
      robots: 'index,follow',
    });
    upsertJsonLdScript('jsonld-organization', buildOrganizationJsonLd());
    return () => upsertJsonLdScript('jsonld-organization', null);
  }, []);

  return (
    <div className="page about-page">
      <BreadcrumbNav items={[{ label: 'Home', to: '/' }, { label: 'About' }]} />
      <header className="page-header">
        <p className="page-header__eyebrow">About</p>
        <h1>About {SITE_NAME}</h1>
        <p>
          {SITE_NAME} is an independent football discovery and learning website. We help you explore
          players, clubs, leagues, and national teams—then reinforce what you learned with quizzes
          and study tools.
        </p>
        <p className="page-header__meta">
          Dataset snapshot: <strong>{DATASET_META.dataAsOf}</strong> · {DATASET_META.playerCount?.toLocaleString?.() ?? '4,800+'}{' '}
          players in the index
        </p>
      </header>

      <TrustPageChrome />

      <section className="privacy-page__section" aria-labelledby="about-who-title">
        <h2 id="about-who-title">Who operates this site</h2>
        <p>
          {SITE_NAME} is published by an independent builder as a consumer education product. We are
          not a club, league, national federation, or rights holder. Trademarks and team names are
          used for identification and learning only.
        </p>
        <p>
          Tagline: <strong>{SITE_TAGLINE}</strong>
        </p>
      </section>

      <section className="privacy-page__section" aria-labelledby="about-why-title">
        <h2 id="about-why-title">Why it exists</h2>
        <p>
          Football sites excel at news, live scores, and transfers. {SITE_NAME} focuses on something
          different: <strong>recognition and context</strong>—who plays where, squad identity,
          rivalries, and fair quiz practice so names stick.
        </p>
      </section>

      <section className="privacy-page__section" aria-labelledby="about-what-title">
        <h2 id="about-what-title">What you can do here</h2>
        <ul className="tag-list" aria-label="Key features">
          <li>Browse and search thousands of player profiles</li>
          <li>Explore club, league, and national team pages</li>
          <li>Follow curated collections and learning paths</li>
          <li>Play player and club quizzes (free, no account)</li>
          <li>Take the daily five-question challenge</li>
        </ul>
        <div className="empty-state__actions">
          <Link to="/browse" className="btn btn--primary">
            Browse players
          </Link>
          <Link to="/quiz" className="btn btn--secondary">
            Play quizzes
          </Link>
          <Link to="/hubs" className="btn btn--secondary">
            Discovery hubs
          </Link>
        </div>
      </section>

      <section className="privacy-page__section" aria-labelledby="about-not-title">
        <h2 id="about-not-title">What this site is not</h2>
        <ul className="tag-list" aria-label="Limitations">
          <li>Not a live transfer or injury news service</li>
          <li>Not an official squad list or federation roster</li>
          <li>Not betting tips, odds, or gambling content</li>
          <li>Not user-generated forums or scraped article republishing</li>
        </ul>
        <p>
          Facts come from a bundled dataset snapshot. For methodology and corrections, see{' '}
          <Link to="/editorial">Editorial policy &amp; data sources</Link>.
        </p>
      </section>

      <section className="privacy-page__section" aria-labelledby="about-eeat-title">
        <h2 id="about-eeat-title">Editorial standards (E-E-A-T)</h2>
        <p>
          We aim for pages that teach something useful: original quiz hints, fan-context blurbs,
          learning paths, and discovery hubs—not empty SEO shells. Thin or duplicate pages are
          expanded when we find gaps in our audits.
        </p>
        <p>
          Privacy, cookies, and advertising are explained in the{' '}
          <Link to="/privacy">Privacy Policy</Link>. Questions and corrections are welcome (see
          contact below).
        </p>
      </section>

      <section
        className="privacy-page__section"
        id="contact"
        aria-labelledby="about-contact-title"
      >
        <h2 id="about-contact-title">Contact</h2>
        <p>
          Feedback, corrections, or partnership inquiries:{' '}
          <a href={mailtoContact()}>{SITE_CONTACT_EMAIL}</a>. We read messages when
          capacity allows and prioritize factual errors on public profile pages.
        </p>
      </section>
    </div>
  );
}
