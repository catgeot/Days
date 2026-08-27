import { festivalLngLat } from './koreaFestivalCorridors.js';
import { detectSidoCode } from './festivalRegionTags.js';
import { areaCodeForHubId, hubIdsForArea } from './koreaHubSeeds.js';
import { extractTourAttractionSigungu } from '../Home/lib/koreaTourAttractionLocality.js';
import { resolveCityAttractionHub } from '../Home/lib/cityAttractionHubs.js';
import { stripKoAdminSuffix } from '../../utils/mrtStayQuery.js';

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
 * addr1 시·군·구와 hub 이름·alias 일치 시 우선 hub (횡성한우축제→평창 오탐 방지).
 * @param {Record<string, unknown> | null | undefined} item
 * @param {Array<{ hubId: string, name: string, lat?: number, lng?: number }>} hubs
 */
function hubFromFestivalAddr(item, hubs) {
  const sigungu = extractTourAttractionSigungu(item?.addr1, item?.addr2);
  if (!sigungu) return null;
  const short = stripKoAdminSuffix(sigungu) || sigungu;

  for (const hub of hubs) {
    if (!hub?.hubId) continue;
    const name = String(hub.name || '').trim();
    if (name && (sigungu.includes(name) || name.includes(short) || short.includes(name))) {
      return hub;
    }
    const full = resolveCityAttractionHub(hub.hubId);
    const aliases = Array.isArray(full?.aliases) ? full.aliases : [];
    if (
      aliases.some((alias) => {
        const a = String(alias || '').trim();
        return a && (sigungu.includes(a) || a.includes(short) || short.includes(a));
      })
    ) {
      return hub;
    }
  }
  return null;
}

/** @param {Array<{ hubId: string, name: string, lat?: number, lng?: number }>} hubs */
function promoteAddrHub(hubs, addrHub, limit) {
  if (!addrHub?.hubId) return hubs;
  const key = String(addrHub.hubId).toLowerCase();
  const rest = hubs.filter((h) => String(h.hubId || '').toLowerCase() !== key);
  return [addrHub, ...rest].slice(0, limit);
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

  const addrHub = hubFromFestivalAddr(item, hubs);
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
      if (out.length) return promoteAddrHub(out, addrHub, limit);
    } else if (ranked.length) {
      return promoteAddrHub(
        ranked.slice(0, limit).map((r) => r.hub),
        addrHub,
        limit,
      );
    }
  }

  if (sido) {
    const byId = new Map(
      hubs.map((h) => [String(h.hubId || '').toLowerCase(), h]),
    );
    const seeded = hubIdsForArea(sido)
      .map((id) => byId.get(String(id).toLowerCase()))
      .filter(Boolean)
      .slice(0, limit);
    if (seeded.length) return promoteAddrHub(seeded, addrHub, limit);
  }

  if (addrHub) return [addrHub].slice(0, limit);

  return [];
}

export { DEFAULT_LIMIT as NEARBY_HUB_LIMIT, MAX_KM as NEARBY_HUB_MAX_KM };
