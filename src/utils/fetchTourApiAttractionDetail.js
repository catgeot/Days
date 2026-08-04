import { supabase } from '../shared/api/supabase';

const INVOKE_TIMEOUT_MS = 12_000;
const ATTRACTION_CONTENT_TYPE_ID = '12';

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
 * 관광지(type12) 상세 — 개요·이용·부가정보·사진.
 * @param {{ contentId: string | number }} opts
 */
export async function fetchTourApiAttractionDetail(opts) {
  const contentId = String(opts?.contentId ?? '').trim();
  if (!/^\d{1,32}$/.test(contentId)) return null;

  const [common, intro, info, images] = await Promise.all([
    invokeTourApi('detailCommon', { contentId }),
    invokeTourApi('detailIntro', {
      contentId,
      contentTypeId: ATTRACTION_CONTENT_TYPE_ID,
    }),
    invokeTourApi('detailInfo', {
      contentId,
      contentTypeId: ATTRACTION_CONTENT_TYPE_ID,
      numOfRows: 30,
      pageNo: 1,
    }),
    invokeTourApi('detailImage', {
      contentId,
      numOfRows: 12,
      pageNo: 1,
    }),
  ]);

  const commonItem = common?.items?.[0] || null;
  const introItem = intro?.items?.[0] || null;
  const infoItems = Array.isArray(info?.items) ? info.items : [];

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

export { ATTRACTION_CONTENT_TYPE_ID };
