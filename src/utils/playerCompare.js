import { getLeagueName } from '../data/sampleData';
import { getPositionCategory, SQUAD_POSITION_GROUPS } from './squadGrouping';

export { getPlayerRoleSummary, getPlayerStrengths } from './compareDisplay';

function positionGroupLabel(groupId) {
  return SQUAD_POSITION_GROUPS.find((group) => group.id === groupId)?.label ?? groupId;
}

/**
 * @param {{ careerHistory?: Array }} player
 */
export function getCareerStopCount(player) {
  return player.careerHistory?.length ?? 0;
}

/**
 * @param {object} playerA
 * @param {object} playerB
 * @returns {Array<{ kind: 'similarity' | 'difference', text: string }>}
 */
export function buildCompareInsights(playerA, playerB) {
  const insights = [];
  const groupA = getPositionCategory(playerA.position);
  const groupB = getPositionCategory(playerB.position);
  const sameLeague = playerA.leagueId === playerB.leagueId;
  const sameGroup = groupA === groupB;
  const sameNation = playerA.nationalTeam === playerB.nationalTeam;
  const sameNationality = playerA.nationality === playerB.nationality;
  const ageDiff = playerA.age - playerB.age;

  insights.push({
    kind: sameLeague ? 'similarity' : 'difference',
    text: sameLeague
      ? `Same league (${getLeagueName(playerA.leagueId)}).`
      : `Different leagues: ${getLeagueName(playerA.leagueId)} vs ${getLeagueName(playerB.leagueId)}.`,
  });

  insights.push({
    kind: sameGroup ? 'similarity' : 'difference',
    text: sameGroup
      ? `Same position group (${positionGroupLabel(groupA)}).`
      : `Different groups: ${positionGroupLabel(groupA)} vs ${positionGroupLabel(groupB)}.`,
  });

  insights.push({
    kind: sameNation ? 'similarity' : 'difference',
    text: sameNation
      ? `Same national team (${playerA.nationalTeam}).`
      : `National teams: ${playerA.nationalTeam} vs ${playerB.nationalTeam}.`,
  });

  insights.push({
    kind: sameNationality ? 'similarity' : 'difference',
    text: sameNationality
      ? `Same nationality (${playerA.nationality}).`
      : `Nationality: ${playerA.nationality} vs ${playerB.nationality}.`,
  });

  if (playerA.age === playerB.age) {
    insights.push({
      kind: 'similarity',
      text: `Same age (${playerA.age}).`,
    });
  } else {
    const older = ageDiff > 0 ? playerA : playerB;
    const younger = ageDiff > 0 ? playerB : playerA;
    insights.push({
      kind: 'difference',
      text: `${older.name} is older (${older.age} vs ${younger.age}).`,
    });
  }

  const scoreDiff = playerA.importanceScore - playerB.importanceScore;
  if (scoreDiff === 0) {
    insights.push({
      kind: 'similarity',
      text: `Same Importance Score (${playerA.importanceScore}).`,
    });
  } else if (scoreDiff > 0) {
    insights.push({
      kind: 'difference',
      text: `${playerA.name} has the higher score (${playerA.importanceScore} vs ${playerB.importanceScore}).`,
    });
  } else {
    insights.push({
      kind: 'difference',
      text: `${playerB.name} has the higher score (${playerB.importanceScore} vs ${playerA.importanceScore}).`,
    });
  }

  const stopsA = getCareerStopCount(playerA);
  const stopsB = getCareerStopCount(playerB);
  if (stopsA === 0 && stopsB === 0) {
    insights.push({
      kind: 'similarity',
      text: 'Career histories are not in the sample yet for either player.',
    });
  } else if (stopsA === stopsB) {
    insights.push({
      kind: 'similarity',
      text: `Same career stops in the sample (${stopsA}).`,
    });
  } else {
    insights.push({
      kind: 'difference',
      text: `Career stops in sample: ${playerA.name} ${stopsA}, ${playerB.name} ${stopsB}.`,
    });
  }

  return insights;
}
