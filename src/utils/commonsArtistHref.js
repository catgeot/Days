const COMMONS_API = 'https://commons.wikimedia.org/w/api.php';
const WIKI_NON_AUTHOR_NS =
  /\/wiki\/(?:File|Category|Help|Template|Special|MediaWiki|Project|Wikipedia|Commons|Module|Draft|TimedText|Topic):/i;

const artistHrefCache = new Map();

function safeDecode(value) {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function hostIs(hostname, roots) {
  const host = String(hostname || '').toLowerCase();
  return roots.some((root) => host === root || host.endsWith(`.${root}`));
}

/**
 * Author page only. Wiki File/Category/Help pages stay unlinked.
 * External http(s) pages (Flickr and similar) are kept.
 * @param {unknown} raw
 * @returns {string | null}
 */
export function sanitizeWikimediaAuthorHref(raw) {
  if (typeof raw !== 'string') return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;
  if (/^(javascript|data|vbscript):/i.test(trimmed)) return null;
  let parsed;
  try {
    parsed = new URL(trimmed, 'https://commons.wikimedia.org');
  } catch {
    return null;
  }
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return null;
  const path = safeDecode(parsed.pathname);
  const wikiHost = hostIs(parsed.hostname, ['wikimedia.org', 'wikipedia.org']);
  const wikidataHost = hostIs(parsed.hostname, ['wikidata.org']);
  if (wikiHost || wikidataHost) {
    if (WIKI_NON_AUTHOR_NS.test(path)) return null;
    if (wikiHost && !/\/wiki\/User:/i.test(path)) return null;
    if (wikidataHost && !/\/wiki\/Q\d+/i.test(path)) return null;
  }
  return parsed.toString();
}

/**
 * First author href inside Commons extmetadata Artist HTML.
 * @param {unknown} html
 * @returns {string | null}
 */
export function extractCommonsArtistHref(html) {
  if (typeof html !== 'string' || !html.includes('href')) return null;
  const decoded = html.replace(/&amp;/g, '&');
  const re = /href\s*=\s*(?:"([^"]+)"|'([^']+)')/gi;
  let match = re.exec(decoded);
  while (match) {
    const href = sanitizeWikimediaAuthorHref(match[1] || match[2] || '');
    if (href && !isLicenseRegistryHref(href)) return href;
    match = re.exec(decoded);
  }
  return null;
}

function isLicenseRegistryHref(href) {
  const host = new URL(href).hostname.toLowerCase();
  return host === 'creativecommons.org' || host.endsWith('.creativecommons.org');
}

/**
 * @param {unknown} url
 * @returns {string | null} `File:…` title
 */
export function commonsFileTitleFromUrl(url) {
  if (typeof url !== 'string' || !url.trim()) return null;
  let parsed;
  try {
    parsed = new URL(url.trim());
  } catch {
    return null;
  }
  const path = safeDecode(parsed.pathname);
  if (hostIs(parsed.hostname, ['wikimedia.org']) && /\/wiki\/File:/i.test(path)) {
    const name = path.split(/\/wiki\/File:/i)[1];
    return name ? `File:${name}` : null;
  }
  if (parsed.hostname.toLowerCase() === 'upload.wikimedia.org') {
    const thumb = path.match(/\/wikipedia\/commons\/thumb\/[^/]+\/[^/]+\/([^/]+)\//i);
    const full = path.match(/\/wikipedia\/commons\/[^/]+\/[^/]+\/([^/]+)$/i);
    const file = thumb?.[1] || full?.[1];
    return file ? `File:${file}` : null;
  }
  return null;
}

/**
 * @param {unknown} data Commons API query JSON
 * @returns {string | null}
 */
export function artistHrefFromCommonsQuery(data) {
  const pages = data?.query?.pages;
  if (!pages || typeof pages !== 'object') return null;
  for (const page of Object.values(pages)) {
    const info = Array.isArray(page?.imageinfo) ? page.imageinfo[0] : null;
    const href = extractCommonsArtistHref(info?.extmetadata?.Artist?.value);
    if (href) return href;
  }
  return null;
}

/**
 * @param {unknown} filePageUrl
 * @returns {Promise<string | null>}
 */
export async function fetchCommonsArtistPageHref(filePageUrl) {
  const title = commonsFileTitleFromUrl(filePageUrl);
  if (!title) return null;
  if (artistHrefCache.has(title)) return artistHrefCache.get(title);
  const params = new URLSearchParams({
    action: 'query',
    format: 'json',
    origin: '*',
    prop: 'imageinfo',
    iiprop: 'extmetadata',
    iiextmetadatafilter: 'Artist',
    titles: title,
  });
  const response = await fetch(`${COMMONS_API}?${params.toString()}`);
  if (!response.ok) {
    throw new Error(`Commons Artist metadata failed: ${response.status}`);
  }
  const href = artistHrefFromCommonsQuery(await response.json());
  artistHrefCache.set(title, href);
  return href;
}

export function clearCommonsArtistHrefCache() {
  artistHrefCache.clear();
}
