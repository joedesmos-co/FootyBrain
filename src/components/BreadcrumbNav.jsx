import { Link } from 'react-router-dom';

export default function BreadcrumbNav({ items, ariaLabel = 'Breadcrumb' }) {
  const crumbs = Array.isArray(items) ? items.filter(Boolean) : [];
  if (crumbs.length === 0) return null;

  return (
    <nav className="collections-breadcrumb" aria-label={ariaLabel}>
      <ol className="collections-breadcrumb__list">
        {crumbs.map((item, idx) => {
          const isLast = idx === crumbs.length - 1;
          return (
            <li
              key={`${item.label}-${idx}`}
              className="collections-breadcrumb__item"
              {...(isLast && !item.to ? { 'aria-current': 'page' } : {})}
            >
              {item.to ? (
                <Link to={item.to}>{item.label}</Link>
              ) : (
                <span>{item.label}</span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
