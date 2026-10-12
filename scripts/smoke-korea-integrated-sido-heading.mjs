/**
 * Integrated sido panel list heading (option A).
 *
 *   npm run smoke:korea-integrated-sido-heading
 */
import {
  localizedFestivalCityListLabel,
  localizedSidoPanelHeadingPhrase,
  localizedSidoListPhrase,
} from '../src/i18n/koreaRegionLabels.js';
import { festivalCityListDisplayPhrase } from '../src/pages/Korea/festivalRegionTags.js';

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

if (failed) {
  console.error(`\n${failed} assertion(s) failed`);
  process.exit(1);
}
console.log('\nkorea-integrated-sido-heading SMOKE OK');
