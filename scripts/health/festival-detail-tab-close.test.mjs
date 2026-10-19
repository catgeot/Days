import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '../..');
const sheet = readFileSync(
  join(root, 'src/pages/Korea/FestivalDetailSheet.jsx'),
  'utf8',
);

function sliceAround(marker, before, after) {
  const index = sheet.indexOf(marker);
  assert.ok(index > 0, `missing ${marker}`);
  return sheet.slice(Math.max(0, index - before), index + after);
}

test('festival detail top-right close still dismisses the sheet', () => {
  const header = sliceAround('icon="close"', 80, 280);
  assert.match(header, /onClick=\{onClose\}/);
  assert.doesNotMatch(header, /setActiveTab\(TAB_INFO\)/);
});

test('festival detail bottom close returns sub-tabs to the overview', () => {
  const button = sliceAround(
    'className="w-full py-3 rounded-2xl text-sm font-bold border border-stone-200 bg-stone-50 text-stone-800 hover:bg-stone-100"',
    900,
    500,
  );
  assert.match(button, /if \(activeTab === TAB_INFO\) \{\s*onClose\(\);/);
  assert.match(button, /returnToOverviewTab\(\)/);
  assert.doesNotMatch(button, /onClick=\{onClose\}/);
  assert.match(
    sheet,
    /overviewScrollPendingRef\.current = true[\s\S]*useLayoutEffect/,
  );
  assert.match(sheet, /scrollFestivalOverviewToTop/);
  assert.match(sheet, /festivalSheetOverviewScroll/);
  assert.match(sheet, /data-festival-sheet-content/);
  assert.match(sheet, /hasVideoTab &&/);
  assert.match(sheet, /videosLoadSettled/);
  assert.match(sheet, /videosKnownEmptyFromCache/);
  assert.match(sheet, /videosUserEmptyOnTab/);
  assert.match(sheet, /videosNotFound/);
  assert.match(sheet, /fetchFestivalVideosCacheOnly/);
  assert.match(
    button,
    /activeTab === TAB_INFO\s*\?\s*t\('korea\.common\.close'\)\s*:\s*t\('korea\.festival\.detail\.backToOverview'\)/,
  );
  const ko = JSON.parse(readFileSync(join(root, 'src/i18n/locales/ko.json'), 'utf8'));
  const en = JSON.parse(readFileSync(join(root, 'src/i18n/locales/en.json'), 'utf8'));
  assert.equal(ko.korea.festival.detail.backToOverview, '안내로 돌아가기');
  assert.equal(en.korea.festival.detail.backToOverview, 'Back to overview');
  assert.equal(ko.korea.common.close, '닫기');
  assert.equal(en.korea.common.close, 'Close');
  assert.equal(ko.korea.festival.detail.tabReading, '영상');
  assert.equal(en.korea.festival.detail.tabReading, 'Videos');
});
