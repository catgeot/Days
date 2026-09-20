/**
 * /korea/theme/scenic 텍스트 검색 — name·addr·지역 부분 일치.
 * 지자체 팔경·구경: 기본은 curated 멤버 필터. 명소 풀은 injectLocalScenic로 결손 멤버 주입.
 * (호출측: 전국 풀에서 매칭한 뒤 권역·종목 칩으로 분해)
 */
import { resolveCityAttractionHub } from './cityAttractionHubs.js';
import {
  listsForHub,
  matchLocalScenicListForScenicSearch,
  mergeLocalScenicMembersIntoScenicSpots,
  resolveLocalScenicList,
  spotMatchesLocalScenicListMember,
} from './koreaLocalScenicLists.js';

/**
 * @param {string} value
 */
export function normalizeScenicQuery(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '');
}

/**
 * PostgREST `.or()` / ilike 패턴용 — 특수문자 제거·길이 제한.
 * @param {string | null | undefined} value
 * @returns {string}
 */
export function sanitizeScenicDbSearchQuery(value) {
  return String(value || '')
    .trim()
    .replace(/[,.()%*_'"\\]/g, '')
    .slice(0, 40);
}

/**
 * 시군 허브 별칭·발음 표기 → 공식명 (창령→창녕).
 * 팔경 리스트 공식 제목(창녕구경)은 그대로 둔다.
 * @param {string} query
 */
export function canonicalScenicSearchQuery(query) {
  const raw = String(query || '').trim();
  if (!raw) return raw;
  if (resolveLocalScenicList(raw)?.list) return raw;
  const hub = resolveCityAttractionHub(raw);
  if (hub?.name) return String(hub.name).trim();
  return raw;
}

const TOUR_ADDR_PROVINCE_PREFIX = {
  서울: '서울특별시',
  부산: '부산광역시',
  대구: '대구광역시',
  인천: '인천광역시',
  광주: '광주광역시',
  대전: '대전광역시',
  울산: '울산광역시',
  세종: '세종특별자치시',
  경기: '경기도',
  강원: '강원',
  충북: '충청북도',
  충남: '충청남도',
  전북: '전북',
  전남: '전라남도',
  경북: '경상북도',
  경남: '경상남도',
  제주: '제주',
};

/**
 * 허브 표기 「경기 광주」는 Tour addr 「경기도 광주시」부분일치가 안 됨.
 * @param {string} hubName
 */
export function scenicTourAddrNeedle(hubName) {
  const raw = String(hubName || '').trim();
  if (!raw) return raw;
  const parts = raw.split(/\s+/).filter(Boolean);
  if (parts.length < 2) return raw;
  const prefix = TOUR_ADDR_PROVINCE_PREFIX[parts[0]];
  if (!prefix) return raw;
  return `${prefix} ${parts.slice(1).join(' ')}`;
}

/**
 * TourAPI title/addr1 ilike용. 허브 공식명(경기 광주)이 아니라 주소 표기(경기도 광주).
 * @param {string} query
 */
export function scenicTourSearchQuery(query) {
  const canonical = canonicalScenicSearchQuery(query);
  const hub =
    resolveCityAttractionHub(canonical) || resolveCityAttractionHub(query);
  const needle = hub?.name ? scenicTourAddrNeedle(hub.name) : canonical;
  return sanitizeScenicDbSearchQuery(needle);
}

/**
 * 짧은 쿼리 오탐 완화용 본명 코어.
 * 「창원 주남저수지」→ 주남저수지 (허브·선두 토큰 제거).
 * @param {object} spot
 * @returns {string[]}
 */
function scenicNameCores(spot) {
  /** @type {Set<string>} */
  const cores = new Set();
  for (const raw of [spot?.name, spot?.attractionName]) {
    const text = String(raw || '').trim();
    if (!text) continue;
    const full = normalizeScenicQuery(text);
    if (full) cores.add(full);
    const parts = text.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
      const tail = normalizeScenicQuery(parts.slice(1).join(''));
      if (tail) cores.add(tail);
    }
  }
  return [...cores];
}

/**
 * @param {object} spot
 * @param {string} normalizedQuery
 */
function spotMatchesScenicQuery(spot, normalizedQuery) {
  if (!normalizedQuery) return true;

  const nameCores = scenicNameCores(spot);
  // 2글자: 「제주남쪽」「광주남한」중간 결합 오탐 방지 — 본명 선두·시군 주소만
  if (normalizedQuery.length <= 2) {
    if (
      nameCores.some(
        (core) =>
          core === normalizedQuery || core.startsWith(normalizedQuery),
      )
    ) {
      return true;
    }
    const addrFields = [
      spot?.addr1,
      spot?.addr2,
      spot?.locality,
      spot?.areaLabel,
    ]
      .map((v) => normalizeScenicQuery(v))
      .filter(Boolean);
    return addrFields.some(
      (field) =>
        field.includes(`${normalizedQuery}시`) ||
        field.includes(`${normalizedQuery}군`) ||
        field.includes(`${normalizedQuery}읍`),
    );
  }

  if (nameCores.some((core) => core.includes(normalizedQuery))) return true;

  const secondary = [
    spot?.attractionNameEn,
    spot?.addr1,
    spot?.addr2,
    spot?.blurb,
    spot?.region,
    spot?.locality,
    spot?.areaLabel,
    spot?.nameHanja,
  ]
    .map((v) => normalizeScenicQuery(v))
    .filter(Boolean);
  return secondary.some((field) => field.includes(normalizedQuery));
}

/**
 * @param {object[]} items
 * @param {string} query
 * @param {{ injectLocalScenic?: boolean }} [opts]
 *   명소(GATEO 선정) 풀에만 true — 명승(유산) 풀에는 넣지 않음.
 */
export function filterScenicSpotsByQuery(items, query, opts = {}) {
  const resolvedQuery = canonicalScenicSearchQuery(query);
  const q = normalizeScenicQuery(resolvedQuery);
  if (!q) return Array.isArray(items) ? items : [];

  if (opts.injectLocalScenic) {
    const exactList = resolveLocalScenicList(resolvedQuery);
    if (exactList?.list) {
      const curatedMembers = (items || []).filter((item) =>
        spotMatchesLocalScenicListMember(item, exactList.list),
      );
      return mergeLocalScenicMembersIntoScenicSpots(
        curatedMembers,
        exactList.list.hubId,
      ).filter((spot) => spot.localScenicListId === exactList.list.listId);
    }

    const hub = resolveCityAttractionHub(resolvedQuery);
    if (hub?.hubId && listsForHub(hub.hubId).length) {
      const pooled = (items || []).filter(
        (item) => String(item.hubId || '').trim() === hub.hubId,
      );
      return mergeLocalScenicMembersIntoScenicSpots(pooled, hub.hubId);
    }

    const listMatch = matchLocalScenicListForScenicSearch(resolvedQuery);
    if (listMatch) {
      const curatedMembers = (items || []).filter((item) =>
        spotMatchesLocalScenicListMember(item, listMatch),
      );
      return mergeLocalScenicMembersIntoScenicSpots(
        curatedMembers,
        listMatch.hubId,
      ).filter((spot) => spot.localScenicListId === listMatch.listId);
    }
  }

  const listMatch = matchLocalScenicListForScenicSearch(resolvedQuery);
  if (listMatch) {
    return (items || []).filter((item) =>
      spotMatchesLocalScenicListMember(item, listMatch),
    );
  }

  return (items || []).filter((item) => spotMatchesScenicQuery(item, q));
}

/**
 * TourAPI 권역 건수 → 최다 권역 (동점이면 regionOrder 앞쪽).
 * 부분일치 오탐(성주→보령 성주면, 함안로 등)보다 본 지역 건수를 고른다.
 *
 * @param {string[]} regionOrder
 * @param {Record<string, number> | null | undefined} regionCounts
 * @param {string} fallback
 */
export function pickBestRegionByCounts(regionOrder, regionCounts, fallback) {
  const order = Array.isArray(regionOrder) ? regionOrder : [];
  let best = null;
  let bestN = 0;
  for (const r of order) {
    const n = Number(regionCounts?.[r]) || 0;
    if (n > bestN) {
      bestN = n;
      best = r;
    }
  }
  return best || fallback;
}

/**
 * hub URL 팔경 주입 — 검색 풀이 0이면 넣지 않음 (창령+?hub=changnyeong → 창녕구경 오탐).
 * @param {{ hubId?: string | null, searchActive?: boolean, searchPoolCount?: number }} opts
 */
export function shouldMergeHubLocalScenic(opts = {}) {
  const hubId = String(opts.hubId || '').trim();
  if (!hubId) return false;
  if (opts.searchActive && Number(opts.searchPoolCount) === 0) return false;
  return true;
}
