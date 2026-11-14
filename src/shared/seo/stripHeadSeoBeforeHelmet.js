/** @param {string} [path] pathname only, e.g. `/blog/e/rome-travelogue` */
export function isEditorialBlogSeoPath(path = '') {
  const normalized = !path || path === '/' ? '' : path.startsWith('/') ? path : `/${path}`;
  return /^\/blog\/e\/[^/]+/.test(normalized);
}

/** Removes index.html / prior head SEO tags so react-helmet-async does not leave duplicates (first tag wins for scrapers). Editorial /blog/e/* only. */
export function stripHeadSeoBeforeHelmet(doc = typeof document !== 'undefined' ? document : null) {
  if (!doc?.head) return;

  const selectors = [
    'meta[name="description"]',
    'meta[name="keywords"]',
    'meta[property^="og:"]',
    'meta[name^="twitter:"]',
  ];

  for (const selector of selectors) {
    doc.head.querySelectorAll(selector).forEach((node) => node.remove());
  }

  doc.head.querySelectorAll('title').forEach((node) => node.remove());
}