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

/**
 * 코스 상세 — 개요·테마·구간(detailInfo).
 * @param {{ contentId: string | number }} opts
 */
export async function fetchTourApiCourseDetail(opts) {
  const contentId = String(opts?.contentId ?? '').trim();
  if (!/^\d{1,32}$/.test(contentId)) return null;

  const [common, intro, info] = await Promise.all([
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
  ]);

  const commonItem = common?.items?.[0] || null;
  const introItem = intro?.items?.[0] || null;
  const segments = (info?.items || [])
    .filter((it) => it && (it.subname || it.subdetailoverview))
    .slice()
    .sort((a, b) => Number(a.subnum ?? 0) - Number(b.subnum ?? 0));

  if (!commonItem && !introItem && segments.length === 0) return null;

  return {
    contentId,
    title: commonItem?.title || introItem?.title || null,
    overview: commonItem?.overview || null,
    addr1: commonItem?.addr1 || null,
    imageUrl: commonItem?.imageUrl || commonItem?.firstimage || null,
    theme: introItem?.theme || null,
    schedule: introItem?.schedule || null,
    distance: introItem?.distance || null,
    taketime: introItem?.taketime || null,
    segments,
  };
}
