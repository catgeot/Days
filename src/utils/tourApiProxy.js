import { supabase } from '../shared/api/supabase';
import { i18n } from '../i18n/config';
import { normalizeAppLocale } from '../i18n/constants';

const DEFAULT_INVOKE_TIMEOUT_MS = 12_000;

/**
 * TourAPI Edge locale — ko=KorService2 · en=EngService2.
 * @param {string | null | undefined} [value]
 * @returns {'ko' | 'en'}
 */
export function resolveTourApiLocale(value) {
  return normalizeAppLocale(value);
}

/** @returns {'ko' | 'en'} */
export function getTourApiLocale() {
  return resolveTourApiLocale(i18n.language);
}

/** KorService2 SSOT — 축제·명승 본문·주변 POI (EngService2 롤백). */
export const TOUR_API_BODY_LOCALE = 'ko';

/** @deprecated alias — use TOUR_API_BODY_LOCALE */
export const NEARBY_TOUR_API_LOCALE = TOUR_API_BODY_LOCALE;

/**
 * @template T
 * @param {Promise<T>} promise
 * @param {number} ms
 * @param {string} label
 * @returns {Promise<T>}
 */
export function withTourApiTimeout(promise, ms, label) {
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
 * @param {Record<string, unknown>} [payload]
 * @param {{ timeoutMs?: number, locale?: string, returnRawOnFail?: boolean }} [opts]
 */
export async function invokeTourApiProxy(action, payload = {}, opts = {}) {
  const timeoutMs = opts.timeoutMs ?? DEFAULT_INVOKE_TIMEOUT_MS;
  const locale = resolveTourApiLocale(opts.locale ?? getTourApiLocale());
  try {
    const { data, error } = await withTourApiTimeout(
      supabase.functions.invoke('tourapi-proxy', {
        body: { action, locale, ...payload },
      }),
      timeoutMs,
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
      return opts.returnRawOnFail ? data ?? null : null;
    }
    return data;
  } catch (err) {
    console.warn(`[tourapi] ${action} failed:`, err?.message || err);
    return null;
  }
}
