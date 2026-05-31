function getInitials(name) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();
}

function getShortCode(name) {
  const initials = getInitials(name);
  if (initials.length >= 2) return initials;
  return String(name ?? '')
    .replace(/[^a-zA-Z]/g, '')
    .slice(0, 3)
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
  const showMeta = size !== 'thumb';

  return (
    <div
      className={`entity-crest-badge league-badge national-team-badge national-team-badge--${size}`}
      style={style}
      role="img"
      aria-label={`${nationalTeam.displayName} national team`}
    >
      <span className="entity-crest-badge__shield" aria-hidden="true" />
      <span className="league-badge__ring" aria-hidden="true" />
      <span className="league-badge__initials entity-crest-badge__code">
        {getShortCode(nationalTeam.displayName)}
      </span>
      {showMeta ? (
        <span className="league-badge__country">
          {nationalTeam.confederation ?? nationalTeam.country}
        </span>
      ) : null}
    </div>
  );
}
