import { useEffect, useState } from 'react';
import {
  getNewAchievementIds,
  resolveAchievements,
} from '../utils/progressionAchievements';
import { calculateLevel } from '../utils/progressionLevel';

// TODO: Future Firebase sync — replace readStorage / persist with Firestore reads and writes
//       once authentication is added. Store progression under users/{uid}/progression.
//       The hook interface (recordAnswer, reset) stays identical; only the I/O layer changes.

export { calculateLevel, xpToAdvance } from '../utils/progressionLevel';

const STORAGE_KEY = 'footybrain:progression';
const CHANGE_EVENT = 'footybrain:progression-changed';

// ---------------------------------------------------------------------------
// Storage helpers
// ---------------------------------------------------------------------------
export const COLLECTION_ITEM_XP = 5;
export const COLLECTION_COMPLETE_XP = 30;
export const COMPARE_XP = 5;

const EMPTY = {
  xp: 0,
  totalAnswered: 0,
  totalCorrect: 0,
  bestStreak: 0,
  quizSessionsCompleted: 0,
  compareCount: 0,
  collectionsCompleted: 0,
  completedTeamQuizzes: [],
  completedLeagueQuizzes: [],
  earnedAchievements: [],
  collectionItemXpAwarded: [],
  collectionCompleteXpAwarded: [],
  comparePairXpAwarded: [],
};

function sanitize(raw) {
  return {
    xp: Number.isFinite(raw?.xp) && raw.xp >= 0 ? raw.xp : 0,
    totalAnswered: Number.isFinite(raw?.totalAnswered) ? raw.totalAnswered : 0,
    totalCorrect: Number.isFinite(raw?.totalCorrect) ? raw.totalCorrect : 0,
    bestStreak: Number.isFinite(raw?.bestStreak) ? raw.bestStreak : 0,
    completedTeamQuizzes: Array.isArray(raw?.completedTeamQuizzes)
      ? raw.completedTeamQuizzes
      : [],
    completedLeagueQuizzes: Array.isArray(raw?.completedLeagueQuizzes)
      ? raw.completedLeagueQuizzes
      : [],
    earnedAchievements: Array.isArray(raw?.earnedAchievements)
      ? raw.earnedAchievements
      : [],
    collectionItemXpAwarded: Array.isArray(raw?.collectionItemXpAwarded)
      ? raw.collectionItemXpAwarded
      : [],
    collectionCompleteXpAwarded: Array.isArray(raw?.collectionCompleteXpAwarded)
      ? raw.collectionCompleteXpAwarded
      : [],
    quizSessionsCompleted: Number.isFinite(raw?.quizSessionsCompleted)
      ? raw.quizSessionsCompleted
      : 0,
    compareCount: Number.isFinite(raw?.compareCount) ? raw.compareCount : 0,
    collectionsCompleted: Number.isFinite(raw?.collectionsCompleted)
      ? Math.max(
          raw.collectionsCompleted,
          Array.isArray(raw?.collectionCompleteXpAwarded)
            ? raw.collectionCompleteXpAwarded.length
            : 0,
        )
      : Array.isArray(raw?.collectionCompleteXpAwarded)
        ? raw.collectionCompleteXpAwarded.length
        : 0,
    comparePairXpAwarded: Array.isArray(raw?.comparePairXpAwarded)
      ? raw.comparePairXpAwarded
      : [],
  };
}

function comparePairKey(idA, idB) {
  return [idA, idB].sort().join('|');
}

function commitAchievements(next, sessionStreak = 0) {
  const before = next.earnedAchievements ?? [];
  next.earnedAchievements = resolveAchievements(next, sessionStreak);
  const newAchievementIds = getNewAchievementIds(before, next.earnedAchievements);
  return { next, newAchievementIds };
}

function collectionItemXpKey(collectionId, itemIndex) {
  return `${collectionId}:${itemIndex}`;
}

function readStorage() {
  if (typeof window === 'undefined') return { ...EMPTY };
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? sanitize(JSON.parse(raw)) : { ...EMPTY };
  } catch {
    return { ...EMPTY };
  }
}

