import { getLeagueName } from '../data/sampleData';
import { formatClubIdentityTags } from './clubIdentity';
import { getTeamCompareSnapshot } from './compareDisplay';
import { SQUAD_POSITION_GROUPS, squadGroupCountLabel } from './squadGrouping';
export { getSquadStrengthSummary, getTeamCompareSnapshot } from './compareDisplay';

function normalizeRivalName(name) {
  return String(name ?? '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

/**
 * @param {{ rivals: string[] }} teamA
 * @param {{ rivals: string[] }} teamB
 */
export function getSharedRivals(teamA, teamB) {
  const setB = new Set(teamB.rivals.map(normalizeRivalName));
  return teamA.rivals.filter((rival) => setB.has(normalizeRivalName(rival)));
}

/**
 * @param {string} teamId
 * @param {Array} players
 */
export function getTeamRosterStats(teamId, players) {
  return getTeamCompareSnapshot(teamId, players).rosterStats;
}

/**
 * @param {object} teamA
 * @param {object} teamB
 * @param {Array} players
 * @returns {Array<{ kind: 'similarity' | 'difference', text: string }>}
 */
export function buildClubCompareInsights(teamA, teamB, players) {
  const insights = [];
  const snapA = getTeamCompareSnapshot(teamA.id, players);
  const snapB = getTeamCompareSnapshot(teamB.id, players);
  const statsA = snapA.rosterStats;
  const statsB = snapB.rosterStats;
  const sameLeague = teamA.leagueId === teamB.leagueId;
  const sameCountry = teamA.country === teamB.country;
  const sharedRivals = getSharedRivals(teamA, teamB);
  const tagsA = new Set(teamA.identityTags ?? []);
  const tagsB = new Set(teamB.identityTags ?? []);
  const sharedTags = [...tagsA].filter((tag) => tagsB.has(tag));

  insights.push({
    kind: sameLeague ? 'similarity' : 'difference',
    text: sameLeague
      ? `Same league (${getLeagueName(teamA.leagueId)}).`
      : `Different leagues: ${getLeagueName(teamA.leagueId)} vs ${getLeagueName(teamB.leagueId)}.`,
  });

  insights.push({
    kind: sameCountry ? 'similarity' : 'difference',
    text: sameCountry
      ? `Same country (${teamA.country}).`
      : `Countries: ${teamA.country} vs ${teamB.country}.`,
  });

  if (sharedRivals.length > 0) {
    insights.push({
      kind: 'similarity',
      text: `Shared rivals in sample: ${sharedRivals.join(', ')}.`,
    });
  } else {
    insights.push({
      kind: 'difference',
      text: 'No shared rival names between the two club lists.',
    });
  }

  if (teamA.founded === teamB.founded) {
    insights.push({
      kind: 'similarity',
      text: `Same founded year (${teamA.founded}).`,
    });
  } else if (teamA.founded < teamB.founded) {
    insights.push({
      kind: 'difference',
      text: `${teamA.name} is older (founded ${teamA.founded} vs ${teamB.founded}).`,
    });
  } else {
    insights.push({
      kind: 'difference',
      text: `${teamB.name} is older (founded ${teamB.founded} vs ${teamA.founded}).`,
    });
  }

  if (sharedTags.length > 0) {
    const labels = formatClubIdentityTags(sharedTags).map((t) => t.label);
    insights.push({
      kind: 'similarity',
      text: `Shared style tags: ${labels.join(', ')}.`,
    });
  }

  const avgDiff = snapA.avgScore - snapB.avgScore;
  if (snapA.total > 0 && snapB.total > 0) {
    if (avgDiff === 0) {
      insights.push({
        kind: 'similarity',
        text: `Same average squad Importance Score (${snapA.avgScore}).`,
      });
    } else if (avgDiff > 0) {
      insights.push({
        kind: 'difference',
        text: `${teamA.name} has the higher average squad score (${snapA.avgScore} vs ${snapB.avgScore}).`,
      });
    } else {
      insights.push({
        kind: 'difference',
        text: `${teamB.name} has the higher average squad score (${snapB.avgScore} vs ${snapA.avgScore}).`,
      });
    }
  }

  if (snapA.quizReady > 0 || snapB.quizReady > 0) {
    insights.push({
      kind: snapA.quizReady === snapB.quizReady ? 'similarity' : 'difference',
      text:
        snapA.quizReady === snapB.quizReady
          ? `Same quiz-ready squad depth (${snapA.quizReady} players each).`
          : `Quiz-ready players: ${teamA.name} ${snapA.quizReady}, ${teamB.name} ${snapB.quizReady}.`,
    });
  }

  const topA = statsA.topPlayer?.importanceScore ?? 0;
  const topB = statsB.topPlayer?.importanceScore ?? 0;
  if (topA === topB && topA > 0) {
    insights.push({
      kind: 'similarity',
      text: `Same top player score in sample (${topA}).`,
    });
  } else if (topA > topB) {
    insights.push({
      kind: 'difference',
      text: `${teamA.name} has the higher top player score (${topA} vs ${topB}).`,
    });
  } else if (topB > topA) {
    insights.push({
      kind: 'difference',
      text: `${teamB.name} has the higher top player score (${topB} vs ${topA}).`,
    });
  } else {
    insights.push({
      kind: 'difference',
      text: 'No players in sample for one or both squads.',
    });
  }

  return insights;
}

export { squadGroupCountLabel, SQUAD_POSITION_GROUPS };
