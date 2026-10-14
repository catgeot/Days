import { buildMooniBoundSpotFromLocation } from '../../Home/lib/mooniPlaceChatLabel.js';
import { festivalLngLat } from '../koreaFestivalCorridors.js';
import { buildFestivalMooniContext } from './festivalMooniContext.js';

export {
  buildFestivalMooniContext,
  buildFestivalMooniNeutralOpening,
  buildFestivalMooniChatOpening,
} from './festivalMooniContext.js';

/**
 * @param {{
 *   item?: Record<string, unknown>,
 *   intro?: Record<string, unknown>,
 *   location?: Record<string, unknown> | null,
 *   homepage?: string,
 *   summaryFields?: { dateText?: string, timeText?: string, fee?: { text?: string } },
 *   overview?: string,
 *   program?: string,
 *   nearbyPlaces?: string[],
 *   nearbyRestaurants?: string[],
 *   info?: Array<{ infoname?: string, name?: string, infotext?: string, text?: string }>,
 * }} input
 */
export function buildFestivalMooniBoundSpot(input = {}) {
  const { item, intro, location, homepage, summaryFields, overview, program, nearbyPlaces, nearbyRestaurants, nearbyParking, stayAreas, info, transport } = input;
  const festivalContext = buildFestivalMooniContext({
    item,
    intro,
    homepage,
    summaryFields,
    location,
    overview,
    program,
    nearbyPlaces,
    nearbyRestaurants,
    nearbyParking,
    stayAreas,
    info,
    transport,
  });
  const title = festivalContext?.title || '';
  const loc = location && typeof location === 'object' ? location : null;
  const hubName = String(loc?.name || loc?.parentCity || '').trim();
  const displayLabel =
    title && hubName ? `${title} · ${hubName}` : title || hubName;
  const pt = festivalLngLat(item?.mapx, item?.mapy);

  return buildMooniBoundSpotFromLocation({
    ...loc,
    name: title || hubName,
    displayLabel,
    lat: pt?.lat ?? loc?.lat,
    lng: pt?.lng ?? loc?.lng,
    festivalContext,
  });
}

function listKey(value) {
  return (Array.isArray(value) ? value : []).map((raw) => {
    const name = String(raw?.name || raw || '').trim();
    const dist = Number(raw?.distKm);
    return `${name}|${Number.isFinite(dist) ? dist : ''}`;
  }).join('\n');
}

function sameNameList(left, right) {
  return listKey(left) === listKey(right);
}

/** Keep an open chat, and copy 주변 맛집 names in when the sheet list arrives. */
export function patchFestivalBoundSpot(prev, next) {
  if (!prev?.festivalContext || !next?.festivalContext) return prev;
  const prevParking = String(prev.festivalContext.parking || '');
  const nextParking = String(next.festivalContext.parking || '');
  const prevTransport = JSON.stringify(prev.festivalContext.transport || null);
  const nextTransport = JSON.stringify(next.festivalContext.transport || null);
  if (
    sameNameList(prev.festivalContext.nearbyRestaurants, next.festivalContext.nearbyRestaurants)
    && sameNameList(prev.festivalContext.nearbyPlaces, next.festivalContext.nearbyPlaces)
    && sameNameList(prev.festivalContext.nearbyParking, next.festivalContext.nearbyParking)
    && prevParking === nextParking
    && prevTransport === nextTransport
  ) return prev;
  return {
    ...prev,
    festivalContext: {
      ...prev.festivalContext,
      nearbyRestaurants: next.festivalContext.nearbyRestaurants || [],
      nearbyPlaces: next.festivalContext.nearbyPlaces || [],
      nearbyParking: next.festivalContext.nearbyParking || [],
      parking: next.festivalContext.parking ?? prev.festivalContext.parking,
      transport: next.festivalContext.transport ?? prev.festivalContext.transport ?? null,
    },
  };
}