function persist(state) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // localStorage unavailable — in-memory state keeps the UI working.
  }
  // Notify all hook instances in this tab so the XP bar stays in sync.
  window.dispatchEvent(new CustomEvent(CHANGE_EVENT, { detail: state }));
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------
export function useProgression() {
  const [state, setState] = useState(readStorage);

  useEffect(() => {
    const onSync = (event) => {
      setState(
        event instanceof CustomEvent && event.detail
          ? sanitize(event.detail)
          : readStorage(),
      );
    };
    window.addEventListener('storage', onSync);
    window.addEventListener(CHANGE_EVENT, onSync);
    return () => {
      window.removeEventListener('storage', onSync);
      window.removeEventListener(CHANGE_EVENT, onSync);
    };
  }, []);

  // commit: apply an update derived from current state, persist, and broadcast.
  // We derive `next` from the closure `state` (same pattern as useFavorites).
  // This is safe because QuizMode calls commit exactly once per user action
  // (via the single recordAnswer call), so there is no stale-state batching risk.
  function commit(next) {
    const clean = sanitize(next);
    setState(clean);
    persist(clean);
  }

  const { level, xpIntoLevel, xpForNextLevel } = calculateLevel(state.xp);

  return {
    // ── Derived state ──────────────────────────────────────────────────────
    level,
    xpIntoLevel,
    xpForNextLevel,

    // ── Raw state (spread for easy destructuring in consumers) ─────────────
    xp: state.xp,
    totalAnswered: state.totalAnswered,
    totalCorrect: state.totalCorrect,
    bestStreak: state.bestStreak,
    completedTeamQuizzes: state.completedTeamQuizzes,
    completedLeagueQuizzes: state.completedLeagueQuizzes,
    earnedAchievements: state.earnedAchievements,
    collectionItemXpAwarded: state.collectionItemXpAwarded,
    collectionCompleteXpAwarded: state.collectionCompleteXpAwarded,
    quizSessionsCompleted: state.quizSessionsCompleted,
    compareCount: state.compareCount,
    collectionsCompleted: state.collectionsCompleted,

    // ── Actions ────────────────────────────────────────────────────────────

    /**
     * One-time XP for marking a collection item as learned.
     * @returns {number} XP awarded (0 if already claimed).
     */
    awardCollectionItemXp(collectionId, itemIndex) {
      const key = collectionItemXpKey(collectionId, itemIndex);
      if (state.collectionItemXpAwarded.includes(key)) return 0;
      let next = {
        ...state,
        xp: state.xp + COLLECTION_ITEM_XP,
        collectionItemXpAwarded: [...state.collectionItemXpAwarded, key],
      };
      ({ next } = commitAchievements(next, 0));
      commit(next);
      return COLLECTION_ITEM_XP;
    },

    /**
     * One-time XP for completing a collection.
     * @returns {number} XP awarded (0 if already claimed).
     */
    awardCollectionCompleteXp(collectionId) {
      if (state.collectionCompleteXpAwarded.includes(collectionId)) return 0;
      let next = {
        ...state,
        xp: state.xp + COLLECTION_COMPLETE_XP,
        collectionsCompleted: state.collectionsCompleted + 1,
        collectionCompleteXpAwarded: [
          ...state.collectionCompleteXpAwarded,
          collectionId,
        ],
      };
      ({ next } = commitAchievements(next, 0));
      commit(next);
      return COLLECTION_COMPLETE_XP;
    },

    /**
     * Record a player or club comparison (once per unique pair earns XP).
     * @returns {{ xp: number, newAchievementIds: string[] }}
     */
    recordCompare(entityIdA, entityIdB) {
      const pairKey = comparePairKey(entityIdA, entityIdB);
      const firstPair = !state.comparePairXpAwarded.includes(pairKey);
      const xpGain = firstPair ? COMPARE_XP : 0;

      let next = {
        ...state,
        compareCount: state.compareCount + 1,
        comparePairXpAwarded: firstPair
          ? [...state.comparePairXpAwarded, pairKey]
          : state.comparePairXpAwarded,
        xp: state.xp + xpGain,
      };
      const { newAchievementIds } = commitAchievements(next, 0);
      commit(next);
      return { xp: xpGain, newAchievementIds };
    },

    /**
     * Record the outcome of a quiz answer.
     * Optionally includes a session milestone so everything lands in one commit.
     *
     * @param {{
     *   isCorrect: boolean,
     *   newSessionStreak: number,          – streak value AFTER this answer
     *   sessionMilestone?: {               – include when the 5-question milestone is hit
     *     teamId?: string,
     *     leagueId?: string,
     *     correct: number,
     *     total: number,
     *   } | null
     * }}
     * @returns {{
     *   baseXp: number,
     *   streakBonus: number,
     *   milestoneXp: number,
     *   totalXp: number,
     *   newAchievementIds: string[],
     *   sessionMilestoneHit: object | null,
     * }}
     */
    recordAnswer({ isCorrect, newSessionStreak, sessionMilestone = null }) {
      const streakBonus =
        isCorrect && newSessionStreak > 0 && newSessionStreak % 5 === 0 ? 5 : 0;
      const baseXp = isCorrect ? 10 + streakBonus : 0;

      const teams = [...state.completedTeamQuizzes];
      const lgues = [...state.completedLeagueQuizzes];
      let milestoneXp = 0;
      let quizSessionsCompleted = state.quizSessionsCompleted;

      if (sessionMilestone) {
        quizSessionsCompleted += 1;
        const { teamId, leagueId, correct, total } = sessionMilestone;
        let newFirstCompletion = false;
        if (teamId && !teams.includes(teamId)) {
          teams.push(teamId);
          milestoneXp += 25;
          newFirstCompletion = true;
        }
        if (leagueId && !lgues.includes(leagueId)) {
          lgues.push(leagueId);
          milestoneXp += 50;
          newFirstCompletion = true;
        }
        if (newFirstCompletion && correct >= 1 && correct / total >= 0.6) milestoneXp += 15;
      }

      let next = {
        ...state,
        xp: state.xp + baseXp + milestoneXp,
        totalAnswered: state.totalAnswered + 1,
        totalCorrect: isCorrect ? state.totalCorrect + 1 : state.totalCorrect,
        bestStreak: isCorrect
          ? Math.max(state.bestStreak, newSessionStreak)
          : state.bestStreak,
        completedTeamQuizzes: teams,
        completedLeagueQuizzes: lgues,
        quizSessionsCompleted,
      };
      const { next: withAchievements, newAchievementIds } = commitAchievements(
        next,
        isCorrect ? newSessionStreak : 0,
      );
      commit(withAchievements);

      return {
        baseXp,
        streakBonus,
        milestoneXp,
        totalXp: baseXp + milestoneXp,
        newSessionStreak: isCorrect ? newSessionStreak : 0,
        newAchievementIds,
        sessionMilestoneHit: sessionMilestone,
      };
    },

    /**
     * Record the results of a completed daily challenge in a single atomic commit.
     * Avoids stale-state issues that would arise from calling recordAnswer in a loop.
     * Idempotency (don't double-award) is enforced by the daily hook before this is called.
     *
     * @param {{
     *   results: boolean[],   – isCorrect per question
     *   bonusXp?: number,     – completion bonus (computed by getDailyCompletionBonus)
     * }}
     * @returns {number} Total XP awarded.
     */
    recordDailyChallenge({ results, bonusXp = 0 }) {
      const correctCount = results.filter(Boolean).length;
      const xpFromAnswers = correctCount * 10;
      const total = Math.max(xpFromAnswers + bonusXp, 0);

      let next = {
        ...state,
        xp: state.xp + total,
        totalAnswered: state.totalAnswered + results.length,
        totalCorrect: state.totalCorrect + correctCount,
        bestStreak: state.bestStreak,
        completedTeamQuizzes: state.completedTeamQuizzes,
        completedLeagueQuizzes: state.completedLeagueQuizzes,
        collectionItemXpAwarded: state.collectionItemXpAwarded,
        collectionCompleteXpAwarded: state.collectionCompleteXpAwarded,
        quizSessionsCompleted: state.quizSessionsCompleted,
        compareCount: state.compareCount,
        collectionsCompleted: state.collectionsCompleted,
        comparePairXpAwarded: state.comparePairXpAwarded,
      };
      ({ next } = commitAchievements(next, 0));
      commit(next);
      return total;
    },

    /** Wipe all progression data. Useful for development and testing. */
    reset() {
      const fresh = sanitize({});
      setState(fresh);
      persist(fresh);
    },
  };
}
