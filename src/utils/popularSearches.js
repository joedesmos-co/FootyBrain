/**
 * Curated quick-search chips for the universal search empty state.
 * Queries use the same matching rules as typed search (aliases, fuzzy, etc.).
 */

export const POPULAR_SEARCHES = [
  { label: 'Arsenal', query: 'arsenal' },
  { label: 'Premier League', query: 'premier league' },
  { label: 'Haaland', query: 'haaland' },
  { label: 'Saka', query: 'saka' },
  { label: 'Brazil', query: 'brazil' },
  { label: 'KDB', query: 'kdb' },
  { label: 'Vini', query: 'vini' },
  { label: 'Son', query: 'son' },
  { label: 'World Cup', query: 'world cup' },
  { label: 'Quiz', query: 'quiz' },
];

export const SEARCH_EMPTY_HINT =
  'Try searching for a player, club, league, or collection.';

export const SEARCH_EMPTY_EXAMPLES = [
  'Haaland',
  'Barcelona',
  'MLS',
  'Puli',
  'Wonderkids collection',
];
