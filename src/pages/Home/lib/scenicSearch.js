/**
 * /korea/theme/scenic 텍스트 검색 — name·addr·지역 부분 일치.
 * (호출측: 전국 풀에서 매칭한 뒤 권역·종목 칩으로 분해)
 */

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
 */
export function filterScenicSpotsByQuery(items, query) {
  const q = normalizeScenicQuery(query);
  if (!q) return Array.isArray(items) ? items : [];
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
