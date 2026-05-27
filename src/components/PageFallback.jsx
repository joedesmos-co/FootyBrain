function LoadingSkeleton() {
  return (
    <div className="page-fallback__skeleton" aria-hidden="true">
      <div className="skeleton skeleton--bar" />
      <div className="skeleton skeleton--bar skeleton--short" />
      <div className="skeleton skeleton--block" />
    </div>
  );
}

export default function PageFallback({ label = 'Loading page…' }) {
  return (
    <div className="page-fallback" role="status" aria-live="polite" aria-busy="true">
      <LoadingSkeleton />
      <p className="page-fallback__label">{label}</p>
    </div>
  );
}

export function PageLoadingInline({ label = 'Loading…' }) {
  return (
    <div className="page-loading" role="status" aria-live="polite" aria-busy="true">
      <div className="page-loading__skeleton" aria-hidden="true">
        <div className="skeleton skeleton--bar" />
        <div className="skeleton skeleton--bar skeleton--short" />
      </div>
      <p className="page-loading__label">{label}</p>
    </div>
  );
}
