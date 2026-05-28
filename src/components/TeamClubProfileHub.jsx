import { Link } from 'react-router-dom';
import { formatClubIdentityTags } from '../utils/clubIdentity';
import { formatCountryLabel, getFootballAccentStyle } from '../utils/footballDisplay';
import { buildClubLeagueContext, buildSyntheticClubStory } from '../utils/clubProfileEditorial';
import {
  buildTeamQuickFacts,
  getTeamProfileEditorial,
  parseTeamLegendLines,
} from '../utils/teamProfileDisplay';
import { resolveRivalEntries } from '../utils/teamPageUtils';
import TeamBadge from './TeamBadge';

function QuickFact({ fact }) {
  const value = fact.href ? (
    <Link to={fact.href}>{fact.value}</Link>
  ) : (
    fact.value
  );

  return (
    <div className="team-quick-fact">
      <span className="team-quick-fact__icon" aria-hidden="true">
        {fact.icon}
      </span>
      <span className="team-quick-fact__body">
        <span className="team-quick-fact__label">{fact.label}</span>
        <span className="team-quick-fact__value">{value}</span>
      </span>
    </div>
  );
}

/**
 * @param {{
 *   team: object,
 *   leagueName: string,
 *   rosterSize: number,
 *   leagueTeams: object[],
 *   isExternalStub?: boolean,
 * }} props
 */
export default function TeamClubProfileHub({
  team,
  leagueName,
  rosterSize,
  leagueTeams,
  isExternalStub = false,
}) {
  const editorial = getTeamProfileEditorial(team);
  const identityTags = formatClubIdentityTags(team.identityTags);
  const rivalEntries = resolveRivalEntries(team.rivals, leagueTeams);
  const legendEntries = parseTeamLegendLines(team.legends);
  const quickFacts = buildTeamQuickFacts({
    team,
    leagueName,
    rosterSize,
    rivalCount: rivalEntries.length,
    honorCount: editorial.honors.length,
  });

  const showRivals = rivalEntries.length > 0;
  const showHonors = editorial.honors.length > 0;
  const showLegends = legendEntries.length > 0;
  const showIdentity = identityTags.length > 0;
  const showNicknames = editorial.nicknames.length > 0;
  const showFanGuide = editorial.hasFanGuide;
  const showStory = editorial.hasStory;
  const syntheticStory = !showStory
    ? buildSyntheticClubStory(team, leagueName, rosterSize)
    : '';
  const leagueContext = buildClubLeagueContext(team, leagueName);
  const showSyntheticStory = Boolean(syntheticStory);
  const showLeagueContext = Boolean(leagueContext);

  if (
    isExternalStub &&
    !editorial.hasContext &&
    !showSyntheticStory &&
    quickFacts.length === 0 &&
    !showRivals &&
    !showLegends
  ) {
    return null;
  }

  return (
    <div className="team-club-hub" style={getFootballAccentStyle(team)}>
      {quickFacts.length > 0 ? (
        <section className="team-club-hub__panel" aria-label="Club quick facts">
          <div className="team-quick-facts">
            {quickFacts.map((fact) => (
              <QuickFact key={fact.label} fact={fact} />
            ))}
          </div>
        </section>
      ) : null}

      {(showNicknames || showIdentity) && (
        <section className="team-club-hub__panel team-club-hub__panel--compact" aria-label="Club identity">
          {showNicknames ? (
            <div className="team-club-hub__chip-row">
              <span className="team-club-hub__chip-label">Nickname</span>
              <ul className="team-profile-chips">
                {editorial.nicknames.map((name) => (
                  <li key={name}>{name}</li>
                ))}
              </ul>
            </div>
          ) : null}
          {showIdentity ? (
            <div className="team-club-hub__chip-row">
              <span className="team-club-hub__chip-label">Playing style</span>
              <ul className="team-profile-chips">
                {identityTags.map(({ key, label }) => (
                  <li key={key}>{label}</li>
                ))}
              </ul>
            </div>
          ) : null}
        </section>
      )}

      {showStory ? (
        <section className="team-club-hub__panel info-card" aria-labelledby="team-why-matters-title">
          <h2 id="team-why-matters-title" className="team-club-hub__card-title">
            Club identity &amp; history
          </h2>
          <p className="team-club-hub__prose">{editorial.shortHistory}</p>
        </section>
      ) : null}

      {showSyntheticStory ? (
        <section className="team-club-hub__panel info-card" aria-labelledby="team-club-identity-title">
          <h2 id="team-club-identity-title" className="team-club-hub__card-title">
            Club identity
          </h2>
          <p className="team-club-hub__prose">{syntheticStory}</p>
        </section>
      ) : null}

      {showLeagueContext ? (
        <section className="team-club-hub__panel info-card" aria-labelledby="team-league-context-title">
          <h2 id="team-league-context-title" className="team-club-hub__card-title">
            League context
          </h2>
          <p className="team-club-hub__prose">{leagueContext}</p>
          <p className="team-fan-guide__meta">
            <Link to={`/league/${team.leagueId}`}>Open {leagueName} hub</Link>
            {' · '}
            <Link to={`/hubs/quizzes/league/${team.leagueId}`}>League quiz page</Link>
          </p>
        </section>
      ) : null}

      {showFanGuide ? (
        <details className="team-fan-guide info-card" open>
          <summary className="team-fan-guide__summary">
            <span className="team-club-hub__card-title">Fan guide</span>
            <span className="team-fan-guide__hint">Culture, colours, and matchday feel</span>
          </summary>
          <div className="team-fan-guide__body">
            <p className="team-club-hub__prose">{editorial.fanGuide}</p>
            {team.country ? (
              <p className="team-fan-guide__meta">
                {formatCountryLabel(team.country)} · {leagueName}
              </p>
            ) : null}
          </div>
        </details>
      ) : null}

      {(showRivals || showHonors || showLegends) && (
        <div className="team-club-hub__grid">
          {showRivals ? (
            <section className="team-club-hub__panel info-card" aria-labelledby="team-rivals-title">
              <h2 id="team-rivals-title" className="team-club-hub__card-title">
                Rival clubs
              </h2>
              <ul className="team-rival-cards team-rival-cards--dense">
                {rivalEntries.map(({ label, team: rivalTeam }) => (
                  <li key={label}>
                    {rivalTeam ? (
                      <Link to={`/team/${rivalTeam.id}`} className="team-rival-cards__item">
                        <TeamBadge team={rivalTeam} size="thumb" />
                        <span>{rivalTeam.name}</span>
                      </Link>
                    ) : (
                      <span className="team-rival-cards__item team-rival-cards__item--pending">
                        {label}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {showHonors ? (
            <section className="team-club-hub__panel info-card" aria-labelledby="team-honors-title">
              <h2 id="team-honors-title" className="team-club-hub__card-title">
                Honours & trophies
              </h2>
              <ul className="team-profile-chips team-profile-chips--honors">
                {editorial.honors.map((honor) => (
                  <li key={honor}>{honor}</li>
                ))}
              </ul>
            </section>
          ) : null}

          {showLegends ? (
            <section
              className="team-club-hub__panel info-card team-club-hub__panel--wide"
              aria-labelledby="team-legends-title"
            >
              <h2 id="team-legends-title" className="team-club-hub__card-title">
                Club legends
              </h2>
              <ul className="team-legends-timeline">
                {legendEntries.map(({ name, note }) => (
                  <li key={name} className="team-legends-timeline__item">
                    <strong>{name}</strong>
                    {note ? <span>{note}</span> : null}
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
        </div>
      )}
    </div>
  );
}
