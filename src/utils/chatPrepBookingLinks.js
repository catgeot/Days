import { getKlookAffiliateUrl, KLOOK_AIRPORT_TRANSFER_TARGET } from './affiliate.js';
import { getMultiLinks } from '../components/PlaceCard/tabs/planner/utils.js';

/** PreTravelChecklist와 동일 SSOT */
export const CHAT_KLOOK_AIRPORT_TRANSFER_URL = KLOOK_AIRPORT_TRANSFER_TARGET;

/**
 * 툴킷 essential_guide.categories.pre_travel[] — 플래너 PreTravelChecklist와 동일.
 * @param {Record<string, unknown> | null | undefined} essentialGuide
 */
export function getPreTravelItemsFromGuide(essentialGuide) {
  if (!essentialGuide || typeof essentialGuide !== 'object') return [];
  const cats = /** @type {{ pre_travel?: unknown[] }} */ (
    essentialGuide.categories ?? essentialGuide
  );
  const items = cats?.pre_travel;
  if (!Array.isArray(items)) return [];
  return items.filter(
    (item) =>
      item &&
      typeof item === 'object' &&
      item.url &&
      String(item.url).trim().startsWith('http')
  );
}

/**
 * intent leg → 채팅 CTA (visa · 관광세 pre_travel · Klook 픽업).
 * URL은 getMultiLinks·PreTravelChecklist·툴킷만 사용.
 *
 * @param {{
 *   legs: string[],
 *   essentialGuide?: object | null,
 *   location?: { slug?: string, name?: string, country?: string } | null,
 *   destinationName?: string,
 * }} params
 */
export function resolveChatPrepActions({
  legs = [],
  essentialGuide = null,
  location = null,
  destinationName = '',
}) {
  if (!legs.length) return [];

  const loc =
    location && typeof location === 'object'
      ? location
      : { name: destinationName };

  /** @type {Array<{ type: string, label: string, url: string, provider: string }>} */
  const actions = [];

  if (legs.includes('transfer')) {
    actions.push({
      type: 'klook_transfer',
      label: '공항 픽업 예약',
      url: getKlookAffiliateUrl(CHAT_KLOOK_AIRPORT_TRANSFER_URL),
      provider: 'klook',
    });
  }

  if (legs.includes('visa')) {
    const visaData =
      essentialGuide?.categories?.visa ?? essentialGuide?.visa ?? null;
    const links = getMultiLinks({
      type: 'visa',
      data: visaData,
      location: loc,
      essentialGuide,
    });
    for (const link of links) {
      if (!link?.url) continue;
      actions.push({
        type: 'visa_official',
        label: link.text || '비자·입국 정보',
        url: link.url,
        provider: 'official',
      });
    }
  }

  if (legs.includes('prep_fees')) {
    const items = getPreTravelItemsFromGuide(essentialGuide);
    for (const item of items) {
      actions.push({
        type: 'pre_travel',
        label: item.title || '입국 준비',
        url: String(item.url).trim(),
        provider: 'pre_travel',
      });
    }
  }

  return actions.slice(0, 4);
}
