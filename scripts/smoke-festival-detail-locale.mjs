#!/usr/bin/env node
/**
 * 축제·명승 TourAPI 본문 — KorService2 SSOT (EngService2 본문 롤백).
 * 축제 titleEn join · 지도 핀·상세 헤더 EN (#41).
 *
 *   npm run smoke:festival-detail-locale
 */
import { readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

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

const festivalsJs = readFileSync(
  join(root, 'src/utils/fetchTourApiFestivals.js'),
  'utf8',
);
assert(
  festivalsJs.includes('TOUR_API_BODY_LOCALE') &&
    !festivalsJs.includes('fetchTourApiFestivalDetailLocalized') &&
    !festivalsJs.includes('mergeTourApiFestivalDetail'),
  'festival detail uses TOUR_API_BODY_LOCALE only',
);
assert(
  festivalsJs.includes('locale: opts.locale ?? TOUR_API_BODY_LOCALE'),
  'festivalWindow accepts optional locale (default ko)',
);
assert(
  festivalsJs.includes("locale: TOUR_API_BODY_LOCALE"),
  'festivalDetail pin ko locale',
);

const windowJs = readFileSync(
  join(root, 'src/pages/Korea/fetchKoreaFestivalsWindow.js'),
  'utf8',
);
assert(windowJs.includes('rolling12:ko'), 'sessionStorage cache key includes ko');
assert(
  windowJs.includes('mergeFestivalTitleEn') &&
    windowJs.includes("locale: 'en'"),
  'fetchKoreaFestivalsWindow merges titleEn via en festivalWindow',
);
assert(
  windowJs.includes('wantTitleEn') &&
    windowJs.includes('itemsNeedTitleEn'),
  'fetchKoreaFestivalsWindow lazy-en merge on cache hit only when locale=en',
);

const spotCardJs = readFileSync(
  join(root, 'src/pages/Home/components/SearchDiscovery/SpotThumbnailCard.jsx'),
  'utf8',
);
assert(
  spotCardJs.includes('({ spot, categoryStyle, icon, displayName })') &&
    spotCardJs.includes('displayName={displayName}'),
  'SpotThumbnailCard passes displayName prop (no ReferenceError on lazy load)',
);

const mergeJs = readFileSync(
  join(root, 'src/pages/Korea/festivalTitleEnMerge.js'),
  'utf8',
);
assert(
  mergeJs.includes('parseEngFestivalTitle') &&
    mergeJs.includes('byKoTitle'),
  'titleEn merge uses parenthetical ko hint matching',
);

const mapJs = readFileSync(
  join(root, 'src/pages/Korea/KoreaFestivalMap.jsx'),
  'utf8',
);
assert(
  mapJs.includes('festivalMapTitle(item, locale)'),
  'KoreaFestivalMap pins use festivalMapTitle',
);
assert(
  mapJs.includes('buildGeoJson(items, locale)'),
  'KoreaFestivalMap GeoJSON passes locale',
);

const sheetJs = readFileSync(
  join(root, 'src/pages/Korea/FestivalDetailSheet.jsx'),
  'utf8',
);
assert(
  sheetJs.includes('fetchTourApiFestivalDetail') &&
    !sheetJs.includes('fetchTourApiFestivalDetailLocalized'),
  'FestivalDetailSheet uses ko-only festivalDetail',
);
assert(
  sheetJs.includes('festivalMapTitle(item, locale)'),
  'FestivalDetailSheet header uses festivalMapTitle',
);
assert(
  sheetJs.includes('localizedScenicMajorRegion(locale, scenicRegion)'),
  'FestivalDetailSheet cross links localize scenic region',
);
assert(
  sheetJs.includes('localizedPackageCtaLabel'),
  'FestivalDetailSheet package CTA uses localizedPackageCtaLabel',
);

const { festivalMapTitle } = await import(
  '../src/pages/Home/lib/scenicSpotPlaceLabel.js'
);
const {
  mergeFestivalTitleEn,
  parseEngFestivalTitle,
} = await import('../src/pages/Korea/festivalTitleEnMerge.js');

const sample = {
  title: '2026 부산 불꽃축제',
  titleEn: '2026 Busan Fireworks Festival',
  contentId: '123',
};
assert(
  festivalMapTitle(sample, 'en') === sample.titleEn,
  'festivalMapTitle prefers titleEn for en locale',
);
assert(
  festivalMapTitle(sample, 'ko') === sample.title,
  'festivalMapTitle uses ko title for ko locale',
);

const parsed = parseEngFestivalTitle('Garden Night Market (가든 나이트 마켓)');
assert(
  parsed.en === 'Garden Night Market' && parsed.koHint === '가든 나이트 마켓',
  'parseEngFestivalTitle splits English (Korean)',
);

const merged = mergeFestivalTitleEn(
  [{ contentId: '1', title: '가든 나이트 마켓', eventStartDate: '20260401' }],
  [
    {
      contentId: '999',
      title: 'Garden Night Market (가든 나이트 마켓)',
      eventStartDate: '20260401',
    },
  ],
);
assert(
  merged[0]?.titleEn === 'Garden Night Market',
  'mergeFestivalTitleEn matches ko title via parenthetical hint',
);

if (failed) {
  console.error(`\n${failed} check(s) failed`);
  process.exit(1);
}
console.log('\nAll festival TourAPI body ko SSOT + titleEn join checks passed');
