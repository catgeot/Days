import { isCrawlerRequest } from './src/edge/botDetect.js';
import { injectCrawlerMetaIntoHtml } from './src/edge/injectCrawlerMeta.js';
import {
  buildCrawlerSoft404Meta,
  getCrawlerMetaKind,
  isCrawlerSoft404Path,
  parseCrawlerPath,
  resolveCrawlerMeta,
} from './src/edge/resolveCrawlerMeta.js';

export const config = {
  matcher: [
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

export default async function middleware(request) {
  if (!isCrawlerRequest(request)) {
    return;
  }

  const url = new URL(request.url);
  const parsed = parseCrawlerPath(url.pathname);
  if (!parsed) {
    return;
  }

  const locale = url.searchParams.get('lang') === 'en' ? 'en' : 'ko';
  let meta = resolveCrawlerMeta(url.pathname, locale);
  const soft404 = !meta && isCrawlerSoft404Path(url.pathname);
  if (soft404) {
    meta = buildCrawlerSoft404Meta(url.pathname, locale);
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
  const kind = soft404 ? 'soft-404' : getCrawlerMetaKind(url.pathname) || 'tier1-place';

  return new Response(html, {
    status: soft404 ? 404 : 200,
    headers: {
      'content-type': 'text/html; charset=utf-8',
      'cache-control': 'public, max-age=0, must-revalidate',
      'x-crawler-meta': kind,
    },
  });
}
