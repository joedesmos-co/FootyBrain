/**
 * Quiz ecosystem: all roster players, difficulty-aware session pools, and pick weighting.
 * Search completeness uses the full dataset; session frequency uses these weights.
 */

import {
  getQuizClueTier,
  hasEditorialQuizClues,
  isInQuizEcosystem,
} from './quizPlayerRules.js';
import { ensureQuizPlayablePlayer } from './quizPlayerSynthesis.js';

/** @typedef {'easy' | 'medium' | 'hard' | 'hardcore' | 'nerd'} QuizDifficultyId */

const DEFAULT_DIFFICULTY = 'medium';

/** Session gates — easy/medium favour recognizable players; hard+ opens deeper cuts. */
const SESSION_RULES = {
  easy: { minImportance: 58, syntheticMaxImportance: 62 },
  medium: { minImportance: 50, syntheticMaxImportance: 70 },
  hard: { minImportance: 42, syntheticMaxImportance: 100 },
  hardcore: { minImportance: 34, syntheticMaxImportance: 100 },
  nerd: { minImportance: 30, syntheticMaxImportance: 100 },
};

/** Share of ranked pool used for weighted random draw (lower = more star-heavy). */
const TOP_SLICE_RATIO = {
  easy: 0.4,
  medium: 0.52,
  hard: 0.62,
  hardcore: 0.72,
  nerd: 0.8,
};

function normalizeDifficulty(difficulty) {
  return SESSION_RULES[difficulty] ? difficulty : DEFAULT_DIFFICULTY;
}

function playerImportance(player) {
  return Number(player?.importanceScore) || 0;
}

/**
 * @param {object} player
 * @param {QuizDifficultyId} [difficulty]
 */
export function canAppearInQuizSession(player, difficulty = DEFAULT_DIFFICULTY) {
  if (!isInQuizEcosystem(player)) return false;
  const rules = SESSION_RULES[normalizeDifficulty(difficulty)];
  const importance = playerImportance(player);
  const editorial = hasEditorialQuizClues(player) || player?.hasEditorialClues === true;
  const hints = player?.quizHints ?? [];
  if (hints.length < 2) return false;

  if (editorial) return importance >= Math.max(rules.minImportance - 12, 20);

  if (importance < rules.minImportance) return false;
  if (importance > rules.syntheticMaxImportance) return true;
  return (
    normalizeDifficulty(difficulty) === 'hard' ||
    normalizeDifficulty(difficulty) === 'hardcore' ||
    normalizeDifficulty(difficulty) === 'nerd'
  );
}

/**
 * @param {object[]} pool
 * @param {QuizDifficultyId} [difficulty]
 */
export function filterQuizSessionPool(pool, difficulty = DEFAULT_DIFFICULTY) {
  if (!Array.isArray(pool)) return [];
  return pool.filter((player) => canAppearInQuizSession(player, difficulty));
}

/**
 * Difficulty-aware recognizability multiplier on pick weight.
 * @param {number} importance
 * @param {QuizDifficultyId} difficulty
 */
function applyRecognizabilityBias(weight, importance, difficulty) {
  const diff = normalizeDifficulty(difficulty);
  let w = weight;

  if (diff === 'easy') {
    if (importance >= 82) w *= 1.5;
    else if (importance >= 72) w *= 1.22;
    else if (importance < 62) w *= 0.28;
    else if (importance < 68) w *= 0.55;
  } else if (diff === 'medium') {
    if (importance >= 78) w *= 1.28;
    else if (importance >= 68) w *= 1.1;
    else if (importance < 54) w *= 0.45;
  } else if (diff === 'hard') {
    if (importance >= 80) w *= 1.08;
    else if (importance < 52) w *= 1.12;
    else if (importance >= 60 && importance <= 74) w *= 1.05;
  } else if (diff === 'hardcore') {
    if (importance >= 88) w *= 0.82;
    else if (importance < 50) w *= 1.18;
    else if (importance >= 52 && importance <= 70) w *= 1.1;
  } else if (diff === 'nerd') {
    if (importance >= 90) w *= 0.7;
    else if (importance >= 82) w *= 0.88;
    else if (importance < 48) w *= 1.22;
    else if (importance >= 50 && importance <= 68) w *= 1.15;
  }

  return w;
}

