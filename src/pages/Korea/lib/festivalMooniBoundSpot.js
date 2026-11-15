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
 *   detailPending?: boolean,
 * }} input
 */
export function buildFestivalMooniBoundSpot(input = {}) {
  const { item, intro, location, homepage, summaryFields, overview, program, nearbyPlaces, nearbyRestaurants, nearbyParking, stayAreas, info, transport, detailPending } = input;
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
    detailPending,
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

const DETAIL_TEXT_KEYS = [
  'overview',
  'sceneOverview',
  'program',
  'venue',
  'timeText',
  'feeText',
  'homepage',
  'tel',
  'titleEn',
  'eventStartDate',
  'eventEndDate',
  'dateLabel',
];

function keepRicherText(prevValue, nextValue) {
  const next = String(nextValue ?? '').trim();
  if (!next) return prevValue ?? '';
  return nextValue;
}

function detailPendingOf(ctx, fallback) {
  if (ctx && Object.prototype.hasOwnProperty.call(ctx, 'detailPending')) {
    return Boolean(ctx.detailPending);
  }
  return Boolean(fallback);
}

/** Keep the open chat. Copy detail narrative and nearby lists when they arrive. */
export function patchFestivalBoundSpot(prev, next) {
  if (!prev?.festivalContext || !next?.festivalContext) return prev;
  const prevId = String(prev.festivalContext.contentId || '');
  const nextId = String(next.festivalContext.contentId || '');
  if (prevId && nextId && prevId !== nextId) return next;

  const narrative = {};
  for (const key of DETAIL_TEXT_KEYS) {
    narrative[key] = keepRicherText(prev.festivalContext[key], next.festivalContext[key]);
  }
  const detailPending = detailPendingOf(next.festivalContext, prev.festivalContext.detailPending);
  const prevParking = String(prev.festivalContext.parking || '');
  const nextParking = String(next.festivalContext.parking || '');
  const prevTransport = JSON.stringify(prev.festivalContext.transport || null);
  const nextTransport = JSON.stringify(next.festivalContext.transport || null);
  const narrativeSame = DETAIL_TEXT_KEYS.every(
    (key) => String(narrative[key] ?? '') === String(prev.festivalContext[key] ?? ''),
  );
  const pendingSame = Boolean(prev.festivalContext.detailPending) === detailPending;
  if (
    narrativeSame
    && pendingSame
    && sameNameList(prev.festivalContext.nearbyRestaurants, next.festivalContext.nearbyRestaurants)
    && sameNameList(prev.festivalContext.nearbyPlaces, next.festivalContext.nearbyPlaces)
    && sameNameList(prev.festivalContext.nearbyParking, next.festivalContext.nearbyParking)
    && prevParking === nextParking
    && prevTransport === nextTransport
  ) return prev;
  return {
    ...prev,
    festivalContext: {
      ...prev.festivalContext,
      ...narrative,
      detailPending,
      nearbyRestaurants: next.festivalContext.nearbyRestaurants || [],
      nearbyPlaces: next.festivalContext.nearbyPlaces || [],
      nearbyParking: next.festivalContext.nearbyParking || [],
      parking: next.festivalContext.parking ?? prev.festivalContext.parking,
      transport: next.festivalContext.transport ?? prev.festivalContext.transport ?? null,
    },
  };
}
