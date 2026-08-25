import { isCrawlerRequest } from './src/edge/botDetect.js';
import { injectCrawlerMetaIntoHtml } from './src/edge/injectCrawlerMeta.js';
import { parseCrawlerPlacePath, resolveCrawlerPlaceMeta } from './src/edge/resolveCrawlerPlaceMeta.js';

export const config = {
  matcher: ['/place/:slug/gallery', '/place/:slug/planner'],
};

export default async function middleware(request) {
  if (!isCrawlerRequest(request)) {
    return;
  }

  const url = new URL(request.url);
  const parsed = parseCrawlerPlacePath(url.pathname);
  if (!parsed) {
    return;
  }

  const locale = url.searchParams.get('lang') === 'en' ? 'en' : 'ko';
  const meta = resolveCrawlerPlaceMeta(url.pathname, locale);
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

  return new Response(html, {
    status: 200,
    headers: {
      'content-type': 'text/html; charset=utf-8',
      'cache-control': 'public, max-age=0, must-revalidate',
      'x-crawler-meta': 'tier1-place',
    },
  });
}
