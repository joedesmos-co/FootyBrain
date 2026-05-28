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

const SESSION_RULES = {
  easy: { minImportance: 55, syntheticMaxImportance: 64 },
  medium: { minImportance: 48, syntheticMaxImportance: 72 },
  hard: { minImportance: 40, syntheticMaxImportance: 100 },
  hardcore: { minImportance: 32, syntheticMaxImportance: 100 },
  nerd: { minImportance: 28, syntheticMaxImportance: 100 },
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

  if (editorial) return importance >= Math.max(rules.minImportance - 12, 20);

  const hints = player?.quizHints ?? [];
  if (hints.length < 2) return false;

  if (importance < rules.minImportance) return false;
  if (importance > rules.syntheticMaxImportance) return true;
  return normalizeDifficulty(difficulty) === 'hard' ||
    normalizeDifficulty(difficulty) === 'hardcore' ||
    normalizeDifficulty(difficulty) === 'nerd';
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
 * @param {object} player
 * @param {QuizDifficultyId} [difficulty]
 */
export function getQuizPickWeight(player, difficulty = DEFAULT_DIFFICULTY) {
  let weight = playerImportance(player);
  const tier = player?.quizClueTier ?? getQuizClueTier(player);

  if (tier === 'editorial' || player?.hasEditorialClues) weight += 28;
  else if (player?._syntheticClues || tier === 'synthetic') weight += 6;

  const hints = player?.quizHints?.length ?? 0;
  weight += Math.min(hints, 6) * 2;

  if (String(player?.quickFact ?? '').length > 28) weight += 4;

  const diff = normalizeDifficulty(difficulty);
  if (diff === 'easy' && tier === 'synthetic') weight *= 0.3;
  else if (diff === 'medium' && tier === 'synthetic') weight *= 0.55;
  else if (diff === 'hard' && tier === 'synthetic') weight *= 0.85;

  return Math.max(1, weight);
}

/**
 * @param {object[]} pool
 * @param {string} [excludePlayerId]
 * @param {QuizDifficultyId} [difficulty]
 */
export function pickWeightedFromQuizPool(pool, excludePlayerId = '', difficulty = DEFAULT_DIFFICULTY) {
  const candidates = excludePlayerId
    ? pool.filter((p) => p.id !== excludePlayerId)
    : pool;
  if (candidates.length === 0) return null;
  if (candidates.length === 1) return candidates[0];

  const ranked = [...candidates].sort(
    (a, b) => getQuizPickWeight(b, difficulty) - getQuizPickWeight(a, difficulty),
  );
  const topCount = Math.max(6, Math.ceil(ranked.length * 0.65));
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
