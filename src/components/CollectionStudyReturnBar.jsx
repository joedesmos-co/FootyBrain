import { useEffect, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { getCollectionById } from '../data/collectionsData';
import {
  clearCollectionStudy,
  getCollectionStudyContext,
  startCollectionStudy,
} from '../utils/collectionStudyContext';

export default function CollectionStudyReturnBar() {
  const [searchParams] = useSearchParams();
  const studyId = searchParams.get('study');

  useEffect(() => {
    if (!studyId) return;
    const collection = getCollectionById(studyId);
    startCollectionStudy(studyId, collection?.title ?? 'Collection');
  }, [studyId]);

  const context = useMemo(() => {
    if (studyId) {
      const collection = getCollectionById(studyId);
      return {
        collectionId: studyId,
        collectionTitle: collection?.title ?? 'Collection',
      };
    }
    return getCollectionStudyContext();
  }, [studyId]);

  if (!context?.collectionId) return null;

  const collectionHref = `/collections/${context.collectionId}`;

  const handleDone = () => {
    clearCollectionStudy();
  };

  return (
    <nav className="collection-study-return" aria-label="Return to collection study">
      <Link to={collectionHref} className="collection-study-return__back">
        <span className="collection-study-return__arrow" aria-hidden="true">
          ←
        </span>
        <span className="collection-study-return__text">
          <span className="collection-study-return__label">Back to collection</span>
          <span className="collection-study-return__name">{context.collectionTitle}</span>
        </span>
      </Link>
      <Link to={collectionHref} className="collection-study-return__done" onClick={handleDone}>
        Done studying
      </Link>
    </nav>
  );
}
