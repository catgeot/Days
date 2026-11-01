/**
 * 검색어와 같은 이름의 다른 지역 업소(동명 상호·잘못 저장된 방문 좌표)가 섞이지 않게 하는 지역 검증.
 * 기준점(anchor) = 같은 검색 결과의 장소·관광 POI 또는 TourAPI 공식 제목 일치 항목.
 * 기준점이 없으면 판단하지 않는다(원본 유지). supabase·fetch 없음 — 순수 함수.
 */

export const HOMONYM_REGION_MAX_KM = 60;

const TOURISM_KIND_RE =
  /tourist|attraction|monument|museum|beach|park|worship|temple|viewpoint|historic|heritage|landmark|island|natural|outdoor|mountain|lighthouse|trail|nature|scenic|lake|waterfall|castle|palace/;

const normalizeKey = (s) =>
  String(s ?? '')
    .trim()
    .toLowerCase()
    .replace(/\(.*?\)/g, '')
    .replace(/[\s_\-·.,]+/g, '');

function toFiniteCoord(value) {
  const n = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(n) ? n : NaN;
}

export function haversineKm(lat1, lng1, lat2, lng2) {
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function hasCoords(item) {
  return Number.isFinite(toFiniteCoord(item?.lat)) && Number.isFinite(toFiniteCoord(item?.lng));
}

function itemNameKeys(item) {
  return [item?.name, item?.name_en, item?.name_ko]
    .map(normalizeKey)
    .filter((key) => key.length >= 2);
}

/** 검색어와 이름이 정확히 같은 결과 */
export function nameEqualsQuery(item, query) {
  const q = normalizeKey(query);
  if (q.length < 2) return false;
  return itemNameKeys(item).includes(q);
}

function nameContainsQuery(item, query) {
  const q = normalizeKey(query);
  if (q.length < 2) return false;
  return itemNameKeys(item).some((key) => key.includes(q));
}

/**
 * 이름이 검색어이거나 검색어를 한 단어로 포함 — 「서산 해미읍성」「Chujado Island」.
 * 「남산면」「해동용궁사」처럼 검색어가 다른 지명의 일부일 뿐인 결과는 기준점이 아니다.
 */
function nameHasQueryWord(item, query) {
  const q = normalizeKey(query);
  if (q.length < 2) return false;
  if (nameEqualsQuery(item, query)) return true;
  return [item?.name, item?.name_en, item?.name_ko].some((name) =>
    String(name ?? '')
      .replace(/\(.*?\)/g, ' ')
      .split(/[\s,·]+/)
      .some((word) => normalizeKey(word) === q),
  );
}

/** Mapbox POI 중 관광 카테고리가 없는 것(식당·상호·무분류 marker) */
export function isBusinessLikeSearchHit(item) {
  if (!item || item.source !== 'mapbox') return false;
  if (!item.poiAttraction && item.kind !== 'attraction') return false;
  const kind = normalizeKey(item.attractionKind);
  return !kind || !TOURISM_KIND_RE.test(kind);
}

/**
 * 「Gwacheon Mission of the Anmyeonam」(안면암 과천 포교당)처럼 관광 카테고리여도
 * 이름이 다른 곳의 분원·지점임을 밝힌 POI. 카테고리만으로는 본 장소와 구분되지 않는다.
 */
const BRANCH_NAME_RE = /포교당|분원|지점|분점|\bmission\b|\bbranch\b/i;

/** 거리 규칙 대상 — 업소(상호·무분류) 또는 이름이 지점·분원인 POI. 관광·명소는 제외하지 않는다. */
export function isBranchLikeSearchHit(item) {
  if (isBusinessLikeSearchHit(item)) return true;
  if (!item || item.source !== 'mapbox') return false;
  if (!item.poiAttraction && item.kind !== 'attraction') return false;
  return [item.name, item.name_en, item.name_ko].some((name) => BRANCH_NAME_RE.test(String(name ?? '')));
}

/** 지역 기준점이 될 수 있는 결과 — 도시·지역형이거나 관광 카테고리 POI (지점 제외) */
export function isRegionAnchorHit(item) {
  if (!item || !hasCoords(item)) return false;
  if (item.source === 'mapbox' && (item.poiAttraction || item.kind === 'attraction')) {
    return !isBranchLikeSearchHit(item);
  }
  return item.source === 'tourapi' || item.kind === 'city' || item.kind === 'spot';
}

function minDistanceKm(item, anchors) {
  const lat = toFiniteCoord(item?.lat);
  const lng = toFiniteCoord(item?.lng);
  let best = Infinity;
  for (const anchor of anchors) {
    const d = haversineKm(lat, lng, toFiniteCoord(anchor.lat), toFiniteCoord(anchor.lng));
    if (d < best) best = d;
  }
  return best;
}

/** 「해미읍성감자탕」「… 대부도점」처럼 검색어를 상호에 붙인 업소 — 그 장소 바로 옆일 때만 의미가 있다. */
export const DERIVED_NAME_BUSINESS_MAX_KM = 15;

function isMapboxPoiHit(item) {
  return item?.source === 'mapbox' && (item.poiAttraction || item.kind === 'attraction');
}

/**
 * 검색어와 이름이 겹치는 업소·지점 POI가 그 장소와 멀리 떨어져 있으면 뺀다.
 * 관광·명소 POI는 거리로 빼지 않는다 — 경주 남산·부산 해동용궁사처럼 같은 이름의 명소가 여러 지역에 있다.
 * - 이름이 같은 업소: 이름이 겹치는 기준점에서 maxKm 초과 (Chujado → 부천 상호)
 * - 이름에 검색어를 붙인 업소·지점: 정답 기준점에서 DERIVED_NAME_BUSINESS_MAX_KM 초과
 *   (해미읍성 → 안산·창원 지점, Anmyeonam → 과천 포교당)
 * 기준점 = 이름이 검색어이거나 검색어를 한 단어로 포함한 장소·관광 결과(nameHasQueryWord).
 * 호출부가 넘긴 anchors(내장 결과 전체)도 같은 조건으로 거른다 — 「남산」 검색의 춘천 결과처럼
 * 이름이 다른 내장 결과가 기준점이 되어 서울 「남산」 업소를 빼는 일이 없게. 기준점이 없으면 판단하지 않는다.
 * @param {string} query
 * @param {object[]} hits
 * @param {{ anchors?: object[], maxKm?: number }} [opts] anchors = 호출부가 아는 정답 후보(SSOT 결과 등)
 */
export function dropFarHomonymBusinessHits(query, hits, opts = {}) {
  const list = Array.isArray(hits) ? hits : [];
  const maxKm = opts.maxKm ?? HOMONYM_REGION_MAX_KM;
  const anchors = [...(opts.anchors || []).filter(hasCoords), ...list.filter(isRegionAnchorHit)].filter((item) =>
    nameHasQueryWord(item, query),
  );
  if (!anchors.length) return list;
  return list.filter((item) => {
    if (!isMapboxPoiHit(item) || !hasCoords(item)) return true;
    if (!isBranchLikeSearchHit(item)) return true;
    if (nameEqualsQuery(item, query)) return minDistanceKm(item, anchors) <= maxKm;
    if (!nameContainsQuery(item, query)) return true;
    return minDistanceKm(item, anchors) <= DERIVED_NAME_BUSINESS_MAX_KM;
  });
}

/**
 * TourAPI searchKeyword items → 기준점 (제목이 검색어와 같은 것만).
 * @param {object[]} items
 * @param {string} query
 */
export function tourKeywordItemsToRegionAnchors(items, query) {
  const out = [];
  for (const item of items || []) {
    const lat = toFiniteCoord(item?.mapy);
    const lng = toFiniteCoord(item?.mapx);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) continue;
    const anchor = {
      name: String(item?.title || '').trim(),
      lat,
      lng,
      source: 'tourapi',
      contentId: String(item?.contentId || item?.contentid || '').trim() || undefined,
      addr1: String(item?.addr1 || '').trim() || undefined,
    };
    if (!nameEqualsQuery(anchor, query)) continue;
    out.push(anchor);
  }
  return out;
}

