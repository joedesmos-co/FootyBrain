import { Link } from 'react-router-dom';

export default function BreadcrumbNav({ items, ariaLabel = 'Breadcrumb' }) {
  const crumbs = Array.isArray(items) ? items.filter(Boolean) : [];
  if (crumbs.length === 0) return null;

  return (
    <nav className="collections-breadcrumb" aria-label={ariaLabel}>
      {crumbs.map((item, idx) => (
        <span key={`${item.label}-${idx}`}>
          {idx > 0 ? <span aria-hidden="true"> / </span> : null}
          {item.to ? <Link to={item.to}>{item.label}</Link> : <span>{item.label}</span>}
        </span>
      ))}
    </nav>
  );
}

