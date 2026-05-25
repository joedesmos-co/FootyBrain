import { useEffect, useState } from 'react';

// TODO: Future Firebase sync — replace readStorage / persist with Firestore reads and writes
//       once authentication is added. Store progression under users/{uid}/progression.
//       The hook interface (recordAnswer, reset) stays identical; only the I/O layer changes.

const STORAGE_KEY = 'footybrain:progression';
const CHANGE_EVENT = 'footybrain:progression-changed';

// ---------------------------------------------------------------------------
// Leveling formula
// XP needed to advance from level N to N+1 = N * 100.
// Level 1→2: 100 XP, Level 2→3: 200 XP, Level 5→6: 500 XP, etc.
// ---------------------------------------------------------------------------
export function xpToAdvance(level) {
  return level * 100;
}

/**
 * Given a raw total-XP number, return:
 *   level          – current level (≥ 1)
 *   xpIntoLevel    – XP earned within the current level
 *   xpForNextLevel – XP required to complete the current level
 */
export function calculateLevel(totalXp) {
  let level = 1;
  let accumulated = 0;
  let needed = xpToAdvance(level);
  while (totalXp >= accumulated + needed) {
    accumulated += needed;
    level += 1;
    needed = xpToAdvance(level);
  }
  return { level, xpIntoLevel: totalXp - accumulated, xpForNextLevel: needed };
}

// ---------------------------------------------------------------------------
// Storage helpers
// ---------------------------------------------------------------------------
const EMPTY = {
  xp: 0,
  totalAnswered: 0,
  totalCorrect: 0,
  bestStreak: 0,
  completedTeamQuizzes: [],   // [teamId, ...]
  completedLeagueQuizzes: [], // [leagueId, ...]
  earnedAchievements: [],     // [achievementId, ...]
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
  };
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
// Achievement resolution
// Accepts the candidate state + the session streak for the current answer.
// Returns a new (possibly larger) earnedAchievements array.
// ---------------------------------------------------------------------------
function resolveAchievements(state, sessionStreak = 0) {
  const earned = new Set(state.earnedAchievements);
  if (state.totalCorrect >= 1) earned.add('first_correct');
  if (sessionStreak >= 5) earned.add('streak_5');
  if (sessionStreak >= 10) earned.add('streak_10');
  if (state.totalAnswered >= 10) earned.add('answered_10');
  if (state.totalAnswered >= 50) earned.add('answered_50');
  if (calculateLevel(state.xp).level >= 5) earned.add('level_5');
  if (state.completedTeamQuizzes.length >= 1) earned.add('team_quiz_first');
  if (state.completedLeagueQuizzes.length >= 1) earned.add('league_quiz_first');
  return [...earned];
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

    // ── Actions ────────────────────────────────────────────────────────────

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
     * @returns {number} Base XP awarded (for "+N XP" display; excludes milestone bonus).
     */
    recordAnswer({ isCorrect, newSessionStreak, sessionMilestone = null }) {
      // Base XP is deterministic from the answer + streak; no state read needed.
      const baseXp = isCorrect
        ? 10 + (newSessionStreak > 0 && newSessionStreak % 5 === 0 ? 5 : 0)
        : 0;

      const teams = [...state.completedTeamQuizzes];
      const lgues = [...state.completedLeagueQuizzes];
      let milestoneXp = 0;

      if (sessionMilestone) {
        const { teamId, leagueId, correct, total } = sessionMilestone;
        // newFirstCompletion gates the accuracy bonus so it can only be earned
        // once per team/league — not re-farmed by switching filters and replaying.
        let newFirstCompletion = false;
        if (teamId && !teams.includes(teamId)) {
          teams.push(teamId);
          milestoneXp += 25; // first team-quiz completion bonus
          newFirstCompletion = true;
        }
        if (leagueId && !lgues.includes(leagueId)) {
          lgues.push(leagueId);
          milestoneXp += 50; // first league-quiz completion bonus
          newFirstCompletion = true;
        }
        // Accuracy bonus: ≥ 60% correct, awarded only on genuine first completion.
        // Gating on newFirstCompletion means it cannot be re-earned by replaying
        // a filter combo that was already completed.
        if (newFirstCompletion && correct >= 1 && correct / total >= 0.6) milestoneXp += 15;
      }

      const next = {
        ...state,
        xp: state.xp + baseXp + milestoneXp,
        totalAnswered: state.totalAnswered + 1,
        totalCorrect: isCorrect ? state.totalCorrect + 1 : state.totalCorrect,
        bestStreak: isCorrect
          ? Math.max(state.bestStreak, newSessionStreak)
          : state.bestStreak,
        completedTeamQuizzes: teams,
        completedLeagueQuizzes: lgues,
      };
      next.earnedAchievements = resolveAchievements(
        next,
        isCorrect ? newSessionStreak : 0,
      );

      commit(next);
      return baseXp;
    },

    /** Wipe all progression data. Useful for development and testing. */
    reset() {
      const fresh = sanitize({});
      setState(fresh);
      persist(fresh);
    },
  };
}
