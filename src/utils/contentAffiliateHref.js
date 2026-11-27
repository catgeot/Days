import { buildKlookAffiliateUrl, isKlookConsumerHost } from './klookAffiliateUrl.js';
import { applyMrtMylinkParams } from './mrtMylinkUrl.js';
import { TRIPCOM_KR_PARTNER } from './tripcomKrPartner.js';

/** Same rel as place-card and planner affiliate anchors. */
export const CONTENT_AFFILIATE_LINK_REL = 'noopener noreferrer sponsored';

const SUB_TAG_MAX = 100;

/**
 * `blog-<slug>` or `review-<slug or id>`. Empty when kind or id is missing.
 * @param {'blog' | 'review' | string} kind
 * @param {unknown} slugOrId
 * @returns {string}
 */
export function contentAffiliateSubTag(kind, slugOrId) {
  const prefix = kind === 'blog' || kind === 'review' ? kind : '';
  const id = String(slugOrId ?? '').trim();
  if (!prefix || !id) return '';
  return `${prefix}-${id}`.slice(0, SUB_TAG_MAX);
}

/**
 * @param {unknown} href
 * @returns {'trip' | 'klook' | 'mrt' | ''}
 */
export function contentAffiliatePartner(href) {
  const url = parseHttpUrl(href);
  if (!url) return '';
  if (isTripHost(url.hostname)) return 'trip';
  if (isKlookConsumerHost(url.hostname)) return 'klook';
  if (isMrtHost(url.hostname)) return 'mrt';
  return '';
}

/**
 * Add Trip.com / Klook / MyRealTrip affiliate params at render time.
 * Already-tagged partner URLs, other hosts, and unparseable strings come back unchanged.
 * @param {unknown} href
 * @param {{ subTag?: string }} [options]
 * @returns {string}
 */
export function rewriteContentAffiliateHref(href, options = {}) {
  const original = String(href ?? '');
  const url = parseHttpUrl(original);
  if (!url) return original;
  const subTag = String(options.subTag ?? '').trim().slice(0, SUB_TAG_MAX);

  if (isTripHost(url.hostname)) {
    if (hasParam(url, 'Allianceid') || hasParam(url, 'SID')) return original;
    url.searchParams.set('Allianceid', TRIPCOM_KR_PARTNER.allianceId);
    url.searchParams.set('SID', TRIPCOM_KR_PARTNER.sid);
    if (subTag) url.searchParams.set('trip_sub1', subTag);
    return url.href;
  }

  if (isKlookConsumerHost(url.hostname)) {
    if (hasParam(url, 'aid')) return original;
    const affiliated = buildKlookAffiliateUrl(original);
    if (!subTag || !affiliated) return affiliated || original;
    // Klook's web builder has no sub-id argument. utm_content matches buildMrtMylinkUrl.
    try {
      const next = new URL(affiliated);
      next.searchParams.set('utm_content', subTag);
      return next.href;
    } catch {
      return affiliated;
    }
  }

  if (isMrtHost(url.hostname)) {
    if (hasParam(url, 'mylink_id')) return original;
    try {
      return applyMrtMylinkParams(original, subTag ? { utmContent: subTag } : {});
    } catch {
      return original;
    }
  }

  return original;
}

/**
 * @param {unknown} href
 * @param {{ subTag?: string }} [options]
 * @returns {{ href: string, affiliated: boolean, partner: 'trip' | 'klook' | 'mrt' | '' }}
 */
export function resolveContentAffiliateLink(href, options = {}) {
  const original = String(href ?? '');
  const partner = contentAffiliatePartner(original);
  if (!partner) return { href: original, affiliated: false, partner: '' };
  return {
    href: rewriteContentAffiliateHref(original, options),
    affiliated: true,
    partner,
  };
}

/**
 * @param {unknown} href
 * @returns {URL | null}
 */
function parseHttpUrl(href) {
  const raw = String(href ?? '');
  if (!raw) return null;
  try {
    const url = new URL(raw);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return null;
    if (!url.hostname) return null;
    return url;
  } catch {
    return null;
  }
}

/**
 * @param {URL} url
 * @param {string} name
 */
function hasParam(url, name) {
  const target = name.toLowerCase();
  for (const key of url.searchParams.keys()) {
    if (key.toLowerCase() === target) return true;
  }
  return false;
}

/**
 * @param {string} hostname
 */
function isTripHost(hostname) {
  const host = String(hostname || '').toLowerCase();
  return host === 'trip.com' || host.endsWith('.trip.com');
}

/**
 * @param {string} hostname
 */
function isMrtHost(hostname) {
  const host = String(hostname || '').toLowerCase();
  return host === 'myrealtrip.com' || host.endsWith('.myrealtrip.com');
}
