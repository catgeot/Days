import { festivalLngLat } from './koreaFestivalCorridors.js';
import { detectSidoCode } from './festivalRegionTags.js';
import { areaCodeForHubId, hubIdsForArea } from './koreaHubSeeds.js';
import koreaAreaCodes from '../Home/data/koreaAreaCodes.json' with { type: 'json' };
import { extractTourAttractionSigungu } from '../Home/lib/koreaTourAttractionLocality.js';
import { resolveCityAttractionHub } from '../Home/lib/cityAttractionHubs.js';
import { stripKoAdminSuffix } from '../../utils/mrtStayQuery.js';

const DEFAULT_LIMIT = 4;
const MAX_KM = 120;

function sidoNameForArea(sido) {
  const entry = koreaAreaCodes?.areas?.[String(sido || '')];
  return String(entry?.name || '').trim();
}

function hubRecord(hub) {
  if (!hub?.hubId) return null;
  return {
    hubId: String(hub.hubId).toLowerCase(),
    name: String(hub.name || hub.hubId),
    lat: Number(hub.lat),
    lng: Number(hub.lng),
  };
}

function hubBelongsToFestivalSido(hub, sido) {
  if (!hub?.hubId || !sido) return true;
  const mapped = areaCodeForHubId(hub.hubId);
  if (mapped) return String(mapped) === String(sido);
  const label = sidoNameForArea(sido);
  if (!label) return false;
  const full = resolveCityAttractionHub(hub.hubId) || hub;
  const blob = [full.name, full.name_en, full.hubId, ...(full.aliases || [])].join(' ');
  return blob.includes(label);
}

function hubNameFitsSigungu(hub, sigungu) {
  if (!hub || !sigungu) return false;
  const short = stripKoAdminSuffix(sigungu) || sigungu;
  const name = String(hub.name || '').trim();
  if (name && (name === short || name === sigungu)) return true;
  if (name && name.length >= 2 && sigungu.includes(name)) return true;
  if (name && short.length >= 2 && (name.includes(short) || short.includes(name))) return true;
  const full = resolveCityAttractionHub(hub.hubId) || hub;
  const aliases = Array.isArray(full?.aliases) ? full.aliases : [];
  return aliases.some((alias) => {
    const a = String(alias || '').trim();
    if (!a) return false;
    if (a === sigungu || a === short) return true;
    return a.length >= 2 && sigungu.includes(a);
  });
}

function sidoPrimaryHub(hubs, sido) {
  if (!sido) return null;
  const primaryId = String(hubIdsForArea(sido)[0] || '').toLowerCase();
  if (!primaryId) return null;
  return hubs.find((h) => String(h.hubId || '').toLowerCase() === primaryId) || null;
}

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
function hubFromFestivalAddr(item, hubs, sido) {
  const sigungu = extractTourAttractionSigungu(item?.addr1, item?.addr2);
  if (!sigungu) return null;
  const short = stripKoAdminSuffix(sigungu) || sigungu;

  for (const hub of hubs) {
    if (!hub?.hubId) continue;
    if (hubNameFitsSigungu(hub, sigungu)) return hub;
  }

  // 구 hub가 시도 시드에 없어도 카탈로그 exact로 찾음 (미추홀구 → michuhol, 인천 시드는 인천·강화·옹진만)
  const resolved =
    resolveCityAttractionHub(sigungu) ||
    (short !== sigungu ? resolveCityAttractionHub(short) : null);
  if (resolved && hubBelongsToFestivalSido(resolved, sido)) {
    return hubRecord(resolved);
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

function finalizeNearby(rankedHubs, addrHub, item, hubs, sido, limit) {
  const out = rankedHubs.slice(0, limit);
  if (addrHub) return promoteAddrHub(out, addrHub, limit);
  const sigungu = extractTourAttractionSigungu(item?.addr1, item?.addr2);
  if (!sigungu || !out[0] || hubNameFitsSigungu(out[0], sigungu)) return out;
  const primary = sidoPrimaryHub(hubs, sido);
  if (primary) return promoteAddrHub(out, primary, limit);
  return out;
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

  const rawArea = item?.areaCode;
  const sido =
    (rawArea != null && String(rawArea).trim() !== '' && String(rawArea).trim()) ||
    detectSidoCode(item?.addr1) ||
    null;
  const addrHub = hubFromFestivalAddr(item, hubs, sido);
  const pt = festivalLngLat(item?.mapx, item?.mapy);

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
      if (out.length) return finalizeNearby(out, addrHub, item, hubs, sido, limit);
    } else if (ranked.length) {
      return finalizeNearby(
        ranked.slice(0, limit).map((r) => r.hub),
        addrHub,
        item,
        hubs,
        sido,
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
    if (seeded.length) return finalizeNearby(seeded, addrHub, item, hubs, sido, limit);
  }

  if (addrHub) return [addrHub].slice(0, limit);

  return [];
}

export { DEFAULT_LIMIT as NEARBY_HUB_LIMIT, MAX_KM as NEARBY_HUB_MAX_KM };
