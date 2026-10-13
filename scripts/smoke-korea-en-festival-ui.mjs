/**
 * EN festival list UI — subregion romanization + index headline plain text.
 *
 *   npm run smoke:korea-en-festival-ui
 */
import {
  localizeFestivalGroupLabel,
  localizedSubregionLabel,
} from '../src/i18n/koreaRegionLabels.js';
import { romanizeKoreanAdminSubregion } from '../src/i18n/koreaSubregionRomanize.js';
import { formatFestivalIndexHeadlinePlain } from '../src/pages/Korea/festivalIndexHeadline.js';

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

function assertNoHangul(en, ctx) {
  return assert(!/[가-힣]/u.test(en), `${ctx} has no Hangul: ${en}`);
}

assert(localizedSubregionLabel('en', '북구') === 'Buk-gu', 'EN 북구 → Buk-gu');
assert(localizedSubregionLabel('en', '서구') === 'Seo-gu', 'EN 서구 → Seo-gu');
assert(localizedSubregionLabel('en', '동구') === 'Dong-gu', 'EN 동구 → Dong-gu');
assert(localizedSubregionLabel('en', '남구') === 'Nam-gu', 'EN 남구 → Nam-gu');
assert(
  localizedSubregionLabel('en', '광주시') === 'Gwangju-si',
  'EN 경기 광주시',
);
assert(
  romanizeKoreanAdminSubregion('수원시') === 'Suwon-si',
  'RR 수원시',
);
assert(
  romanizeKoreanAdminSubregion('고양시') === 'Goyang-si',
  'RR 고양시',
);

assertNoHangul(localizedSubregionLabel('en', '북구'), 'chip label');
assertNoHangul(
  localizeFestivalGroupLabel('en', { id: '서구', label: '서구' }),
  'group header',
);

const tEn = (key, opts = {}) => {
  if (key === 'korea.festival.headlineTasteSuffix') {
    return ` · ${opts.taste} themed`;
  }
  return opts?.defaultValue || key;
};

const jeonnamTitle = formatFestivalIndexHeadlinePlain({
  locale: 'en',
  timeTab: 'thisMonth',
  place: 'South Jeolla',
  time: 'This Month',
  tasteSuffix: '',
  t: tEn,
});
assert(
  jeonnamTitle === "South Jeolla · This month's festivals",
  'EN Jeonnam headline plain',
);
assert(!jeonnamTitle.includes('"'), 'EN headline has no ASCII quotes');
assert(
  !jeonnamTitle.includes('South Jeolla · "'),
  'EN headline no dangling quote after place',
);

const gwangjuTitle = formatFestivalIndexHeadlinePlain({
  locale: 'en',
  timeTab: 'thisMonth',
  place: 'Gwangju',
  time: 'Month',
  tasteSuffix: '',
  t: tEn,
});
assert(
  gwangjuTitle === "Gwangju · This month's festivals",
  'EN Gwangju headline plain',
);

if (failed) {
  console.error(`\n${failed} assertion(s) failed`);
  process.exit(1);
}
console.log('\nkorea-en-festival-ui SMOKE OK');
