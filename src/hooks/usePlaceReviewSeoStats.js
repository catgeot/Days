import { useState, useEffect } from 'react';
import { supabase } from '../shared/api/supabase';
import { computePlaceReviewStats } from '../utils/placeReviewStats';

/**
 * Lightweight rating/count fetch for SEO JSON-LD on /place/:slug/reviews.
 */
export function usePlaceReviewSeoStats(placeSlug) {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    if (!placeSlug) {
      return;
    }

    let cancelled = false;

    supabase
      .from('place_reviews')
      .select('rating, is_editorial')
      .eq('place_slug', placeSlug)
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error) {
          console.error('[usePlaceReviewSeoStats]', error);
          setStats(computePlaceReviewStats([]));
          return;
        }
        setStats(computePlaceReviewStats(data || []));
      });

    return () => {
      cancelled = true;
    };
  }, [placeSlug]);

  return stats;
}
