/**
 * 탐색창 검색어 별칭·로마자 보강 — SSOT 미등록·표기 변형(람코↔랑코, 다카마스 등).
 * 큐레이션 exact는 cityAttractionHubs aliases가 우선; 여기는 Mapbox 보조 쿼리용.
 */

const normalizeKey = (s) =>
  String(s ?? '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '');

/** @type {Map<string, { canonical: string, romanized?: string, also?: string[] }>} */
const QUERY_ALIASES = new Map(
  [
    ['람코', { canonical: '랑코 해변', romanized: 'Lang Co Beach, Vietnam' }],
    ['랑코', { canonical: '랑코 해변', romanized: 'Lang Co Beach, Vietnam' }],
    ['랑코해변', { canonical: '랑코 해변', romanized: 'Lang Co Beach, Vietnam' }],
    ['langco', { canonical: 'lang co beach', romanized: 'Lang Co Beach, Vietnam' }],
    ['langcobeach', { canonical: 'lang co beach', romanized: 'Lang Co Beach, Vietnam' }],
    ['다카마스', { canonical: '다카마스', romanized: 'Takamatsu, Japan' }],
    ['다카맀', { canonical: '다카마스', romanized: 'Takamatsu, Japan' }],
    ['타카마스', { canonical: '다카마스', romanized: 'Takamatsu, Japan' }],
    ['타카마츠', { canonical: '다카마스', romanized: 'Takamatsu, Japan' }],
    ['다카마츠', { canonical: '다카마스', romanized: 'Takamatsu, Japan' }],
    [
      '사바섬',
      {
        canonical: '사바',
        romanized: 'Sabah, Malaysia',
        also: ['Saba, Caribbean Netherlands'],
      },
    ],
    [
      '사바 섬',
      {
        canonical: '사바',
        romanized: 'Sabah, Malaysia',
        also: ['Saba, Caribbean Netherlands'],
      },
    ],
    [
      'saba island',
      {
        canonical: 'Saba',
        romanized: 'Saba, Caribbean Netherlands',
        also: ['Sabah, Malaysia'],
      },
    ],
  ].map(([key, value]) => [normalizeKey(key), value]),
);

/**
 * @param {string} query
 * @returns {{ canonical: string, romanized?: string, also?: string[] } | null}
 */
export function resolveExploreSearchAlias(query) {
  const key = normalizeKey(query);
  if (!key) return null;
  return QUERY_ALIASES.get(key) || null;
}

/**
 * @param {string} query
 */
export function canonicalizeExploreSearchQuery(query) {
  const alias = resolveExploreSearchAlias(query);
  return alias?.canonical || String(query || '').trim();
}

/**
 * Mapbox 보조 쿼리 목록 (원문 + canonical + romanized).
 * @param {string} query
 */
export function buildMapboxSearchQueries(query) {
  const q = String(query || '').trim();
  if (!q) return [];

  const out = [];
  const seen = new Set();
  const push = (value) => {
    const next = String(value || '').trim();
    if (!next) return;
    const key = normalizeKey(next);
    if (!key || seen.has(key)) return;
    seen.add(key);
    out.push(next);
  };

  push(q);
  const alias = resolveExploreSearchAlias(q);
  if (alias?.canonical) push(alias.canonical);
  if (alias?.romanized) push(alias.romanized);
  for (const extra of alias?.also || []) push(extra);
  return out;
}

/** 해외 섬 한글명 — KR 우선·POI·「섬」수식어 제거하면 사바↔사보·사바 사헤브로 어긋남 */
export function isIslandPlaceQuery(query) {
  return /섬$|\bislands?\b/i.test(String(query || '').trim());
}
