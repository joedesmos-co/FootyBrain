export default function PageFallback({ label = 'Loading page…' }) {
  return (
    <p className="page-loading" role="status" aria-live="polite" aria-busy="true">
      {label}
    </p>
  );
}
