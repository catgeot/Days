import { useEffect, useMemo, useState } from 'react';
import { isPlaceTravelogueCardEnabled } from '../../../utils/placeEditorialTravelogueFlag';
import {
  placeSlugFromLocation,
  selectPlaceEditorialTravelogueCards,
} from '../../../utils/placeEditorialTravelogue';
import { isEditorialLogbookPublished } from '../../../utils/logbookEditorial';
import { filterPlaceRelatedLogbookRows } from '../../../utils/placeRelatedLogbooks.js';
import { fetchRelatedBlogRows } from './relatedBlogsQuery';
import { useVisitStories } from './useVisitStories';

const DISABLED_PLACE_TRAVELOGUES = Object.freeze({
  enabled: false,
  items: [],
  isLoading: false,
});

function placeRelatedQueryName(location) {
  return String(location?.name || location?.name_ko || location?.name_en || '').trim();
}

export function usePlaceEditorialTravelogues(location) {
  if (!isPlaceTravelogueCardEnabled()) return DISABLED_PLACE_TRAVELOGUES;
  return usePlaceEditorialTraveloguesEnabled(location);
}

function usePlaceEditorialTraveloguesEnabled(location) {
  const placeSlug = placeSlugFromLocation(location);
  const locationName = placeRelatedQueryName(location);
  const [rows, setRows] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const { stories, isLoading: storiesLoading } = useVisitStories(location);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);

    const load = async () => {
      try {
        if (!locationName) {
          if (!cancelled) setRows([]);
          return;
        }
        const related = await fetchRelatedBlogRows(locationName);
        if (cancelled) return;
        const matched = filterPlaceRelatedLogbookRows(related, locationName, placeSlug);
        setRows(matched.filter(isEditorialLogbookPublished));
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
  }, [placeSlug, locationName]);

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