import { memo, useEffect, useState } from 'react';
import { peekTeamById } from '../data/teamStore';
import { formatPosition } from '../utils/footballDisplay';
import {
  getPlayerAvatarStyle,
  getPlayerInitials,
  getPositionBadgeLabel,
  resolvePlayerAvatarTheme,
} from '../utils/identityVisual';
import {
  getPlayerImageAttribution,
  getPlayerImageAttributes,
  resolvePlayerImageSource,
  warnMissingImageAttribution,
} from '../utils/playerImage';
import PlayerImageCredit from './PlayerImageCredit';

function PlayerAvatarPlaceholder({
  player,
  team,
  size,
  compact,
  style,
  teamName,
}) {
  const theme = resolvePlayerAvatarTheme(player, team);
  const initials = getPlayerInitials(player?.name);
  const positionBadge = getPositionBadgeLabel(player?.position);
  const isThumb = size === 'thumb';
  const isCircle = isThumb || size === 'profile';

  return (
    <div
      className={`player-avatar player-avatar--${size} player-avatar--placeholder player-visual player-visual--${size} player-visual--placeholder${compact ? ' player-visual--compact' : ''}`}
      style={style}
      role="img"
      aria-label={`${player?.name ?? 'Player'} avatar`}
    >
      <span className={`player-avatar__disc${isCircle ? ' player-avatar__disc--circle' : ''}`}>
        <span className="player-avatar__silhouette" aria-hidden="true" />
        <span className="player-avatar__ring" aria-hidden="true" />
        {theme.flag ? (
          <span className="player-avatar__flag" aria-hidden="true">
            {theme.flag}
          </span>
        ) : null}
        <span className="player-avatar__initials player-visual__initials">{initials}</span>
      </span>
      {positionBadge ? (
        <span className="player-avatar__position">{positionBadge}</span>
      ) : null}
      {!compact && !isThumb ? (
        <span className="player-avatar__meta player-visual__meta">
          <span>{formatPosition(player?.position)}</span>
          <strong>{teamName}</strong>
        </span>
      ) : null}
    </div>
  );
}

function PlayerAvatarComponent({
  player,
  team: teamProp,
  size = 'card',
  priority = false,
  compact = false,
  teamName: teamNameProp,
  preferPhoto = true,
  showCredit = false,
}) {
  const team = teamProp ?? peekTeamById(player?.teamId);
  const source = resolvePlayerImageSource(player);
  const imageAttrs = preferPhoto ? getPlayerImageAttributes(player, { size, priority }) : null;
  const [failedPlayerId, setFailedPlayerId] = useState(null);
  const style = getPlayerAvatarStyle(player, team);
  const teamName = teamNameProp ?? player?._teamName ?? team?.name ?? 'Unknown';
  const attribution = getPlayerImageAttribution(player, source);
  const shouldShowCredit = showCredit && Boolean(attribution);

  useEffect(() => {
    warnMissingImageAttribution(player);
  }, [player]);

  const showPhoto =
    preferPhoto &&
    Boolean(imageAttrs) &&
    source.tier !== 'gradientInitials' &&
    failedPlayerId !== player?.id;

  if (showPhoto && imageAttrs) {
    return (
      <figure
        className={`player-avatar-figure player-avatar-figure--${size}${shouldShowCredit ? ' player-avatar-figure--with-credit' : ''}`}
      >
        <div
          className={`player-avatar player-avatar--${size} player-avatar--photo player-visual player-visual--${size} player-visual--photo${compact ? ' player-visual--compact' : ''}`}
          style={style}
        >
          <img {...imageAttrs} onError={() => setFailedPlayerId(player?.id ?? '')} />
          {getPositionBadgeLabel(player?.position) ? (
            <span className="player-avatar__position player-avatar__position--photo">
              {getPositionBadgeLabel(player.position)}
            </span>
          ) : null}
        </div>
        {shouldShowCredit ? <PlayerImageCredit player={player} compact={size !== 'profile'} /> : null}
      </figure>
    );
  }

  return (
    <PlayerAvatarPlaceholder
      player={player}
      team={team}
      size={size}
      compact={compact}
      style={style}
      teamName={teamName}
    />
  );
}

export default memo(PlayerAvatarComponent);
