/**
 * Integrated sido panel list heading (option A).
 *
 *   npm run smoke:korea-integrated-sido-heading
 */
import { localizedSidoPanelHeadingPhrase } from '../src/i18n/koreaRegionLabels.js';
import { localizedSidoListPhrase } from '../src/i18n/koreaRegionLabels.js';

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

if (failed) {
  console.error(`\n${failed} assertion(s) failed`);
  process.exit(1);
}
console.log('\nkorea-integrated-sido-heading SMOKE OK');
