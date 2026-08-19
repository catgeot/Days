import { getTourApiLocale, invokeTourApiProxy } from './tourApiProxy';
import { mergeTourApiAttractionDetail } from './mergeTourApiAttractionDetail';
import { resolveTourApiEngContentId } from './resolveTourApiEngContentId';

const ATTRACTION_CONTENT_TYPE_ID = '12';
const RESTAURANT_CONTENT_TYPE_ID = '39';
const INTRO_TYPE_CANDIDATES = ['12', '14', '28', '38', '39'];

function hasText(value) {
  return String(value ?? '').trim().length > 0;
}

/**
 * @param {string} action
 * @param {Record<string, unknown>} payload
 * @param {'ko' | 'en'} locale
 */
async function invokeTourApi(action, payload, locale) {
  return invokeTourApiProxy(action, payload, { locale });
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

/**
 * @param {{
 *   contentId: string,
 *   contentTypeId?: string,
 *   locale: 'ko' | 'en',
 * }} params
 */
async function loadTourApiAttractionBundle(params) {
  const { contentId, locale } = params;
  const preferredType = String(params.contentTypeId || '').trim();

  const [common, images] = await Promise.all([
    invokeTourApi('detailCommon', { contentId }, locale),
    invokeTourApi(
      'detailImage',
      {
        contentId,
        numOfRows: 12,
        pageNo: 1,
      },
      locale,
    ),
  ]);

  const commonItem = common?.items?.[0] || null;
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
      invokeTourApi('detailIntro', { contentId, contentTypeId }, locale),
      invokeTourApi(
        'detailInfo',
        {
          contentId,
          contentTypeId,
          numOfRows: 30,
          pageNo: 1,
        },
        locale,
      ),
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

  return {
    contentId,
    title: commonItem?.title || introItem?.title || null,
    overview: commonItem?.overview || null,
    addr1: commonItem?.addr1 || null,
    addr2: commonItem?.addr2 || null,
    tel: commonItem?.tel || null,
    homepage: commonItem?.homepage || null,
    imageUrl,
    galleryUrls,
    intro: introItem,
    infoItems,
  };
}

/**
 * @param {{
 *   contentId: string | number,
 *   contentTypeId?: string | number,
 *   locale?: 'ko' | 'en',
 *   titleEn?: string | null,
 *   placeSlug?: string | null,
 *   spotId?: string | null,
 * }} opts
 */
async function fetchTourApiAttractionDetailForLocale(opts) {
  const contentId = String(opts?.contentId ?? '').trim();
  if (!/^\d{1,32}$/.test(contentId)) return null;

  const locale = opts?.locale === 'en' ? 'en' : 'ko';
  let preferredType = String(opts?.contentTypeId || '').trim();

  let detail = await loadTourApiAttractionBundle({
    contentId,
    contentTypeId: preferredType,
    locale,
  });

  if (
    locale === 'en' &&
    (!detail ||
      (String(detail.overview || '').trim().length < 40 && !hasText(detail.title)))
  ) {
    const resolved = await resolveTourApiEngContentId(opts);
    if (resolved?.contentId && resolved.contentId !== contentId) {
      preferredType = resolved.contentTypeId;
      detail = await loadTourApiAttractionBundle({
        contentId: resolved.contentId,
        contentTypeId: preferredType,
        locale,
      });
    }
  }

  return detail;
}

/**
 * 관광지·맛집 등 상세 — 개요·이용·부가정보·사진.
 * @param {{ contentId: string | number, contentTypeId?: string | number }} opts
 */
export async function fetchTourApiAttractionDetail(opts) {
  return fetchTourApiAttractionDetailForLocale({
    ...opts,
    locale: getTourApiLocale(),
  });
}

/**
 * locale=en — EngService2 본문 + KorService2 폴백. ko — KorService2만.
 * @param {{
 *   contentId: string | number,
 *   contentTypeId?: string | number,
 *   titleEn?: string | null,
 *   placeSlug?: string | null,
 *   spotId?: string | null,
 * }} opts
 */
export async function fetchTourApiAttractionDetailLocalized(opts) {
  const contentId = String(opts?.contentId ?? '').trim();
  if (!/^\d{1,32}$/.test(contentId)) return null;

  if (getTourApiLocale() !== 'en') {
    return fetchTourApiAttractionDetailForLocale({ ...opts, locale: 'ko' });
  }

  const [enDetail, koDetail] = await Promise.all([
    fetchTourApiAttractionDetailForLocale({ ...opts, locale: 'en' }),
    fetchTourApiAttractionDetailForLocale({ ...opts, locale: 'ko' }),
  ]);
  return mergeTourApiAttractionDetail(enDetail, koDetail);
}

export { ATTRACTION_CONTENT_TYPE_ID, RESTAURANT_CONTENT_TYPE_ID };
