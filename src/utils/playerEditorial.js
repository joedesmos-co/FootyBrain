import { getLeagueName, getTeamName } from '../data/sampleData';

/** Squad listing without full editorial (phase 1 generated rows). */
export function isBrowseOnlyPlayer(player) {
  if (!player) return false;
  if (player.quizEligible === false) return true;
  if (player.dataStatus === 'generated-needs-editorial') return true;
  return !(player.quizHints?.length > 0);
}

function isPlaceholderQuickFact(text) {
  const value = String(text ?? '').toLowerCase();
  return (
    value.includes('editorial profile coming soon') ||
    value.includes('editorial quiz profile pending') ||
    (value.includes('footybrain') && value.includes('database')) ||
    value.includes('listed as ') && value.includes('footybrain senior squad sample') ||
    (value.includes(' at ') &&
      value.includes(' · ') &&
      (value.includes('major league soccer') || value.includes('série a')))
  );
}

/** Profile/card copy — avoids robotic merge placeholders. */
export function getDisplayQuickFact(player) {
  const fact = String(player?.quickFact ?? '').trim();
  if (!isBrowseOnlyPlayer(player)) return fact || '—';

  if (!fact || isPlaceholderQuickFact(fact)) {
    const club = getTeamName(player.teamId);
    const league = getLeagueName(player.leagueId);
    const ageBit = typeof player.age === 'number' ? `, age ${player.age}` : '';
    const citizenship = String(player.nationalTeam || player.nationality || '').trim();
    const countryBit = citizenship ? ` · ${citizenship}` : '';
    return `${player.name} (${player.position}${ageBit}) — ${club}, ${league}${countryBit}. Editorial quiz profile pending.`;
  }
  return fact;
}

/** Shorter line for browse cards. */
export function getCardQuickFact(player) {
  if (!isBrowseOnlyPlayer(player)) {
    const fact = String(player?.quickFact ?? '').trim();
    return fact || '—';
  }
  const ageBit = typeof player.age === 'number' ? ` · ${player.age}` : '';
  return `${getTeamName(player.teamId)} · ${player.position}${ageBit}`;
}
