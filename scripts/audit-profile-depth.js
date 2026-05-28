import { players, teams } from '../src/data/sampleData.js';

function isBrowseOnlyPlayer(player) {
  if (!player) return false;
  if (player.quizEligible === false) return true;
  if (player.dataStatus === 'generated-needs-editorial') return true;
  return !(player.quizHints?.length > 0);
}

function getTeamProfileEditorial(team) {
  const fanGuide = String(team.fanGuide ?? '').trim();
  const shortHistory = String(team.shortHistory ?? '').trim();
  return { fanGuide, shortHistory, hasStory: Boolean(shortHistory), hasFanGuide: Boolean(fanGuide) };
}

function playerDepth(p) {
  let score = 0;
  const qf = String(p.quickFact ?? '');
  if (qf && !qf.includes('pending') && !qf.includes('coming soon')) score += 2;
  if (p.playingStyle || p.playStyleSummary) score += 2;
  if (p.strengths?.length || p.keyStrengths?.length) score += 2;
  if (p.careerHistory?.length) score += 2;
  if (p.honors?.length || p.honours?.length) score += 2;
  if (p.quizHints?.length) score += 1;
  return score;
}

function teamDepth(t) {
  const ed = getTeamProfileEditorial(t);
  let score = 0;
  if (ed.shortHistory) score += 3;
  if (ed.fanGuide) score += 3;
  if (t.rivals?.length) score += 2;
  if (t.legends?.length) score += 2;
  if (t.currentKeyPlayers?.length) score += 1;
  if (t.identityTags?.length) score += 1;
  return score;
}

const thinPlayers = players
  .filter((p) => playerDepth(p) <= 2)
  .sort((a, b) => (b.importanceScore || 0) - (a.importanceScore || 0));
const thinTeams = teams
  .filter((t) => teamDepth(t) <= 3)
  .sort((a, b) => {
    const sum = (teamId) =>
      players.filter((p) => p.teamId === teamId).reduce((s, p) => s + (p.importanceScore || 0), 0);
    return sum(b.id) - sum(a.id);
  });

console.log('Players total:', players.length);
console.log('Browse-only:', players.filter(isBrowseOnlyPlayer).length);
console.log('Thin players (depth<=2):', thinPlayers.length);
console.log(
  'Top 15 thin by importance:',
  thinPlayers.slice(0, 15).map((p) => `${p.name} (${p.importanceScore}) depth=${playerDepth(p)}`),
);
console.log('Teams total:', teams.length);
console.log('Thin teams (depth<=3):', thinTeams.length);
console.log(
  'Top 15 thin teams:',
  thinTeams.slice(0, 15).map((t) => `${t.name} depth=${teamDepth(t)}`),
);
