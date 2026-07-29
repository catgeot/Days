import { supabase } from '../shared/api/supabase';

const INVOKE_TIMEOUT_MS = 12_000;

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
 * @param {{
 *   eventStartDate: string,
 *   eventEndDate?: string,
 *   areaCode?: string | number,
 *   sigunguCode?: string | number,
 *   numOfRows?: number,
 *   pageNo?: number,
 * }} opts
 */
export async function fetchTourApiFestivals(opts) {
  const eventStartDate = String(opts?.eventStartDate || '').trim();
  if (!/^\d{8}$/.test(eventStartDate)) return null;

  /** @type {Record<string, unknown>} */
  const payload = {
    eventStartDate,
    numOfRows: opts?.numOfRows,
    pageNo: opts?.pageNo,
  };
  if (opts?.eventEndDate != null && String(opts.eventEndDate).trim()) {
    payload.eventEndDate = String(opts.eventEndDate).trim();
  }
  if (opts?.areaCode != null && String(opts.areaCode).trim() !== '') {
    payload.areaCode = String(opts.areaCode).trim();
  }
  if (opts?.sigunguCode != null && String(opts.sigunguCode).trim() !== '') {
    payload.sigunguCode = String(opts.sigunguCode).trim();
  }

  return invokeTourApi('searchFestival', payload);
}

/**
 * @param {{
 *   contentId: string | number,
 *   contentTypeId?: string | number,
 * }} opts
 */
export async function fetchTourApiFestivalIntro(opts) {
  const contentId = String(opts?.contentId ?? '').trim();
  if (!/^\d{1,32}$/.test(contentId)) return null;
  const contentTypeId = String(opts?.contentTypeId ?? '15').trim() || '15';
  return invokeTourApi('detailIntro', { contentId, contentTypeId });
}

/**
 * @param {{ contentId: string | number }} opts
 */
export async function fetchTourApiFestivalCommon(opts) {
  const contentId = String(opts?.contentId ?? '').trim();
  if (!/^\d{1,32}$/.test(contentId)) return null;
  return invokeTourApi('detailCommon', { contentId });
}

/**
 * @param {{
 *   contentId: string | number,
 *   numOfRows?: number,
 * }} opts
 */
export async function fetchTourApiFestivalImages(opts) {
  const contentId = String(opts?.contentId ?? '').trim();
  if (!/^\d{1,32}$/.test(contentId)) return null;
  const numOfRows = Math.min(
    30,
    Math.max(1, Math.floor(Number(opts?.numOfRows) || 12)),
  );
  return invokeTourApi('detailImage', { contentId, numOfRows, pageNo: 1 });
}
