import { Link } from 'react-router-dom';

/**
 * Crawlable related-entity links (real anchors) — capped to avoid nav spam.
 * @param {{ title?: string, links: { label: string, to: string }[], className?: string }} props
 */
export default function EntityRelatedNav({
  title = 'Explore connections',
  links = [],
  className = '',
}) {
  if (!links.length) return null;

  const sectionId = 'entity-related-nav';

  return (
    <nav
      className={`entity-related-nav profile__section${className ? ` ${className}` : ''}`}
      aria-labelledby={sectionId}
    >
      <h2 id={sectionId} className="entity-related-nav__title">
        {title}
      </h2>
      <ul className="entity-related-nav__list">
        {links.map((link) => (
          <li key={link.to}>
            <Link to={link.to} className="entity-related-nav__link">
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
