import { getCollectionById } from '../data/collectionsData';
import { getNationalTeamById } from '../data/nationalTeamData';
import { getCollectionQuizHref, getEntityProfilePath, resolveCollectionItem } from './collections';

const STEP_KIND_LABELS = {
  collection: 'Collection',
  quiz: 'Quiz',
  profile: 'Profile',
};

const STEP_CTA_LABELS = {
  collection: 'Open collection',
  quiz: 'Start quiz',
  profile: 'Open profile',
};

/**
 * @param {import('../data/learningPathsData').learningPaths[0]['steps'][0]} step
 */
export function getLearningPathStepHref(step) {
  if (step.type === 'collection') {
    return `/collections/${step.collectionId}`;
  }
  if (step.type === 'quiz') {
    return getCollectionQuizHref(step.quizLaunch ?? null);
  }
  if (step.type === 'profile') {
    return getEntityProfilePath(step.entityType, step.id);
  }
  return '/browse';
}

/**
 * @param {import('../data/learningPathsData').learningPaths[0]['steps'][0]} step
 */
function isStepAvailable(step) {
  if (step.type === 'collection') {
    return Boolean(getCollectionById(step.collectionId));
  }
  if (step.type === 'profile') {
    if (step.entityType === 'national-team') {
      return Boolean(getNationalTeamById(step.id));
    }
    return Boolean(resolveCollectionItem({ type: step.entityType, id: step.id }));
  }
  return true;
}

/**
 * @param {import('../data/learningPathsData').learningPaths[0]} path
 */
export function resolveLearningPathSteps(path) {
  if (!path?.steps) return [];

  return path.steps
    .map((step, index) => ({
      ...step,
      index,
      kindLabel: STEP_KIND_LABELS[step.type] ?? step.type,
      ctaLabel: STEP_CTA_LABELS[step.type] ?? 'Open',
      href: getLearningPathStepHref(step),
    }))
    .filter(isStepAvailable);
}

export function getLearningPathStepCount(path) {
  return resolveLearningPathSteps(path).length;
}
