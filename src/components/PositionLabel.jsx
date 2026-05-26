import { formatPosition } from '../utils/footballDisplay';

/** Consistent position pill across cards, profiles, and squad rows. */
export default function PositionLabel({ position, className = 'football-position' }) {
  const label = formatPosition(position);
  if (!label || label === '—') return null;

  return <span className={className}>{label}</span>;
}
