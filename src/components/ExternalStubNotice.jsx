/**
 * Notice for minimal club references tied to national-team player pools.
 */
export default function ExternalStubNotice({ compact = false }) {
  return (
    <p
      className={`external-stub-notice${compact ? ' external-stub-notice--compact' : ''}`}
      role="note"
    >
      Quick club reference for national-team players—a full club profile is on the way.
    </p>
  );
}
