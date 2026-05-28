import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { DATASET_META } from '../data/datasetMeta';
import { canonicalUrlForPath, SITE_NAME } from '../utils/brand';
import { applyPageSeo } from '../utils/seoCtr.js';
import {
  mailtoContact,
  SITE_CONTACT_EMAIL,
  SITE_PUBLISHER_DESCRIPTION,
} from '../utils/siteTrust.js';
import BreadcrumbNav from './BreadcrumbNav';
import TrustPageChrome from './TrustPageChrome';

export default function EditorialPolicyPage() {
  useEffect(() => {
    applyPageSeo({
      title: `Editorial policy & data sources · ${SITE_NAME}`,
      description: `How ${SITE_NAME} sources football data, writes original quiz and fan content, handles corrections, and discloses advertising. Dataset snapshot ${DATASET_META.dataAsOf}.`,
      canonicalUrl: canonicalUrlForPath('/editorial'),
      robots: 'index,follow',
    });
  }, []);

  return (
    <div className="page editorial-page">
      <BreadcrumbNav items={[{ label: 'Home', to: '/' }, { label: 'Editorial policy' }]} />
      <header className="page-header">
        <p className="page-header__eyebrow">Transparency</p>
        <h1>Editorial policy &amp; data sources</h1>
        <p>
          This page explains what data {SITE_NAME} uses, how editorial content is created, how we
          avoid misleading claims, and how to request corrections. {SITE_PUBLISHER_DESCRIPTION}
        </p>
        <p className="page-header__meta">
          Dataset snapshot: <strong>{DATASET_META.dataAsOf}</strong>
        </p>
      </header>

      <TrustPageChrome />

      <section className="privacy-page__section" aria-labelledby="ed-sources-title">
        <h2 id="ed-sources-title">Data sources (snapshot)</h2>
        <p>
          {SITE_NAME} ships with a <strong>static snapshot</strong> of player, club, league, and
          national-team records bundled with the app (currently{' '}
          {DATASET_META.playerCount?.toLocaleString?.() ?? '4,800+'} players). The snapshot date is{' '}
          <strong>{DATASET_META.dataAsOf}</strong>.
        </p>
        <p>
          We do not scrape news articles or republish third-party prose. Structured fields (club,
          nationality, position, importance scores) come from our dataset pipeline; narrative blurbs
          and quiz hints are written for learning.
        </p>
        <p>
          We are <strong>not</strong> an official rights-holder feed. Squad lists can lag real-world
          transfers until the next dataset refresh.
        </p>
      </section>

      <section className="privacy-page__section" aria-labelledby="ed-originality-title">
        <h2 id="ed-originality-title">Original editorial content</h2>
        <p>
          Original work on {SITE_NAME} includes quiz hints, quick facts, learning paths, curated
          collections, fan-guide summaries, discovery hubs, and compare/quiz framing. These are meant
          to help users <strong>recognize and remember</strong> players—not to mirror a stats API.
        </p>
        <p>
          We do not use AI to mass-generate thousands of unique player biographies without human
          review. When tools assist drafting, facts still must match the bundled snapshot.
        </p>
      </section>

      <section className="privacy-page__section" aria-labelledby="ed-quality-title">
        <h2 id="ed-quality-title">Quality &amp; thin-content standards</h2>
        <ul className="tag-list" aria-label="Quality standards">
          <li>Prefer teachable, specific copy over generic filler</li>
          <li>Avoid live injury/transfer claims unless present in the snapshot</li>
          <li>Keep quizzes fair (clear prompts, no trick duplicates where avoidable)</li>
          <li>Label prep-mode or low-coverage entities honestly</li>
          <li>Expand thin profiles when audits flag missing facts or hints</li>
        </ul>
        <p>
          Pages with little unique value may be de-emphasized in internal linking or improved in
          future dataset passes rather than left as empty shells.
        </p>
      </section>

      <section className="privacy-page__section" aria-labelledby="ed-images-title">
        <h2 id="ed-images-title">Images &amp; trademarks</h2>
        <p>
          Player imagery uses licensed assets or neutral placeholders (silhouettes/initials) when no
          photo is available. Club and league names are used for identification only; {SITE_NAME} is
          not endorsed by any competition or federation.
        </p>
      </section>

      <section className="privacy-page__section" aria-labelledby="ed-corrections-title">
        <h2 id="ed-corrections-title">Corrections process</h2>
        <p>
          If you spot an error (wrong club, nationality, hint, or duplicate), email{' '}
          <a href={mailtoContact('FootyCompass correction')}>{SITE_CONTACT_EMAIL}</a> with:
        </p>
        <ul className="tag-list" aria-label="Correction request fields">
          <li>Link to the page (player, club, league, or national team)</li>
          <li>What looks wrong</li>
          <li>What it should be</li>
          <li>Optional: source link(s) or evidence</li>
        </ul>
        <p>
          We prioritize factual errors on high-traffic profiles. Fixes ship in the next dataset or
          site update we publish.
        </p>
      </section>

      <section className="privacy-page__section" aria-labelledby="ed-ads-title">
        <h2 id="ed-ads-title">Advertising &amp; monetization</h2>
        <p>
          {SITE_NAME} may display ads through <strong>Google AdSense</strong>. Our authorized
          seller record is published at{' '}
          <a href="/ads.txt" rel="noopener">
            /ads.txt
          </a>
          . Cookie, personalization, and vendor details are in the{' '}
          <Link to="/privacy">Privacy Policy</Link>.
        </p>
        <p>
          Editorial content is not sold as sponsored posts. If that ever changes, we will label
          sponsored material clearly.
        </p>
      </section>

      <section className="privacy-page__section" aria-labelledby="ed-identity-title">
        <h2 id="ed-identity-title">Publisher &amp; contact</h2>
        <p>
          {SITE_NAME} is maintained by an independent publisher. Partnership or press questions:{' '}
          <a href={mailtoContact()}>{SITE_CONTACT_EMAIL}</a>. See also{' '}
          <Link to="/about">About {SITE_NAME}</Link>.
        </p>
      </section>
    </div>
  );
}
