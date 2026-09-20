/**
 * 역·POI 숙소 — 검색 중심점 Haversine 거리 · 네이버 지도 인근 숙소 딥링크.
 * GlobeStayStrip 카드 뱃지·추천순 거리 가중 · 순수 함수(스모크 가능).
 */

import {
  resolveKoStationAliasForLocation,
  universityAliasFromLocation,
  UNIVERSITY_CAMPUS_MAX_KM,
} from './mrtStayQuery.js';

export const STAY_GEOCODE_MAX_KM = 8;

export function simplifyStayGeocodeQuery(name) {
  let s = String(name || '').replace(/\s+/g, ' ').trim();
  s = s.replace(/,\s*BW\b.*/i, '');
  s = s.replace(/\s*시그니처\s*컬렉션/g, '');
  s = s.replace(/\s*(바이|by)\s+\S+/gi, '');
  s = s.replace(/\s*[&＆]\s*스파/g, '');
  return s.replace(/\s+/g, ' ').trim();
}

export function stayGeocodeQueries(name) {
  const full = String(name || '').replace(/\s+/g, ' ').trim();
  const simple = simplifyStayGeocodeQuery(full);
  const seen = new Set();
  const out = [];
  for (const q of [full, simple]) {
    if (!q || q.length < 2 || seen.has(q)) continue;
    seen.add(q);
    out.push(q);
  }
  return out;
}

export function isLodgingOsmValue(value) {
  return /^(hotel|hostel|motel|guest_house|apartment|chalet)$/i.test(String(value || '').trim());
}

const STAY_NAME_GENERIC_RE =
  /호텔|호스텔|모텔|리조트|스테이|스위츠|스위트|서울|부산|인천|호텔스|hotel|hostel|motel|resort|stay|suites|suite|premier|프리미어|collection|컬렉션|시그니처|&|＆|스파|by|바이/gi;

