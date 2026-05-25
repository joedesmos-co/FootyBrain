import { getTeamName } from '../data/sampleData';

function getInitials(name) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();
}

export default function PlayerVisual({ player, size = 'card' }) {
  const teamName = getTeamName(player.teamId);
  const theme = player.visualTheme ?? {
    from: '#22c55e',
    to: '#0f766e',
    accent: '#bbf7d0',
  };
  const style = {
    '--visual-from': theme.from,
    '--visual-to': theme.to,
    '--visual-accent': theme.accent,
  };

  if (player.imageUrl) {
    return (
      <div className={`player-visual player-visual--${size}`} style={style}>
        <img src={player.imageUrl} alt={`${player.name} portrait`} loading="lazy" />
      </div>
    );
  }

  return (
    <div
      className={`player-visual player-visual--${size}`}
      style={style}
      role="img"
      aria-label={`${player.name} placeholder player card`}
    >
      <span className="player-visual__shine" aria-hidden="true" />
      <span className="player-visual__pitch-line" aria-hidden="true" />
      <span className="player-visual__jersey" aria-hidden="true">
        <span className="player-visual__initials">{getInitials(player.name)}</span>
      </span>
      <span className="player-visual__meta">
        <span>{player.position}</span>
        <strong>{teamName}</strong>
      </span>
    </div>
  );
}
