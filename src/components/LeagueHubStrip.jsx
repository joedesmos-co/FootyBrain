import {
  formatLeagueIdentityTags,
  parseFamousClubLabel,
  truncateLeagueText,
} from '../utils/leagueIdentity';
import { leagueHubQuizLabel } from '../utils/consumerCopy';
import { formatCountryLabel, getFootballAccentStyle } from '../utils/footballDisplay';

function Fact({ label, children }) {
  return (
    <div className="league-hub__fact">
      <dt>{label}</dt>
      <dd>{children}</dd>
    </div>
  );
}

export default function LeagueHubStrip({
  league,
  clubCount,
  quizReadyCount,
  playstyle,
  famousClubs = [],
}) {
  const tags = formatLeagueIdentityTags(league.id);
  const playstyleSnapshot = truncateLeagueText(playstyle, 200);
  const famousLabels = famousClubs.map(parseFamousClubLabel).slice(0, 5);

  return (
    <section
      className="league-hub football-accent-rail"
      style={getFootballAccentStyle(league)}
      aria-label={`${league.name} at a glance`}
    >
      <dl className="league-hub__facts">
        <Fact label="Country">{formatCountryLabel(league.country)}</Fact>
        <Fact label="Clubs">{clubCount}</Fact>
        <Fact label="Quizzes">{leagueHubQuizLabel(quizReadyCount)}</Fact>
      </dl>

      {playstyleSnapshot && (
        <p className="league-hub__playstyle">
          <span className="league-hub__tags-label">Playstyle</span>
          {playstyleSnapshot}
        </p>
      )}

      {tags.length > 0 && (
        <div className="league-hub__tags" aria-label="League identity">
          <span className="league-hub__tags-label">Identity</span>
          <ul className="league-hub__tag-list">
            {tags.map(({ key, label }) => (
              <li key={key}>{label}</li>
            ))}
          </ul>
        </div>
      )}

      {famousLabels.length > 0 && (
        <div className="league-hub__famous">
          <span className="league-hub__tags-label">Famous clubs</span>
          <ul className="league-hub__famous-list">
            {famousLabels.map((name) => (
              <li key={name}>{name}</li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
