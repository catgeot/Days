import { isDomesticKoreaLocation } from '../../utils/tourApiMatch';
import { listCityAttractionHubs } from '../Home/lib/cityAttractionHubs';
import { areaCodeForHubId } from './koreaHubSeeds';

/** 한반도 대략 bbox (울릉·제주 포함) */
const KR_BBOX = { minLat: 32.9, maxLat: 39.0, minLng: 124.0, maxLng: 132.2 };
const MAX_HUB_KM = 200;

function toRad(d) {
  return (d * Math.PI) / 180;
}

function haversineKm(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/**
 * @param {number} lat
 * @param {number} lng
 */
function inKoreaBbox(lat, lng) {
  return (
    lat >= KR_BBOX.minLat &&
    lat <= KR_BBOX.maxLat &&
    lng >= KR_BBOX.minLng &&
    lng <= KR_BBOX.maxLng
  );
}

/**
 * GPS → 최근접 KR hub 라벨 + 시드 areaCode(매핑된 hub 중 최근접).
 * 시드에 없는 hub만 있어도, 인근 시드 hub의 areaCode로 폴백한다.
 *
 * @param {number} lat
 * @param {number} lng
 * @returns {{ areaCode: string, hubId: string, hubName: string, km: number } | null}
 */
export function resolveKoreaAreaFromCoords(lat, lng) {
  const la = Number(lat);
  const ln = Number(lng);
  if (!Number.isFinite(la) || !Number.isFinite(ln)) return null;
  if (!inKoreaBbox(la, ln)) return null;

  /** @type {{ hub: object, km: number } | null} */
  let nearestAny = null;
  /** @type {{ hub: object, km: number, areaCode: string } | null} */
  let nearestMapped = null;

  for (const hub of listCityAttractionHubs()) {
    if (!isDomesticKoreaLocation(hub) || !hub.hubId) continue;
    const hLat = Number(hub.lat);
    const hLng = Number(hub.lng);
    if (!Number.isFinite(hLat) || !Number.isFinite(hLng)) continue;
    const km = haversineKm(la, ln, hLat, hLng);
    if (!Number.isFinite(km)) continue;

    if (!nearestAny || km < nearestAny.km) {
      nearestAny = { hub, km };
    }

    const areaCode = areaCodeForHubId(hub.hubId);
    if (areaCode && (!nearestMapped || km < nearestMapped.km)) {
      nearestMapped = { hub, km, areaCode };
    }
  }

  if (!nearestMapped || nearestMapped.km > MAX_HUB_KM) return null;

  // 라벨은 실제 최근접 hub(시드 밖이어도) · area는 시드 매핑
  const labelHub =
    nearestAny && nearestAny.km <= MAX_HUB_KM ? nearestAny.hub : nearestMapped.hub;

  return {
    areaCode: nearestMapped.areaCode,
    hubId: String(labelHub.hubId),
    hubName: String(labelHub.name || labelHub.hubId),
    km: nearestAny?.km ?? nearestMapped.km,
  };
}
