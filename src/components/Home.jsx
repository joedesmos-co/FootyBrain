import { Link } from 'react-router-dom';

const features = [
  {
    to: '/browse',
    title: 'Browse Database',
    description: 'Filter by league and team. Explore player cards, stats, and quick facts.',
    icon: '📊',
  },
  {
    to: '/quiz',
    title: 'Quiz Mode',
    description: 'Guess the player from hints. Test your fan knowledge one clue at a time.',
    icon: '🧠',
  },
  {
    to: '/teams',
    title: 'Team Learning',
    description: 'Stadiums, rivals, legends, and fan guides for clubs across Europe.',
    icon: '🏟️',
  },
];

export default function Home() {
  return (
    <div className="home">
      <section className="hero">
        <p className="hero__eyebrow">Soccer learning database</p>
        <h1 className="hero__title">FootyBrain</h1>
        <p className="hero__tagline">
          Learn the game. Know the players. Become a real fan.
        </p>
      </section>

      <section className="feature-grid" aria-label="Main features">
        {features.map((feature) => (
          <Link key={feature.to} to={feature.to} className="feature-card">
            <span className="feature-card__icon" aria-hidden="true">
              {feature.icon}
            </span>
            <h2 className="feature-card__title">{feature.title}</h2>
            <p className="feature-card__text">{feature.description}</p>
            <span className="feature-card__cta">Open →</span>
          </Link>
        ))}
      </section>
    </div>
  );
}
