/**
 * GA4 custom event. No-ops when gtag is missing and never throws.
 * @param {string} name
 * @param {Record<string, unknown>} [params]
 */
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

export function trackEvent(name, params) {
  try {
    if (typeof window === 'undefined') return;
    const gtag = window.gtag;
    if (typeof gtag !== 'function') return;
    gtag('event', name, params);
  } catch {
    // analytics must not break the page
  }
}
