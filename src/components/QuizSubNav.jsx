import { NavLink, useLocation } from 'react-router-dom';
import {
  LINK_THEMED_QUIZZES,
  NAME_CLUB_QUIZ,
  NAME_DAILY_CHALLENGE,
  NAME_PLAYER_QUIZ,
} from '../utils/entityCopy';

function isPlayerQuizActive(pathname) {
  return pathname === '/quiz';
}

function isClubQuizActive(pathname) {
  return pathname.startsWith('/club-quiz');
}

function isDailyActive(pathname) {
  return pathname === '/daily';
}

function isThemesActive(pathname) {
  return (
    pathname === '/hubs/quizzes/themes' || pathname.startsWith('/hubs/quizzes/theme/')
  );
}

/**
 * Shared quiz mode navigation — player, club, daily, and themed pools.
 */
export default function QuizSubNav() {
  const { pathname } = useLocation();

  return (
    <nav className="quiz-subnav" aria-label="Quiz modes">
      <NavLink
        to="/quiz"
        className={() =>
          `quiz-subnav__link${isPlayerQuizActive(pathname) ? ' quiz-subnav__link--active' : ''}`
        }
        end
      >
        {NAME_PLAYER_QUIZ}
      </NavLink>
      <NavLink
        to="/club-quiz"
        className={() =>
          `quiz-subnav__link${isClubQuizActive(pathname) ? ' quiz-subnav__link--active' : ''}`
        }
      >
        {NAME_CLUB_QUIZ}
      </NavLink>
      <NavLink
        to="/daily"
        className={() =>
          `quiz-subnav__link${isDailyActive(pathname) ? ' quiz-subnav__link--active' : ''}`
        }
      >
        {NAME_DAILY_CHALLENGE}
      </NavLink>
      <NavLink
        to="/hubs/quizzes/themes"
        className={() =>
          `quiz-subnav__link${isThemesActive(pathname) ? ' quiz-subnav__link--active' : ''}`
        }
      >
        {LINK_THEMED_QUIZZES}
      </NavLink>
    </nav>
  );
}
