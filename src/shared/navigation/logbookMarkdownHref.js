const GATEO_HOSTS = new Set(['gateo.kr', 'www.gateo.kr']);

/** Pathname prefixes that React Router owns. Anything else stays a normal anchor. */
const SPA_ROUTE_PREFIXES = [
  '/place',
  '/explore',
  '/korea',
  '/world-events',
  '/en',
  '/qa',
  '/about',
  '/pricing',
  '/product',
  '/blog',
  '/p',
  '/auth',
  '/account',
  '/admin',
];

/**
 * @param {string} pathname
 */
export function isLogbookSpaPath(pathname) {
  const path = pathname || '/';
  if (path === '/') return true;
  const leaf = path.slice(path.lastIndexOf('/') + 1);
  if (leaf.includes('.')) return false;
  if (path === '/api' || path.startsWith('/api/')) return false;
  if (path === '/assets' || path.startsWith('/assets/')) return false;
  if (/^\/sitemap[^/]*\.xml$/i.test(path) || path === '/rss.xml') return false;
  return SPA_ROUTE_PREFIXES.some((prefix) => path === prefix || path.startsWith(`${prefix}/`));
}

function isExactGateoHost(hostname) {
  return GATEO_HOSTS.has(String(hostname || '').toLowerCase());
}

/**
 * @param {unknown} href
 * @param {string} [base]
 * @returns {{ kind: 'internal', to: string } | { kind: 'external', href: string } | { kind: 'plain', href: string }}
 */
export function classifyLogbookMarkdownHref(href, base = 'https://www.gateo.kr/') {
  let raw = String(href ?? '').trim();
  if (!raw || raw.startsWith('#')) return { kind: 'plain', href: raw };

  if (/^[a-z][a-z0-9+.-]*:/i.test(raw) && !/^https?:/i.test(raw)) {
    return { kind: 'plain', href: raw };
  }

  // gateo.kr/place/rome and www.gateo.kr/... — exact hosts only.
  if (/^(?:www\.)?gateo\.kr(?=$|[/?#])/i.test(raw)) {
    raw = `https://${raw}`;
  } else if (isSchemeLessForeignHost(raw)) {
    return { kind: 'external', href: `https://${raw}` };
  } else if (!raw.includes('/') && /\.[a-z0-9]{1,8}$/i.test(raw)) {
    return { kind: 'plain', href: raw };
  }

  if (raw.startsWith('/') && !raw.startsWith('//')) {
    return classifyAppPath(raw, raw);
  }

  let url;
  let baseUrl;
  try {
    baseUrl = new URL(base);
    url = new URL(raw, baseUrl);
  } catch {
    return { kind: 'plain', href: raw };
  }

  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    return { kind: 'plain', href: raw };
  }

  const to = `${url.pathname}${url.search}${url.hash}` || '/';
  const sameHost = url.hostname.toLowerCase() === baseUrl.hostname.toLowerCase();
  if (isExactGateoHost(url.hostname) || sameHost) {
    return classifyAppPath(to, to);
  }

  return { kind: 'external', href: url.href };
}

/**
 * Scheme-less notgateo.kr/... and gateo.kr.evil.com/... are hosts, not site-relative paths.
 * @param {string} raw
 */
function isSchemeLessForeignHost(raw) {
  if (
    /^[a-z][a-z0-9+.-]*:/i.test(raw)
    || raw.startsWith('//')
    || raw.startsWith('/')
    || raw.startsWith('.')
    || raw.startsWith('#')
  ) {
    return false;
  }
  const host = raw.split(/[/?#]/)[0];
  if (!host.includes('.')) return false;
  if (isExactGateoHost(host)) return false;
  if (!raw.includes('/') && /\.[a-z0-9]{1,8}$/i.test(host)) return false;
  return true;
}

/**
 * @param {string} to pathname + search + hash
 * @param {string} plainHref
 */
function classifyAppPath(to, plainHref) {
  const pathname = to.split(/[?#]/)[0] || '/';
  if (isLogbookSpaPath(pathname)) return { kind: 'internal', to };
  return { kind: 'plain', href: plainHref };
}

/**
 * In-body place card or festival detail target. Empty when the link should stay a normal anchor.
 * @param {unknown} href
 * @param {string} [base]
 * @returns {string}
 */
export function articleBodyPlaceOrFestivalTo(href, base) {
  const classified = classifyLogbookMarkdownHref(href, base);
  if (classified.kind !== 'internal') return '';
  const to = classified.to;
  const pathname = (to.split(/[?#]/)[0] || '/').replace(/\/+$/, '') || '/';
  if (pathname === '/korea' && /[?&]festival=\d+/.test(to)) return to;
  if (pathname === '/place' || pathname.startsWith('/place/')) return to;
  return '';
}
