/**
 * MRT 패키지(/pkc) 딥링크 + mylink — Edge/목록 API 없음.
 * affiliate.js와 순환 없이 Node 스모크 가능.
 */
import {
  MRT_HOME_MYLINK_ID,
  MRT_PACKAGE_THEME_TARGETS,
  MRT_PKC_HOME_URL,
} from '../pages/Home/data/mrtPackageThemeLinks.js';
import {
  resolveMrtPackageSearchKeyword,
  resolveMrtPackageThemeKey,
} from './mrtPackageQuery.js';
import { i18n } from '../i18n/config.js';

function withMylink(targetUrl, options = {}) {
  if (!targetUrl) return '';
  try {
    const url = new URL(targetUrl);
    const mylinkId = String(options.mylinkId ?? MRT_HOME_MYLINK_ID).trim();
    if (mylinkId) url.searchParams.set('mylink_id', mylinkId);
    url.searchParams.set('utm_source', 'mktpartner');
    const utmContent = String(options.utmContent ?? '').trim();
    if (utmContent) url.searchParams.set('utm_content', utmContent.slice(0, 100));
    return url.toString();
  } catch {
    return targetUrl;
  }
}

/** 마이리얼트립 패키지 허브(`/pkc`) + mylink */
export function buildMrtPkcHomeUrl(options = {}) {
  return withMylink(MRT_PKC_HOME_URL, options);
}

/**
 * 패키지 검색(`/pkc/search?q=`) + mylink.
 * @param {string} query
 */
export function buildMrtPkcSearchUrl(query, options = {}) {
  const q = String(query ?? '').trim();
  if (!q) return buildMrtPkcHomeUrl(options);
  return withMylink(
    `${MRT_PKC_HOME_URL}/search?q=${encodeURIComponent(q)}`,
    options
  );
}

/**
 * 패키지 기획전(`/pkc/search?promotionGroupId=`) + mylink.
 * @param {string|number} promotionGroupId
 */
export function buildMrtPkcPromotionGroupUrl(promotionGroupId, options = {}) {
  const id = String(promotionGroupId ?? '').trim();
  if (!id) return buildMrtPkcHomeUrl(options);
  return withMylink(
    `${MRT_PKC_HOME_URL}/search?promotionGroupId=${encodeURIComponent(id)}`,
    options
  );
}

/**
 * 패키지 권역(`/pkc/search?regionCategoryCode=`) + mylink.
 * @param {string} regionCategoryCode 예: GANGWONDO
 */
export function buildMrtPkcRegionCategoryUrl(regionCategoryCode, options = {}) {
  const code = String(regionCategoryCode ?? '').trim();
  if (!code) return buildMrtPkcHomeUrl(options);
  return withMylink(
    `${MRT_PKC_HOME_URL}/search?regionCategoryCode=${encodeURIComponent(code)}`,
    options
  );
}

/**
 * 테마 키 → 제휴 URL + CTA 문구.
 * @param {string} themeKey MRT_PACKAGE_THEME_TARGETS 키
 */
export function resolveMrtPackageThemeHref(themeKey, options = {}) {
  const target = MRT_PACKAGE_THEME_TARGETS[themeKey];
  if (!target) return null;
  const utm = {
    ...options,
    utmContent: options.utmContent || `pkc-theme-${themeKey}`,
  };
  let url = buildMrtPkcHomeUrl(utm);
  if (target.kind === 'promotionGroup' && target.promotionGroupId) {
    url = buildMrtPkcPromotionGroupUrl(target.promotionGroupId, utm);
  } else if (target.kind === 'regionCategory' && target.regionCategoryCode) {
    url = buildMrtPkcRegionCategoryUrl(target.regionCategoryCode, utm);
  } else if (target.kind === 'search') {
    url = buildMrtPkcSearchUrl(target.q || target.searchFallback, utm);
  } else if (target.kind === 'home') {
    url = buildMrtPkcHomeUrl(utm);
  }
  return { url, ctaLabel: target.ctaLabel };
}

/**
 * 장소 → 패키지 검색 URL (키워드 없으면 패키지 홈).
 */
export function buildMrtPkcUrlForLocation(location, options = {}) {
  const keyword = resolveMrtPackageSearchKeyword(location);
  const utm = {
    ...options,
    utmContent: options.utmContent || 'pkc-place',
  };
  if (!keyword) return buildMrtPkcHomeUrl(utm);
  return buildMrtPkcSearchUrl(keyword, utm);
}

/** 장소 → 테마 CTA (없으면 null). */
export function resolveMrtPackageThemeForLocation(location, options = {}) {
  const key = resolveMrtPackageThemeKey(location);
  if (!key) return null;
  return resolveMrtPackageThemeHref(key, options);
}

/** 숙소·투어 모달 CTA 문구 — 예: `View Timbuktu package deals` */
export function formatMrtPackageProductCtaLabel(keyword, options = {}) {
  const k = String(options.displayKeyword ?? keyword ?? '').trim();
  return k
    ? i18n.t('home.stayStrip.packageCta', { keyword: k })
    : i18n.t('home.stayStrip.packageCtaDefault');
}
