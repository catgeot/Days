import { useState, useEffect } from 'react';
import { supabase } from '../shared/api/supabase';
import { computePlaceReviewStats } from '../utils/placeReviewStats';

/**
 * Lightweight rating/count fetch for SEO JSON-LD on /place/:slug/reviews.
 * Returns null while slug is changing or loading (avoids flashing prior place stats).
 */
export function usePlaceReviewSeoStats(placeSlug) {
  const [snapshot, setSnapshot] = useState(() => ({ slug: null, stats: null }));

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
          setSnapshot({ slug: placeSlug, stats: computePlaceReviewStats([]) });
          return;
        }
        setSnapshot({ slug: placeSlug, stats: computePlaceReviewStats(data || []) });
      });

    return () => {
      cancelled = true;
    };
  }, [placeSlug]);

  if (!placeSlug || snapshot.slug !== placeSlug) {
    return null;
  }
  return snapshot.stats;
}
