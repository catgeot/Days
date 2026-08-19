import { invokeTourApiProxy } from './tourApiProxy';

/**
 * @param {string} action
 * @param {Record<string, unknown>} payload
 */
async function invokeTourApi(action, payload) {
  return invokeTourApiProxy(action, payload);
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