/**
 * @param {object} player
 * @param {QuizDifficultyId} [difficulty]
 */
export function getQuizPickWeight(player, difficulty = DEFAULT_DIFFICULTY) {
  const importance = playerImportance(player);
  let weight = importance;
  const tier = player?.quizClueTier ?? getQuizClueTier(player);

  if (tier === 'editorial' || player?.hasEditorialClues) weight += 28;
  else if (player?._syntheticClues || tier === 'synthetic') weight += 6;

  const hints = player?.quizHints?.length ?? 0;
  weight += Math.min(hints, 6) * 2;

  if (String(player?.quickFact ?? '').length > 28) weight += 4;

  const diff = normalizeDifficulty(difficulty);
  if (diff === 'easy' && tier === 'synthetic') weight *= 0.22;
  else if (diff === 'medium' && tier === 'synthetic') weight *= 0.48;
  else if (diff === 'hard' && tier === 'synthetic') weight *= 0.78;
  else if ((diff === 'hardcore' || diff === 'nerd') && tier === 'synthetic') weight *= 0.92;

  weight = applyRecognizabilityBias(weight, importance, diff);

  return Math.max(1, weight);
}

function getTopSliceCount(poolLength, difficulty) {
  const ratio = TOP_SLICE_RATIO[normalizeDifficulty(difficulty)] ?? 0.55;
  return Math.max(6, Math.ceil(poolLength * ratio));
}

/**
 * @param {object[]} pool
 * @param {string} [excludePlayerId] — never pick immediately after this player
 * @param {QuizDifficultyId} [difficulty]
 * @param {Set<string> | string[] | null} [askedPlayerIds] — session dedupe until pool exhausted
 */
export function pickWeightedFromQuizPool(
  pool,
  excludePlayerId = '',
  difficulty = DEFAULT_DIFFICULTY,
  askedPlayerIds = null,
) {
  let candidates = excludePlayerId ? pool.filter((p) => p.id !== excludePlayerId) : [...pool];
  if (candidates.length === 0) return null;

  const askedSet =
    askedPlayerIds instanceof Set
      ? askedPlayerIds
      : Array.isArray(askedPlayerIds)
        ? new Set(askedPlayerIds)
        : null;

  if (askedSet?.size && candidates.length > 1) {
    const fresh = candidates.filter((p) => !askedSet.has(p.id));
    if (fresh.length > 0) candidates = fresh;
  }

  if (candidates.length === 1) return candidates[0];

  const ranked = [...candidates].sort(
    (a, b) => getQuizPickWeight(b, difficulty) - getQuizPickWeight(a, difficulty),
  );
  const topCount = getTopSliceCount(ranked.length, difficulty);
  const topSlice = ranked.slice(0, topCount);

  let totalWeight = 0;
  const weights = topSlice.map((player, index) => {
    const w = getQuizPickWeight(player, difficulty) * (topSlice.length - index);
    totalWeight += w;
    return w;
  });

  let roll = Math.random() * totalWeight;
  for (let i = 0; i < topSlice.length; i += 1) {
    roll -= weights[i];
    if (roll <= 0) return topSlice[i];
  }
  return topSlice[topSlice.length - 1];
}

/**
 * @param {object} player
 * @param {{ teamName?: string, leagueName?: string }} [ctx]
 */
export function enrichPlayerForQuiz(player, ctx = {}) {
  if (!isInQuizEcosystem(player)) return null;
  return ensureQuizPlayablePlayer(player, ctx);
}

/**
 * Scale themed pool caps with source size — avoids hard 100-player ceilings on large themes.
 * @param {number} sourceLength
 * @param {number} [preferredCap]
 */
export function resolveThemePoolCap(sourceLength, preferredCap = 100) {
  if (!sourceLength) return 0;
  if (!preferredCap || preferredCap <= 0) return sourceLength;
  const scaled = Math.max(preferredCap, Math.round(sourceLength * 0.2));
  return Math.min(sourceLength, scaled);
}

/** @param {QuizDifficultyId} difficulty */
export function getDifficultyTopSliceRatio(difficulty) {
  return TOP_SLICE_RATIO[normalizeDifficulty(difficulty)] ?? 0.55;
}
