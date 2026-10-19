import { useEffect, useMemo, useState } from 'react';
import { isPlaceTravelogueCardEnabled } from '../../../utils/placeEditorialTravelogueFlag';
import {
  filterEditorialLocationFallback,
  mergePlaceEditorialTravelogues,
  placeNameCandidates,
  placeSlugFromLocation,
  selectPlaceEditorialTravelogueCards,
} from '../../../utils/placeEditorialTravelogue';
import { fetchEditorialTraveloguesByLocationName, fetchEditorialTraveloguesByPlaceSlug } from './relatedBlogsQuery';
import { useVisitStories } from './useVisitStories';

const DISABLED_PLACE_TRAVELOGUES = Object.freeze({
  enabled: false,
  items: [],
  isLoading: false,
});

export function usePlaceEditorialTravelogues(location) {
  // Build-time flag. Off must return before useVisitStories — that hook queries reports and place_reviews, which PlaceVisitStories already does (Cairo).
  if (!isPlaceTravelogueCardEnabled()) return DISABLED_PLACE_TRAVELOGUES;
  return usePlaceEditorialTraveloguesEnabled(location);
}

function usePlaceEditorialTraveloguesEnabled(location) {
  const placeSlug = placeSlugFromLocation(location);
  const names = placeNameCandidates(location);
  const namesKey = names.join('\n');
  const [rows, setRows] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const { stories, isLoading: storiesLoading } = useVisitStories(location);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);

    const load = async () => {
      try {
        const bySlug = await fetchEditorialTraveloguesByPlaceSlug(placeSlug);
        let locationRows = [];
        if (bySlug.length < 2 && names.length) {
          const batches = await Promise.all(names.map((name) => fetchEditorialTraveloguesByLocationName(name)));
          locationRows = filterEditorialLocationFallback(batches.flat(), { placeSlug, names });
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
  }, [placeSlug, namesKey]);

  const items = useMemo(
    () => selectPlaceEditorialTravelogueCards(rows, stories),
    [rows, stories],
  );

  return {
    enabled: true,
    items,
    isLoading: isLoading || storiesLoading,
  };
}
