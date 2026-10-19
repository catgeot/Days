import { useEffect, useMemo, useState } from 'react';
import { isPlaceTravelogueCardEnabled } from '../../../utils/placeEditorialTravelogueFlag';
import {
  mergePlaceEditorialTravelogues,
  placeSlugFromLocation,
  selectPlaceEditorialTravelogueCards,
} from '../../../utils/placeEditorialTravelogue';
import { fetchEditorialTraveloguesByPlaceSlug, fetchRelatedBlogRows } from './relatedBlogsQuery';
import { useVisitStories } from './useVisitStories';

export function usePlaceEditorialTravelogues(location) {
  const enabled = isPlaceTravelogueCardEnabled();
  const placeSlug = placeSlugFromLocation(location);
  const locationName = location?.name || location?.name_en || '';
  const [rows, setRows] = useState([]);
  const [isLoading, setIsLoading] = useState(enabled);
  const { stories, isLoading: storiesLoading } = useVisitStories(location);

  useEffect(() => {
    if (!enabled) {
      setRows([]);
      setIsLoading(false);
      return undefined;
    }

    let cancelled = false;
    setIsLoading(true);

    const load = async () => {
      try {
        const bySlug = await fetchEditorialTraveloguesByPlaceSlug(placeSlug);
        let locationRows = [];
        if (bySlug.length < 2 && locationName) {
          locationRows = await fetchRelatedBlogRows(locationName);
        }
        if (cancelled) return;
        setRows(mergePlaceEditorialTravelogues(bySlug, locationRows));
      } catch (error) {
        console.error('[place-travelogue] fetch failed', error);
        if (!cancelled) setRows([]);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, [enabled, placeSlug, locationName]);

  const items = useMemo(
    () => (enabled ? selectPlaceEditorialTravelogueCards(rows, stories) : []),
    [enabled, rows, stories],
  );

  return {
    enabled,
    items,
    isLoading: enabled && (isLoading || storiesLoading),
  };
}
