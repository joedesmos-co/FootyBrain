import { Link } from 'react-router-dom';
import { leagues, players, teams } from '../data/sampleData';

const features = [
  {
    to: '/browse',
    label: 'Database',
    title: 'Browse Database',
    description: 'Filter leagues and clubs, then open visual player cards with context that sticks.',
    stat: `${players.length} players`,
  },
  {
    to: '/teams',
    label: 'Fan Mode',
    title: 'Club Learning Paths',
    description: 'Learn the basics, squad, rivals, legends, and fan culture for each club.',
    stat: `${teams.length} teams`,
  },
  {
    to: '/quiz',
    label: 'Quiz',
    title: 'Practice With Hints',
    description: 'Use progressive clues, difficulty levels, and feedback to build recall.',
    stat: '3 levels',
  },
  {
    to: '/saved',
    label: 'Saved',
    title: 'Saved Learning',
    description: 'Keep a local list of players and clubs you want to revisit next.',
    stat: 'Local only',
  },
];

export default function Home() {
  return (
    <div className="home">
      <section className="hero">
        <div className="hero__content">
          <p className="hero__eyebrow">Soccer learning database</p>
          <h1 className="hero__title">FootyBrain</h1>
          <p className="hero__tagline">
            Learn the game. Know the players. Become a real fan.
          </p>
          <p className="hero__copy">
            A football study app for new and returning fans who want names,
            clubs, positions, rivalries, and quiz practice in one clean place.
          </p>
          <div className="hero__actions">
            <Link to="/browse" className="btn btn--primary btn--large">
              Browse players
            </Link>
            <Link to="/quiz" className="btn btn--secondary btn--large">
              Start quiz
            </Link>
          </div>
          <dl className="hero__stats" aria-label="FootyBrain sample data">
            <div>
              <dt>{players.length}</dt>
              <dd>Players</dd>
            </div>
            <div>
              <dt>{teams.length}</dt>
              <dd>Teams</dd>
            </div>
            <div>
              <dt>{leagues.length}</dt>
              <dd>Leagues</dd>
            </div>
          </dl>
        </div>

        <div className="hero-visual" aria-hidden="true">
          <div className="hero-visual__pitch">
            <span className="hero-visual__line hero-visual__line--half" />
            <span className="hero-visual__line hero-visual__line--box" />
            <article className="floating-card floating-card--primary">
              <span className="floating-card__label">Player card</span>
              <strong>Bukayo Saka</strong>
              <span>RW · Arsenal · 92</span>
            </article>
            <article className="floating-card floating-card--club">
              <span className="floating-card__label">Fan Mode</span>
              <strong>Arsenal</strong>
              <span>Rivals · Legends · Culture</span>
            </article>
            <article className="floating-card floating-card--quiz">
              <span className="floating-card__label">Quiz clue</span>
              <strong>Right winger</strong>
              <span>England · Premier League</span>
            </article>
            <div className="squad-tile squad-tile--one" />
            <div className="squad-tile squad-tile--two" />
            <div className="squad-tile squad-tile--three" />
          </div>
        </div>
      </section>

      <section className="feature-grid" aria-label="Main features">
        {features.map((feature) => (
          <Link key={feature.to} to={feature.to} className="feature-card">
            <span className="feature-card__label">{feature.label}</span>
            <div className="feature-card__topline">
              <h2 className="feature-card__title">{feature.title}</h2>
              <span>{feature.stat}</span>
            </div>
            <p className="feature-card__text">{feature.description}</p>
            <span className="feature-card__cta">Open</span>
          </Link>
        ))}
      </section>
    </div>
  );
}
