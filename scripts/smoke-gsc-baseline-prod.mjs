#!/usr/bin/env node
/**
 * GSC baseline — PROD crawler meta live smoke (Googlebot UA).
 *
 *   npm run smoke:gsc-baseline-prod
 *
 * @see scripts/data/gsc-seo-baseline-template.csv
 */
const ORIGIN = 'https://www.gateo.kr';
const GOOGLEBOT_UA =
  'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)';
const TIMEOUT_MS = 20_000;

const SAMPLES = [
  {
    path: '/place/tokyo/gallery?crawler=1',
    notes: 'tier1',
    expectHeader: 'tier1-place',
    titlePattern: /도쿄|Tokyo/i,
  },
  {
    path: '/place/phuket/gallery?crawler=1',
    notes: 'tier2-crawler',
    expectHeader: 'tier1-place',
    titlePattern: /푸켓|Phuket/i,
  },
  {
    path: '/place/hamburg/gallery?crawler=1',
    notes: 'tier2-batch3',
    expectHeader: 'tier1-place',
    titlePattern: /함부르크|Hamburg/i,
  },
  {
    path: '/place/bohol/gallery?crawler=1',
    notes: 'tier2-batch4',
    expectHeader: 'tier1-place',
    titlePattern: /보홀|Bohol/i,
  },
  {
    path: '/place/bohol/wiki?crawler=1',
    notes: 'wiki-crawler',
    expectHeader: 'tier1-place',
    titlePattern: /보홀|Bohol/i,
  },
  {
    path: '/korea/theme/scenic?crawler=1',
    notes: 'hub-scenic',
    expectHeader: 'scenic',
    titlePattern: /명승|Scenic/i,
  },
  {
    path: '/explore/asia/paradise?crawler=1',
    notes: 'explore-category',
    expectHeader: 'explore-category',
    titlePattern: /아시아|Asia/i,
  },
  {
    path: '/blog/curation?crawler=1',
    notes: 'curation',
    expectHeader: 'curation',
    titlePattern: /큐레이션|curation/i,
  },
  {
    path: '/place/tokyo/planner?crawler=1',
    notes: 'flight-route',
    expectHeader: 'tier1-place',
    titlePattern: /도쿄|Tokyo/i,
    descPattern: /ICN.*HND/i,
  },
  {
    path: '/place/seoul/gallery?lang=en',
    notes: 'tier2-pop70-en-batch4',
    expectHeader: 'tier1-place',
    titlePattern: /Seoul travel photos/i,
  },
];

let failed = 0;
function assert(cond, msg) {
  if (!cond) {
    failed += 1;
    console.error(`FAIL  ${msg}`);
    return false;
  }
  console.log(`OK    ${msg}`);
  return true;
}

async function fetchProd(path) {
  const url = `${ORIGIN}${path}`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      headers: { 'user-agent': GOOGLEBOT_UA },
      redirect: 'follow',
      signal: controller.signal,
    });
    const html = await res.text();
    return { url, res, html };
  } finally {
    clearTimeout(timer);
  }
}

function extractTitle(html) {
  const m = html.match(/<title>([^<]*)<\/title>/i);
  return m?.[1] ?? '';
}

function extractDescription(html) {
  const m = html.match(/<meta\s+name="description"\s+content="([^"]*)"/i);
  return m?.[1] ?? '';
}

for (const sample of SAMPLES) {
  const { url, res, html } = await fetchProd(sample.path);
  const title = extractTitle(html);
  const description = extractDescription(html);
  const crawlerHeader = res.headers.get('x-crawler-meta') ?? '';

  assert(res.status === 200, `${sample.notes} HTTP 200 (${url})`);
  assert(
    crawlerHeader === sample.expectHeader,
    `${sample.notes} x-crawler-meta=${crawlerHeader || '(none)'}`,
  );
  assert(
    sample.titlePattern.test(title),
    `${sample.notes} title "${title.slice(0, 60)}"`,
  );
  if (sample.descPattern) {
    assert(
      sample.descPattern.test(description),
      `${sample.notes} description includes flight route`,
    );
  }
}

if (failed > 0) {
  console.error(`\n${failed} check(s) failed`);
  process.exit(1);
}

console.log(`\nsmoke:gsc-baseline-prod PASS (${SAMPLES.length} PROD URLs)`);
