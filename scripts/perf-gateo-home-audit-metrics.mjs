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
  let runs = 3;
  for (let i = 0; i < args.length; i += 1) {
    if (args[i] === '--base' && args[i + 1]) {
      base = args[i + 1].replace(/\/$/, '');
      i += 1;
    } else if (args[i] === '--label' && args[i + 1]) {
      label = args[i + 1];
      i += 1;
    } else if (args[i] === '--runs' && args[i + 1]) {
      runs = Math.max(1, Number(args[i + 1]) || 3);
      i += 1;
    }
  }
  return { base, label, runs };
}

function median(nums) {
  const arr = nums.filter((n) => Number.isFinite(n)).sort((a, b) => a - b);
  if (!arr.length) return null;
  const mid = Math.floor(arr.length / 2);
  return arr.length % 2 ? arr[mid] : (arr[mid - 1] + arr[mid]) / 2;
}

function summarizeEdgePosts(edgePosts) {
  const counts = new Map();
  for (const p of edgePosts) {
    const key = edgeKey(p.url, p.postData);
    counts.set(key, (counts.get(key) || 0) + 1);
  }
  const duplicates = [...counts.entries()]
    .filter(([, c]) => c > 1)
    .map(([key, count]) => ({ key, count }))
    .sort((a, b) => b.count - a.count);
  return {
    total: edgePosts.length,
    unique: counts.size,
    duplicates,
  };
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
  const resourceBytes = new Map();

  const cdp = await context.newCDPSession(page);
  await cdp.send('Network.enable');
  const requestUrls = new Map();
  cdp.on('Network.requestWillBeSent', (event) => {
    if (event.requestId && event.request?.url) {
      requestUrls.set(event.requestId, event.request.url);
    }
  });
  cdp.on('Network.loadingFinished', (event) => {
    if (Number.isFinite(event.encodedDataLength)) {
      transferBytes += event.encodedDataLength;
      const u = requestUrls.get(event.requestId) || '';
      if (u) resourceBytes.set(u, (resourceBytes.get(u) || 0) + event.encodedDataLength);
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

  const globeChunkLoaded = await page.evaluate(() => {
    return performance
      .getEntriesByType('resource')
      .some((e) => /globe-[^/]+\.js/i.test(e.name));
  });

  const topResources = [...resourceBytes.entries()]
    .map(([name, bytes]) => ({ url: name, transferBytes: bytes }))
    .sort((a, b) => b.transferBytes - a.transferBytes)
    .slice(0, 10);

  page.off('request', onRequest);
  await cdp.detach().catch(() => {});

  const edgeSummary = summarizeEdgePosts(edgePosts);

  return {
    url,
    transferBytes,
    lcpMs: lcp != null ? Math.round(lcp) : null,
    edgePostTotal: edgeSummary.total,
    edgePostUnique: edgeSummary.unique,
    edgeDuplicates: edgeSummary.duplicates,
    brokenImages,
    affiliateHrefs,
    threeChunkLoaded,
    globeChunkLoaded,
    topResources,
  };
}

function medianPageMetrics(runs) {
  const keys = [
    'transferBytes',
    'lcpMs',
    'edgePostTotal',
    'edgePostUnique',
    'brokenImages',
  ];
  const out = {};
  for (const k of keys) {
    out[k] = median(runs.map((r) => r[k]));
  }
  out.threeChunkLoaded = runs.some((r) => r.threeChunkLoaded);
  out.globeChunkLoaded = runs.some((r) => r.globeChunkLoaded);
  const affiliate = runs[runs.length - 1]?.affiliateHrefs ?? [];
  out.affiliateHrefs = affiliate;
  const topPick =
    runs.find((r) => r.topResources?.length)?.topResources ?? [];
  out.topResources = topPick;
  const dupMap = new Map();
  for (const run of runs) {
    for (const d of run.edgeDuplicates || []) {
      dupMap.set(d.key, Math.max(dupMap.get(d.key) || 0, d.count));
    }
  }
  out.edgeDuplicates = [...dupMap.entries()]
    .map(([key, count]) => ({ key, count }))
    .filter((d) => d.count > 1)
    .sort((a, b) => b.count - a.count);
  return out;
}

async function main() {
  const { base, label, runs: runCount } = parseArgs();
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
  const rawRuns = {};
  for (const spec of pages) {
    rawRuns[spec.key] = [];
    for (let i = 0; i < runCount; i += 1) {
      const page = await context.newPage();
      const fullUrl = `${base}${spec.path}`;
      const row = await measurePage(page, context, fullUrl, {
        waitForDetail: spec.waitForDetail,
      });
      rawRuns[spec.key].push(row);
      await page.close();
    }
    results[spec.key] = medianPageMetrics(rawRuns[spec.key]);
  }

  await browser.close();

  const outDir = path.join('/opt/cursor/artifacts', 'perf-gateo-home-audit');
  await mkdir(outDir, { recursive: true });
  const outPath = path.join(outDir, `metrics-${label}.json`);
  const payload = {
    label,
    base,
    runCount,
    measuredAt: new Date().toISOString(),
    note:
      'Non-GET supabase rest/v1 aborted. Edge POSTs counted at request time (not aborted). Medians over runCount.',
    results,
    rawRuns,
  };
  await writeFile(outPath, `${JSON.stringify(payload, null, 2)}\n`);
  console.log(JSON.stringify(payload, null, 2));
  console.log(`Wrote ${outPath}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
