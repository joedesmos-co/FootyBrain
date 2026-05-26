import { Link } from 'react-router-dom';
import { getResolvedRecentViews } from '../utils/resolveRecentView';

export default function RecentlyViewedPanel({ onNavigate, className = '' }) {
  const items = getResolvedRecentViews();
  if (items.length === 0) return null;

  return (
    <div className={`recently-viewed${className ? ` ${className}` : ''}`}>
      <p className="recently-viewed__label">Recently viewed</p>
      <ul className="recently-viewed__list">
        {items.map((item) => (
          <li key={`${item.type}-${item.id}`}>
            <Link
              to={item.path}
              className="recently-viewed__link"
              onClick={() => onNavigate?.()}
            >
              <span className="recently-viewed__name">{item.name}</span>
              <span className="recently-viewed__meta">{item.subtitle}</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
