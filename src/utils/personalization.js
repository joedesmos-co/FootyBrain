import { KNOWLEDGE_LEVELS } from '../data/preferencesOptions';

export function formatPreferencesSummary(prefs, leaguesList, teamsList) {
  const leagueNames = prefs.favoriteLeagueIds
    .map((id) => leaguesList.find((l) => l.id === id)?.name)
    .filter(Boolean);
  const clubNames = prefs.favoriteClubIds
    .map((id) => teamsList.find((t) => t.id === id)?.name)
    .filter(Boolean);
  const level =
    KNOWLEDGE_LEVELS.find((l) => l.id === prefs.knowledgeLevel)?.label ?? '—';
  const goals = prefs.learningGoals
    .map((id) => id.charAt(0).toUpperCase() + id.slice(1))
    .join(', ');

  return { leagueNames, clubNames, level, goals };
}
