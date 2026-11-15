const GATEO_HOSTS = new Set(['gateo.kr', 'www.gateo.kr']);

/**
 * @param {unknown} href
 * @param {string} [base]
 * @returns {{ kind: 'internal', to: string } | { kind: 'external', href: string } | { kind: 'plain', href: string }}
 */
export function classifyLogbookMarkdownHref(href, base = 'https://www.gateo.kr/') {
  let raw = String(href ?? '').trim();
  if (!raw || raw.startsWith('#')) return { kind: 'plain', href: raw };
  // Markdown often omits the scheme: gateo.kr/place/rome
  if (/^(?:www\.)?gateo\.kr(?=$|[/?#])/i.test(raw)) {
    raw = `https://${raw}`;
  }

  // Site path. Resolve against gateo so a preview host does not turn it into an external URL.
  if (raw.startsWith('/') && !raw.startsWith('//')) {
    return { kind: 'internal', to: raw };
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

  const explicitHost = /^[a-z][a-z0-9+.-]*:/i.test(raw) || raw.startsWith('//');
  const sameHost = explicitHost && url.hostname === baseUrl.hostname;
  if (GATEO_HOSTS.has(url.hostname) || sameHost) {
    const to = `${url.pathname}${url.search}${url.hash}` || '/';
    return { kind: 'internal', to };
  }

  return { kind: 'external', href: url.href };
}
