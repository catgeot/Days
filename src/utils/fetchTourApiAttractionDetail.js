import { invokeTourApiProxy } from './tourApiProxy';

const ATTRACTION_CONTENT_TYPE_ID = '12';
const RESTAURANT_CONTENT_TYPE_ID = '39';
const INTRO_TYPE_CANDIDATES = ['12', '14', '28', '38', '39'];

/**
 * @param {string} action
 * @param {Record<string, unknown>} payload
 */
async function invokeTourApi(action, payload) {
  return invokeTourApiProxy(action, payload);
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
 * 관광지·맛집 등 상세 — 개요·이용·부가정보·사진.
 * @param {{ contentId: string | number, contentTypeId?: string | number }} opts
 */
export async function fetchTourApiAttractionDetail(opts) {
  const contentId = String(opts?.contentId ?? '').trim();
  if (!/^\d{1,32}$/.test(contentId)) return null;

  const preferredType = String(opts?.contentTypeId || '').trim();

  const [common, images] = await Promise.all([
    invokeTourApi('detailCommon', { contentId }),
    invokeTourApi('detailImage', {
      contentId,
      numOfRows: 12,
      pageNo: 1,
    }),
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

export { ATTRACTION_CONTENT_TYPE_ID, RESTAURANT_CONTENT_TYPE_ID };
