import { shouldSkipGateoAutomatedTraffic } from './gateoGaQa.js';
import { trackEvent } from './trackEvent.js';

/** @param {{ window?: Window, navigator?: Navigator, localStorage?: Storage, search?: string, userAgent?: string, webdriver?: boolean }} [env] */
export function isQuicklinkInternalTraffic(env) {
  if (shouldSkipGateoAutomatedTraffic(env)) return true;
  const search =
    env?.search ??
    env?.window?.location?.search ??
    (typeof window !== 'undefined' ? window.location.search : '');
  try {
    return new URLSearchParams(String(search || '')).get('crawler') === '1';
  } catch {
    return false;
  }
}

/**
 * Home quick-link click. Internal traffic (QA, webdriver, `?crawler=1`, bot UA) is not sent.
 * @param {string} item festival | world_events | scenic | review_hub | curation
 * @param {Parameters<typeof isQuicklinkInternalTraffic>[0]} [env]
 */
export function trackQuicklinkClick(item, env) {
  if (isQuicklinkInternalTraffic(env)) return false;
  trackEvent('quicklink_click', {
    item,
    surface: 'home_menu',
    expanded: true,
  });
  return true;
}

/**
 * MOONi companion-answer curation link. Not sent for internal traffic.
 * @param {Parameters<typeof isQuicklinkInternalTraffic>[0]} [env]
 */
export function trackMooniCurationLinkClick(env) {
  if (isQuicklinkInternalTraffic(env)) return false;
  trackEvent('mooni_curation_link_click', { from_chip: 'companion' });
  return true;
}
