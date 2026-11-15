/** @param {string} [path] pathname only, e.g. `/blog/e/rome-travelogue` */
export function isEditorialBlogSeoPath(path = '') {
  const normalized = !path || path === '/' ? '' : path.startsWith('/') ? path : `/${path}`;
  return /^\/blog\/e\/[^/]+/.test(normalized);
}

function isHelmetManagedNode(node) {
  return node?.getAttribute?.('data-rh') === 'true';
}

/**
 * Drops static/index/middleware head tags only. Skips data-rh="true".
 * React 19 hoists <title>/<meta>/<link> without data-rh — call this before those nodes exist
 * (app boot, or a layout effect while <SEO> is unmounted). A render-time call races removeChild.
 */
export function stripHeadSeoBeforeHelmet(doc = typeof document !== 'undefined' ? document : null) {
  if (!doc?.head) return;

  const selectors = [
    'meta[name="description"]',
    'meta[name="keywords"]',
    'meta[property^="og:"]',
    'meta[name^="twitter:"]',
    'link[rel="canonical"]',
  ];

  const safeRemove = (node) => {
    if (!node || isHelmetManagedNode(node)) return;
    try {
      if (node.parentNode) node.parentNode.removeChild(node);
      else if (typeof node.remove === 'function') node.remove();
    } catch {
      /* concurrent Helmet update */
    }
  };

  for (const selector of selectors) {
    doc.head.querySelectorAll(selector).forEach(safeRemove);
  }

  doc.head.querySelectorAll('title').forEach(safeRemove);
}