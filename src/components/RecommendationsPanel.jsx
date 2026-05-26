import { Link } from 'react-router-dom';

function RecCard({ rec }) {
  return (
    <Link to={rec.href} className="rec-card">
      <div className="rec-card__main">
        <strong className="rec-card__title">{rec.title}</strong>
        {rec.meta && <span className="rec-card__meta">{rec.meta}</span>}
      </div>
      <span className="rec-card__reason">{rec.reason}</span>
    </Link>
  );
}

function RecSection({ title, items }) {
  if (!items?.length) return null;
  return (
    <div className="rec-panel__block">
      <h3 className="rec-panel__subtitle">{title}</h3>
      <ul className="rec-panel__list">
        {items.map((rec) => (
          <li key={`${rec.type}-${rec.id ?? rec.href}`}>
            <RecCard rec={rec} />
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function RecommendationsPanel({
  recommendations,
  title = 'Learn next',
  showEditPrefs = false,
  compact = false,
  footerLink,
}) {
  const {
    players,
    teams,
    leagues,
    collections,
    quizzes,
    knowledgeLabel,
  } = recommendations;

  const hasAny =
    players.length > 0 ||
    teams.length > 0 ||
    leagues.length > 0 ||
    collections.length > 0 ||
    quizzes.length > 0;

  if (!hasAny) return null;

  return (
    <section
      className={`rec-panel${compact ? ' rec-panel--compact' : ''}`}
      aria-label={title}
    >
      <div className="rec-panel__header">
        <h2 className="rec-panel__title">{title}</h2>
        {knowledgeLabel && (
          <span className="rec-panel__level">{knowledgeLabel}</span>
        )}
        {showEditPrefs && (
          <Link to="/onboarding?edit=1" className="rec-panel__edit">
            Edit preferences
          </Link>
        )}
      </div>

      <RecSection title="Collections" items={collections} />
      <RecSection title="Players" items={players} />
      <RecSection title="Teams" items={teams} />
      <RecSection title="Leagues" items={leagues} />
      <RecSection title="Quizzes" items={quizzes} />

      {footerLink && (
        <Link to={footerLink.to} className="rec-panel__footer">
          {footerLink.label}
        </Link>
      )}
    </section>
  );
}
