/**
 * Navbar-only daily completion flag — avoids loading quiz/daily plan data on every route.
 */
import { useState } from 'react';

const STORAGE_KEY = 'footybrain:daily';

export function getTodayKey() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function readCompletedToday() {
  if (typeof window === 'undefined') return false;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return false;
    const parsed = JSON.parse(raw);
    return parsed.date === getTodayKey() && Boolean(parsed.completed);
  } catch {
    return false;
  }
}

export function useDailyCompletionStatus() {
  const [isCompleted, setIsCompleted] = useState(readCompletedToday);

  return {
    todayKey: getTodayKey(),
    isCompleted,
    /** Call after markCompleted on Daily page so navbar dot updates without reload. */
    refresh: () => setIsCompleted(readCompletedToday()),
  };
}
