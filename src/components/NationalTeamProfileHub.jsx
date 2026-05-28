import { Link } from 'react-router-dom';
import { buildStructuredNationalProfile } from '../utils/nationalProfileEditorial';

/**
 * @param {{
 *   nationalTeam: object,
 *   squad: object[],
 *   linkedCount: number,
 *   quizReadyCount: number,
 * }} props
 */
export default function NationalTeamProfileHub({
  nationalTeam,
  squad,
  linkedCount,
  quizReadyCount,
}) {
  const profile = buildStructuredNationalProfile({
    nationalTeam,
    squad,
    linkedCount,
    quizReadyCount,
  });

  const showHistory = profile.hasAuthoritativeHistory;
  const showSquadIdentity = Boolean(profile.squadIdentity);
  const showCulture = Boolean(profile.footballCulture) && !nationalTeam.fanGuide;
  const showCultureDetails = Boolean(nationalTeam.fanGuide);
  const showRivalry = Boolean(profile.rivalry);
  const showTournament = Boolean(profile.tournament);

  if (
    !showHistory &&
    !showSquadIdentity &&
    !showCulture &&
    !showCultureDetails &&
    !showRivalry &&
    !showTournament
  ) {
    return null;
  }

  return (
    <div className="national-team-hub">
      {showHistory ? (
        <section className="info-card profile__section" aria-labelledby="nt-history-title">
          <h2 id="nt-history-title">National team overview</h2>
          <p className="national-team-hub__prose">{profile.history}</p>
        </section>
      ) : null}

      {showSquadIdentity ? (
        <section className="info-card profile__section" aria-labelledby="nt-squad-id-title">
          <h2 id="nt-squad-id-title">Squad identity</h2>
          <p className="national-team-hub__prose">{profile.squadIdentity}</p>
        </section>
      ) : null}

      {showTournament ? (
        <section className="info-card profile__section" aria-labelledby="nt-tournament-title">
          <h2 id="nt-tournament-title">Tournament relevance</h2>
          <p className="national-team-hub__prose">{profile.tournament}</p>
          {profile.isWorldCupFeatured ? (
            <p className="national-team-hub__meta">
              <Link to="/world-cup">World Cup 2026 hub</Link>
              {' · '}
              <Link to="/quiz?theme=world-cup">World Cup quiz pool</Link>
            </p>
          ) : null}
        </section>
      ) : null}

      {showCultureDetails ? (
        <details className="profile__section national-team-profile__fan-guide info-card" open>
          <summary>Football culture &amp; fan guide</summary>
          <p className="national-team-hub__prose">{nationalTeam.fanGuide}</p>
        </details>
      ) : null}

      {showCulture ? (
        <section className="info-card profile__section" aria-labelledby="nt-culture-title">
          <h2 id="nt-culture-title">Football culture</h2>
          <p className="national-team-hub__prose">{profile.footballCulture}</p>
        </section>
      ) : null}

      {showRivalry ? (
        <section className="info-card profile__section" aria-labelledby="nt-rivalry-title">
          <h2 id="nt-rivalry-title">Rivalry context</h2>
          <p className="national-team-hub__prose">{profile.rivalry}</p>
        </section>
      ) : null}
    </div>
  );
}
