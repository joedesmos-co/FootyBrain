import { useEffect, useLayoutEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  getCollectionById,
  isAdvancedFootballCollection,
  isNationalTeamLearningCollection,
} from '../data/collectionsData';
import { getNationalTeamName } from '../data/nationalTeamData';
import { getManifestLeague } from '../data/contentManifest';
import { peekTeamName } from '../data/teamStore';
import { useCollectionProgress } from '../hooks/useCollectionProgress';
import {
  getCollectionQuizHref,
  getEntityLabel,
  getEntityProfilePath,
  resolveCollectionItems,
} from '../utils/collections';
import NationalTeamBadge from './NationalTeamBadge';
import PlayerVisual from './PlayerVisual';
import TeamBadge from './TeamBadge';
import { canonicalUrlForPath } from '../utils/brand.js';
import { getCanonicalUrl } from '../utils/jsonLd';
import { applyEntityNotFoundSeo, applyPageSeo, truncateMetaDescription } from '../utils/seoCtr.js';
import BreadcrumbNav from './BreadcrumbNav';
import ActionRow from './ui/ActionRow';
import SectionHeading from './ui/SectionHeading';

function XpToast({ message, onDismiss }) {
  if (!message) return null;
  return (
    <div className="collection-xp-toast" role="status" aria-live="polite">
      <span>{message}</span>
      <button type="button" className="collection-xp-toast__dismiss" onClick={onDismiss}>
        Dismiss
      </button>
    </div>
  );
}

function CollectionItemRow({
  collectionId,
  itemCount,
  resolved,
  viewed,
  learned,
  onMarkViewed,
  onMarkLearned,
}) {
  const { type, entity, note, index } = resolved;
  const profilePath = getEntityProfilePath(type, entity.id);
  const handleOpenProfile = () => onMarkViewed(collectionId, index);

  return (
    <li
      className={`collection-item${learned ? ' collection-item--done' : ''}${viewed && !learned ? ' collection-item--viewed' : ''}`}
    >
      <span className="collection-item__order" aria-hidden="true">
        {index + 1}
      </span>
      <div className="collection-item__body">
        <div className="collection-item__preview">
          {type === 'player' && <PlayerVisual player={entity} size="thumb" />}
          {type === 'team' && <TeamBadge team={entity} />}
          {type === 'league' && (
            <span
              className="collection-item__league-badge"
              style={{
                background: `linear-gradient(135deg, ${entity.badgeTheme.from}, ${entity.badgeTheme.to})`,
              }}
              aria-hidden="true"
            >
              {entity.name.slice(0, 2).toUpperCase()}
            </span>
          )}
          {type === 'national-team' && (
            <NationalTeamBadge nationalTeam={entity} size="thumb" />
          )}
          <div className="collection-item__identity">
            <h3>
              <Link to={profilePath} onClick={handleOpenProfile}>
                {entity.name}
              </Link>
            </h3>
            <p className="collection-item__meta">{getEntityLabel(resolved)}</p>
          </div>
        </div>
        <p className="collection-item__note">{note}</p>
        <div className="collection-item__status">
          {viewed && !learned && <span className="collection-item__viewed-badge">Viewed</span>}
          {learned && (
            <span className="collection-item__done-badge" aria-label="Learned">
              ✓ Learned
            </span>
          )}
        </div>
        <div className="collection-item__actions">
          <Link
            to={profilePath}
            className="btn btn--primary btn--small"
            onClick={handleOpenProfile}
          >
            Open profile
          </Link>
          {!learned && (
            viewed ? (
              <button
                type="button"
                className="btn btn--secondary btn--small"
                onClick={() => onMarkLearned(collectionId, index, itemCount)}
              >
                Mark learned
              </button>
            ) : (
              <span className="collection-item__mark-wrap">
                <button
                  type="button"
                  className="btn btn--secondary btn--small"
                  disabled
                  title="Open the profile first to unlock marking as learned"
                >
                  Mark learned
                </button>
                <span className="collection-item__mark-hint">Open the profile first</span>
              </span>
            )
          )}
        </div>
      </div>
    </li>
  );
}

function getLeagueName(leagueId) {
  return getManifestLeague(leagueId)?.name ?? 'Unknown';
}

function getTeamName(teamId) {
  return peekTeamName(teamId);
}

