/** ICN→서·북유럽 corridor — hub 없을 때 남쪽 출발 waypoint + DXB 관문 */
export const ICN_EUROPE_DEPARTURE_WAYPOINT = [125, 33];
export const ICN_EUROPE_CORRIDOR_HUB = 'DXB';
/** DXB→서·북유럽 — 우크라이나·RU50 bbox 회피용 지중해 관문 (헬싱키·발트 회귀 방지) */
export const ICN_EUROPE_MEDITERRANEAN_GATEWAY = [15, 42];
/** ICN→태평양·미 서부 — 북한 bbox arc 회피 · 북태평양 대권(구 [180,12]는 하와이급 남하) */
export const ICN_PACIFIC_MIDPOINT_WAYPOINT = [135, 35];
/** Dubai (DXB) — graph visual flyover only · hubIatas(Bar semantic)는 변경하지 않음 */
export const DXB_VISUAL_FLYOVER_WAYPOINT = [55.3657, 25.2532];

/** Europe bbox (lat 35–72, lng -25–45) */
export function isEuropeCorridorDest(destLngLat) {
  const lng = destLngLat[0];
  const lat = destLngLat[1];
  return lat >= 35 && lat <= 72 && lng >= -25 && lng <= 45;
}

/** 남유럽 — DXB corridor 생략 · 직항 short arc */
export function isSouthernEuropeDest(destLngLat) {
  const lng = destLngLat[0];
  const lat = destLngLat[1];
  return lat >= 35 && lat < 43 && lng >= -10 && lng <= 30;
}

/**
 * ICN→서·북유럽 corridor 적용 대상 (override hub 없을 때).
 * @param {[number, number]} destLngLat
 * @param {string} [originIata]
 */
export function isWesternNorthernEuropeCorridor(destLngLat, originIata = 'ICN') {
  if (String(originIata ?? '').trim().toUpperCase() !== 'ICN') return false;
  if (!isEuropeCorridorDest(destLngLat)) return false;
  if (isSouthernEuropeDest(destLngLat)) return false;
  return true;
}

/**
 * @param {[number, number]} originLngLat
 * @param {[number, number]} destLngLat
 * @param {{ originIata?: string }} [options]
 * @returns {{ waypoints: [number, number][], hubIatas: string[] } | null}
 */
export function resolveCorridorAnchors(originLngLat, destLngLat, options = {}) {
  void originLngLat;
  if (!isWesternNorthernEuropeCorridor(destLngLat, options.originIata)) return null;
  return {
    waypoints: [ICN_EUROPE_DEPARTURE_WAYPOINT],
    postHubWaypoints: [ICN_EUROPE_MEDITERRANEAN_GATEWAY],
    hubIatas: [ICN_EUROPE_CORRIDOR_HUB],
  };
}

/**
 * North Atlantic·Caribbean (버뮤다·아소르스 등) — ICN 직항 short arc는 북극·민감공역 / long arc는 남극 루프.
 * 미국·캐나다 본토(lat>35, lng<-65)는 태평양 routing — DXB Atlantic corridor 오적용 제외.
 */
export function isNorthAtlanticCorridorDest(destLngLat, originIata = 'ICN') {
  if (String(originIata ?? '').trim().toUpperCase() !== 'ICN') return false;
  const lng = destLngLat[0];
  const lat = destLngLat[1];
  if (lat < 15 || lat > 45) return false;
  if (lat > 35 && lng < -65) return false;
  if (lng >= -90 && lng < -30) return true;
  if (lng >= -30 && lng < 20) return true;
  return false;
}

/**
 * @param {[number, number]} originLngLat
 * @param {[number, number]} destLngLat
 * @param {{ originIata?: string }} [options]
 */
export function resolveAtlanticCorridorAnchors(originLngLat, destLngLat, options = {}) {
  void originLngLat;
  if (!isNorthAtlanticCorridorDest(destLngLat, options.originIata)) return null;
  return {
    waypoints: [ICN_EUROPE_DEPARTURE_WAYPOINT],
    postHubWaypoints: [],
    hubIatas: [ICN_EUROPE_CORRIDOR_HUB],
  };
}

/** @param {[number, number]} destLngLat @param {{ originIata?: string }} [options] */
export function resolveRegionalCorridorAnchors(originLngLat, destLngLat, options = {}) {
  return resolveCorridorAnchors(originLngLat, destLngLat, options)
    ?? resolveAtlanticCorridorAnchors(originLngLat, destLngLat, options);
}

/**
 * Graph tier arc-only avoid — hubIatas(Bar semantic)는 변경하지 않음.
 * ICN→남쪽 출발→DXB flyover→지중해 관문→(graph hub)→목적지 순.
 * @returns {{ waypoints: [number, number][], postHubWaypoints: [number, number][] }}
 */
export function resolveVisualAvoidWaypoints(_destLngLat, _options = {}) {
  return {
    waypoints: [
      ICN_EUROPE_DEPARTURE_WAYPOINT,
      DXB_VISUAL_FLYOVER_WAYPOINT,
      ICN_EUROPE_MEDITERRANEAN_GATEWAY,
    ],
    postHubWaypoints: [],
  };
}

/** avoid guard 재빌드 — 남쪽 waypoint + DXB + (유럽) 지중해 관문 */
export function resolveSouthernCorridorAnchors(destLngLat, options = {}) {
  const europe = isEuropeCorridorDest(destLngLat);
  const atlantic = isNorthAtlanticCorridorDest(destLngLat, options.originIata);
  if (europe || atlantic) {
    return {
      waypoints: [ICN_EUROPE_DEPARTURE_WAYPOINT],
      postHubWaypoints: europe ? [ICN_EUROPE_MEDITERRANEAN_GATEWAY] : [],
      hubIatas: [ICN_EUROPE_CORRIDOR_HUB],
    };
  }
  return {
    waypoints: [ICN_EUROPE_DEPARTURE_WAYPOINT],
    postHubWaypoints: [],
    hubIatas: [],
  };
}
