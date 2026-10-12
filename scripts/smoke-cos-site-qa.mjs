/**
 * Cos site QA follow-ups — Cairo EN dashes, festival EN title, place body SEO.
 *
 *   npm run smoke:cos-site-qa
 */
import { factValueForLocale } from '../src/data/placeVerifiedFacts/cairoEn.js';
import { getLocalizedPlaceDesc, getPlaceTabSeoDescription } from '../src/pages/Home/lib/placeSeoText.js';
import {
  enFestivalListTimePhrase,
  formatFestivalIndexHeadlinePlain,
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

const adventure = { slug: 'aconcagua', name_en: 'Aconcagua', country: 'Argentina', category: 'adventure' };
assert(getLocalizedPlaceDesc(adventure, 'en') === '', 'EN body omits synthetic Discover blurb');
const meta = getPlaceTabSeoDescription(adventure, 'en', 'gallery', (k) => k);
assert(meta.includes('an adventure'), 'meta keeps article-correct synthetic blurb');
assert(meta.includes('Discover'), 'meta still has Discover lead');

if (failed) {
  console.error(`\n${failed} assertion(s) failed`);
  process.exit(1);
}
console.log('\ncos-site-qa SMOKE OK');
