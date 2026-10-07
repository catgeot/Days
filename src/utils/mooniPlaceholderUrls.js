const PLACEHOLDER_HOST_RE =
  /^(?:.*\.)?example\.(?:com|org|net)$|^localhost$|.*\.(?:example|test|invalid|localhost)$/i;

const ALLOWED_LINK_SCHEMES = new Set(['http:', 'https:']);

const GATEO_PRODUCTION_HOSTS = new Set(['www.gateo.kr', 'gateo.kr']);

/** UI 헤더·버튼을 가리키는 링크 문구 — gateo.kr 외 URL은 링크로 두지 않음 */
const IN_APP_UI_LINK_LABEL_RE =
  /^(?:📋\s*)?(?:플래너\s*보기|GATEO\s*플래너|Planner|여행\s*플래너|플래너)$/i;

/**
 * @param {string} hostname
 */
function isMooniReservedHost(hostname) {
  const host = String(hostname ?? '').toLowerCase();
  if (!host) return true;
  if (host === 'localhost' || host.endsWith('.localhost')) return true;
  return PLACEHOLDER_HOST_RE.test(host);
}

/**
 * @param {string} url
 */
export function isGateoProductionUrl(url) {
  try {
    const host = new URL(String(url).trim(), 'https://www.gateo.kr').hostname.toLowerCase();
    return GATEO_PRODUCTION_HOSTS.has(host);
  } catch {
    return false;
  }
}

/**
 * 예시·예약 TLD 및 http(s) 외 스킴.
 *
 * @param {string} url
 */
export function isUnsafeMooniLinkUrl(url) {
  const raw = String(url ?? '').trim();
  if (!raw) return true;
  try {
    const parsed = new URL(raw, 'https://www.gateo.kr');
    if (!ALLOWED_LINK_SCHEMES.has(parsed.protocol)) return true;
    return isMooniReservedHost(parsed.hostname);
  } catch {
    return true;
  }
}

/** @deprecated use isUnsafeMooniLinkUrl */
export function isMooniPlaceholderUrl(url) {
  return isUnsafeMooniLinkUrl(url);
}

/**
 * @param {string} label
 */
export function isMooniInAppUiLinkLabel(label) {
  const text = String(label ?? '').trim();
  if (!text) return false;
  if (IN_APP_UI_LINK_LABEL_RE.test(text)) return true;
  return /플래너\s*보기/.test(text);
}

/**
 * @param {string} href
 * @param {string} [label]
 */
export function shouldStripMooniMarkdownLink(href, label = '') {
  if (isUnsafeMooniLinkUrl(href)) return true;
  if (isMooniInAppUiLinkLabel(label) && !isGateoProductionUrl(href)) return true;
  return false;
}

/**
 * @param {string} markdown
 */
export function sanitizeMooniMarkdownLinks(markdown) {
  let s = String(markdown ?? '');
  if (!s) return s;
  s = s.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (full, label, href) =>
    shouldStripMooniMarkdownLink(href, label) ? label : full,
  );
  return s;
}

/** @deprecated use sanitizeMooniMarkdownLinks */
export function stripMooniPlaceholderMarkdownLinks(markdown) {
  return sanitizeMooniMarkdownLinks(markdown);
}
