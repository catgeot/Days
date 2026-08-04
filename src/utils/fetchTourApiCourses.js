import { supabase } from '../shared/api/supabase';
import { fetchTourApiAreaBasedList } from './fetchTourApiArea';

const INVOKE_TIMEOUT_MS = 12_000;
const COURSE_CONTENT_TYPE_ID = '25';

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
 * TourAPI contentTypeId=25 (여행코스) 지역 목록.
 * @param {{
 *   areaCode: string | number,
 *   numOfRows?: number,
 *   pageNo?: number,
 * }} opts
 */
export async function fetchTourApiTravelCourses(opts) {
  return fetchTourApiAreaBasedList({
    areaCode: opts.areaCode,
    contentTypeId: COURSE_CONTENT_TYPE_ID,
    numOfRows: opts.numOfRows ?? 30,
    pageNo: opts.pageNo,
  });
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
 * 코스 상세 — 개요·테마·구간(detailInfo)·대표/구간 사진.
 * TourAPI type25는 동영상 URL을 주지 않음. detailImage는 코스에서 비는 경우가 많음.
 * @param {{ contentId: string | number }} opts
 */
export async function fetchTourApiCourseDetail(opts) {
  const contentId = String(opts?.contentId ?? '').trim();
  if (!/^\d{1,32}$/.test(contentId)) return null;

  const [common, intro, info, images] = await Promise.all([
    invokeTourApi('detailCommon', { contentId }),
    invokeTourApi('detailIntro', {
      contentId,
      contentTypeId: COURSE_CONTENT_TYPE_ID,
    }),
    invokeTourApi('detailInfo', {
      contentId,
      contentTypeId: COURSE_CONTENT_TYPE_ID,
      numOfRows: 30,
      pageNo: 1,
    }),
    invokeTourApi('detailImage', {
      contentId,
      numOfRows: 20,
      pageNo: 1,
    }),
  ]);

  const commonItem = common?.items?.[0] || null;
  const introItem = intro?.items?.[0] || null;
  const segments = (info?.items || [])
    .filter(
      (it) =>
        it && (it.subname || it.subdetailoverview || it.subdetailimg),
    )
    .map((it) => ({
      ...it,
      subdetailimg: pickImageUrl(it.subdetailimg),
      subdetailalt: it.subdetailalt || it.subname || null,
    }))
    .sort((a, b) => Number(a.subnum ?? 0) - Number(b.subnum ?? 0));

  if (!commonItem && !introItem && segments.length === 0) return null;

  const imageUrl = pickImageUrl(
    commonItem?.imageUrl,
    commonItem?.firstimage,
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
    pushGallery(it?.imageUrl || it?.originimgurl || it?.smallimageurl || it?.firstimage);
  }
  for (const seg of segments) {
    pushGallery(seg.subdetailimg);
  }

  return {
    contentId,
    title: commonItem?.title || introItem?.title || null,
    overview: commonItem?.overview || null,
    addr1: commonItem?.addr1 || null,
    imageUrl,
    galleryUrls,
    theme: introItem?.theme || null,
    schedule: introItem?.schedule || null,
    distance: introItem?.distance || null,
    taketime: introItem?.taketime || null,
    segments,
  };
}
