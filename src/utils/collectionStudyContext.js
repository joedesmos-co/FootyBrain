const STORAGE_ID = 'footybrain:study-collection-id';
const STORAGE_TITLE = 'footybrain:study-collection-title';

export function startCollectionStudy(collectionId, collectionTitle) {
  if (!collectionId) return;
  try {
    sessionStorage.setItem(STORAGE_ID, collectionId);
    sessionStorage.setItem(STORAGE_TITLE, collectionTitle || 'Collection');
  } catch {
    /* private mode */
  }
}

export function getCollectionStudyContext() {
  try {
    const collectionId = sessionStorage.getItem(STORAGE_ID);
    if (!collectionId) return null;
    return {
      collectionId,
      collectionTitle: sessionStorage.getItem(STORAGE_TITLE) || 'Collection',
    };
  } catch {
    return null;
  }
}

export function clearCollectionStudy() {
  try {
    sessionStorage.removeItem(STORAGE_ID);
    sessionStorage.removeItem(STORAGE_TITLE);
  } catch {
    /* private mode */
  }
}

export function buildStudyProfileHref(profilePath, collectionId) {
  if (!collectionId || !profilePath) return profilePath;
  const joiner = profilePath.includes('?') ? '&' : '?';
  return `${profilePath}${joiner}study=${encodeURIComponent(collectionId)}`;
}
