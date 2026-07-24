/**
 * hub 명소 → 상위 도시 여행 스케치(명시적 이동) 해석.
 * 매거진 본문 상속은 하지 않고, CTA용 place 핀만 반환.
 */
import { TRAVEL_SPOTS } from '../data/travelSpots.js';
import { isHubAttractionLocation } from '../../../utils/travelSpotResolve.js';
import {
  hubToPlacePin,
  resolveCityAttractionHub,
} from './cityAttractionHubs.js';

/**
 * @param {object} location
 * @returns {{ place: object, label: string } | null}
 */
export function resolveHubAttractionParentSketch(location) {
  if (!isHubAttractionLocation(location)) return null;

  const hubId = String(location.hubId || '').trim();
  const parentCity = String(location.parentCity || '').trim();
  const hubIdLower = hubId.toLowerCase();

  const catalogSpot = TRAVEL_SPOTS.find((s) => {
    const slug = String(s.slug || '').toLowerCase();
    if (hubIdLower && slug === hubIdLower) return true;
    if (parentCity && (s.name === parentCity || s.name_en === parentCity)) return true;
    return false;
  });
  if (catalogSpot) {
    return {
      place: {
        ...catalogSpot,
        type: catalogSpot.type || 'temp-base',
      },
      label: catalogSpot.name || parentCity || hubId,
    };
  }

  const hub =
    (hubId && resolveCityAttractionHub(hubId)) ||
    (parentCity && resolveCityAttractionHub(parentCity)) ||
    null;
  if (hub) {
    return {
      place: hubToPlacePin(hub),
      label: hub.name || parentCity || hubId,
    };
  }

  return null;
}
