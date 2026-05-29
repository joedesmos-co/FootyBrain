import { Link } from 'react-router-dom';
import { buildClubQuizDiscoveryLinks } from '../utils/clubProfileEditorial';
import { getTeamProfileEditorial } from '../utils/teamProfileDisplay';
import { isTopTierClub } from '../utils/topTierPages';

/**
 * @param {{
 *   team: object,
 *   leagueName: string,
 *   hasTeamQuiz?: boolean,
 *   hasLeagueQuiz?: boolean,
 * }} props
 */
export default function ClubQuizDiscoveryStrip({
  team,
  leagueName,
  hasTeamQuiz = false,
  hasLeagueQuiz = false,
}) {
  const links = buildClubQuizDiscoveryLinks(team, {
    leagueName,
    hasTeamQuiz,
    hasLeagueQuiz,
  });
  const editorial = getTeamProfileEditorial(team);
  const topTier = isTopTierClub(team);
  const lead =
    editorial.quizDiscoveryLead ||
    'Turn squad browsing into recall — player quizzes, league pools, and club trivia from real profiles.';

  if (!links.length) return null;

  return (
    <section
      className={`club-quiz-discovery${topTier ? ' club-quiz-discovery--premium' : ''}`}
      aria-labelledby="club-quiz-discovery-title"
    >
      <h2 id="club-quiz-discovery-title" className="club-quiz-discovery__title">
        Quiz &amp; study links
      </h2>
      <p className="club-quiz-discovery__lead">{lead}</p>
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
