import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { FESTIVAL_DETAIL_BOTTOM_SECTION_ORDER } from '../../src/pages/Korea/lib/festivalDetailBottomSectionOrder.js';
import { nearbyLocalScenicRestGroupTitle } from '../../src/pages/Home/lib/koreaLocalScenicLists.js';
import { mergeFestivalNearbySights } from '../../src/pages/Korea/lib/festivalNearbySights.js';

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

test('festival nearby sights merge into one section', () => {
  assert.equal(nearbyLocalScenicRestGroupTitle('ko'), '가까운 곳');
  const sheet = readFileSync(
    join(root, 'src/pages/Korea/FestivalDetailSheet.jsx'),
    'utf8',
  );
  assert.match(sheet, /nearbySights/);
  assert.match(sheet, /mergeFestivalNearbySights/);
  assert.match(sheet, /rankMooniNearbySights/);
  assert.match(sheet, /kind === 'heading'/);
  assert.match(sheet, /text-base font-bold text-stone-800/);
  assert.doesNotMatch(sheet, /nearbyLocalScenicRestGroupTitle/);
  assert.match(sheet, /variant="solid"/);
  const merged = mergeFestivalNearbySights({
    scenicSpots: [
      { name: '함평엑스포공원', contentId: '130864', lat: 35.05916, lng: 126.5222 },
      { name: '돌머리해수욕장', contentId: '126291', lat: 35.08655, lng: 126.44191 },
    ],
    grouped: {
      groups: [
        {
          title: '함평 팔경',
          listId: 'hampyeong-palgyeong',
          items: [
            {
              name: '함평엑스포공원',
              contentId: '130864',
              lat: 35.05916,
              lng: 126.5222,
              rankBlurb: '함평 2경',
            },
            {
              name: '돌머리 해수욕장',
              contentId: '126291',
              rankBlurb: '함평 4경',
              localScenicListId: 'hampyeong-palgyeong',
            },
            {
              name: '백제고도',
              rankBlurb: '함평 5경',
              lat: 35.0654,
              lng: 126.5166,
            },
            {
              name: '모악산',
              rankBlurb: '함평 6경',
              lat: 35.0654,
              lng: 126.5166,
            },
          ],
        },
      ],
      rest: [
        { name: '기린사우나', contentId: '1', lat: 35.07, lng: 126.53 },
        { name: '보광사', contentId: '999', lat: 35.08, lng: 126.5 },
        { name: '돌머리해수욕장', contentId: '126291', lat: 35.08655, lng: 126.44191 },
      ],
    },
    origin: { lat: 35.061, lng: 126.52 },
    venue: { contentIds: ['130864'], eventPlace: '함평엑스포공원', addr: '' },
    fallbackCenters: [{ lat: 35.0654, lng: 126.5166 }],
  });
  const names = merged.items.map((spot) => spot.name);
  assert.equal(names.filter((name) => name.includes('돌머리')).length, 1);
  assert.ok(!names.some((name) => name.includes('엑스포')));
  assert.ok(!names.includes('기린사우나'));
  assert.ok(merged.groups.some((group) => group.title === '함평 팔경'));
  const baekje = merged.items.find((spot) => spot.name === '백제고도');
  assert.equal(baekje?.distKm, null);
  const finite = merged.items
    .map((spot) => spot.distKm)
    .filter((km) => Number.isFinite(km));
  const sorted = [...finite].sort((a, b) => a - b);
  assert.deepEqual(finite, sorted);
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
  const sheet = readFileSync(join(root, 'src/pages/Korea/FestivalDetailSheet.jsx'), 'utf8');
  assert.match(sheet, /useTrustBarOverlayLockEffect\(Boolean\(item\) \|\| pending\)/);
  assert.match(sheet, /data-festival-photo-strip=/);
  assert.doesNotMatch(sheet, /heroColMin\.current - heroBox/);
  assert.match(sheet, /imageUrls\.length > 1 && heroColMin\.current > 0/);
});
