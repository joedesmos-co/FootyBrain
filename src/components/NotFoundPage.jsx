import { useLayoutEffect } from 'react';
import { Link } from 'react-router-dom';
import { canonicalUrlForPath } from '../utils/brand.js';
import { applyPageSeo } from '../utils/seoCtr.js';
import BreadcrumbNav from './BreadcrumbNav';

export default function NotFoundPage() {
  useLayoutEffect(() => {
    applyPageSeo({
      title: 'Page not found · FootyCompass',
      description:
        'This page is not on FootyCompass. Browse players, clubs, leagues, national teams, or start from home.',
      canonicalUrl: canonicalUrlForPath(window.location.pathname),
      robots: 'noindex,nofollow',
    });
  }, []);

  return (
    <div className="page">
      <BreadcrumbNav items={[{ label: 'Home', to: '/' }, { label: 'Page not found' }]} />
      <header className="page-header">
        <h1>Page not found</h1>
        <p>That page is not in FootyCompass yet. Try search or start from browse.</p>
      </header>
      <div className="empty-state__actions">
        <Link to="/" className="btn btn--primary">
          Home
        </Link>
        <Link to="/browse" className="btn btn--secondary">
          Browse players
        </Link>
        <Link to="/onboarding" className="btn btn--secondary">
          How it works
        </Link>
      </div>
    </div>
  );
}
