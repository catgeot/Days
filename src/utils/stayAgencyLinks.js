import stayAgencyLinksData from '../pages/Home/data/travelSpotStayAgencyLinks.json' with { type: 'json' };

/** @typedef {'tourism-board'|'local-dmc'|'kr-specialist'} StayAgencyLinkKind */

/**
 * @typedef {{
 *   name: string,
 *   href: string,
 *   kind: StayAgencyLinkKind,
 *   locale?: string,
 *   verifiedAt?: string,
 *   evidence?: string,
 * }} StayAgencyLink
 */

/**
 * @typedef {{
 *   note: string,
 *   links: StayAgencyLink[],
 *   confidence?: 'high'|'medium',
 *   alwaysShow?: boolean,
 * }} StayAgencyProfile
 */

const KIND_LABEL = {
  'tourism-board': '공식 관광',
  'local-dmc': '인가·전문',
  'kr-specialist': '국내 전문',
};

const DISCLAIMER =
  '게이트오는 해당 여행사와 예약 대행 관계가 아닙니다. 공식 안내를 참고해 주세요.';

/**
 * @param {{ slug?: string } | string | null | undefined} locationOrSlug
 * @returns {string}
 */
export function getStayAgencySlugKey(locationOrSlug) {
  if (typeof locationOrSlug === 'string') {
    return locationOrSlug.trim().toLowerCase();
  }
  return String(locationOrSlug?.slug || '')
    .trim()
    .toLowerCase();
}

/**
 * @param {{ slug?: string } | string | null | undefined} locationOrSlug
 * @returns {StayAgencyProfile | null}
 */
export function resolveStayAgencyProfile(locationOrSlug) {
  const slug = getStayAgencySlugKey(locationOrSlug);
  if (!slug) return null;
  const spots = stayAgencyLinksData?.spots;
  const entry = spots?.[slug];
  if (!entry || !Array.isArray(entry.links) || entry.links.length === 0) return null;
  return {
    note: String(entry.note || '').trim(),
    confidence: entry.confidence,
    alwaysShow: Boolean(entry.alwaysShow),
    links: entry.links
      .map((link) => ({
        name: String(link?.name || '').trim(),
        href: String(link?.href || '').trim(),
        kind: link?.kind,
        locale: link?.locale,
        verifiedAt: link?.verifiedAt,
        evidence: link?.evidence,
      }))
      .filter((link) => link.name && /^https:\/\//i.test(link.href) && link.kind)
      .slice(0, 3),
  };
}

/**
 * @param {{ slug?: string } | string | null | undefined} locationOrSlug
 * @returns {boolean}
 */
export function hasStayAgencyLinks(locationOrSlug) {
  const profile = resolveStayAgencyProfile(locationOrSlug);
  return Boolean(profile?.links?.length);
}

/**
 * @param {StayAgencyLinkKind | string | undefined} kind
 * @returns {string}
 */
export function getStayAgencyKindLabel(kind) {
  return KIND_LABEL[kind] || '안내';
}

/**
 * 안내 링크에 gateo 출처만 붙인다 (제휴 campaign과 분리).
 * 일부 .gov 호스트는 쿼리 문자열이 있으면 403을 내므로 건너뛴다.
 * @param {string} href
 * @returns {string}
 */
export function withStayAgencyReferral(href) {
  const raw = String(href || '').trim();
  if (!/^https:\/\//i.test(raw)) return raw;
  try {
    const url = new URL(raw);
    const host = url.hostname.toLowerCase();
    // nauru.gov.nr 등 — UTM 붙이면 403 Forbidden
    if (/\.gov(\.|$)/i.test(host) || /\.gob(\.|$)/i.test(host)) {
      return raw;
    }
    if (!url.searchParams.has('utm_source')) {
      url.searchParams.set('utm_source', 'gateo');
    }
    if (!url.searchParams.has('utm_medium')) {
      url.searchParams.set('utm_medium', 'referral');
    }
    if (!url.searchParams.has('utm_campaign')) {
      url.searchParams.set('utm_campaign', 'stay-agency-guide');
    }
    return url.toString();
  } catch {
    return raw;
  }
}

export const STAY_AGENCY_DISCLAIMER = DISCLAIMER;
