import { festivalLngLat } from './koreaFestivalCorridors.js';
import { detectSidoCode } from './festivalRegionTags.js';
import { areaCodeForHubId, hubIdsForArea } from './koreaHubSeeds.js';

const DEFAULT_LIMIT = 4;
const MAX_KM = 120;

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
 * 축제 좌표·주소 기준 인근 hub.
 * 전국 defaultHubIds 고정 추천 금지 — 위치 없으면 시도 시드만, 둘 다 없으면 [].
 *
 * @param {Record<string, unknown> | null | undefined} item
 * @param {Array<{ hubId: string, name: string, lat?: number, lng?: number }>} hubList
 * @param {{ limit?: number, maxKm?: number }} [opts]
 */
export function nearbyHubsForFestival(item, hubList, opts = {}) {
  const limit = opts.limit ?? DEFAULT_LIMIT;
  const maxKm = opts.maxKm ?? MAX_KM;
  const hubs = Array.isArray(hubList) ? hubList : [];
  if (!item || !hubs.length) return [];

  const pt = festivalLngLat(item?.mapx, item?.mapy);
  const rawArea = item?.areaCode;
  const sido =
    (rawArea != null && String(rawArea).trim() !== '' && String(rawArea).trim()) ||
    detectSidoCode(item?.addr1) ||
    null;

  if (pt) {
    /** @type {{ hub: (typeof hubs)[number], km: number }[]} */
    const ranked = [];
    for (const hub of hubs) {
      if (!hub?.hubId) continue;
      const lat = Number(hub.lat);
      const lng = Number(hub.lng);
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) continue;
      const km = haversineKm(pt.lat, pt.lng, lat, lng);
      if (!Number.isFinite(km) || km > maxKm) continue;
      ranked.push({ hub, km });
    }
    ranked.sort((a, b) => a.km - b.km || String(a.hub.name).localeCompare(String(b.hub.name), 'ko'));

    if (sido) {
      const same = [];
      const other = [];
      for (const row of ranked) {
        if (String(areaCodeForHubId(row.hub.hubId) || '') === String(sido)) {
          same.push(row);
        } else {
          other.push(row);
        }
      }
      const out = [...same, ...other].slice(0, limit).map((r) => r.hub);
      if (out.length) return out;
    } else if (ranked.length) {
      return ranked.slice(0, limit).map((r) => r.hub);
    }
  }

  if (sido) {
    const byId = new Map(
      hubs.map((h) => [String(h.hubId || '').toLowerCase(), h]),
    );
    return hubIdsForArea(sido)
      .map((id) => byId.get(String(id).toLowerCase()))
      .filter(Boolean)
      .slice(0, limit);
  }

  return [];
}

export { DEFAULT_LIMIT as NEARBY_HUB_LIMIT, MAX_KM as NEARBY_HUB_MAX_KM };
