import { DATASET_META } from '../data/datasetMeta';

/**
 * Consumer-facing snapshot / privacy context (browse, squads, onboarding).
 */
export default function DataTrustNotice({ compact = false }) {
  return (
    <p
      className={`data-trust-notice${compact ? ' data-trust-notice--compact' : ''}`}
      role="note"
    >
      <strong>Local learning snapshot</strong> — squads and clubs as of{' '}
      {DATASET_META.dataAsOf}, not live transfer feeds. Favorites, quiz XP, and preferences stay
      in your browser only (no accounts).
    </p>
  );
}
