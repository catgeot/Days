import { withGateoTrafficType } from './gateoGaQa.js';

/**
 * One event when a closed MOONi surface becomes open. Close and repeat true are ignored.
 * @param {boolean} wasOpen
 * @param {boolean} open
 * @param {Record<string, unknown>} params
 */
export function trackMooniOpenIfRising(wasOpen, open, params) {
  if (wasOpen || !open) return false;
  trackEvent('mooni_open', params);
  return true;
}

/**
 * GA4 custom event. No-ops when gtag is missing and never throws.
 * QA, `navigator.webdriver`, and `?crawler=1` get `traffic_type: 'internal'`.
 * Real visitors do not.
 * @param {string} name
 * @param {Record<string, unknown>} [params]
 * @param {Parameters<typeof withGateoTrafficType>[1]} [env]
 */
export function trackEvent(name, params, env) {
  try {
    if (typeof window === 'undefined') return;
    const sentParams = withGateoTrafficType(params, env);
    const payload = { name, params: sentParams };
    if (Array.isArray(window.__gateoGaEvents)) {
      window.__gateoGaEvents.push(payload);
    }
    if (window.__GATEO_GA_DISABLED__) {
      const buf = window.__GATEO_GA_EVENTS__;
      if (Array.isArray(buf)) buf.push(payload);
    }
    const gtag = window.gtag;
    if (typeof gtag !== 'function') return;
    gtag('event', name, sentParams);
  } catch {
    // analytics must not break the page
  }
}
