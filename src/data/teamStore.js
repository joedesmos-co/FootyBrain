import { loadEntityIndex, peekEntityIndex } from './entityIndex';

export function peekTeamName(teamId) {
  if (!teamId) return 'Unknown';
  const idx = peekEntityIndex();
  return idx?.teamById.get(teamId)?.name ?? 'Unknown';
}

export function peekTeamById(teamId) {
  if (!teamId) return null;
  const idx = peekEntityIndex();
  return idx?.teamById.get(teamId) ?? null;
}

export async function getTeamName(teamId) {
  if (!teamId) return 'Unknown';
  const idx = await loadEntityIndex();
  return idx.teamById.get(teamId)?.name ?? 'Unknown';
}

export async function getTeamById(teamId) {
  if (!teamId) return null;
  const idx = await loadEntityIndex();
  return idx.teamById.get(teamId) ?? null;
}

