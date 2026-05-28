/**
 * Minimal quiz clues for browse-only squad rows — keeps sessions fair without editorial copy.
 */

import { formatCountryLabel, formatPosition } from './footballDisplay.js';
import { hasEditorialQuizClues } from './quizPlayerRules.js';

function cleanLabel(value) {
  const text = String(value ?? '').trim();
  return text || null;
}

/**
 * @param {object} player
 * @param {{ teamName?: string, leagueName?: string }} [ctx]
 * @returns {string[]}
 */
export function synthesizeQuizHints(player, ctx = {}) {
  const teamName = cleanLabel(ctx.teamName) ?? 'their club';
  const leagueName = cleanLabel(ctx.leagueName) ?? 'their league';
  const hints = [];

  const position = formatPosition(player?.position);
  if (position && position !== '—') {
    hints.push(`Plays as a ${position.toLowerCase()} for ${teamName}.`);
  }

  const nation = cleanLabel(player?.nationalTeam) ?? cleanLabel(player?.nationality);
  if (nation) {
    hints.push(`Listed with ${formatCountryLabel(nation)} for international football.`);
  }

  if (typeof player?.age === 'number' && player.age > 0) {
    hints.push(`Squad listing: age ${player.age} in ${leagueName}.`);
  }

  hints.push(`Featured in the FootyCompass ${leagueName} database.`);

  const unique = [];
  const seen = new Set();
  for (const hint of hints) {
    const key = hint.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push(hint);
  }

  return unique.slice(0, 4);
}

/**
 * @param {object} player
 * @param {{ teamName?: string, leagueName?: string }} [ctx]
 */
export function synthesizeQuickFact(player, ctx = {}) {
  const teamName = cleanLabel(ctx.teamName) ?? 'their club';
  const leagueName = cleanLabel(ctx.leagueName) ?? 'their league';
  const position = formatPosition(player?.position);
  const nation = cleanLabel(player?.nationalTeam) ?? cleanLabel(player?.nationality);
  const ageBit = typeof player?.age === 'number' ? `, age ${player.age}` : '';
  const nationBit = nation ? ` · ${formatCountryLabel(nation)}` : '';
  return `${player.name} (${position}${ageBit}) — ${teamName}, ${leagueName}${nationBit}.`;
}

/**
 * @param {object} player
 * @param {{ teamName?: string, leagueName?: string }} [ctx]
 */
export function ensureQuizPlayablePlayer(player, ctx = {}) {
  if (!player) return null;
  if (hasEditorialQuizClues(player)) {
    return {
      ...player,
      quizClueTier: 'editorial',
      hasEditorialClues: true,
    };
  }

  const hints = synthesizeQuizHints(player, ctx);
  const quickFact = synthesizeQuickFact(player, ctx);

  return {
    ...player,
    quizHints: hints,
    quickFact,
    quizClueTier: 'synthetic',
    hasEditorialClues: false,
    _syntheticClues: true,
  };
}
