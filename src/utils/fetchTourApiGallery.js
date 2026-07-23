import { supabase } from '../shared/api/supabase';
import { scoreTourPhotoTitle } from './tourApiPhotoRank';

export { scoreTourPhotoTitle } from './tourApiPhotoRank';

const DEFAULT_ROWS = 30;
const MIN_ROWS = 1;
const SCENIC_KEYWORD_ROWS = 12;

/**
 * @param {string} action
 * @param {Record<string, unknown>} payload
 */
async function invokeTourApi(action, payload) {
  const { data, error } = await supabase.functions.invoke('tourapi-proxy', {
    body: { action, ...payload },
  });
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
 */
function buildSearchKeywords(primary, extras, placeTitle) {
  const out = [];
  const seen = new Set();
  const push = (k) => {
    const s = String(k || '').trim();
    if (!s || s.length > 80 || seen.has(s)) return;
    seen.add(s);
    out.push(s);
  };

  for (const k of extras || []) push(k);

  // 시드에 전경이 없으면 자동 보조 키워드
  const hasScenicExtra = (extras || []).some((k) =>
    /전경|야경|근정전|풍경/.test(String(k)),
  );
  if (!hasScenicExtra && placeTitle) {
    push(`${placeTitle} 전경`);
    push(`${placeTitle} 야경`);
  }

  push(primary);
  return out;
}

/**
 * 국내 갤러리:
 * 1) contentId detailImage (공식 POI) 선두
 * 2) searchPhoto — 전경/야경 키워드 + 제목 랭킹 (오프트픽 제외)
 *
 * @param {{
 *   photoKeyword: string,
 *   photoKeywords?: string[],
 *   title?: string,
 *   contentId?: string | null,
 *   page?: number,
 *   numOfRows?: number,
 *   thumbnailOnly?: boolean,
 * }} opts
 * @returns {Promise<Array>}
 */
export async function fetchTourApiGallery(opts) {
  const keyword = String(opts?.photoKeyword || '').trim();
  if (!keyword) return [];

  const placeTitle = String(opts?.title || keyword).trim();
  const page = Math.max(1, Math.floor(Number(opts?.page) || 1));
  const numOfRows = opts?.thumbnailOnly
    ? 3
    : Math.min(
        50,
        Math.max(MIN_ROWS, Math.floor(Number(opts?.numOfRows) || DEFAULT_ROWS)),
      );
  const contentId =
    opts?.contentId != null && String(opts.contentId).trim() !== ''
      ? String(opts.contentId).trim()
      : null;

  /** @type {Array<ReturnType<typeof toGalleryImage>>} */
  const detailImages = [];
  /** @type {Array<ReturnType<typeof toGalleryImage>>} */
  const photoImages = [];

  // 1) detailImage 선두 — contentId 공식 이미지(대개 해당 POI 전경)
  if (contentId && page === 1) {
    const detail = await invokeTourApi('detailImage', {
      contentId,
      numOfRows: opts?.thumbnailOnly ? 3 : 20,
      pageNo: 1,
    });
    if (detail?.items?.length) {
      detail.items.forEach((it, i) => {
        detailImages.push(toGalleryImage(it, 'detailImage', i, 80));
      });
    }
    if (detailImages.length === 0) {
      const common = await invokeTourApi('detailCommon', { contentId });
      const first = common?.items?.[0];
      if (first) detailImages.push(toGalleryImage(first, 'detailImage', 0, 70));
    }
  }

  // 2) searchPhoto — page1: 전경 키워드들 → 기본 키워드 / page>1: 기본만
  const searchKeywords =
    page === 1
      ? buildSearchKeywords(keyword, opts?.photoKeywords, placeTitle)
      : [keyword];

  let photoIndex = 0;
  for (const kw of searchKeywords) {
    const rows =
      kw === keyword
        ? numOfRows
        : Math.min(SCENIC_KEYWORD_ROWS, numOfRows);
    const photo = await invokeTourApi('searchPhoto', {
      keyword: kw,
      numOfRows: rows,
      pageNo: kw === keyword ? page : 1,
    });
    if (!photo?.items?.length) continue;

    for (const it of photo.items) {
      const title = String(it?.title || it?.galTitle || '');
      const score = scoreTourPhotoTitle(title, placeTitle, kw);
      if (score < 0) continue; // 오프트픽 드롭
      photoImages.push(toGalleryImage(it, 'searchPhoto', photoIndex++, score));
    }
  }

  photoImages.sort(
    (a, b) => (b?.tourApi?.rankScore || 0) - (a?.tourApi?.rankScore || 0),
  );

  const merged = dedupeByUrl([...detailImages, ...photoImages]);
  if (opts?.thumbnailOnly) return merged.slice(0, 1);
  return merged;
}
