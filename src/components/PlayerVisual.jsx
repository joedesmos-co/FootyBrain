import { memo, useEffect, useState } from 'react';
import { peekTeamName } from '../data/teamStore';
import {
  getPlayerImageAttributes,
  resolvePlayerImageSource,
  warnMissingImageAttribution,
} from '../utils/playerImage';

const DEFAULT_VISUAL_THEME = {
  from: '#22c55e',
  to: '#0f766e',
  accent: '#bbf7d0',
};

function getInitials(name) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();
}

function getVisualStyle(player) {
  const theme = player.visualTheme ?? DEFAULT_VISUAL_THEME;
  return {
    '--visual-from': theme.from,
    '--visual-to': theme.to,
    '--visual-accent': theme.accent,
  };
}

function PlaceholderVisual({ player, size, style, compact, teamName, tier }) {
  const isGeneric = tier === 'genericPlaceholder';

  return (
    <div
      className={`player-visual player-visual--${size} player-visual--placeholder${isGeneric ? ' player-visual--placeholder-generic' : ''}${compact ? ' player-visual--compact' : ''}`}
      style={style}
      role="img"
      aria-label={`${player.name} placeholder player card`}
    >
      <span className="player-visual__shine" aria-hidden="true" />
      <span className="player-visual__pitch-line" aria-hidden="true" />
      <span className="player-visual__jersey" aria-hidden="true">
        <span className="player-visual__initials">{getInitials(player.name)}</span>
      </span>
      {!compact && (
        <span className="player-visual__meta">
          <span>{player.position}</span>
          <strong>{teamName}</strong>
        </span>
      )}
    </div>
  );
}

function PlayerVisualComponent({ player, size = 'card', priority = false, compact = false, teamName: teamNameProp }) {
  const source = resolvePlayerImageSource(player);
  const imageAttrs = getPlayerImageAttributes(player, { size, priority });
  const [failedPlayerId, setFailedPlayerId] = useState(null);

  useEffect(() => {
    warnMissingImageAttribution(player);
  }, [player]);

  const style = getVisualStyle(player);
  const teamName = teamNameProp ?? player?._teamName ?? peekTeamName(player?.teamId);
  const showPhoto =
    Boolean(imageAttrs)
    && source.tier !== 'gradientInitials'
    && failedPlayerId !== player?.id;

  if (showPhoto && imageAttrs) {
    return (
      <div
        className={`player-visual player-visual--${size} player-visual--photo${compact ? ' player-visual--compact' : ''}`}
        style={style}
      >
        <img
          {...imageAttrs}
          onError={() => setFailedPlayerId(player?.id ?? '')}
        />
      </div>
    );
  }

  return (
    <PlaceholderVisual
      player={player}
      size={size}
      style={style}
      compact={compact}
      teamName={teamName}
      tier={source.tier}
    />
  );
}

export default memo(PlayerVisualComponent);
