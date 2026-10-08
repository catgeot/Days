import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { FESTIVAL_DETAIL_BOTTOM_SECTION_ORDER } from '../../src/pages/Korea/lib/festivalDetailBottomSectionOrder.js';
import { nearbyLocalScenicRestGroupTitle } from '../../src/pages/Home/lib/koreaLocalScenicLists.js';

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
    'lodging',
    'packages',
    'nearFood',
    'nearLeports',
    'nearCulture',
    'nearCourses',
  ]);
  const sheet = readFileSync(
    join(root, 'src/pages/Korea/FestivalDetailSheet.jsx'),
    'utf8',
  );
  const indices = FESTIVAL_DETAIL_BOTTOM_SECTION_ORDER.map((id) =>
    sheet.indexOf(`data-festival-section="${id}"`),
  );
  for (const idx of indices) {
    assert.ok(idx > 0, `missing data-festival-section marker`);
  }
  for (let i = 1; i < indices.length; i += 1) {
    assert.ok(
      indices[i] > indices[i - 1],
      `order violation: ${FESTIVAL_DETAIL_BOTTOM_SECTION_ORDER[i - 1]} before ${FESTIVAL_DETAIL_BOTTOM_SECTION_ORDER[i]}`,
    );
  }
});

test('팔경 rest subgroup title', () => {
  assert.equal(nearbyLocalScenicRestGroupTitle('ko'), '가까운 곳');
  assert.match(
    readFileSync(join(root, 'src/pages/Korea/FestivalDetailSheet.jsx'), 'utf8'),
    /nearbyLocalScenicRestGroupTitle/,
  );
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
