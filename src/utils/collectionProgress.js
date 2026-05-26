export function itemProgressKey(collectionId, index) {
  return `${collectionId}:${index}`;
}

export function getCollectionProgress(collectionId, itemCount, state) {
  const prefix = `${collectionId}:`;
  const viewedCount = state.viewed.filter((k) => k.startsWith(prefix)).length;
  const learnedCount = state.learned.filter((k) => k.startsWith(prefix)).length;
  const total = itemCount;
  const percent = total > 0 ? Math.round((learnedCount / total) * 100) : 0;
  const allItemsLearned = total > 0 && learnedCount >= total;
  const collectionComplete =
    state.completedCollections.includes(collectionId) || allItemsLearned;

  return {
    viewedCount,
    learnedCount,
    total,
    percent,
    allItemsLearned,
    collectionComplete,
    completed: collectionComplete,
  };
}
