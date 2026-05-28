import { Link } from 'react-router-dom';
import {
  mailtoContact,
  SITE_CONTACT_EMAIL,
  SITE_OPERATOR_LABEL,
  TRUST_NAV_LINKS,
  TRUST_PAGE_LAST_REVIEWED,
} from '../utils/siteTrust.js';

/**
 * Shared trust chrome for About, Editorial, and Privacy pages.
 */
export default function TrustPageChrome({ showContact = true }) {
  return (
    <aside className="trust-page-chrome" aria-label="Site trust and policies">
      <p className="trust-page-chrome__meta">
        <strong>Publisher:</strong> {SITE_OPERATOR_LABEL}. Last reviewed{' '}
        <time dateTime={TRUST_PAGE_LAST_REVIEWED}>{TRUST_PAGE_LAST_REVIEWED}</time>.
      </p>
      <nav className="trust-page-chrome__nav" aria-label="Trust and policy pages">
        {TRUST_NAV_LINKS.map((item) => (
          <Link key={item.to} to={item.to} className="trust-page-chrome__link">
            {item.label}
          </Link>
        ))}
      </nav>
      {showContact ? (
        <p className="trust-page-chrome__contact">
          Contact:{' '}
          <a href={mailtoContact()}>{SITE_CONTACT_EMAIL}</a>
        </p>
      ) : null}
    </aside>
  );
}
