// TODO: Future Firebase sync — replace readStorage / persist with Firestore reads and writes
//       once authentication is added. Store daily progress under users/{uid}/daily.
//       The hook interface (markCompleted, isCompleted, etc.) stays identical.

import { useState } from 'react';
import { players } from '../data/sampleData';

const STORAGE_KEY = 'footybrain:daily';
const DAILY_QUESTION_COUNT = 5;

// ---------------------------------------------------------------------------
// Date helpers
// ---------------------------------------------------------------------------
export function getTodayKey() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function getYesterdayKey() {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  const y = d.getFullYear();
  const mo = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${mo}-${day}`;
}

// ---------------------------------------------------------------------------
// Deterministic seeded RNG (Mulberry32)
// Produces identical question order for a given date on every device/refresh.
// ---------------------------------------------------------------------------
function dateToSeed(dateKey) {
  // 'YYYY-MM-DD' → numeric seed
  return dateKey.split('-').reduce((acc, part) => acc * 1000 + parseInt(part, 10), 0);
}

function makeRng(seed) {
  let s = seed >>> 0;
  return function () {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Fisher-Yates shuffle with seeded RNG, returns first n items
function seededSample(arr, n, rng) {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy.slice(0, n);
}

/**
 * Generate the deterministic list of daily challenge players for a given date.
 * Exported so it can be called from any component without the hook.
 */
export function generateDailyQuestions(dateKey) {
  const rng = makeRng(dateToSeed(dateKey));
  return seededSample(players, DAILY_QUESTION_COUNT, rng);
}

// ---------------------------------------------------------------------------
// Storage helpers
// ---------------------------------------------------------------------------
const EMPTY = {
  date: '',
  completed: false,
  score: 0,
  xpEarned: 0,
  dailyStreak: 0,
  lastCompletedDate: '',
  questionResults: [], // boolean[] — per-question isCorrect, stored for completion screen replay
};

function readStorage() {
  if (typeof window === 'undefined') return { ...EMPTY };
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? { ...EMPTY, ...JSON.parse(raw) } : { ...EMPTY };
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
}

// ---------------------------------------------------------------------------
// XP bonus formula for daily challenge completion
// ---------------------------------------------------------------------------
export function getDailyCompletionBonus(correctCount, total) {
  if (total < 1) return 0;
  if (correctCount === total) return 50;  // perfect score
  if (correctCount >= 4) return 25;
  if (correctCount >= 3) return 10;
  return 0;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------
export function useDailyChallenge() {
  const [stored, setStored] = useState(readStorage);

  const todayKey = getTodayKey();
  const todayData = stored.date === todayKey ? stored : null;
  const isCompleted = todayData?.completed ?? false;

  /**
   * Mark today's challenge as completed.
   * Idempotent — safe to call multiple times (subsequent calls are no-ops).
   *
   * @param {{ score: number, xpEarned: number, questionResults: boolean[] }}
   */
  function markCompleted({ score, xpEarned, questionResults }) {
    // Guard: never double-complete the same day
    if (stored.date === todayKey && stored.completed) return;

    const yesterdayKey = getYesterdayKey();
    const prevStreak = stored.dailyStreak ?? 0;

    let newStreak;
    if (stored.lastCompletedDate === yesterdayKey) {
      newStreak = prevStreak + 1; // continued streak
    } else if (stored.lastCompletedDate === todayKey) {
      newStreak = prevStreak; // guard: somehow called twice in same day
    } else {
      newStreak = 1; // streak broken, or first ever completion
    }

    const next = {
      date: todayKey,
      completed: true,
      score,
      xpEarned,
      dailyStreak: newStreak,
      lastCompletedDate: todayKey,
      questionResults: Array.isArray(questionResults) ? questionResults : [],
    };

    setStored(next);
    persist(next);
  }

  return {
    todayKey,
    // Deterministic questions for today — same result on every call/refresh
    questions: generateDailyQuestions(todayKey),
    isCompleted,
    // Completion data from storage (non-null only when today is completed)
    completionData: isCompleted ? todayData : null,
    // Current streak (0 if never completed, resets if a day is missed)
    dailyStreak: stored.dailyStreak,
    // Whether user has an active streak going (completed yesterday or today)
    hasActiveStreak:
      stored.lastCompletedDate === getYesterdayKey() ||
      stored.lastCompletedDate === todayKey,
    markCompleted,
  };
}
