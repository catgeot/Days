import { tourListSummaryFromOverview } from '../pages/Home/lib/tourListSummary.js';
import { invokeTourApiProxy, TOUR_API_BODY_LOCALE } from './tourApiProxy';

const ATTRACTION_CONTENT_TYPE_ID = '12';
const RESTAURANT_CONTENT_TYPE_ID = '39';
const INTRO_TYPE_CANDIDATES = ['12', '14', '28', '38', '39'];

/**
 * @param {string} action
 * @param {Record<string, unknown>} payload
 */
async function invokeTourApi(action, payload) {
  return invokeTourApiProxy(action, payload, { locale: TOUR_API_BODY_LOCALE });
}

function toHttps(url) {
  const s = String(url || '').trim();
  if (!s) return null;
  if (s.startsWith('//')) return `https:${s}`;
  if (s.startsWith('http://')) return `https://${s.slice('http://'.length)}`;
  return s;
}

function pickImageUrl(...candidates) {
  for (const c of candidates) {
    const https = toHttps(c);
    if (https) return https;
  }
  return null;
}

/** contentId → detailCommon item. 썸네일과 상세가 같은 호출을 두 번 하지 않게 한다. */
const detailCommonCache = new Map();

function plainOverview(raw) {
  const text = String(raw || '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  if (text.length < 12) return null;
  return text;
}

function detailCommonItem(contentId) {
  const id = String(contentId ?? '').trim();
  if (!/^\d{1,32}$/.test(id)) return Promise.resolve(null);
  let pending = detailCommonCache.get(id);
  if (!pending) {
    pending = invokeTourApi('detailCommon', { contentId: id })
      .then((res) => res?.items?.[0] || null)
      .catch(() => null);
    detailCommonCache.set(id, pending);
  }
  return pending;
}

/**
 * 목록 써머리용 첫 문장. 상세 본문 전문은 여기서 반환하지 않는다.
 * @param {string | number | null | undefined} contentId
 * @returns {Promise<string | null>}
 */
export async function fetchTourApiListSummary(contentId) {
  const item = await detailCommonItem(contentId);
  const sentence = tourListSummaryFromOverview(plainOverview(item?.overview));
  return sentence || null;
}

/**
 * 관광지·맛집 등 상세 — 개요·이용·부가정보·사진 (KorService2 SSOT).
 * @param {{ contentId: string | number, contentTypeId?: string | number }} opts
 */
export async function fetchTourApiAttractionDetail(opts) {
  const contentId = String(opts?.contentId ?? '').trim();
  if (!/^\d{1,32}$/.test(contentId)) return null;

  const preferredType = String(opts?.contentTypeId || '').trim();

  const [commonItem, images] = await Promise.all([
    detailCommonItem(contentId),
    invokeTourApi('detailImage', {
      contentId,
      numOfRows: 12,
      pageNo: 1,
    }),
  ]);

  const typeFromCommon = String(commonItem?.contentTypeId || '').trim();
  const typeOrder = [
    ...new Set(
      [
        preferredType,
        typeFromCommon,
        ATTRACTION_CONTENT_TYPE_ID,
        ...INTRO_TYPE_CANDIDATES,
      ].filter((t) => /^\d{1,4}$/.test(t)),
    ),
  ];

  let introItem = null;
  let infoItems = [];
  for (const contentTypeId of typeOrder) {
    const [intro, info] = await Promise.all([
      invokeTourApi('detailIntro', { contentId, contentTypeId }),
      invokeTourApi('detailInfo', {
        contentId,
        contentTypeId,
        numOfRows: 30,
        pageNo: 1,
      }),
    ]);
    const candidateIntro = intro?.items?.[0] || null;
    const candidateInfo = Array.isArray(info?.items) ? info.items : [];
    if (candidateIntro || candidateInfo.length > 0) {
      introItem = candidateIntro;
      infoItems = candidateInfo;
      break;
    }
  }

  if (!commonItem && !introItem && infoItems.length === 0) return null;

  const imageUrl = pickImageUrl(
    commonItem?.imageUrl,
    commonItem?.firstimage,
    commonItem?.firstimage2,
  );

  const galleryUrls = [];
  const seen = new Set();
  const pushGallery = (raw) => {
    const url = pickImageUrl(raw);
    if (!url || seen.has(url)) return;
    seen.add(url);
    galleryUrls.push(url);
  };
  pushGallery(imageUrl);
  for (const it of images?.items || []) {
    pushGallery(
      it?.imageUrl || it?.originimgurl || it?.smallimageurl || it?.firstimage,
    );
  }

  if (!imageUrl && galleryUrls.length === 0) {
    const rawTitle = commonItem?.title || introItem?.title || '';
    const cleanTitle = String(rawTitle).replace(/\(.*?\)/g, '').trim();
    if (cleanTitle) {
      try {
        const photoRes = await invokeTourApi('searchPhoto', {
          keyword: cleanTitle,
          numOfRows: 8,
          pageNo: 1,
        });
        for (const item of photoRes?.items || []) {
          pushGallery(item?.imageUrl || item?.galWebImageUrl);
        }
      } catch {
        /* ignore fallback photo error */
      }
    }
  }

  const finalImageUrl = imageUrl || galleryUrls[0] || null;

  return {
    contentId,
    title: commonItem?.title || introItem?.title || null,
    overview: commonItem?.overview || null,
    addr1: commonItem?.addr1 || null,
    addr2: commonItem?.addr2 || null,
    tel: commonItem?.tel || null,
    homepage: commonItem?.homepage || null,
    imageUrl: finalImageUrl,
    galleryUrls,
    intro: introItem,
    infoItems,
  };
}

/**
 * 리스트 썸네일용 — firstimage가 비면 detailImage 갤러리. JSON contentId 기입 아님.
 * DB·searchKeyword·detailCommon firstimage가 공란이어도 TourAPI 사진은 detailImage에 있는 경우가 많다.
 * @param {string | number | null | undefined} contentId
 * @returns {Promise<string | null>}
 */
export async function fetchTourApiFirstImage(contentId) {
  const id = String(contentId ?? '').trim();
  if (!/^\d{1,32}$/.test(id)) return null;
  const [item, images] = await Promise.all([
    detailCommonItem(id),
    invokeTourApi('detailImage', { contentId: id, numOfRows: 8, pageNo: 1 }),
  ]);
  const directImage = pickImageUrl(
    item?.imageUrl,
    item?.firstimage,
    item?.firstimage2,
  );
  if (directImage) return directImage;
  for (const it of images?.items || []) {
    const fromGallery = pickImageUrl(
      it?.imageUrl,
      it?.originimgurl,
      it?.smallimageurl,
      it?.firstimage,
    );
    if (fromGallery) return fromGallery;
  }
  const title = String(item?.title || '').replace(/\(.*?\)/g, '').trim();
  if (!title) return null;
  try {
    const photo = await invokeTourApi('searchPhoto', {
      keyword: title,
      numOfRows: 1,
      pageNo: 1,
    });
    const photoItem = photo?.items?.[0];
    return pickImageUrl(photoItem?.imageUrl, photoItem?.galWebImageUrl);
  } catch {
    return null;
  }
}

export { ATTRACTION_CONTENT_TYPE_ID, RESTAURANT_CONTENT_TYPE_ID };
