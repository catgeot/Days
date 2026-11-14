/** Removes index.html / prior head SEO tags so react-helmet-async does not leave duplicates (first tag wins for scrapers). */
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