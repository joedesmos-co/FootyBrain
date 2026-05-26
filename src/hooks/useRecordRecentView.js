import { useEffect } from 'react';
import { recordRecentView } from '../utils/recentlyViewed';

/**
 * @param {'player' | 'team' | 'league' | 'national-team'} type
 * @param {string | undefined} id
 */
export function useRecordRecentView(type, id) {
  useEffect(() => {
    if (!id) return;
    recordRecentView({ type, id });
  }, [type, id]);
}
