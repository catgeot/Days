/**
 * Wikidata P242 (locator map image) → Wikimedia Commons 정적 URL.
 * 여행 스케치 탭 위치 맥락용. 실패 시 null (Mapbox 폴백 없음).
 */

const WIKIDATA_API = 'https://www.wikidata.org/w/api.php';
const CACHE_PREFIX = 'gateo_wiki_locator_v1:';
const MEMORY_CACHE = new Map();

/** enwiki 표제가 name_en과 다른 소수 slug만 */
const TITLE_OVERRIDES_BY_SLUG = {
  // 필요 시 추가 — 예: 'some-slug': 'Canonical_Wikipedia_Title',
};

/**
 * @typedef {{ imageUrl: string, fileName: string, commonsFileUrl: string, entityId: string, title: string }} WikiLocatorMapResult
 */

/**
 * @param {string} fileName
 * @param {number} [width=1200]
 */
export function buildCommonsFilePathUrl(fileName, width = 1200) {
  const encoded = encodeURIComponent(fileName.replace(/ /g, '_'));
  const base = `https://commons.wikimedia.org/wiki/Special:FilePath/${encoded}`;
  return width ? `${base}?width=${width}` : base;
}

/**
 * @param {string} fileName
 */
export function buildCommonsFilePageUrl(fileName) {
  const encoded = encodeURIComponent(fileName.replace(/ /g, '_'));
  return `https://commons.wikimedia.org/wiki/File:${encoded}`;
}

/**
 * @param {{ name_en?: string, name?: string, slug?: string } | null | undefined} location
 * @returns {string[]}
 */
export function buildWikiTitleCandidates(location) {
  if (!location) return [];

  const out = [];
  const seen = new Set();
  const add = (raw) => {
    if (!raw || typeof raw !== 'string') return;
    const trimmed = raw.trim();
    if (!trimmed) return;
    const variants = [
      trimmed,
      trimmed.replace(/_/g, ' '),
      trimmed.replace(/\s+/g, '_'),
    ];
    for (const v of variants) {
      const key = v.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      out.push(v);
    }
  };

  const slug = location.slug ? String(location.slug).trim() : '';
  if (slug && TITLE_OVERRIDES_BY_SLUG[slug]) {
    add(TITLE_OVERRIDES_BY_SLUG[slug]);
  }

  add(location.name_en);
  add(location.name);

  if (slug) {
    add(
      slug
        .split('-')
        .filter(Boolean)
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' '),
    );
  }

  return out;
}

/**
 * @param {unknown} claims
 * @param {string} propertyId
 * @returns {string | null}
 */
function pickPreferredCommonsFile(claims, propertyId) {
  const list = claims?.[propertyId];
  if (!Array.isArray(list) || list.length === 0) return null;

  const ranked = [...list].sort((a, b) => {
    const rankScore = (c) => {
      if (c?.rank === 'preferred') return 0;
      if (c?.rank === 'normal') return 1;
      return 2;
    };
    return rankScore(a) - rankScore(b);
  });

  for (const claim of ranked) {
    const value = claim?.mainsnak?.datavalue?.value;
    if (typeof value === 'string' && value.trim()) return value.trim();
  }
  return null;
}

/**
 * @param {string} cacheKey
 * @returns {WikiLocatorMapResult | null | undefined}
 */
function readCache(cacheKey) {
  if (MEMORY_CACHE.has(cacheKey)) return MEMORY_CACHE.get(cacheKey);
  try {
    const raw = sessionStorage.getItem(CACHE_PREFIX + cacheKey);
    if (!raw) return undefined;
    const parsed = JSON.parse(raw);
    if (parsed === null || (parsed && typeof parsed.imageUrl === 'string')) {
      MEMORY_CACHE.set(cacheKey, parsed);
      return parsed;
    }
  } catch {
    // ignore
  }
  return undefined;
}

/**
 * @param {string} cacheKey
 * @param {WikiLocatorMapResult | null} value
 */
function writeCache(cacheKey, value) {
  MEMORY_CACHE.set(cacheKey, value);
  try {
    sessionStorage.setItem(CACHE_PREFIX + cacheKey, JSON.stringify(value));
  } catch {
    // quota — memory cache still works
  }
}

/**
 * @param {string} title
 * @returns {Promise<WikiLocatorMapResult | null>}
 */
async function fetchLocatorForTitle(title) {
  const params = new URLSearchParams({
    action: 'wbgetentities',
    sites: 'enwiki',
    titles: title,
    props: 'claims',
    format: 'json',
    origin: '*',
  });

  const res = await fetch(`${WIKIDATA_API}?${params.toString()}`);
  if (!res.ok) return null;

  const data = await res.json();
  const entities = data?.entities;
  if (!entities || typeof entities !== 'object') return null;

  for (const entity of Object.values(entities)) {
    if (!entity || entity.missing != null || !entity.id) continue;
    const fileName = pickPreferredCommonsFile(entity.claims, 'P242');
    if (!fileName) continue;

    return {
      imageUrl: buildCommonsFilePathUrl(fileName, 1200),
      fileName,
      commonsFileUrl: buildCommonsFilePageUrl(fileName),
      entityId: entity.id,
      title,
    };
  }
  return null;
}

/**
 * @param {{ name_en?: string, name?: string, slug?: string } | null | undefined} location
 * @returns {Promise<WikiLocatorMapResult | null>}
 */
export async function fetchWikiLocatorMap(location) {
  const candidates = buildWikiTitleCandidates(location);
  if (candidates.length === 0) return null;

  const cacheKey = (location?.slug || location?.name_en || location?.name || candidates[0])
    .toString()
    .trim()
    .toLowerCase();

  const cached = readCache(cacheKey);
  if (cached !== undefined) return cached;

  for (const title of candidates) {
    try {
      const result = await fetchLocatorForTitle(title);
      if (result) {
        writeCache(cacheKey, result);
        return result;
      }
    } catch {
      // try next title
    }
  }

  writeCache(cacheKey, null);
  return null;
}
