import { getCountryFlag } from '../utils/footballDisplay';

/**
 * Subtle flag marker for nationality / country labels (emoji, accessible name).
 */
export default function CountryFlag({ label, className = '' }) {
  const text = String(label ?? '').trim();
  const flag = getCountryFlag(text);
  if (!flag) return null;

  return (
    <span
      className={`country-flag${className ? ` ${className}` : ''}`}
      role="img"
      aria-label={text}
      title={text}
    >
      {flag}
    </span>
  );
}
