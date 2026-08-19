import { invokeTourApiProxy, getTourApiLocale } from './tourApiProxy';
import { mergeTourApiFestivalDetailBundle } from './mergeTourApiFestivalDetail';

const FESTIVAL_WINDOW_TIMEOUT_MS = 90_000;
const FESTIVAL_DETAIL_TIMEOUT_MS = 30_000;

/**
 * @param {string} action
 * @param {Record<string, unknown>} payload
 * @param {{ timeoutMs?: number, locale?: string }} [opts]
 */
async function invokeTourApi(action, payload, opts = {}) {
  return invokeTourApiProxy(action, payload, {
    timeoutMs: opts.timeoutMs,
    returnRawOnFail: true,
    locale: opts.locale,
  });
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
 * 롤링 12개월 목록 — Edge merge + DB 캐시 (1 invoke).
 * @param {{
 *   eventStartDate?: string,
 *   eventEndDate?: string,
 *   force?: boolean,
 * }} [opts]
 */
export async function fetchTourApiFestivalWindow(opts = {}) {
  /** @type {Record<string, unknown>} */
  const payload = {};
  if (opts?.eventStartDate != null && String(opts.eventStartDate).trim()) {
    payload.eventStartDate = String(opts.eventStartDate).trim();
  }
  if (opts?.eventEndDate != null && String(opts.eventEndDate).trim()) {
    payload.eventEndDate = String(opts.eventEndDate).trim();
  }
  if (opts?.force === true) payload.force = true;
  // 축제 허브 목록 SSOT = KorService2 (EngService2는 별도·부분 카탈로그)
  return invokeTourApi('festivalWindow', payload, {
    timeoutMs: FESTIVAL_WINDOW_TIMEOUT_MS,
    locale: 'ko',
  });
}

/**
 * 축제 상세 intro/common/info — Edge 묶음 + DB 캐시 (1 invoke).
 * @param {{
 *   contentId: string | number,
 *   contentTypeId?: string | number,
 *   force?: boolean,
 * }} opts
 */
export async function fetchTourApiFestivalDetail(opts) {
  const contentId = String(opts?.contentId ?? '').trim();
  if (!/^\d{1,32}$/.test(contentId)) return null;
  /** @type {Record<string, unknown>} */
  const payload = {
    contentId,
    contentTypeId: String(opts?.contentTypeId ?? '15').trim() || '15',
  };
  if (opts?.force === true) payload.force = true;
  return invokeTourApi('festivalDetail', payload, {
    timeoutMs: FESTIVAL_DETAIL_TIMEOUT_MS,
  });
}

/**
 * locale=en — EngService2 본문 + KorService2 폴백. ko — KorService2만.
 * @param {{
 *   contentId: string | number,
 *   contentTypeId?: string | number,
 *   force?: boolean,
 * }} opts
 */
export async function fetchTourApiFestivalDetailLocalized(opts) {
  const contentId = String(opts?.contentId ?? '').trim();
  if (!/^\d{1,32}$/.test(contentId)) return null;
  /** @type {Record<string, unknown>} */
  const payload = {
    contentId,
    contentTypeId: String(opts?.contentTypeId ?? '15').trim() || '15',
  };
  if (opts?.force === true) payload.force = true;
  const invokeOpts = { timeoutMs: FESTIVAL_DETAIL_TIMEOUT_MS };

  if (getTourApiLocale() !== 'en') {
    return invokeTourApi('festivalDetail', payload, invokeOpts);
  }

  const [enData, koData] = await Promise.all([
    invokeTourApi('festivalDetail', payload, { ...invokeOpts, locale: 'en' }),
    invokeTourApi('festivalDetail', payload, { ...invokeOpts, locale: 'ko' }),
  ]);
  return mergeTourApiFestivalDetailBundle(enData, koData);
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
 *   contentTypeId?: string | number,
 *   numOfRows?: number,
 * }} opts
 */
export async function fetchTourApiFestivalInfo(opts) {
  const contentId = String(opts?.contentId ?? '').trim();
  if (!/^\d{1,32}$/.test(contentId)) return null;
  const contentTypeId = String(opts?.contentTypeId ?? '15').trim() || '15';
  const numOfRows = Math.min(
    50,
    Math.max(1, Math.floor(Number(opts?.numOfRows) || 30)),
  );
  return invokeTourApi('detailInfo', {
    contentId,
    contentTypeId,
    numOfRows,
    pageNo: 1,
  });
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
