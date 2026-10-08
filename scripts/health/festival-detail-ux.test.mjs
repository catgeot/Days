import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import {
  FESTIVAL_DETAIL_BOTTOM_SECTION_ORDER,
  FESTIVAL_DETAIL_SCROLL_TOP_THRESHOLD_PX,
} from '../../src/pages/Korea/lib/festivalDetailBottomSectionOrder.js';
import { nearbyLocalScenicRestGroupTitle } from '../../src/pages/Home/lib/koreaLocalScenicLists.js';
import {
  buildFestivalMooniGuideOpening,
  getFestivalMooniFollowUpChips,
} from '../../src/pages/Korea/lib/festivalMooniContext.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '../..');

function contrastRatio(rgbA, rgbB) {
  const lum = (rgb) => {
    const [r, g, b] = rgb.map((c) => {
      const x = c / 255;
      return x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4;
    });
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };
  const l1 = lum(rgbA);
  const l2 = lum(rgbB);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

test('festival detail bottom section order SSOT', () => {
  assert.deepEqual(FESTIVAL_DETAIL_BOTTOM_SECTION_ORDER, [
    'nearAttractions',
    'packages',
    'nearCourses',
  ]);
  const sheet = readFileSync(
    join(root, 'src/pages/Korea/FestivalDetailSheet.jsx'),
    'utf8',
  );
  const idxAttr = sheet.indexOf('data-festival-section="nearAttractions"');
  const idxPkg = sheet.indexOf('data-festival-section="packages"');
  const idxCourse = sheet.indexOf('data-festival-section="nearCourses"');
  assert.ok(idxAttr > 0 && idxPkg > idxAttr && idxCourse > idxPkg);
});

test('팔경 rest subgroup title', () => {
  assert.equal(nearbyLocalScenicRestGroupTitle('ko'), '가까운 곳');
  assert.match(
    readFileSync(join(root, 'src/pages/Korea/FestivalDetailSheet.jsx'), 'utf8'),
    /nearbyLocalScenicRestGroupTitle/,
  );
});

test('MOONi festival opening guide + chips', () => {
  const opening = buildFestivalMooniGuideOpening({
    title: '테스트 축제',
    dateLabel: '10.01 – 10.03',
    timeText: '10:00–18:00',
    feeText: '무료',
    venue: '시청 앞',
    address: '서울',
    hubLabel: '서울',
    programText: '퍼레이드와 체험 부스',
    hasEnded: false,
  });
  assert.match(opening, /볼거리/);
  assert.match(opening, /현장 분위기/);
  assert.match(opening, /주변 즐길거리/);
  const ended = buildFestivalMooniGuideOpening({
    title: '지난 축제',
    eventEndDate: '20240101',
    hasEnded: true,
  });
  assert.match(ended, /종료/);
  const chips = getFestivalMooniFollowUpChips('ko');
  assert.equal(chips.length, 4);
  assert.ok(chips.some((c) => c.label.includes('주차')));
});

test('scroll-top threshold for MOONi FAB', () => {
  assert.ok(FESTIVAL_DETAIL_SCROLL_TOP_THRESHOLD_PX >= 240);
});

test('flight origin chat-header contrast tokens', () => {
  const labelOnDark = [241, 245, 249];
  const chipTextOnDark = [255, 255, 255];
  const chipBgOnDark = [15, 23, 42];
  assert.ok(contrastRatio(labelOnDark, chipBgOnDark) >= 4.5);
  assert.ok(contrastRatio(chipTextOnDark, chipBgOnDark) >= 4.5);
  const labelOnLight = [30, 41, 59];
  const chipTextOnLight = [22, 78, 99];
  const chipBgOnLight = [255, 255, 255];
  assert.ok(contrastRatio(labelOnLight, chipBgOnLight) >= 4.5);
  assert.ok(contrastRatio(chipTextOnLight, chipBgOnLight) >= 4.5);
});

test('trust bar hides under modal overlay lock', () => {
  const main = readFileSync(join(root, 'src/shared/layout/MainLayout.jsx'), 'utf8');
  assert.match(main, /useTrustBarOverlayHidden/);
  assert.match(
    readFileSync(join(root, 'src/pages/KoreaTheme/CourseDetailModal.jsx'), 'utf8'),
    /useTrustBarOverlayLockEffect/,
  );
});
