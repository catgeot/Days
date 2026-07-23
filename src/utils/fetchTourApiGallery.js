import { supabase } from '../shared/api/supabase';
import { scoreTourPhotoTitle } from './tourApiPhotoRank';

export { scoreTourPhotoTitle } from './tourApiPhotoRank';

/** page1 기본 searchPhoto 행 수 — 직렬 다건 호출 대신 병렬+소수 */
const DEFAULT_ROWS = 12;
const MIN_ROWS = 1;
const SCENIC_KEYWORD_ROWS = 8;
/** 공식 POI detailImage — 남이섬 등 풍부한 곳 활용 (TourAPI 상한 근처) */
const DETAIL_IMAGE_ROWS = 20;
/** page1에서 쓸 검색어 상한 (전경들 + 기본) */
const MAX_SEARCH_KEYWORDS = 3;
/** 갤러리에 남길 목표 장수 */
const TARGET_GALLERY = 24;
/** 깨진 URL 프로브 후보 상한 — 갤러리 기본은 skipProbe (UI onError) */
const PROBE_CANDIDATES = 12;
const PROBE_TIMEOUT_MS = 1500;
/** Edge invoke 단일 호출 상한 — 없으면 data.go.kr 지연에 수 분 hang */
const INVOKE_TIMEOUT_MS = 12_000;
/** fetchTourApiGallery 전체 상한 */
const GALLERY_FETCH_BUDGET_MS = 18_000;

/**
 * @template T
 * @param {Promise<T>} promise
 * @param {number} ms
 * @param {string} label
 * @returns {Promise<T>}
 */
function withTimeout(promise, ms, label) {
  let timer;
  return Promise.race([
    promise,
    new Promise((_, reject) => {
      timer = setTimeout(() => reject(new Error(`${label} timeout ${ms}ms`)), ms);
    }),
  ]).finally(() => {
    if (timer) clearTimeout(timer);
  });
}

/**
 * @param {string} action
 * @param {Record<string, unknown>} payload
 */
async function invokeTourApi(action, payload) {
  try {
    const { data, error } = await withTimeout(
      supabase.functions.invoke('tourapi-proxy', {
        body: { action, ...payload },
      }),
      INVOKE_TIMEOUT_MS,
      `tourapi:${action}`,
    );
    if (error) {
      console.warn(`[tourapi] ${action} invoke error:`, error.message || error);
      return null;
    }
    if (!data?.ok) {
      console.warn(
        `[tourapi] ${action} not ok:`,
        data?.message || data?.error || 'unknown',
      );
      return null;
    }
    return data;
  } catch (err) {
    console.warn(`[tourapi] ${action} failed:`, err?.message || err);
    return null;
  }
}

/**
 * @param {Record<string, unknown>} item
 * @param {string} kind
 * @param {number} index
 * @param {number} [rankScore]
 */
