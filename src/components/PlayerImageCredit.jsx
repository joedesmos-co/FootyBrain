import { getPlayerImageAttribution } from '../utils/playerImage';

/**
 * Visible photo attribution (credit + license + optional source link).
 */
export default function PlayerImageCredit({ player, className = '', compact = false }) {
  const attribution = getPlayerImageAttribution(player);
  if (!attribution) return null;

  const { credit, license, sourceLabel, sourceUrl } = attribution;

  return (
    <p className={`player-image-credit${compact ? ' player-image-credit--compact' : ''}${className ? ` ${className}` : ''}`}>
      <span className="player-image-credit__label">Photo: </span>
      <span className="player-image-credit__text">
        {credit}
        {license ? (
          <>
            {' '}
            <span className="player-image-credit__license">({license})</span>
          </>
        ) : null}
        {sourceLabel ? (
          <>
            {' '}
            {sourceUrl ? (
              <a
                href={sourceUrl}
                className="player-image-credit__source"
                target="_blank"
                rel="noopener noreferrer"
              >
                {sourceLabel}
              </a>
            ) : (
              <span className="player-image-credit__source">{sourceLabel}</span>
            )}
          </>
        ) : null}
      </span>
    </p>
  );
}
