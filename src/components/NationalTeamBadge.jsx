function getInitials(name) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();
}

export default function NationalTeamBadge({ nationalTeam, size = 'card' }) {
  const theme = nationalTeam.badgeTheme ?? {
    from: '#22c55e',
    to: '#134e4a',
    accent: '#dcfce7',
  };
  const style = {
    '--league-from': theme.from,
    '--league-to': theme.to,
    '--league-accent': theme.accent,
  };

  return (
    <div
      className={`league-badge national-team-badge national-team-badge--${size}`}
      style={style}
      role="img"
      aria-label={`${nationalTeam.displayName} national team`}
    >
      <span className="league-badge__ring" aria-hidden="true" />
      <span className="league-badge__initials">{getInitials(nationalTeam.displayName)}</span>
      <span className="league-badge__country">{nationalTeam.confederation ?? nationalTeam.country}</span>
    </div>
  );
}
