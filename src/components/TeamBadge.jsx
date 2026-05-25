function getInitials(name) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();
}

export default function TeamBadge({ team, size = 'card' }) {
  const theme = team.badgeTheme ?? {
    from: '#0f9f6e',
    to: '#14532d',
    accent: '#d1fae5',
  };
  const style = {
    '--badge-from': theme.from,
    '--badge-to': theme.to,
    '--badge-accent': theme.accent,
  };

  if (team.crestUrl) {
    return (
      <div className={`team-badge team-badge--${size}`} style={style}>
        <img src={team.crestUrl} alt={`${team.name} crest`} loading="lazy" />
      </div>
    );
  }

  return (
    <div
      className={`team-badge team-badge--${size}`}
      style={style}
      role="img"
      aria-label={`${team.name} placeholder club badge`}
    >
      <span className="team-badge__rim" aria-hidden="true" />
      <span className="team-badge__initials">{getInitials(team.name)}</span>
      <span className="team-badge__country">{team.country}</span>
    </div>
  );
}
