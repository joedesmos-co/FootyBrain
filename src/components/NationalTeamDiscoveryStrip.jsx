import { Link } from 'react-router-dom';
import { buildNationalQuizDiscoveryLinks } from '../utils/nationalProfileEditorial';

/**
 * @param {{
 *   nationalTeam: object,
 *   quizReady: boolean,
 *   squad: object[],
 * }} props
 */
export default function NationalTeamDiscoveryStrip({ nationalTeam, quizReady, squad }) {
  const links = buildNationalQuizDiscoveryLinks(nationalTeam, { quizReady, squad });

  if (!links.length) return null;

  return (
    <section className="club-quiz-discovery national-discovery" aria-labelledby="nt-discovery-title">
      <h2 id="nt-discovery-title" className="club-quiz-discovery__title">
        Study &amp; quiz links
      </h2>
      <p className="club-quiz-discovery__lead">
        Connect national squads to World Cup prep, nationality hubs, rival nations, and club leagues
        on FootyCompass.
      </p>
      <ul className="club-quiz-discovery__list">
        {links.slice(0, 8).map((link) => (
          <li key={link.to}>
            <Link to={link.to} className="club-quiz-discovery__link">
              <strong>{link.label}</strong>
              {link.hint ? <span>{link.hint}</span> : null}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
