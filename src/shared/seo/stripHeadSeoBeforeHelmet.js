/** @param {string} [path] pathname only, e.g. `/blog/e/rome-travelogue` */
export function isEditorialBlogSeoPath(path = '') {
  const normalized = !path || path === '/' ? '' : path.startsWith('/') ? path : `/${path}`;
  return /^\/blog\/e\/[^/]+/.test(normalized);
}

function isHelmetManagedNode(node) {
  return node?.getAttribute?.('data-rh') === 'true';
}

/** Drops static/index/middleware head tags only; never removes react-helmet-async nodes (data-rh="true"). */
export function stripHeadSeoBeforeHelmet(doc = typeof document !== 'undefined' ? document : null) {
  if (!doc?.head) return;

  const selectors = [
    'meta[name="description"]',
    'meta[name="keywords"]',
    'meta[property^="og:"]',
    'meta[name^="twitter:"]',
    'link[rel="canonical"]',
  ];

  for (const selector of selectors) {
    doc.head.querySelectorAll(selector).forEach((node) => {
      if (!isHelmetManagedNode(node)) node.remove();
    });
  }

  doc.head.querySelectorAll('title').forEach((node) => {
    if (!isHelmetManagedNode(node)) node.remove();
  });
}