import { isCrawlerRequest } from './src/edge/botDetect.js';
import { injectCrawlerMetaIntoHtml } from './src/edge/injectCrawlerMeta.js';
import { fetchPublishedEditorialIndex } from './src/edge/editorialSupabase.js';
import { resolveEditorialCrawlerMetaLive } from './src/edge/resolveEditorialCrawlerMetaLive.js';
import { buildSitemapBlogXml } from './src/edge/sitemapBlogXml.js';
import { getCrawlerMetaKind, parseCrawlerPath, resolveCrawlerMeta } from './src/edge/resolveCrawlerMeta.js';

const SITEMAP_BLOG_CACHE = 'public, s-maxage=300, stale-while-revalidate=600';
const CRAWLER_LIVE_CACHE = 'public, s-maxage=300, stale-while-revalidate=600, max-age=0';

export const config = {
  matcher: [
    '/sitemap-blog.xml',
    '/',
    '/korea',
    '/korea/theme/scenic',
    '/explore',
    '/explore/:continent/:category',
    '/blog',
    '/blog/curation',
    '/blog/e/:editorialSlug',
    '/world-events',
    '/place/:slug',
    '/place/:slug/gallery',
    '/place/:slug/planner',
    '/place/:slug/wiki',
  ],
};

async function serveSitemapBlog() {
  const rows = await fetchPublishedEditorialIndex();
  const body = buildSitemapBlogXml(rows);
  return new Response(body, {
    status: 200,
    headers: {
      'content-type': 'application/xml; charset=utf-8',
      'cache-control': SITEMAP_BLOG_CACHE,
      'x-sitemap-blog': 'live',
    },
  });
}

export default async function middleware(request) {
  const url = new URL(request.url);

  if (url.pathname === '/sitemap-blog.xml') {
    try {
      return await serveSitemapBlog();
    } catch {
      return new Response(buildSitemapBlogXml([]), {
        status: 200,
        headers: {
          'content-type': 'application/xml; charset=utf-8',
          'cache-control': 'public, max-age=60',
          'x-sitemap-blog': 'fallback-empty',
        },
      });
    }
  }

  if (!isCrawlerRequest(request)) {
    return;
  }

  const parsed = parseCrawlerPath(url.pathname);
  if (!parsed) {
    return;
  }

  const locale = url.searchParams.get('lang') === 'en' ? 'en' : 'ko';
  let meta = resolveCrawlerMeta(url.pathname, locale);
  let metaSource = meta ? 'bundle' : null;

  if (!meta && parsed.kind === 'editorial-logbook') {
    meta = await resolveEditorialCrawlerMetaLive(parsed.slug, locale);
    metaSource = meta ? 'live' : null;
  }

  if (!meta) {
    return;
  }

  const indexUrl = new URL('/index.html', request.url);
  const indexRes = await fetch(indexUrl.toString(), {
    headers: { 'x-middleware-subrequest': '1' },
  });

  if (!indexRes.ok) {
    return;
  }

  const html = injectCrawlerMetaIntoHtml(await indexRes.text(), meta);
  const kind = getCrawlerMetaKind(url.pathname) || 'tier1-place';

  return new Response(html, {
    status: 200,
    headers: {
      'content-type': 'text/html; charset=utf-8',
      'cache-control': metaSource === 'live' ? CRAWLER_LIVE_CACHE : 'public, max-age=0, must-revalidate',
      'x-crawler-meta': kind,
      ...(metaSource === 'live' ? { 'x-crawler-meta-source': 'live' } : {}),
    },
  });
}
