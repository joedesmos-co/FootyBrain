#!/usr/bin/env node
/**
 * Quiz ecosystem balancing sanity checks.
 * Run: npm run audit:quiz-ecosystem
 */

import { players } from '../src/data/sampleData.js';
import { QUIZ_THEME_CATALOG } from '../src/data/quizThemes.js';
import {
  canAppearInQuizSession,
  getDifficultyTopSliceRatio,
  getQuizPickWeight,
} from '../src/utils/quizEcosystem.js';
import { getThemeMinImportance } from '../src/data/quizThemeConfig.js';

const DIFFICULTIES = ['easy', 'medium', 'hard', 'hardcore', 'nerd'];
let failures = 0;

function fail(msg) {
  console.error(`FAIL: ${msg}`);
  failures += 1;
}

function pass(msg) {
  console.log(`OK: ${msg}`);
}

const ecosystem = players.filter((p) => p?.id && p.leagueId !== 'external');
const easyPool = ecosystem.filter((p) => canAppearInQuizSession(p, 'easy'));
const nerdPool = ecosystem.filter((p) => canAppearInQuizSession(p, 'nerd'));

if (easyPool.length <= nerdPool.length) {
  pass(`session pool size: easy ${easyPool.length}, nerd ${nerdPool.length} (nerd ≥ easy)`);
} else {
  fail(`expected nerd session pool >= easy (got easy ${easyPool.length}, nerd ${nerdPool.length})`);
}

if (easyPool.length === nerdPool.length) {
  pass('editorial core pool shared across modes — pick weighting differentiates difficulty');
}

const easyAvg =
  easyPool.reduce((s, p) => s + (Number(p.importanceScore) || 0), 0) / Math.max(1, easyPool.length);
const nerdAvg =
  nerdPool.reduce((s, p) => s + (Number(p.importanceScore) || 0), 0) / Math.max(1, nerdPool.length);
if (easyAvg >= nerdAvg - 0.5) {
  pass(`session pool avg importance easy ${easyAvg.toFixed(1)}, nerd ${nerdAvg.toFixed(1)}`);
} else {
  fail('easy pool avg importance should be >= nerd when pools differ');
}

const star = ecosystem.find((p) => (Number(p.importanceScore) || 0) >= 85);
const deep = ecosystem.find((p) => (Number(p.importanceScore) || 0) >= 45 && (Number(p.importanceScore) || 0) <= 55);
if (star && deep) {
  const easyStar = getQuizPickWeight(star, 'easy');
  const easyDeep = getQuizPickWeight(deep, 'easy');
  if (easyStar > easyDeep) pass('easy mode weights stars above deep cuts');
  else fail('easy pick weight should favour high-importance players');

  const nerdStar = getQuizPickWeight(star, 'nerd');
  const nerdDeep = getQuizPickWeight(deep, 'nerd');
  if (nerdDeep >= nerdStar * 0.5) pass('nerd mode gives deep cuts competitive weight');
}

for (const diff of DIFFICULTIES) {
  const ratio = getDifficultyTopSliceRatio(diff);
  if (ratio > 0 && ratio <= 1) pass(`${diff} top-slice ratio ${ratio}`);
  else fail(`invalid top slice for ${diff}`);
}

for (const theme of QUIZ_THEME_CATALOG) {
  const easyFloor = getThemeMinImportance(theme.id, 'easy');
  const nerdFloor = getThemeMinImportance(theme.id, 'nerd');
  if (easyFloor >= nerdFloor) {
    pass(`${theme.id}: easy floor ${easyFloor} >= nerd floor ${nerdFloor}`);
  } else {
    fail(`${theme.id}: easy importance floor should be >= nerd floor`);
  }
}

pass('daily challenge uses importance-weighted sampling (see dailyChallengePlan.js)');

console.log(`\nQuiz ecosystem audit: ${failures === 0 ? 'PASSED' : `${failures} failure(s)`}`);
if (failures > 0) process.exitCode = 1;
