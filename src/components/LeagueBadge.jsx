function getInitials(name) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();
}

export default function LeagueBadge({ league, size = 'card' }) {
  const theme = league.badgeTheme ?? {
    from: '#22c55e',
    to: '#134e4a',
    accent: '#dcfce7',
  };
  const style = {
    '--league-from': theme.from,
    '--league-to': theme.to,
    '--league-accent': theme.accent,
  };

  if (league.logoUrl) {
    return (
      <div className={`league-badge league-badge--${size}`} style={style}>
        <img src={league.logoUrl} alt={`${league.name} mark`} loading="lazy" />
      </div>
    );
  }

  return (
    <div
      className={`entity-crest-badge league-badge league-badge--${size}`}
      style={style}
      role="img"
      aria-label={`${league.name} placeholder league badge`}
    >
      <span className="entity-crest-badge__shield" aria-hidden="true" />
      <span className="league-badge__ring" aria-hidden="true" />
      <span className="league-badge__initials entity-crest-badge__code">{getInitials(league.name)}</span>
      {size !== 'thumb' ? (
        <span className="league-badge__country">{league.country}</span>
      ) : null}
    </div>
  );
}
