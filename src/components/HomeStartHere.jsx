import { Link } from 'react-router-dom';

const START_STEPS = [
  {
    id: 'learn',
    icon: '👤',
    title: 'Explore players',
    description: 'Profiles, positions, clubs, and career paths.',
    to: '/browse',
    cta: 'Browse players',
  },
  {
    id: 'clubs',
    icon: '🏟',
    title: 'Explore clubs',
    description: 'Squads, rivals, legends, and fan culture.',
    to: '/browse?tab=clubs',
    cta: 'Browse clubs',
  },
  {
    id: 'quiz',
    icon: '⚽',
    title: 'Player quizzes',
    description: 'Guess from hints — leagues, clubs, themed pools, daily challenge.',
    to: '/quiz',
    cta: 'Play player quiz',
  },
  {
    id: 'club-quiz',
    icon: '🏟',
    title: 'Club quizzes',
    description: 'Stadiums, rivalries, leagues, and kit cues — not player names.',
    to: '/club-quiz',
    cta: 'Play club quiz',
  },
  {
    id: 'hubs',
    icon: '🧭',
    title: 'Try search hubs',
    description: 'Long-tail pages for leagues, clubs, and player discovery.',
    to: '/hubs',
    cta: 'Open hubs',
  },
];

export default function HomeStartHere() {
  return (
    <section className="home-start" aria-labelledby="home-start-title">
      <div className="home-start__header">
        <h2 id="home-start-title">Start here</h2>
        <p>New to FootyCompass? Pick a lane and start exploring.</p>
      </div>
      <ul className="home-start__grid">
        {START_STEPS.map((step) => (
          <li key={step.id}>
            <Link to={step.to} className="home-start-card">
              <span className="home-start-card__icon" aria-hidden="true">
                {step.icon}
              </span>
              <span className="home-start-card__title">{step.title}</span>
              <span className="home-start-card__desc">{step.description}</span>
              <span className="home-start-card__cta">{step.cta} →</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
