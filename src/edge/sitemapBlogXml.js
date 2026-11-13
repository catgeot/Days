const SITE_ORIGIN = 'https://www.gateo.kr';

function formatLastmod(publishedAt, fallback) {
  if (publishedAt) {
    const day = String(publishedAt).split('T')[0];
    if (/^\d{4}-\d{2}-\d{2}$/.test(day)) return day;
  }
  return fallback;
}

/**
 * @param {Array<{ slug: string, published_at?: string }>} rows
 * @param {{ fallbackLastmod?: string }} [options]
 */
export function buildSitemapBlogXml(rows, options = {}) {
  const fallback = options.fallbackLastmod || new Date().toISOString().split('T')[0];
  const urls = (rows || [])
    .map((row) => {
      const slug = String(row?.slug || '').trim();
      if (!slug) return '';
      const lastmod = formatLastmod(row.published_at, fallback);
      return `  <url>
    <loc>${SITE_ORIGIN}/blog/e/${slug}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.75</priority>
  </url>`;
    })
    .filter(Boolean)
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`;
}

export function buildSitemapIndexXml({ coreLastmod, blogLastmod } = {}) {
  const today = new Date().toISOString().split('T')[0];
  const coreMod = coreLastmod || today;
  const blogMod = blogLastmod || today;
  return `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap>
    <loc>${SITE_ORIGIN}/sitemap-core.xml</loc>
    <lastmod>${coreMod}</lastmod>
  </sitemap>
  <sitemap>
    <loc>${SITE_ORIGIN}/sitemap-blog.xml</loc>
    <lastmod>${blogMod}</lastmod>
  </sitemap>
</sitemapindex>`;
}