function toGalleryImage(item, kind, index, rankScore = 0) {
  const url = String(
    item?.imageUrl ||
      item?.galWebImageUrl ||
      item?.originimgurl ||
      item?.firstimage ||
      item?.smallimageurl ||
      '',
  ).trim();
  if (!url) return null;
  if (!/^https?:\/\//i.test(url)) return null;

  const httpsUrl = url.replace(/^http:\/\//i, 'https://');
  const idBase = String(
    item?.contentId || item?.title || item?.galTitle || index,
  ).replace(/\s+/g, '_');
  const photographer = String(
    item?.photographer || item?.galPhotographer || '한국관광공사',
  ).trim();
  const title = String(item?.title || item?.galTitle || '').trim();

  return {
    id: `tourapi-${kind}-${idBase}-${index}`,
    source: 'tourapi',
    urls: {
      small: httpsUrl,
      regular: httpsUrl,
      full: httpsUrl,
    },
    user: { name: photographer },
    links: {
      html: 'https://www.visitkorea.or.kr/',
    },
    alt_description: title || undefined,
    tourApi: {
      kind,
      contentId: item?.contentId ? String(item.contentId) : null,
      title: title || null,
      rankScore,
    },
  };
}

/**
 * @param {Array<ReturnType<typeof toGalleryImage>>} list
 */
function dedupeByUrl(list) {
  const seen = new Set();
  const out = [];
  for (const img of list) {
    if (!img) continue;
    const key = img.urls?.regular || img.urls?.full;
    if (!key || seen.has(key)) continue;
    seen.add(key);
    out.push(img);
  }
  return out;
}

/**
 * @param {string} primary
 * @param {string[] | undefined} extras
 * @param {string} placeTitle
 * @param {number} maxKeywords
 */
function buildSearchKeywords(primary, extras, placeTitle, maxKeywords) {
  const out = [];
  const seen = new Set();
  const push = (k) => {
    const s = String(k || '').trim();
    if (!s || s.length > 80 || seen.has(s)) return;
    seen.add(s);
    out.push(s);
  };

  for (const k of extras || []) push(k);

  // curated photoKeywords가 있으면 자동 전경/야경 생략 — 남이섬처럼 0건 키워드가 슬롯을 먹는 것 방지
  if (!(extras || []).length && placeTitle) {
    push(`${placeTitle} 전경`);
    push(`${placeTitle} 야경`);
  }

  push(primary);

  // 전경 키워드 우선 · 기본 keyword는 항상 마지막에 1개 확보
  if (out.length <= maxKeywords) return out;
  const primaryIdx = out.lastIndexOf(primary);
  const head = out.filter((_, i) => i !== primaryIdx).slice(0, maxKeywords - 1);
  return primary ? [...head, primary] : head.slice(0, maxKeywords);
}

/**
 * 브라우저에서 URL 로드 + 가로/세로 측정 (깨진 CDN 걸러냄).
 * Node/SSR에서는 ok만 통과.
 * @param {string} url
 * @param {number} timeoutMs
 * @returns {Promise<{ ok: boolean, width?: number, height?: number }>}
 */
function probeImageUrl(url, timeoutMs = PROBE_TIMEOUT_MS) {
  if (typeof Image === 'undefined') return Promise.resolve({ ok: true });
  return new Promise((resolve) => {
    const img = new Image();
    let settled = false;
    const done = (result) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      img.onload = null;
      img.onerror = null;
      try {
        img.src = '';
      } catch {
        /* ignore */
      }
      resolve(result);
    };
    const timer = setTimeout(() => done({ ok: false }), timeoutMs);
    img.onload = () =>
      done({
        ok: true,
        width: img.naturalWidth || 0,
        height: img.naturalHeight || 0,
      });
    img.onerror = () => done({ ok: false });
    img.referrerPolicy = 'no-referrer';
    img.src = url;
  });
}

/**
 * 가로·세로(·정사각)를 번갈아 배치해 메이슨리 리듬을 만듦.
 * @param {Array<Record<string, unknown>>} images
 */
export function interleaveByOrientation(images) {
  const landscape = [];
  const portrait = [];
  const square = [];
  for (const img of images || []) {
    const w = Number(img?.width) || 0;
    const h = Number(img?.height) || 0;
    if (w > 0 && h > 0) {
      if (h > w * 1.08) portrait.push(img);
      else if (w > h * 1.08) landscape.push(img);
      else square.push(img);
    } else {
      landscape.push(img);
    }
  }
  // 세로가 거의 없으면 원순서 유지 (전부 가로인 TourAPI 허브 등)
  if (portrait.length < 2) return images;

  const out = [];
  let li = 0;
  let pi = 0;
  let si = 0;
  let preferLandscape = true;
  while (
    li < landscape.length ||
    pi < portrait.length ||
    si < square.length
  ) {
    if (preferLandscape) {
      if (li < landscape.length) out.push(landscape[li++]);
      else if (si < square.length) out.push(square[si++]);
      else if (pi < portrait.length) out.push(portrait[pi++]);
    } else if (pi < portrait.length) {
      out.push(portrait[pi++]);
    } else if (si < square.length) {
      out.push(square[si++]);
    } else if (li < landscape.length) {
      out.push(landscape[li++]);
    }
    preferLandscape = !preferLandscape;
  }
  return out;
}

/**
 * @param {Array<ReturnType<typeof toGalleryImage>>} images
 * @param {{ limit?: number, thumbnailOnly?: boolean }} [opts]
 */
export async function filterLoadableTourApiImages(images, opts = {}) {
  const list = Array.isArray(images) ? images : [];
  if (list.length === 0) return [];
  const limit = opts.thumbnailOnly
    ? Math.min(3, list.length)
    : Math.min(PROBE_CANDIDATES, list.length);
  const candidates = list.slice(0, limit);

  const checks = await Promise.all(
    candidates.map(async (img) => {
      const url = img?.urls?.regular || img?.urls?.small || img?.urls?.full;
      if (!url) return null;
      const probed = await probeImageUrl(url);
      if (!probed?.ok) return null;
      const next = { ...img };
      if (probed.width > 0 && probed.height > 0) {
        next.width = probed.width;
        next.height = probed.height;
      }
      return next;
    }),
  );

  const kept = checks.filter(Boolean);
  if (opts.thumbnailOnly) return kept.slice(0, 1);
  return interleaveByOrientation(kept).slice(0, TARGET_GALLERY);
}

/**
 * 국내 갤러리 본체 (타임아웃은 fetchTourApiGallery 래퍼).
 * @param {Parameters<typeof fetchTourApiGallery>[0]} opts
 */
async function fetchTourApiGalleryInner(opts) {
  const keyword = String(opts?.photoKeyword || '').trim();
  if (!keyword) return [];

  const placeTitle = String(opts?.title || keyword).trim();
  const page = Math.max(1, Math.floor(Number(opts?.page) || 1));
  const numOfRows = opts?.thumbnailOnly
    ? 3
    : Math.min(
        30,
        Math.max(MIN_ROWS, Math.floor(Number(opts?.numOfRows) || DEFAULT_ROWS)),
      );
  const contentId =
    opts?.contentId != null && String(opts.contentId).trim() !== ''
      ? String(opts.contentId).trim()
      : null;
  // 갤러리 기본: 프로브 생략 — 32장 CDN decode가 분 단위로 막히던 주원인
  const skipProbe = opts?.skipProbe !== false;

  /** @type {Array<ReturnType<typeof toGalleryImage>>} */
  const detailImages = [];
  /** @type {Array<ReturnType<typeof toGalleryImage>>} */
  const photoImages = [];

  // 1) detailImage — thumbnailOnly면 이것만으로 충분하면 searchPhoto 생략
  let detailPromise = Promise.resolve(null);
  if (contentId && page === 1) {
    detailPromise = invokeTourApi('detailImage', {
      contentId,
      numOfRows: opts?.thumbnailOnly ? 3 : DETAIL_IMAGE_ROWS,
      pageNo: 1,
    });
  }

  // 2) searchPhoto 키워드 — 직렬 → 병렬 (체감 속도 핵심)
  const searchKeywords =
    page === 1
      ? buildSearchKeywords(
          keyword,
          opts?.photoKeywords,
          placeTitle,
          opts?.thumbnailOnly ? 1 : MAX_SEARCH_KEYWORDS,
        )
      : [keyword];

  // thumbnail + contentId 있으면 detail만으로 먼저 시도 후 부족분만 photo
  const photoPromises =
    opts?.thumbnailOnly && contentId
      ? []
      : searchKeywords.map((kw) => {
          const rows =
            kw === keyword
              ? numOfRows
              : Math.min(SCENIC_KEYWORD_ROWS, numOfRows);
          return invokeTourApi('searchPhoto', {
            keyword: kw,
            numOfRows: rows,
            pageNo: kw === keyword ? page : 1,
          }).then((photo) => ({ kw, photo }));
        });

  const [detail, ...photoResults] = await Promise.all([
    detailPromise,
    ...photoPromises,
  ]);

  if (detail?.items?.length) {
    detail.items.forEach((it, i) => {
      const img = toGalleryImage(it, 'detailImage', i, 80);
      if (img) detailImages.push(img);
    });
  }

  // detail 비었고 contentId 있으면 firstimage 1장만 (추가 왕복 최소화)
  if (
    contentId &&
    page === 1 &&
    detailImages.length === 0 &&
    !opts?.thumbnailOnly
  ) {
    const common = await invokeTourApi('detailCommon', { contentId });
    const first = common?.items?.[0];
    if (first) {
      const img = toGalleryImage(first, 'detailImage', 0, 70);
      if (img) detailImages.push(img);
    }
  }

  // thumbnailOnly + contentId인데 detail 실패 → 기본 keyword 1회
  if (opts?.thumbnailOnly && contentId && detailImages.length === 0) {
    const photo = await invokeTourApi('searchPhoto', {
      keyword,
      numOfRows: 3,
      pageNo: 1,
    });
    let photoIndex = 0;
    for (const it of photo?.items || []) {
      const title = String(it?.title || it?.galTitle || '');
      const score = scoreTourPhotoTitle(title, placeTitle, keyword);
      if (score < 0) continue;
      const img = toGalleryImage(it, 'searchPhoto', photoIndex++, score);
      if (img) photoImages.push(img);
    }
  }

  let photoIndex = 0;
  for (const result of photoResults) {
    if (!result?.photo?.items?.length) continue;
    const { kw, photo } = result;
    for (const it of photo.items) {
      const title = String(it?.title || it?.galTitle || '');
      const score = scoreTourPhotoTitle(title, placeTitle, kw);
      if (score < 0) continue;
      const img = toGalleryImage(it, 'searchPhoto', photoIndex++, score);
      if (img) photoImages.push(img);
    }
  }

  photoImages.sort(
    (a, b) => (b?.tourApi?.rankScore || 0) - (a?.tourApi?.rankScore || 0),
  );

  let merged = dedupeByUrl([...detailImages, ...photoImages]);
  if (opts?.thumbnailOnly) merged = merged.slice(0, 3);
  else merged = merged.slice(0, Math.max(PROBE_CANDIDATES, TARGET_GALLERY));

  if (skipProbe) {
    return opts?.thumbnailOnly ? merged.slice(0, 1) : merged.slice(0, TARGET_GALLERY);
  }

  const loadable = await filterLoadableTourApiImages(merged, {
    thumbnailOnly: Boolean(opts?.thumbnailOnly),
  });

  // 전부 깨지면 프로브 없이 상위라도 반환(빈 갤러리보다 낫음 — UI onError로 제거)
  if (loadable.length === 0 && merged.length > 0) {
    return opts?.thumbnailOnly ? merged.slice(0, 1) : merged.slice(0, TARGET_GALLERY);
  }
  return loadable;
}

/**
 * @param {{
 *   photoKeyword: string,
 *   photoKeywords?: string[],
 *   title?: string,
 *   contentId?: string | null,
 *   page?: number,
 *   numOfRows?: number,
 *   thumbnailOnly?: boolean,
 *   skipProbe?: boolean,
 * }} opts
 * @returns {Promise<Array>}
 */
export async function fetchTourApiGallery(opts) {
  try {
    return await withTimeout(
      fetchTourApiGalleryInner(opts),
      GALLERY_FETCH_BUDGET_MS,
      'fetchTourApiGallery',
    );
  } catch (err) {
    console.warn('[tourapi] gallery budget exceeded:', err?.message || err);
    return [];
  }
}
