import { buildMooniBoundSpotFromLocation } from '../../Home/lib/placeChatIntro.js';
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
 * }} input
 */
export function buildFestivalMooniBoundSpot(input = {}) {
  const { item, intro, location, homepage, summaryFields } = input;
  const festivalContext = buildFestivalMooniContext({
    item,
    intro,
    homepage,
    summaryFields,
    location,
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