/**
 * place_stats 방문 행이 검색어와 같은 이름의 공식 장소(TourAPI)와 멀리 떨어져 있으면
 * 좌표를 공식 장소로 맞춘다. 동명 업소 좌표로 저장된 행(추자도 → 포항)이 다른 지역 결과로 뜨지 않게.
 * 좌표 출처가 공식이 아니던 지역 라벨(parentCity)은 버린다 — 이후 reverse geocode가 다시 채운다.
 * @param {object[]} spots
 * @param {object[]} anchors tourKeywordItemsToRegionAnchors 결과
 * @param {{ maxKm?: number, isDomestic?: (lat: number, lng: number) => boolean }} [opts]
 */
export function alignVisitedSpotsToRegionAnchors(spots, anchors, opts = {}) {
  const list = Array.isArray(spots) ? spots : [];
  const usable = (anchors || []).filter(hasCoords);
  if (!usable.length) return list;
  const maxKm = opts.maxKm ?? HOMONYM_REGION_MAX_KM;
  return list.map((spot) => {
    if (!spot || !hasCoords(spot)) return spot;
    const lat = toFiniteCoord(spot.lat);
    const lng = toFiniteCoord(spot.lng);
    if (opts.isDomestic && !opts.isDomestic(lat, lng)) return spot;
    const sameName = usable.filter((anchor) =>
      itemNameKeys(spot).some((key) => key === normalizeKey(anchor.name)),
    );
    if (!sameName.length) return spot;
    if (minDistanceKm(spot, sameName) <= maxKm) return spot;
    const nearestOfficial = sameName[0];
    const { parentCity: _staleParent, poiAttraction: _stalePoi, ...rest } = spot;
    return {
      ...rest,
      lat: nearestOfficial.lat,
      lng: nearestOfficial.lng,
      ...(nearestOfficial.contentId && !spot.contentId ? { contentId: nearestOfficial.contentId } : {}),
      regionAlignedFrom: { lat, lng },
    };
  });
}
