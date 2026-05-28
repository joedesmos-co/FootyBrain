import { DATASET_META } from '../data/datasetMeta';

/**
 * Consumer-facing snapshot / privacy context (browse, squads, onboarding).
 */
export default function DataTrustNotice({ compact = false }) {
  if (compact) return null;

  return (
    <p
      className={`data-trust-notice${compact ? ' data-trust-notice--compact' : ''}`}
      role="note"
    >
      Updated {DATASET_META.dataAsOf}. FootyCompass is a discovery platform — not a live transfer feed.
      Your favorites and progress stay on this device (no accounts).
    </p>
  );
}
