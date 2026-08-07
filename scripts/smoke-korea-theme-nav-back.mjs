/**
 * 테마여행 #21 — 테마 간 이전 복귀 스택·경로 스모크 (오프라인).
 *
 *   npm run smoke:korea-theme-nav-back
 */
import { readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import {
  buildThemeModulePath,
  clearThemeNavBack,
  consumeThemeNavBack,
  formatThemeNavBackLabel,
  peekThemeNavBack,
  pushThemeNavBack,
  reconcileThemeNavBack,
  resolveThemeNavBack,
  themeModuleLabelForPath,
} from '../src/pages/Home/lib/koreaThemeNavBack.js';

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

// sessionStorage polyfill for Node
const store = new Map();
globalThis.sessionStorage = {
  getItem: (k) => (store.has(k) ? store.get(k) : null),
  setItem: (k, v) => store.set(k, String(v)),
  removeItem: (k) => store.delete(k),
};

clearThemeNavBack();

assert(
  buildThemeModulePath('/korea/theme/top10', { spotId: 'boseong-tea' }) ===
    '/korea/theme/top10?spot=boseong-tea',
  'build path with spot',
);
{
  const regionsPath = buildThemeModulePath('/korea/theme/regions', {
    areaCode: '38',
    spotId: 'boseong:boseong-green-tea-plantation',
  });
  assert(
    regionsPath.startsWith('/korea/theme/regions?') &&
      regionsPath.includes('area=38') &&
      regionsPath.includes('spot=boseong'),
    'build regions path with area+spot',
  );
}
assert(
  themeModuleLabelForPath('/korea/theme/top10?spot=x') === '10대 절경',
  'module label from path',
);

pushThemeNavBack({
  path: '/korea/theme/top10?spot=boseong-tea',
  label: '보성녹차밭',
  moduleLabel: '10대 절경',
});
assert(peekThemeNavBack()?.label === '보성녹차밭', 'peek after push');
assert(
  formatThemeNavBackLabel(peekThemeNavBack()) === '보성녹차밭 · 10대 절경',
  'format label',
);

pushThemeNavBack({
  path: '/korea/theme/scenic?spot=foo',
  label: '경복궁',
  moduleLabel: '명승지',
});
assert(peekThemeNavBack()?.label === '경복궁', 'stack top is scenic');

reconcileThemeNavBack('/korea/theme/scenic?spot=foo');
assert(peekThemeNavBack()?.label === '보성녹차밭', 'reconcile pops matching top');

const consumed = consumeThemeNavBack();
assert(consumed?.label === '보성녹차밭', 'consume returns top10');
assert(peekThemeNavBack() == null, 'stack empty after consume');

assert(
  resolveThemeNavBack({
    themeBack: {
      path: '/korea/theme/top10?spot=boseong-tea',
      label: '보성녹차밭',
    },
  })?.path === '/korea/theme/top10?spot=boseong-tea',
  'resolve from route state',
);

const placeSrc = readFileSync(
  join(root, 'src/pages/Home/lib/placeReturnTo.js'),
  'utf8',
);
assert(
  placeSrc.includes("pathname.startsWith('/korea/theme/')") ||
    placeSrc.includes('split(\'?\')'),
  'placeReturnTo allows theme query paths',
);

const modalSrc = readFileSync(
  join(root, 'src/pages/KoreaTheme/ThemeSpotDetailModal.jsx'),
  'utf8',
);
assert(modalSrc.includes('pushThemeNavBack'), 'modal pushes theme nav back');
assert(modalSrc.includes('themeBack'), 'modal navigates with themeBack state');
assert(
  !modalSrc.includes("path: '/korea/theme/top10'") &&
    !modalSrc.includes("path: '/korea/theme/regions'"),
  'modal chips no longer deep-link top10/regions',
);

for (const file of ['ScenicPage.jsx', 'CoursesPage.jsx']) {
  const src = readFileSync(join(root, 'src/pages/KoreaTheme', file), 'utf8');
  assert(src.includes('ThemeModuleBackButton'), `${file} uses ThemeModuleBackButton`);
  assert(src.includes('ThemeNavBackHint'), `${file} shows ThemeNavBackHint`);
}

const appSrc = readFileSync(join(root, 'src/App.jsx'), 'utf8');
for (const legacy of ['top10', 'regions', 'packages']) {
  assert(
    appSrc.includes(`path="/korea/theme/${legacy}"`) &&
      appSrc.includes('Navigate to="/korea/theme/scenic"'),
    `legacy /korea/theme/${legacy} redirects to scenic`,
  );
}
assert(
  !appSrc.includes('KoreaThemeLanding'),
  'hub landing component not mounted',
);
assert(appSrc.includes('path="/korea/theme"'), '/korea/theme route present');
assert(
  (appSrc.match(/Navigate to="\/korea\/theme\/scenic"/g) || []).length >= 4,
  '/korea/theme + legacy modules redirect to scenic',
);

const homeUi = readFileSync(
  join(root, 'src/pages/Home/components/HomeUI.jsx'),
  'utf8',
);
assert(
  homeUi.includes('to="/korea"') &&
    homeUi.includes('한국의 축제') &&
    homeUi.includes('to="/korea/theme/scenic"') &&
    homeUi.includes('한국의 명승'),
  'globe home has festival + scenic dual entry',
);
assert(
  !homeUi.includes('to="/korea/theme"\n') &&
    !homeUi.includes("to='/korea/theme'") &&
    !homeUi.includes('to="/korea/theme" '),
  'globe home does not link bare /korea/theme hub',
);

const korea = readFileSync(join(root, 'src/pages/Korea/index.jsx'), 'utf8');
assert(
  korea.includes('ThemeFestivalBackLink'),
  'festival from=theme uses ThemeFestivalBackLink',
);
assert(
  korea.includes('to="/korea/theme/scenic"') && korea.includes('명승'),
  'festival header has 명승 mutual chip',
);

const festSheet = readFileSync(
  join(root, 'src/pages/Korea/FestivalDetailSheet.jsx'),
  'utf8',
);
assert(
  festSheet.includes('resolveFestivalThemeCrossLinks'),
  'festival detail wires theme cross links',
);
assert(
  festSheet.includes('숙소 · 투어') && festSheet.includes('패키지'),
  'festival detail has stay/tna/package rails',
);

const crossLib = readFileSync(
  join(root, 'src/pages/Home/lib/koreaThemeCrossLinks.js'),
  'utf8',
);
assert(
  crossLib.includes('export function resolveFestivalThemeCrossLinks'),
  'festival cross helper exported',
);

if (failed) {
  console.error(`\n${failed} failure(s)`);
  process.exit(1);
}
console.log('\nAll korea-theme-nav-back checks passed.');
