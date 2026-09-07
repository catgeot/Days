export const KLOOK_AID = '118544';
export const KLOOK_DEFAULT_AD_ID = '1256120';

/**
 * klook.com 소비자 호스트만. affiliate.klook.com 은 리다이렉트 래퍼.
 * @param {string} hostname
 * @returns {boolean}
 */
export function isKlookConsumerHost(hostname) {
  const host = String(hostname || '')
    .trim()
    .toLowerCase();
  if (!host) return false;
  if (host === 'affiliate.klook.com' || host.endsWith('.affiliate.klook.com')) {
    return false;
  }
  return host === 'klook.com' || host.endsWith('.klook.com');
}

/**
 * Klook 제휴 URL.
 * affiliate.klook.com/redirect 는 klook.onelink.me + af_dp=klook:// 로
 * iOS 「다른 애플리케이션을 열려고 합니다」를 띄움. klook.com 목적지는
 * aid/aff_adid 를 붙여 웹 직행 (클룩 af_r 폴백과 동일 파라미터).
 *
 * @param {string} targetUrl
 * @param {string} [adId]
 * @returns {string}
 */
export function buildKlookAffiliateUrl(targetUrl, adId = KLOOK_DEFAULT_AD_ID) {
  if (!targetUrl) return '';
  const ad = String(adId || KLOOK_DEFAULT_AD_ID);
  try {
    const url = new URL(targetUrl);
    if (isKlookConsumerHost(url.hostname)) {
      url.searchParams.set('aid', KLOOK_AID);
      url.searchParams.set('aff_adid', ad);
      url.searchParams.set('utm_medium', 'affiliate-alwayson');
      url.searchParams.set('utm_source', 'non-network');
      url.searchParams.set('utm_campaign', KLOOK_AID);
      return url.toString();
    }
  } catch {
    // non-URL → redirect wrapper
  }
  return `https://affiliate.klook.com/redirect?aid=${KLOOK_AID}&aff_adid=${ad}&k_site=${encodeURIComponent(targetUrl)}`;
}
