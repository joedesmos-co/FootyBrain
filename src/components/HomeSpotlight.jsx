import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { getTodayKey } from '../hooks/useDailyChallenge';
import { getHomeSpotlightSlides } from '../utils/homeSpotlight';
import PlayerVisual from './PlayerVisual';
import TeamBadge from './TeamBadge';
import LeagueBadge from './LeagueBadge';
import PageFallback from './PageFallback';

const ROTATE_MS = 9000;

function SpotlightVisual({ slide }) {
  if (!slide) return null;
  if (slide.kind === 'player' && slide.player) {
    return (
      <span className="home-spotlight__visual" aria-hidden="true">
        <PlayerVisual player={slide.player} size="card" />
      </span>
    );
  }
  if (slide.kind === 'club' && slide.team) {
    return (
      <span className="home-spotlight__visual" aria-hidden="true">
        <TeamBadge team={slide.team} />
      </span>
    );
  }
  if (slide.kind === 'league' && slide.league) {
    return (
      <span className="home-spotlight__visual" aria-hidden="true">
        <LeagueBadge league={slide.league} size="thumb" />
      </span>
    );
  }
  if (slide.kind === 'rivalry' && slide.team) {
    return (
      <span className="home-spotlight__visual" aria-hidden="true">
        <TeamBadge team={slide.team} />
      </span>
    );
  }
  if (slide.kind === 'quiz') {
    return (
      <span className="home-spotlight__visual home-spotlight__visual--quiz" aria-hidden="true">
        <span className="home-spotlight__quiz-icon">{slide.quizType?.icon ?? '⚽'}</span>
      </span>
    );
  }
  return null;
}

export default function HomeSpotlight() {
  const [bundle, setBundle] = useState(null);
  const [refreshSalt, setRefreshSalt] = useState(0);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    let cancelled = false;
    import('../data/sampleData.js').then((mod) => {
      if (cancelled) return;
      const players = mod.players.map((p) => ({
        ...p,
        _teamName: mod.getTeamName(p.teamId),
      }));
      setBundle({ players, teams: mod.teams, leagues: mod.leagues });
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const slides = useMemo(() => {
    if (!bundle) return [];
    return getHomeSpotlightSlides(
      bundle.players,
      bundle.teams,
      bundle.leagues,
      getTodayKey(),
      refreshSalt,
    );
  }, [bundle, refreshSalt]);

  const slide = slides[activeIndex] ?? slides[0];
  const slideCount = slides.length;

  const goNext = useCallback(() => {
    if (slideCount < 2) return;
    setActiveIndex((i) => (i + 1) % slideCount);
  }, [slideCount]);

  const goPrev = useCallback(() => {
    if (slideCount < 2) return;
    setActiveIndex((i) => (i - 1 + slideCount) % slideCount);
  }, [slideCount]);

  const handleRefresh = () => {
    setRefreshSalt((n) => n + 1);
    setActiveIndex(0);
  };

  useEffect(() => {
    if (slideCount < 2) return undefined;
    const prefersReduced =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) return undefined;
    const id = window.setInterval(goNext, ROTATE_MS);
    return () => window.clearInterval(id);
  }, [slideCount, goNext]);

  if (!bundle) {
    return <PageFallback label="Loading featured picks…" />;
  }

  if (!slide) return null;

  return (
    <section className="home-spotlight" aria-labelledby="home-spotlight-title">
      <div className="home-spotlight__header">
        <div>
          <h2 id="home-spotlight-title">Featured today</h2>
          <p>Fresh picks across players, clubs, leagues, rivalries, and quizzes.</p>
        </div>
        <button type="button" className="btn btn--secondary btn--small" onClick={handleRefresh}>
          Refresh picks
        </button>
      </div>

      <div className="home-spotlight__carousel">
        {slideCount > 1 ? (
          <button
            type="button"
            className="home-spotlight__arrow home-spotlight__arrow--prev"
            onClick={goPrev}
            aria-label="Previous featured pick"
          >
            ‹
          </button>
        ) : null}

        <article className="home-spotlight__card">
          <Link to={slide.to} className="home-spotlight__link">
            <SpotlightVisual slide={slide} />
            <div className="home-spotlight__body">
              <span className="home-spotlight__label">{slide.label}</span>
              <h3 className="home-spotlight__title">{slide.title}</h3>
              {slide.meta ? <p className="home-spotlight__meta">{slide.meta}</p> : null}
              {slide.note ? <p className="home-spotlight__note">{slide.note}</p> : null}
              <span className="home-spotlight__cta">Open →</span>
            </div>
          </Link>
        </article>

        {slideCount > 1 ? (
          <button
            type="button"
            className="home-spotlight__arrow home-spotlight__arrow--next"
            onClick={goNext}
            aria-label="Next featured pick"
          >
            ›
          </button>
        ) : null}
      </div>

      {slideCount > 1 ? (
        <div className="home-spotlight__nav" role="tablist" aria-label="Featured spotlight">
          {slides.map((item, index) => (
            <button
              key={`${item.kind}-${item.title}`}
              type="button"
              role="tab"
              aria-selected={index === activeIndex}
              aria-label={item.label}
              className={`home-spotlight__dot${index === activeIndex ? ' home-spotlight__dot--active' : ''}`}
              onClick={() => setActiveIndex(index)}
            />
          ))}
        </div>
      ) : null}
    </section>
  );
}
