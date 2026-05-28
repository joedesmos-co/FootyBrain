import { Link } from 'react-router-dom';

const PILLARS = [
  {
    id: 'learn',
    title: 'Learn',
    summary: 'Football player profiles, club squads, league hubs, and national team pools.',
    links: [
      { to: '/browse', label: 'Browse players' },
      { to: '/teams', label: 'Browse clubs' },
      { to: '/hubs', label: 'Search hubs' },
    ],
  },
  {
    id: 'quiz',
    title: 'Quiz',
    summary: 'Guess-the-player hints, club knowledge, daily streaks, and themed football pools.',
    links: [
      { to: '/quiz', label: 'Player quiz' },
      { to: '/club-quiz', label: 'Club quiz' },
      { to: '/daily', label: 'Daily challenge' },
    ],
  },
  {
    id: 'discover',
    title: 'Discover',
    summary: 'World Cup 2026 prep, collections, learning paths, and long-tail football study pages.',
    links: [
      { to: '/world-cup', label: 'World Cup hub' },
      { to: '/national-teams', label: 'National teams' },
      { to: '/collections', label: 'Collections' },
    ],
  },
];

export default function HomePillars() {
  return (
    <section className="home-pillars" aria-labelledby="home-pillars-title">
      <div className="home-pillars__header">
        <h2 id="home-pillars-title">Learn · Quiz · Discover</h2>
        <p>Three ways to use FootyCompass — study first, test yourself, then go deeper.</p>
      </div>
      <ul className="home-pillars__grid">
        {PILLARS.map((pillar) => (
          <li key={pillar.id}>
            <article className="home-pillar-card">
              <h3 className="home-pillar-card__title">{pillar.title}</h3>
              <p className="home-pillar-card__summary">{pillar.summary}</p>
              <ul className="home-pillar-card__links">
                {pillar.links.map((link) => (
                  <li key={link.to}>
                    <Link to={link.to}>{link.label}</Link>
                  </li>
                ))}
              </ul>
            </article>
          </li>
        ))}
      </ul>
    </section>
  );
}
