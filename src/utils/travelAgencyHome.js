/**
 * 제휴 여행사 홈 URL — affiliate SSOT 래퍼.
 */

import {
  BIKESBOOKING_AFFILIATE_HOME_URL,
  BOUNCE_AFFILIATE_HOME_URL,
  get12GoHomeUrl,
  getAffiliateLink,
  getAiraloHomeUrl,
  getDirectFerriesAffiliateUrl,
  getGygHomeUrl,
  getHolaflyHomeUrl,
  getKlookSiteHomeUrl,
  getMrtHomeAffiliateUrl,
  getTripcomHomeUrl,
} from './affiliate.js';
import { getTravelAgencyById } from '../data/travelAgencies.js';
import { sanitizeTravelAgencyHref } from './travelAgencyVisits.js';

/**
 * @param {string} agencyId
 * @returns {string}
 */
export function getTravelAgencyHomeUrl(agencyId) {
  switch (agencyId) {
    case 'mrt':
      return getMrtHomeAffiliateUrl();
    case 'klook':
      return getKlookSiteHomeUrl();
    case 'tripcom':
      return getTripcomHomeUrl({ campaign: 'gateo-agency-directory' });
    case 'getyourguide':
      return getGygHomeUrl();
    case 'twelve_go':
      return get12GoHomeUrl({ subId: 'gateo-agency-directory' });
    case 'airalo':
      return getAiraloHomeUrl({ campaign: 'agency-directory' });
    case 'holafly':
      return getHolaflyHomeUrl({ campaign: 'agency-directory' });
    case 'tiqets':
      return getAffiliateLink('https://www.tiqets.com/', 'tiqets', {
        campaign: 'agency-directory',
      });
    case 'bounce':
      return BOUNCE_AFFILIATE_HOME_URL;
    case 'bikesbooking':
      return BIKESBOOKING_AFFILIATE_HOME_URL;
    case 'direct_ferries':
      return getDirectFerriesAffiliateUrl();
    default:
      return '';
  }
}

/**
 * 방문 기록이 있으면 마지막 URL, 없으면 제휴 홈.
 * @param {string} agencyId
 * @param {string} [storedHref]
 * @returns {string}
 */
export function resolveTravelAgencyOpenUrl(agencyId, storedHref) {
  if (getTravelAgencyById(agencyId)) {
    const safe = sanitizeTravelAgencyHref(storedHref, agencyId);
    if (safe) return safe;
  }
  return getTravelAgencyHomeUrl(agencyId);
}
