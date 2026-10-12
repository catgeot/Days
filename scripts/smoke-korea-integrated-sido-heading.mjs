/**
 * Integrated sido panel list heading (option A).
 *
 *   npm run smoke:korea-integrated-sido-heading
 */
import {
  localizedFestivalCityListLabel,
  localizedSidoPanelHeadingPhrase,
  localizedSidoListPhrase,
  localizedSubregionLabel,
} from '../src/i18n/koreaRegionLabels.js';
import { festivalCityListDisplayPhrase } from '../src/pages/Korea/festivalRegionTags.js';
import {
  buildFestivalPanelListMetaSegments,
  formatFestivalPanelListMetaPlain,
} from '../src/pages/Korea/festivalPanelListMeta.js';

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

assert(
  localizedSidoPanelHeadingPhrase('ko', '5', '광주광역시') ===
    '광주(전남광주통합특별시)',
  'KO 광주 panel heading',
);
assert(
  localizedSidoPanelHeadingPhrase('ko', '38', '전라남도') ===
    '전남(전남광주통합특별시)',
  'KO 전남 panel heading',
);
assert(
  localizedSidoPanelHeadingPhrase('en', '5') ===
    'Gwangju (Jeonnam-Gwangju Special City)',
  'EN Gwangju panel heading',
);
assert(
  localizedSidoPanelHeadingPhrase('en', '38') ===
    'Jeonnam (Jeonnam-Gwangju Special City)',
  'EN Jeonnam panel heading',
);
assert(
  localizedSidoPanelHeadingPhrase('ko', '31', '경기도') === '경기도',
  'non-integrated KO unchanged',
);
assert(
  localizedSidoPanelHeadingPhrase('en', '31', '경기도') ===
    localizedSidoListPhrase('en', '31', '경기도'),
  'non-integrated EN unchanged',
);

assert(
  festivalCityListDisplayPhrase('광주시', '31') === '광주시',
  '경기 광주시 display phrase keeps 시',
);
assert(
  festivalCityListDisplayPhrase('광주시', '5') === '광주',
  'metro filter still strips 광주시 chip label',
);
assert(
  localizedFestivalCityListLabel('ko', '31', '광주시') === '광주시',
  'KO 경기 광주시 list label',
);
assert(
  localizedFestivalCityListLabel('en', '31', '광주시') === 'Gwangju-si',
  'EN Gyeonggi Gwangju-si list label',
);
assert(
  localizedSubregionLabel('en', '광주시') === 'Gwangju-si',
  'EN subregion chip/group 광주시 → Gwangju-si',
);

const tKo = (key, opts = {}) => {
  if (key === 'korea.common.countUnit') return `${opts.count}건`;
  if (key === 'korea.festival.panelBySubregion') return `${opts.unit}별`;
  if (key === 'korea.common.regionGroup') return '지역별';
  if (key === 'korea.region.unit.cityCounty') return '시·군';
  if (key === 'korea.region.unit.district') return '구';
  return key;
};
const tEn = (key, opts = {}) => {
  if (key === 'korea.common.countUnit') return String(opts.count);
  if (key === 'korea.festival.panelBySubregion') return `By ${opts.unit}`;
  if (key === 'korea.common.regionGroup') return 'By region';
  if (key === 'korea.region.unit.cityCounty') return 'City/county';
  if (key === 'korea.region.unit.district') return 'District';
  return opts?.defaultValue || key;
};

const jeonnamSegs = buildFestivalPanelListMetaSegments({
  areaCode: '38',
  cityName: 'all',
  count: 13,
  t: tKo,
  locale: 'ko',
});
assert(jeonnamSegs.length === 3, '전남 meta 3 segments');
assert(
  jeonnamSegs[2].text === '시·군별' && jeonnamSegs[2].nowrap === true,
  '전남 grouping segment intact',
);
assert(
  !formatFestivalPanelListMetaPlain(jeonnamSegs).includes('시·\n'),
  '전남 plain meta no broken 시·',
);

const gyeonggiCitySegs = buildFestivalPanelListMetaSegments({
  areaCode: '31',
  cityName: '광주시',
  count: 1,
  t: tKo,
  locale: 'ko',
});
assert(gyeonggiCitySegs.some((s) => s.text === '광주시'), '경기 광주시 city segment');

const enJeonnamSegs = buildFestivalPanelListMetaSegments({
  areaCode: '38',
  cityName: 'all',
  count: 13,
  t: tEn,
  locale: 'en',
});
assert(
  enJeonnamSegs[2].text === 'By City/county',
  'EN grouping single segment',
);

if (failed) {
  console.error(`\n${failed} assertion(s) failed`);
  process.exit(1);
}
console.log('\nkorea-integrated-sido-heading SMOKE OK');
