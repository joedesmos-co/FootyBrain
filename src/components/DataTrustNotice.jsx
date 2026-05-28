import { Link } from 'react-router-dom';
import { DATASET_META } from '../data/datasetMeta';

/**
 * Consumer-facing snapshot / privacy context (browse, squads, onboarding).
 */
export default function DataTrustNotice({ compact = false }) {
  if (compact) {
    return (
      <p className="data-trust-notice data-trust-notice--compact" role="note">
        Data snapshot {DATASET_META.dataAsOf}. Not a live transfer feed.{' '}
        <Link to="/editorial">Sources &amp; corrections</Link>
      </p>
    );
  }

  return (
    <p className="data-trust-notice" role="note">
      Updated {DATASET_META.dataAsOf}. FootyCompass is a discovery platform — not a live transfer
      feed. Your favorites and progress stay on this device (no accounts).{' '}
      <Link to="/about">About</Link> · <Link to="/editorial">Editorial</Link> ·{' '}
      <Link to="/privacy">Privacy</Link>
    </p>
  );
}
