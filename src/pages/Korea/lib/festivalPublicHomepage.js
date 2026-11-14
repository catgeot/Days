/** @type {Record<string, { url: string, verifiedAt?: string, source?: string }>} */
export const FESTIVAL_HOMEPAGE_OVERRIDES = {
  637693: {
    url: 'https://www.changwon.go.kr/cwportal/depart/11063/14383/14384.web',
    verifiedAt: '2026-10-18',
    source: 'manual: Cos verified 200, 제26회, 2026.10.31~11.8',
  },
  1095732: {
    url: 'https://www.stolantern.com/',
    verifiedAt: '2026-11-14',
    source: 'agent: HTTP/HTTPS HEAD 200 on www.stolantern.com',
  },
};

/** Hosts where HTTPS is known good (curl HEAD); http→https for official festival links. */
export const FESTIVAL_HOMEPAGE_HTTPS_KNOWN_HOSTS = new Set([
  'www.stolantern.com',
  'stolantern.com',
]);

function hostKey(hostname) {
  return String(hostname || '').trim().toLowerCase().replace(/^www\./, '');
}

/**
 * @param {string} url
 */
export function preferHttpsFestivalHomepage(url) {
  const raw = String(url || '').trim();
  if (!/^http:\/\//i.test(raw)) return raw;
  try {
    const parsed = new URL(raw);
    const bare = hostKey(parsed.hostname);
    if (FESTIVAL_HOMEPAGE_HTTPS_KNOWN_HOSTS.has(parsed.hostname.toLowerCase())
      || FESTIVAL_HOMEPAGE_HTTPS_KNOWN_HOSTS.has(bare)
      || FESTIVAL_HOMEPAGE_HTTPS_KNOWN_HOSTS.has(`www.${bare}`)) {
      return raw.replace(/^http:\/\//i, 'https://');
    }
  } catch {
    return raw;
  }
  return raw;
}

/**
 * Client + Edge — TourAPI homepage string or override table.
 * @param {string | null | undefined} contentId
 * @param {string | null | undefined} rawHomepage
 * @returns {string}
 */
export function resolveFestivalPublicHomepage(contentId, rawHomepage) {
  const id = String(contentId ?? '').trim();
  const override = id ? FESTIVAL_HOMEPAGE_OVERRIDES[id] : null;
  if (override?.url) return override.url;

  const raw = String(rawHomepage ?? '').trim();
  if (!raw) return '';
  const href = raw.match(/href\s*=\s*["']([^"']+)["']/i)?.[1];
  const candidate = (href || raw.match(/https?:\/\/[^\s<>"']+/i)?.[0] || raw).trim();
  if (!candidate) return '';
  let url = candidate;
  if (!/^https?:\/\//i.test(url) && /^[\w.-]+\.[\w.-]+/.test(url)) {
    url = `https://${url.replace(/^\/+/, '')}`;
  }
  return preferHttpsFestivalHomepage(url);
}