import { collections } from '../data/collectionsData.js';

/**
 * Collections that include a given entity in their study checklist.
 * @param {'player' | 'team' | 'league' | 'national-team'} type
 * @param {string} id
 * @param {number} [limit]
 */
export function getCollectionsFeaturingEntity(type, id, limit = 2) {
  if (!type || !id) return [];
  const matches = [];
  for (const collection of collections) {
    const featured = collection.items?.some(
      (item) => item.type === type && item.id === id,
    );
    if (!featured) continue;
    matches.push({
      id: collection.id,
      title: collection.title,
      to: `/collections/${collection.id}`,
      difficulty: collection.difficulty,
    });
    if (matches.length >= limit) break;
  }
  return matches;
}

/**
 * @param {'player' | 'team' | 'league' | 'national-team'} type
 * @param {string} id
 * @param {number} [limit]
 * @returns {{ label: string, to: string, hint?: string }[]}
 */
export function buildCollectionDiscoveryLinks(type, id, limit = 2) {
  return getCollectionsFeaturingEntity(type, id, limit).map((c) => ({
    label: c.title,
    to: c.to,
    hint: `${c.difficulty} · curated study path`,
  }));
}
