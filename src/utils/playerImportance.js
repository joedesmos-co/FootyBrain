import { getLiveNationalTeamForPlayer } from '../data/nationalTeamData';
import { peekTeamName } from '../data/teamStore';

/**
 * One-line sample importance (no position — shown separately on profile).
 * @param {{ importanceScore: number, teamId: string }} player
 */
export function getRoleSummary(player) {
  const club = player?._teamName ?? peekTeamName(player.teamId);
  const score = player.importanceScore;

  if (score >= 94) {
    return `Headline name for ${club} in the sample (score ${score}).`;
  }
  if (score >= 90) {
    return `Core ${club} player in the sample (score ${score}).`;
  }
  if (score >= 85) {
    return `Notable in the ${club} squad listing (score ${score}).`;
  }
  return `Listed for ${club} study (score ${score}).`;
}

function getInternationalRepLabel(player) {
  const live = getLiveNationalTeamForPlayer(player);
  if (live) return live.displayName;
  return String(player.nationalTeam || player.nationality || '').trim();
}

/**
 * Short career summary from careerHistory only (2–3 sentences; no quickFact repeat).
 * @param {{ position: string, nationalTeam: string, careerHistory: Array, teamId: string }} player
 */
export function buildCareerSummary(player) {
  const sentences = [];
  const stops = player.careerHistory ?? [];
  const club = player?._teamName ?? peekTeamName(player.teamId);
  const country = getInternationalRepLabel(player);

  if (stops.length === 1) {
    sentences.push(
      `Listed at ${stops[0].club} (${stops[0].years}) in the FootyCompass sample.`,
    );
  } else if (stops.length > 1) {
    const path = stops.map((entry) => `${entry.club} (${entry.years})`).join(', then ');
    sentences.push(`Sample stops: ${path}.`);
  }

  if (country) {
    sentences.push(
      `Currently ${player.position} at ${club}; represents ${country} internationally.`,
    );
  } else {
    sentences.push(`Currently ${player.position} at ${club}.`);
  }

  return sentences.slice(0, 3).join(' ');
}
