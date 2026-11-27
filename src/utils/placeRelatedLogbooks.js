import { locationTextMatchesPlaceName } from './placeEditorialTravelogue.js';

/**
 * Whether a reports row belongs on this place's review carousel / GATEO 기행문 card.
 * Primary place_slug match, else location token (multi-destination editorials).
 */
export function relatedRowMatchesPlace(row, locationName, placeKey) {
  const slug = String(row?.place_slug || '').trim();
  const key = String(placeKey || '').trim();
  if (slug && key && slug === key) return true;
  const name = String(locationName || '').trim();
  if (!name) return false;
  return locationTextMatchesPlaceName(row?.location, name);
}

export function filterPlaceRelatedLogbookRows(rows, locationName, placeKey) {
  const key = String(placeKey || '').trim();
  if (!key) return Array.isArray(rows) ? rows : [];
  return (rows || []).filter((row) => relatedRowMatchesPlace(row, locationName, placeKey));
}