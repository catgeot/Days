import { trackEvent } from './trackEvent.js';

/**
 * Home quick-link click. Live with the review-tab flag off or on.
 * The fourth tile is `curation` when the flag is off and `review_hub` when it is on.
 * @param {string} item festival | world_events | scenic | review_hub | curation
 * @param {Parameters<typeof trackEvent>[2]} [env]
 */
export function trackQuicklinkClick(item, env) {
  trackEvent(
    'quicklink_click',
    {
      item,
      surface: 'home_menu',
      expanded: true,
    },
    env,
  );
  return true;
}

/**
 * MOONi companion-answer curation link. The control is flag-gated; this event is not.
 * @param {Parameters<typeof trackEvent>[2]} [env]
 */
export function trackMooniCurationLinkClick(env) {
  trackEvent('mooni_curation_link_click', { from_chip: 'companion' }, env);
  return true;
}
