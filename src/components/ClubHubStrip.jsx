import { Link } from 'react-router-dom';
import { formatClubIdentityTags, truncateClubText } from '../utils/clubIdentity';
import { formatCountryLabel, getFootballAccentStyle } from '../utils/footballDisplay';

function Fact({ label, children }) {
  return (
    <div className="club-hub__fact">
      <dt>{label}</dt>
      <dd>{children}</dd>
    </div>
  );
}

export default function ClubHubStrip({ team, leagueName }) {
  const tags = formatClubIdentityTags(team.identityTags);
  const snapshot = truncateClubText(team.shortHistory, 200);
  const manager = team.manager?.trim() || '—';

  return (
    <section
      className="club-hub football-accent-rail"
      style={getFootballAccentStyle(team)}
      aria-label={`${team.name} at a glance`}
    >
      <dl className="club-hub__facts">
        <Fact label="League">
          <Link to={`/league/${team.leagueId}`}>{leagueName}</Link>
        </Fact>
        <Fact label="Country">{formatCountryLabel(team.country)}</Fact>
        {team.stadium ? <Fact label="Stadium">{team.stadium}</Fact> : null}
        {team.founded ? <Fact label="Founded">{team.founded}</Fact> : null}
        <Fact label="Head coach">{manager}</Fact>
      </dl>

      {tags.length > 0 && (
        <div className="club-hub__tags" aria-label="Playing identity">
          <span className="club-hub__tags-label">Identity</span>
          <ul className="club-hub__tag-list">
            {tags.map(({ key, label }) => (
              <li key={key}>{label}</li>
            ))}
          </ul>
        </div>
      )}

      {snapshot && (
        <p className="club-hub__snapshot">{snapshot}</p>
      )}
    </section>
  );
}
