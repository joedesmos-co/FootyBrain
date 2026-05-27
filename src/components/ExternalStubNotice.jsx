/**
 * Lightweight notice for external TM club stubs (national-pool imports).
 */
export default function ExternalStubNotice({ compact = false }) {
  return (
    <p
      className={`external-stub-notice${compact ? ' external-stub-notice--compact' : ''}`}
      role="note"
    >
      This is a lightweight club reference used for national-pool players. A full club profile
      may be added later.
    </p>
  );
}
