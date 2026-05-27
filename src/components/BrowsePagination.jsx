function formatNumber(value) {
  return Number(value).toLocaleString();
}

/**
 * @param {{
 *   page: number,
 *   pageSize: number,
 *   totalItems: number,
 *   onPageChange: (page: number) => void,
 *   className?: string,
 * }} props
 */
export default function BrowsePagination({
  page,
  pageSize,
  totalItems,
  onPageChange,
  className = '',
}) {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const start = totalItems === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const end = Math.min(safePage * pageSize, totalItems);
  const atStart = safePage <= 1;
  const atEnd = safePage >= totalPages;

  if (totalItems <= pageSize) {
    return (
      <p className={`browse-pagination browse-pagination--summary-only ${className}`.trim()}>
        {totalItems === 0
          ? 'No players to show'
          : `Showing ${formatNumber(start)}–${formatNumber(end)} of ${formatNumber(totalItems)}`}
      </p>
    );
  }

  return (
    <nav
      className={`browse-pagination ${className}`.trim()}
      aria-label="Player results pages"
    >
      <button
        type="button"
        className="ui-nav-arrow browse-pagination__arrow"
        onClick={() => onPageChange(safePage - 1)}
        disabled={atStart}
        aria-label="Previous page"
      >
        ‹
      </button>
      <p className="browse-pagination__status">
        Showing {formatNumber(start)}–{formatNumber(end)} of {formatNumber(totalItems)}
        <span className="browse-pagination__page">
          Page {safePage} of {totalPages}
        </span>
      </p>
      <button
        type="button"
        className="ui-nav-arrow browse-pagination__arrow"
        onClick={() => onPageChange(safePage + 1)}
        disabled={atEnd}
        aria-label="Next page"
      >
        ›
      </button>
    </nav>
  );
}
