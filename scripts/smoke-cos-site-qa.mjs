/**
 * Cos site QA follow-ups — Cairo EN dashes, festival EN title, place body SEO, layout.
 *
 *   npm run smoke:cos-site-qa
 *   COS_QA_LAYOUT_PREVIEW=1 npm run smoke:cos-site-qa  # overlap check (preview on 4174)
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { factValueForLocale } from '../src/data/placeVerifiedFacts/cairoEn.js';
import { getLocalizedPlaceDesc, getPlaceTabSeoDescription } from '../src/pages/Home/lib/placeSeoText.js';
import {
  enFestivalListTimePhrase,
  formatFestivalIndexHeadlinePlain,
  listEnFestivalTimeTabHeadlines,
} from '../src/pages/Korea/festivalIndexHeadline.js';

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

const gizaHours = factValueForLocale('giza-pyramids', { id: 'hours', value: 'ko' }, 'en');
assert(!gizaHours.includes('~'), 'Giza EN hours use en dash not tilde');
assert(gizaHours.includes('08:00–16:00'), 'Giza EN hours range');

const emHours = factValueForLocale(
  'egyptian-museum-cairo',
  { id: 'hours', value: 'ko' },
  'en',
);
assert(emHours.includes('09:00–17:00'), 'Egyptian Museum EN hours');

assert(
  enFestivalListTimePhrase('thisMonth', 'Month') === "This month's festivals",
  'EN this month phrase',
);
assert(
  enFestivalListTimePhrase('now', 'Now') === 'Festivals on now',
  'EN now phrase',
);
assert(
  enFestivalListTimePhrase('weekend', 'Weekend') === "This weekend's festivals",
  'EN weekend phrase',
);

for (const [id, phrase] of Object.entries(listEnFestivalTimeTabHeadlines())) {
  assert(
    !/\bNow festivals\b/i.test(phrase) && !/^Weekend festivals$/i.test(phrase),
    `natural EN headline for ${id}: ${phrase}`,
  );
  assert(/festivals/i.test(phrase), `headline mentions festivals: ${id}`);
}

const tEn = (key, opts = {}) => {
  if (key === 'korea.festival.headlineTasteSuffix') {
    return ` · ${opts.taste} themed`;
  }
  return opts?.defaultValue || key;
};

assert(
  formatFestivalIndexHeadlinePlain({
    locale: 'en',
    timeTab: 'thisMonth',
    place: 'Gyeonggi Province',
    time: 'Month',
    tasteSuffix: '',
    t: tEn,
  }) === "Gyeonggi Province · This month's festivals",
  'EN Gyeonggi headline',
);

assert(
  formatFestivalIndexHeadlinePlain({
    locale: 'en',
    timeTab: 'now',
    place: '',
    time: 'Now',
    tasteSuffix: '',
    t: tEn,
  }) === 'Festivals on now festival list',
  'EN nationwide now headline',
);

const adventure = { slug: 'aconcagua', name_en: 'Aconcagua', country: 'Argentina', category: 'adventure' };
assert(getLocalizedPlaceDesc(adventure, 'en') === '', 'EN body omits synthetic Discover blurb');
const meta = getPlaceTabSeoDescription(adventure, 'en', 'gallery', (k) => k);
assert(meta.includes('an adventure'), 'meta keeps article-correct synthetic blurb');
assert(meta.includes('Discover'), 'meta still has Discover lead');

const indexSrc = readFileSync(
  join(dirname(fileURLToPath(import.meta.url)), '../src/pages/Korea/index.jsx'),
  'utf8',
);
assert(indexSrc.includes('data-festival-list-meta'), 'full-width meta marker in index.jsx');

async function assertNoHeadingOverlap(page, width, lang, area) {
  await page.setViewportSize({ width, height: 844 });
  const url = `https://127.0.0.1:4174/korea/?from=theme&area=${area}&lang=${lang}&qa=${width}`;
  await page.goto(url, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(3500);
  const meta = page.locator('[data-festival-list-meta]');
  const large = page.getByRole('button', { name: /Large|크게/i }).first();
  await meta.waitFor({ state: 'visible', timeout: 60_000 });
  await large.waitFor({ state: 'visible', timeout: 15_000 });
  const a = await meta.boundingBox();
  const b = await large.boundingBox();
  if (!a || !b) {
    assert(false, `bbox missing ${width}px ${lang} area=${area}`);
    return;
  }
  const overlap =
    a.x < b.x + b.width &&
    a.x + a.width > b.x &&
    a.y < b.y + b.height &&
    a.y + a.height > b.y;
  assert(!overlap, `no meta/Large overlap ${width}px ${lang} area=${area}`);
}

if (process.env.COS_QA_LAYOUT_PREVIEW === '1') {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
  const { chromium } = await import('playwright');
  const browser = await chromium.launch();
  const context = await browser.newContext({ ignoreHTTPSErrors: true });
  const page = await context.newPage();
  for (const width of [360, 390]) {
    await assertNoHeadingOverlap(page, width, 'en', '31');
    await assertNoHeadingOverlap(page, width, 'ko', '31');
  }
  await browser.close();
}

if (failed) {
  console.error(`\n${failed} assertion(s) failed`);
  process.exit(1);
}
console.log('\ncos-site-qa SMOKE OK');
