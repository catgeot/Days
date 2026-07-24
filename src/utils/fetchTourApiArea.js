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
 *   areaCode?: string | number,
 *   numOfRows?: number,
 *   pageNo?: number,
 * }} [opts]
 */
export async function fetchTourApiAreaCodes(opts = {}) {
  /** @type {Record<string, unknown>} */
  const payload = {
    numOfRows: opts?.numOfRows ?? 50,
    pageNo: opts?.pageNo,
  };
  if (opts?.areaCode != null && String(opts.areaCode).trim() !== '') {
    payload.areaCode = String(opts.areaCode).trim();
  }
  return invokeTourApi('areaCode', payload);
}

/**
 * @param {{
 *   areaCode: string | number,
 *   contentTypeId?: string | number,
 *   sigunguCode?: string | number,
 *   numOfRows?: number,
 *   pageNo?: number,
 * }} opts
 */
export async function fetchTourApiAreaBasedList(opts) {
  const areaCode = String(opts?.areaCode ?? '').trim();
  if (!/^\d{1,10}$/.test(areaCode)) return null;

  /** @type {Record<string, unknown>} */
  const payload = {
    areaCode,
    numOfRows: opts?.numOfRows,
    pageNo: opts?.pageNo,
  };
  if (opts?.contentTypeId != null && String(opts.contentTypeId).trim() !== '') {
    payload.contentTypeId = String(opts.contentTypeId).trim();
  }
  if (opts?.sigunguCode != null && String(opts.sigunguCode).trim() !== '') {
    payload.sigunguCode = String(opts.sigunguCode).trim();
  }

  return invokeTourApi('areaBasedList', payload);
}
