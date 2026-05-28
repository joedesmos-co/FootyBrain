import { memo } from 'react';
import { getManifestLeague } from '../data/contentManifest';
import { formatCountryLabel, getLeagueDisplayName } from '../utils/footballDisplay';
import { getClubIdentityStyle, getClubShortCode } from '../utils/identityVisual';

function TeamIdentityBadgeComponent({
  team,
  size = 'card',
  leagueName: leagueNameProp,
  showLeagueChip = false,
}) {
  const style = getClubIdentityStyle(team);
  const shortCode = getClubShortCode(team?.name);
  const country = formatCountryLabel(team?.country);
  const leagueLabel =
    leagueNameProp ??
    (team?.leagueId ? getLeagueDisplayName(getManifestLeague(team.leagueId)) : '');

  return (
    <div
      className={`team-identity-badge team-identity-badge--${size} team-badge team-badge--${size}`}
      style={style}
      role="img"
      aria-label={`${team?.name ?? 'Club'} identity badge`}
    >
      <span className="team-identity-badge__pattern" aria-hidden="true" />
      <span className="team-identity-badge__stripe" aria-hidden="true" />
      <span className="team-identity-badge__code team-badge__initials">{shortCode}</span>
      {country && country !== '—' ? (
        <span className="team-identity-badge__country team-badge__country">{country}</span>
      ) : null}
      {showLeagueChip && leagueLabel ? (
        <span className="team-identity-badge__league" title={leagueLabel}>
          {leagueLabel}
        </span>
      ) : null}
      <span className="team-identity-badge__rim team-badge__rim" aria-hidden="true" />
    </div>
  );
}

export default memo(TeamIdentityBadgeComponent);