export function compactStayName(s) {
  return String(s || '')
    .toLowerCase()
    .replace(STAY_NAME_GENERIC_RE, '')
    .replace(/[\s,.\-_'"]+/g, '');
}

/** Photon 히트와 숙소명이 같은 건물인지 — 브랜드만 같고 동이 다르면 거부 */
export function stayNameCompatible(query, hitName) {
  const q = compactStayName(query);
  const h = compactStayName(hitName);
  if (q.length >= 4 && h.length >= 2 && (h.includes(q) || q.includes(h))) return true;
  const qTok = String(query || '')
    .replace(STAY_NAME_GENERIC_RE, ' ')
    .split(/\s+/)
    .map((t) => t.replace(/[^\p{L}\p{N}]/gu, ''))
    .filter((t) => t.length >= 2);
  if (!qTok.length || !h) return false;
  return qTok.every((t) => h.includes(t.toLowerCase()));
}

const EARTH_KM = 6371;

function toRad(d) {
  return (d * Math.PI) / 180;
}

export function haversineKm(lat1, lng1, lat2, lng2) {
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return EARTH_KM * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function finiteCoord(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function isPlausibleWgs84(lat, lng) {
  if (lat == null || lng == null) return false;
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return false;
  if (lat === 0 && lng === 0) return false;
  return true;
}

function pairFromLatLng(la, ln) {
  const lat = finiteCoord(la);
  const lng = finiteCoord(ln);
  if (isPlausibleWgs84(lat, lng)) return { lat, lng };
  if (lat != null && lng != null && isPlausibleWgs84(lng, lat)) return { lat: lng, lng: lat };
  return null;
}

function pushLngLatArray(pairs, coords) {
  if (!Array.isArray(coords) || coords.length < 2) return;
  if (Array.isArray(coords[0])) {
    pushLngLatArray(pairs, coords[0]);
    return;
  }
  pairs.push([coords[1], coords[0]]);
}

/**
 * MRT search item · Edge 매핑분에서 위·경도.
 * @param {Record<string, unknown> | null | undefined} item
 * @returns {{ lat: number, lng: number } | null}
 */
export function parseStayCoordPair(item) {
  if (!item || typeof item !== 'object') return null;
  const nested = [item.location, item.geo, item.coordinate, item.coordinates, item.gps, item.position]
    .filter((v) => v && typeof v === 'object' && !Array.isArray(v));
  const pairs = [
    [item.lat, item.lng],
    [item.latitude, item.longitude],
    [item.lat, item.lon],
    [item.hotelLatitude, item.hotelLongitude],
    [item.geoLat, item.geoLng],
    [item.locationLat, item.locationLng],
    [item.y, item.x],
  ];
  if (item.center && typeof item.center === 'object' && !Array.isArray(item.center)) {
    pairs.push([item.center.lat, item.center.lng], [item.center.latitude, item.center.longitude]);
  }
  pushLngLatArray(pairs, item.center);
  pushLngLatArray(pairs, item.coordinates);
  pushLngLatArray(pairs, item.geometry?.coordinates);
  for (const obj of nested) {
    pairs.push(
      [obj.lat, obj.lng],
      [obj.latitude, obj.longitude],
      [obj.lat, obj.lon],
      [obj.y, obj.x],
    );
    pushLngLatArray(pairs, obj.coordinates);
  }
  for (const [la, ln] of pairs) {
    const hit = pairFromLatLng(la, ln);
    if (hit) return hit;
  }
  return null;
}

/**
 * 숙소 거리·Photon 원점. 종각역 길·동 카드처럼 좌표가 없거나 역에서 8km 밖이면 역 SSOT.
 * @param {object | null | undefined} location
 * @param {string} [label]
 * @returns {{ lat: number, lng: number, label: string } | null}
 */
export function resolveMrtStayOrigin(location, label = '') {
  const stationAlias = resolveKoStationAliasForLocation(location);
  const universityAlias = universityAliasFromLocation(location);
  const parsed = parseStayCoordPair(location);
  const display = String(
    label || location?.name || location?.name_ko || stationAlias?.station || universityAlias?.campus || '',
  ).trim();
  const snapAlias = (alias, maxKm) => {
    const aliasLat = finiteCoord(alias?.lat);
    const aliasLng = finiteCoord(alias?.lng);
    if (!isPlausibleWgs84(aliasLat, aliasLng)) return null;
    if (!parsed) return { lat: aliasLat, lng: aliasLng, label: display || alias.campus || alias.station };
    if (haversineKm(parsed.lat, parsed.lng, aliasLat, aliasLng) > maxKm) {
      return { lat: aliasLat, lng: aliasLng, label: display || alias.campus || alias.station };
    }
    return null;
  };
  const stationSnap = snapAlias(stationAlias, STAY_GEOCODE_MAX_KM);
  if (stationSnap) return stationSnap;
  const campusSnap = snapAlias(universityAlias, UNIVERSITY_CAMPUS_MAX_KM);
  if (campusSnap) return campusSnap;
  if (!parsed) return null;
  return { ...parsed, label: display };
}

/** 350m · 1.1km · 2km */
export function formatStayDistanceLabel(km) {
  const n = Number(km);
  if (!Number.isFinite(n) || n < 0) return '';
  if (n < 1) {
    const meters = Math.max(1, Math.round(n * 1000));
    return `${meters}m`;
  }
  const one = Math.round(n * 10) / 10;
  if (Number.isInteger(one)) return `${one}km`;
  return `${one.toFixed(1)}km`;
}

export function formatStayDistanceFromPlace(placeLabel, km) {
  const dist = formatStayDistanceLabel(km);
  if (!dist) return '';
  const place = String(placeLabel || '').trim();
  return place ? `${place} ${dist}` : dist;
}

export function stayDistanceRank(item) {
  const n = Number(item?.distanceKm);
  return Number.isFinite(n) && n >= 0 ? n : Number.POSITIVE_INFINITY;
}

/**
 * @param {object[] | null | undefined} items
 * @param {{ lat?: unknown, lng?: unknown, label?: string } | null | undefined} origin
 */
export function attachMrtStayDistances(items, origin) {
  const list = Array.isArray(items) ? items : [];
  const lat = finiteCoord(origin?.lat);
  const lng = finiteCoord(origin?.lng);
  const label = String(origin?.label || '').trim();
  if (!isPlausibleWgs84(lat, lng)) return list;
  return list.map((item) => {
    const pt = parseStayCoordPair(item);
    if (!pt) return item;
    const km = haversineKm(lat, lng, pt.lat, pt.lng);
    return {
      ...item,
      distanceKm: km,
      distanceLabel: formatStayDistanceFromPlace(label, km),
    };
  });
}

/**
 * 네이버 지도 — 검색 중심 좌표 + 「{지명} 숙소」.
 * @param {{ lat?: unknown, lng?: unknown, query?: string }} opts
 * @returns {string | null}
 */
export function buildNaverNearbyStayMapUrl(opts = {}) {
  const query = String(opts.query || '').trim();
  if (!query) return null;
  const search = encodeURIComponent(`${query} 숙소`);
  const lat = finiteCoord(opts.lat);
  const lng = finiteCoord(opts.lng);
  if (isPlausibleWgs84(lat, lng)) {
    return `https://map.naver.com/p/search/${search}?c=${lng},${lat},16,0,0,0,dh`;
  }
  return `https://map.naver.com/p/search/${search}`;
}
