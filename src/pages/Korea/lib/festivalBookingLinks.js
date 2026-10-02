import bookingLinksByContentId from '../data/festivalBookingLinks.json' with { type: 'json' };

const ALLOWED_BOOKING_HOSTS = ['ticketlink.co.kr'];

/**
 * @param {unknown} value
 * @returns {number}
 */
function toEpochMs(value) {
  if (value instanceof Date) return value.getTime();
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  const ms = Date.parse(String(value ?? '').trim());
  return Number.isFinite(ms) ? ms : NaN;
}

/**
 * Date-only eventEnd means 23:59:59 KST that calendar day.
 * @param {unknown} eventEnd
 * @returns {number}
 */
export function eventEndCutoffMs(eventEnd) {
  const raw = String(eventEnd ?? '').trim();
  if (!raw) return NaN;
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    return Date.parse(`${raw}T23:59:59+09:00`);
  }
  return Date.parse(raw);
}

/**
 * @param {string} url
 * @returns {boolean}
 */
export function isAllowedBookingUrl(url) {
  let parsed;
  try {
    parsed = new URL(String(url || '').trim());
  } catch {
    return false;
  }
  if (parsed.protocol !== 'https:') return false;
  const host = parsed.hostname.toLowerCase();
  return ALLOWED_BOOKING_HOSTS.some(
    (allowed) => host === allowed || host.endsWith(`.${allowed}`),
  );
}

/**
 * @param {unknown} row
 * @returns {boolean}
 */
function hasRequiredBookingFields(row) {
  if (!row || typeof row !== 'object') return false;
  const item = /** @type {Record<string, unknown>} */ (row);
  if (!item.url || !item.provider || !item.sourceUrl || !item.verifiedAt) return false;
  if (!item.saleEnd && !item.eventEnd) return false;
  if (!item.id) return false;
  return true;
}

/**
 * @param {string} audience
 * @param {string} uiLang
 */
function audienceVisible(audience, uiLang) {
  const lang = String(uiLang || 'ko').toLowerCase();
  const korean = lang === 'ko' || lang.startsWith('ko-');
  if (audience === 'all') return true;
  if (audience === 'domestic') return korean;
  if (audience === 'foreign') return !korean;
  return false;
}

/**
 * Hidden when now is strictly after saleEnd, else after eventEnd 23:59:59 KST.
 * @param {Record<string, unknown>} row
 * @param {number} nowMs
 */
export function isBookingLinkExpired(row, nowMs) {
  if (row.saleEnd) {
    const end = toEpochMs(row.saleEnd);
    if (!Number.isFinite(end)) return true;
    return nowMs > end;
  }
  const end = eventEndCutoffMs(row.eventEnd);
  if (!Number.isFinite(end)) return true;
  return nowMs > end;
}

/**
 * @param {unknown} rows
 * @param {{ now?: Date | string | number, uiLang?: string }} [opts]
 */
export function filterVisibleBookingLinks(rows, opts = {}) {
  const nowMs = toEpochMs(opts.now ?? new Date());
  if (!Number.isFinite(nowMs)) return [];
  const uiLang = opts.uiLang ?? 'ko';
  const list = Array.isArray(rows) ? rows : [];
  const visible = [];
  for (const row of list) {
    if (!hasRequiredBookingFields(row)) continue;
    const item = /** @type {Record<string, unknown>} */ (row);
    const url = String(item.url).trim();
    if (!isAllowedBookingUrl(url)) continue;
    const audience = String(item.audience || '');
    if (!audienceVisible(audience, uiLang)) continue;
    if (isBookingLinkExpired(item, nowMs)) continue;
    visible.push({ ...item, url });
  }
  visible.sort((a, b) => {
    const feat = Number(Boolean(b.featured)) - Number(Boolean(a.featured));
    if (feat !== 0) return feat;
    return String(a.eventStart || '').localeCompare(String(b.eventStart || ''));
  });
  return visible;
}

/**
 * @param {unknown} contentId
 * @param {{ now?: Date | string | number, uiLang?: string }} [opts]
 */
export function getVisibleBookingLinks(contentId, opts = {}) {
  const key = String(contentId ?? '');
  const rows = bookingLinksByContentId[key] || [];
  return filterVisibleBookingLinks(rows, opts);
}

/**
 * Compare official homepage and a booking URL (scheme/host case, one trailing slash).
 * @param {unknown} raw
 */
export function bookingUrlKey(raw) {
  const value = String(raw ?? '').trim();
  if (!value) return '';
  try {
    const parsed = new URL(value);
    const host = parsed.hostname.toLowerCase();
    const path = parsed.pathname.replace(/\/+$/, '') || '';
    return `${parsed.protocol.toLowerCase()}//${host}${path}${parsed.search}`;
  } catch {
    return '';
  }
}

/**
 * @param {unknown} homepage
 * @param {Array<{ url?: string }>} links
 */
export function shouldHideOfficialHomepage(homepage, links) {
  const homeKey = bookingUrlKey(homepage);
  if (!homeKey || !Array.isArray(links) || links.length === 0) return false;
  return links.some((link) => bookingUrlKey(link?.url) === homeKey);
}

/**
 * @param {string} contentId
 * @param {{ id?: string, provider?: string, url?: string, audience?: string }} link
 * @param {{ placement: string, uiLang?: string }} meta
 */
export function bookingClickParams(contentId, link, meta) {
  return {
    festival_id: String(contentId ?? ''),
    program_key: link?.id ?? '',
    provider: link?.provider ?? '',
    link_url: link?.url ?? '',
    placement: meta.placement,
    ui_lang: meta.uiLang ?? '',
    audience: link?.audience ?? '',
  };
}