export default function CollectionDetailPage() {
  const { collectionId } = useParams();
  const collection = getCollectionById(collectionId);
  const {
    isItemViewed,
    isItemLearned,
    markItemViewed,
    markItemLearned,
    markCollectionComplete,
    resetCollection,
    getProgress,
  } = useCollectionProgress();
  const [xpToast, setXpToast] = useState('');
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  useEffect(() => {
    if (!collection) return;
    const canonical = getCanonicalUrl();
    if (!canonical) return;
    const itemCount = collection.items.length;
    const title = `${collection.title} — football study collection · FootyCompass`;
    const description = truncateMetaDescription(
      collection.description
        ? `${collection.description} Study ${itemCount} profiles, track progress, then finish with the linked quiz on FootyCompass.`
        : `Curated football study list with ${itemCount} player and club profiles — mark progress and practice with quizzes on FootyCompass.`,
    );
    applyPageSeo({
      title,
      description,
      canonicalUrl: canonical,
      robots: 'index,follow',
      breadcrumbs: [
        { name: 'Home', item: '/' },
        { name: 'Collections', item: '/collections' },
        { name: collection.title, item: canonical },
      ],
    });
  }, [collection]);

  useLayoutEffect(() => {
    if (collection) return undefined;
    applyEntityNotFoundSeo({
      label: 'Collection',
      canonicalUrl: canonicalUrlForPath(`/collections/${collectionId}`),
    });
    return undefined;
  }, [collection, collectionId]);

  const showXp = (xp) => {
    if (xp > 0) setXpToast(`+${xp} XP`);
    else setXpToast('');
  };

  if (!collection) {
    return (
      <div className="collections-page">
        <header className="page-header">
          <h1>Collection not found</h1>
          <p>
            <Link to="/collections">Back to collections</Link>
          </p>
        </header>
      </div>
    );
  }

  const itemCount = collection.items.length;
  const resolvedItems = resolveCollectionItems(collection.items);
  const progress = getProgress(collection.id, itemCount);
  const quizHref = getCollectionQuizHref(collection.quizLaunch, collection);
  const playerOnly =
    collection.items.length > 0 && collection.items.every((item) => item.type === 'player');
  const compareHint =
    playerOnly && collection.items.length >= 2
      ? `/compare?left=${collection.items[0].id}&right=${collection.items[1].id}`
      : null;

  const quizLabel = collection.quizLaunch?.teamId
    ? `Quiz: ${getTeamName(collection.quizLaunch.teamId)}`
    : collection.quizLaunch?.leagueId
      ? `Quiz: ${getLeagueName(collection.quizLaunch.leagueId)}`
      : collection.quizLaunch?.nationalTeamId
        ? `Quiz: ${getNationalTeamName(collection.quizLaunch.nationalTeamId)}`
        : 'Practice quiz';

  const handleMarkCollectionComplete = () => {
    const xp = markCollectionComplete(collection.id);
    showXp(xp);
  };

  const handleReset = () => {
    resetCollection(collection.id);
    setShowResetConfirm(false);
    setXpToast('');
  };

  return (
    <div className="collections-page collections-page--detail">
      <XpToast message={xpToast} onDismiss={() => setXpToast('')} />

      <BreadcrumbNav
        items={[
          { label: 'Home', to: '/' },
          { label: 'Collections', to: '/collections' },
          { label: collection.title },
        ]}
      />

      <header className="page-header collection-detail-header">
        <div className="collection-detail-header__meta">
          <span className={`collection-tag collection-tag--${collection.difficulty.toLowerCase()}`}>
            {collection.difficulty}
          </span>
          {collection.tags.map((tag) => (
            <span key={tag} className="collection-tag collection-tag--muted">
              {tag}
            </span>
          ))}
        </div>
        <h1>{collection.title}</h1>
        <p>{collection.description}</p>
        <div className="collection-detail-header__stats">
          <span>{itemCount} profiles</span>
          <span>
            {progress.viewedCount} viewed · {progress.learnedCount}/{progress.total} learned
          </span>
          <span>{progress.percent}% complete</span>
        </div>
        {progress.total > 0 && (
          <div
            className="collection-card__bar collection-detail-header__bar"
            role="progressbar"
            aria-valuenow={progress.percent}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Collection learning progress"
          >
            <div
              className="collection-card__bar-fill"
              style={{ width: `${progress.percent}%` }}
            />
          </div>
        )}
        {progress.collectionComplete && (
          <p className="collection-detail-header__complete">Collection complete</p>
        )}
        <p className="collection-detail-header__xp-hint">
          Open each profile, then tap Mark learned to track progress.
        </p>
        {(isAdvancedFootballCollection(collection.id) ||
          isNationalTeamLearningCollection(collection.id)) && (
          <p className="collection-detail-header__study-tip">
            Study flow: open each profile, save players to review later, use Compare for side-by-side
            roles, then run the scoped quiz.
          </p>
        )}
        <ActionRow className="collection-detail-header__actions">
          <Link to={quizHref} className="btn btn--primary">
            {quizLabel}
          </Link>
          {compareHint && (
            <Link to={compareHint} className="btn btn--secondary">
              Compare first two
            </Link>
          )}
          {!progress.collectionComplete && progress.learnedCount >= progress.total && progress.total > 0 && (
            <button
              type="button"
              className="btn btn--secondary"
              onClick={handleMarkCollectionComplete}
            >
              Mark collection complete
            </button>
          )}
          <Link to="/collections" className="btn btn--secondary">
            All collections
          </Link>
        </ActionRow>
        <div className="collection-detail-header__manage">
          {!showResetConfirm ? (
            <button
              type="button"
              className="btn btn--secondary btn--small collection-reset-btn"
              onClick={() => setShowResetConfirm(true)}
            >
              Reset collection progress
            </button>
          ) : (
            <div className="collection-reset-confirm">
              <p>Clear viewed, learned, and completion for this collection? XP already earned stays.</p>
              <div className="collection-reset-confirm__actions">
                <button
                  type="button"
                  className="btn btn--secondary btn--small"
                  onClick={() => setShowResetConfirm(false)}
                >
                  Cancel
                </button>
                <button type="button" className="btn btn--danger btn--small" onClick={handleReset}>
                  Reset progress
                </button>
              </div>
            </div>
          )}
        </div>
      </header>

      <section aria-label="Study checklist">
        <SectionHeading as="h2" className="collections-section-title">
          Study order
        </SectionHeading>
        <ol className="collection-items-list">
          {resolvedItems.map((resolved) => (
            <CollectionItemRow
              key={`${resolved.type}-${resolved.entity.id}`}
              collectionId={collection.id}
              itemCount={itemCount}
              resolved={resolved}
              viewed={isItemViewed(collection.id, resolved.index)}
              learned={isItemLearned(collection.id, resolved.index)}
              onMarkViewed={markItemViewed}
              onMarkLearned={(id, index, count) => showXp(markItemLearned(id, index, count))}
            />
          ))}
        </ol>
      </section>
    </div>
  );
}
