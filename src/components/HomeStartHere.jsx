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
    title: 'Test football knowledge',
    description: 'Hints, career paths, and daily challenges.',
    to: '/quiz',
    cta: 'Play quiz',
  },
];

export default function HomeStartHere() {
  return (
    <section className="home-start" aria-labelledby="home-start-title">
      <div className="home-start__header">
        <h2 id="home-start-title">Start here</h2>
        <p>New to FootyCompass? Pick a lane.</p>
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
