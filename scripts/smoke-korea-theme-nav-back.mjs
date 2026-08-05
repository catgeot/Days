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

for (const file of [
  'Top10Page.jsx',
  'ScenicPage.jsx',
  'RegionsPage.jsx',
  'CoursesPage.jsx',
  'PackagesPage.jsx',
]) {
  const src = readFileSync(join(root, 'src/pages/KoreaTheme', file), 'utf8');
  assert(src.includes('ThemeModuleBackButton'), `${file} uses ThemeModuleBackButton`);
  assert(src.includes('ThemeNavBackHint'), `${file} shows ThemeNavBackHint`);
}

const top10 = readFileSync(
  join(root, 'src/pages/KoreaTheme/Top10Page.jsx'),
  'utf8',
);
assert(top10.includes("searchParams.get('spot')"), 'top10 syncs ?spot=');

const korea = readFileSync(join(root, 'src/pages/Korea/index.jsx'), 'utf8');
assert(
  korea.includes('ThemeFestivalBackLink'),
  'festival from=theme uses ThemeFestivalBackLink',
);

if (failed) {
  console.error(`\n${failed} failure(s)`);
  process.exit(1);
}
console.log('\nAll korea-theme-nav-back checks passed.');
