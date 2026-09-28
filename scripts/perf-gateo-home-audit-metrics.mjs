/**
 * Playwright metrics for gateo home audit (§1 sample URLs).
 * Usage: node scripts/perf-gateo-home-audit-metrics.mjs --base https://www.gateo.kr --label before
 */
import { chromium } from '@playwright/test';
import { mkdir, writeFile } from 'fs/promises';
import path from 'path';

const DEFAULT_BASE = 'https://www.gateo.kr';

function parseArgs() {
  const args = process.argv.slice(2);
  let base = DEFAULT_BASE;
  let label = 'run';
  for (let i = 0; i < args.length; i += 1) {
    if (args[i] === '--base' && args[i + 1]) {
      base = args[i + 1].replace(/\/$/, '');
      i += 1;
    } else if (args[i] === '--label' && args[i + 1]) {
      label = args[i + 1];
      i += 1;
    }
  }
  return { base, label };
}

function stableSerialize(value) {
  if (value === null || typeof value !== 'object') {
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) {
    return `[${value.map((item) => stableSerialize(item)).join(',')}]`;
  }
  const keys = Object.keys(value).sort();
  return `{${keys
    .map((key) => `${JSON.stringify(key)}:${stableSerialize(value[key])}`)
    .join(',')}}`;
}

function edgeKey(url, postData) {
  try {
    const pathname = new URL(url).pathname;
    const fn = pathname.split('/').filter(Boolean).pop() || pathname;
    let body = {};
    if (postData) {
      try {
        body = JSON.parse(postData);
      } catch {
        body = { raw: postData };
      }
    }
    return `${fn}|${stableSerialize(body)}`;
  } catch {
    return url;
  }
}

const AFFILIATE_HOST_RE =
  /myrealtrip\.com|klook\.com|trip\.com|naver\.com|google\.com\/maps|maps\.app\.goo\.gl/i;

async function measurePage(page, context, url, { waitForDetail = false } = {}) {
  const edgePosts = [];
  let transferBytes = 0;

  const cdp = await context.newCDPSession(page);
  await cdp.send('Network.enable');
  cdp.on('Network.loadingFinished', (event) => {
    if (Number.isFinite(event.encodedDataLength)) {
      transferBytes += event.encodedDataLength;
    }
  });

  const onRequest = (request) => {
    const u = request.url();
    if (request.method() === 'POST' && u.includes('/functions/v1/')) {
      edgePosts.push({
        url: u,
        postData: request.postData() || '',
      });
    }
  };

  page.on('request', onRequest);

  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 120_000 });

  if (waitForDetail) {
    await page.waitForTimeout(3000);
  }

  await page.waitForTimeout(8000);

  const lcp = await page.evaluate(() => {
    return new Promise((resolve) => {
      let done = false;
      const finish = (value) => {
        if (done) return;
        done = true;
        resolve(value);
      };
      try {
        new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const last = entries[entries.length - 1];
          if (last) finish(last.startTime);
        }).observe({ type: 'largest-contentful-paint', buffered: true });
      } catch {
        finish(null);
      }
      setTimeout(() => finish(null), 500);
    });
  });

  const brokenImages = await page.evaluate(() => {
    const imgs = [...document.querySelectorAll('img')];
    return imgs.filter((img) => {
      const src = (img.currentSrc || img.src || '').trim();
      if (!src || src.startsWith('data:')) return false;
      return img.complete && img.naturalWidth === 0;
    }).length;
  });

  const affiliateHrefs = await page.evaluate(() => {
    const hosts =
      /myrealtrip\.com|klook\.com|trip\.com|naver\.com|google\.com|maps\.app\.goo\.gl/i;
    return [...document.querySelectorAll('a[href]')]
      .map((a) => a.getAttribute('href') || '')
      .filter((href) => hosts.test(href))
      .sort();
  });

  const threeChunkLoaded = await page.evaluate(() => {
    return performance
      .getEntriesByType('resource')
      .some((e) => /three-[^/]+\.js/i.test(e.name));
  });

  page.off('request', onRequest);
  await cdp.detach().catch(() => {});

  const uniqueEdge = new Set(edgePosts.map((p) => edgeKey(p.url, p.postData)));

  return {
    url,
    transferBytes,
    lcpMs: lcp != null ? Math.round(lcp) : null,
    edgePostTotal: edgePosts.length,
    edgePostUnique: uniqueEdge.size,
    brokenImages,
    affiliateHrefs,
    threeChunkLoaded,
  };
}

async function main() {
  const { base, label } = parseArgs();
  const pages = [
    { key: 'festival-home', path: '/korea/' },
    { key: 'scenic-home', path: '/korea/theme/scenic' },
    {
      key: 'scenic-detail-gyeongbokgung',
      path: '/korea/theme/scenic?spot=gyeongbokgung',
      waitForDetail: true,
    },
    {
      key: 'festival-detail-613316',
      path: '/korea/?festival=613316',
      waitForDetail: true,
    },
  ];

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    ignoreHTTPSErrors: true,
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 3,
    locale: 'ko-KR',
    userAgent:
      'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
  });

  await context.route('**/*', async (route) => {
    const req = route.request();
    const url = req.url();
    const method = req.method();
    if (
      method !== 'GET' &&
      url.includes('.supabase.co') &&
      url.includes('/rest/v1/')
    ) {
      await route.abort();
      return;
    }
    await route.continue();
  });

  const results = {};
  for (const spec of pages) {
    const page = await context.newPage();
    const fullUrl = `${base}${spec.path}`;
    results[spec.key] = await measurePage(page, context, fullUrl, {
      waitForDetail: spec.waitForDetail,
    });
    await page.close();
  }

  await browser.close();

  const outDir = path.join('/opt/cursor/artifacts', 'perf-gateo-home-audit');
  await mkdir(outDir, { recursive: true });
  const outPath = path.join(outDir, `metrics-${label}.json`);
  const payload = {
    label,
    base,
    measuredAt: new Date().toISOString(),
    note:
      'Non-GET supabase rest/v1 aborted. Edge POSTs counted at request time (not aborted).',
    results,
  };
  await writeFile(outPath, `${JSON.stringify(payload, null, 2)}\n`);
  console.log(JSON.stringify(payload, null, 2));
  console.log(`Wrote ${outPath}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
