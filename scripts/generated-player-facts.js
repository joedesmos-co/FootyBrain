/**
 * Factual copy for generated squad rows (no TM prose / market data).
 */

export function buildCurrentClubCareer(teamName) {
  const club = String(teamName ?? '').trim() || 'Current club';
  return [{ club, years: 'Current squad' }];
}

export function buildGeneratedQuickFact({ name, position, age, nationality, teamName, leagueName }) {
  const bits = [name];
  if (position) bits.push(position);
  if (typeof age === 'number') bits.push(`age ${age}`);
  if (nationality) bits.push(nationality);
  bits.push(`at ${teamName}`);
  if (leagueName) bits.push(`(${leagueName})`);
  return `${bits.join(' · ')}. Editorial quiz profile pending.`;
}

export function buildGeneratedPlayingStyle(position) {
  const pos = String(position ?? '').trim();
  if (!pos) return 'Senior squad player in the FootyBrain roster.';
  return `Listed as ${pos} in the FootyBrain senior squad sample.`;
}
