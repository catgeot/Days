import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { filterBySearchQuery } from '../../src/pages/Korea/festivalSearch.js';
import { festivalItemThumbSrc } from '../../src/pages/Korea/festivalListThumb.js';
import {
  auditCityChipCountsMatchGroups,
  auditSidoChipCountsMatchGroups,
} from '../../src/pages/Korea/festivalListChipGroupSync.js';
import { buildCityTags } from '../../src/pages/Korea/festivalRegionTags.js';
import {
  excludePinnedFromPanelItems,
  festivalItemForSessionPin,
} from '../../src/pages/Korea/festivalSessionPin.js';
import {
  isSocialPromoEntryInWindow,
  isYmdWithinInclusive,
  mergeFestivalRowItem,
  mergeSocialPromoIntoFestivalItems,
  normalizeFestivalItemImages,
  filterSocialPromoCardsByRegion,
  pickVisibleSocialPromoCards,
  resolveSocialPromoPresentation,
  resolveSocialPromoRow,
  shouldShowSessionPinnedHomeRow,
  shouldShowSessionPinnedRow,
  shouldShowSocialPromoHomeRow,
  shouldShowSocialPromoItem,
  excludeFestivalsByContentId,
  contentIdsFromPromoCards,
} from '../../src/pages/Korea/socialPromoFestivalsLogic.js';
import { manualFestivalListItem, getManualFestivalEntry } from '../../src/pages/Korea/manualFestivalEntries.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '../..');
const socialPromoFestivals = JSON.parse(
  readFileSync(
    join(root, 'src/pages/Korea/data/socialPromoFestivals.json'),
    'utf8',
  ),
);
const NOW = new Date('2026-10-10T03:00:00Z');

const GUKHYANG = manualFestivalListItem(getManualFestivalEntry('638576'));

test('session pin helpers dedupe list row and keep contentId', () => {
  const pin = festivalItemForSessionPin({
    ...GUKHYANG,
    detailAsOf: GUKHYANG.detailAsOf,
  });
  assert.equal(pin.contentId, '638576');
  assert.equal(pin.detailAsOf, undefined);
  const panel = [
    GUKHYANG,
    { contentId: '637693', title: '마산가고파국화축제' },
  ];
  assert.equal(excludePinnedFromPanelItems(panel, pin).length, 1);
  assert.equal(
    excludePinnedFromPanelItems(panel, pin)[0].contentId,
    '637693',
  );
});

test('promo window and ended festival auto-hide', () => {
  const entry = socialPromoFestivals[0];
  assert.equal(isSocialPromoEntryInWindow(entry, NOW), true);
  assert.equal(isYmdWithinInclusive('20261010', '20261001', '20261115'), true);
  assert.equal(isYmdWithinInclusive('20260930', '20261001', '20261115'), false);
  assert.equal(
    shouldShowSocialPromoItem(
      { ...GUKHYANG, eventEndDate: '20261009' },
      entry,
      NOW,
    ),
    false,
  );
  assert.equal(shouldShowSocialPromoItem(GUKHYANG, entry, NOW), true);
  const afterShowUntil = new Date('2026-11-20T03:00:00Z');
  assert.equal(isSocialPromoEntryInWindow(entry, afterShowUntil), false);
});

test('promo row stays loading until every configured slot resolves (JSON order)', () => {
  const partial = new Map([
    [
      '637693',
      {
        contentId: '637693',
        title: '마산가고파국화축제',
        eventStartDate: '20261031',
        eventEndDate: '20261108',
      },
    ],
  ]);
  const loading = resolveSocialPromoRow(socialPromoFestivals, partial, NOW, 2);
  assert.equal(loading.status, 'loading');
  assert.equal(loading.cards.length, 2);
  assert.equal(loading.cards[0].entry.contentId, '638576');
  assert.equal(loading.cards[1].entry.contentId, '637693');
  assert.equal(pickVisibleSocialPromoCards(socialPromoFestivals, partial, NOW, 2).length, 0);

  const full = new Map([
    ['638576', GUKHYANG],
    [
      '637693',
      {
        contentId: '637693',
        title: '마산가고파국화축제',
        eventStartDate: '20261031',
        eventEndDate: '20261108',
      },
    ],
  ]);
  const ready = resolveSocialPromoRow(socialPromoFestivals, full, NOW, 2);
  assert.equal(ready.status, 'ready');
  assert.equal(ready.cards[0].item.contentId, '638576');
  assert.equal(ready.cards[1].item.contentId, '637693');
});

test('promo row caps at two cards', () => {
  const map = new Map([
    ['638576', GUKHYANG],
    [
      '637693',
      {
        contentId: '637693',
        title: '마산가고파국화축제',
        eventStartDate: '20261031',
        eventEndDate: '20261108',
      },
    ],
    [
      '999',
      {
        contentId: '999',
        title: '세 번째',
        eventStartDate: '20261201',
        eventEndDate: '20261210',
      },
    ],
  ]);
  const cards = pickVisibleSocialPromoCards(socialPromoFestivals, map, NOW, 2);
  assert.equal(cards.length, 2);
  assert.equal(cards[0].item.contentId, '638576');
  assert.equal(cards[1].item.contentId, '637693');
});

test('festivalItemThumbSrc normalizes protocol-relative VisitKorea URLs', () => {
  const src = festivalItemThumbSrc({
    contentId: '638576',
    firstimage: '//tong.visitkorea.or.kr/cms/resource/06/4114406_image2_1.JPG',
  });
  assert.equal(
    src,
    'https://tong.visitkorea.or.kr/cms/resource/06/4114406_image2_1.JPG',
  );
});

test('normalizeFestivalItemImages upgrades http list URLs', () => {
  const normalized = normalizeFestivalItemImages({
    contentId: '638576',
    firstimage: 'http://example.test/a.jpg',
  });
  assert.equal(normalized.firstimage, 'https://example.test/a.jpg');
  assert.equal(normalized.imageUrl, 'https://example.test/a.jpg');
  const merged = mergeFestivalRowItem(
    { contentId: '638576', title: '목록' },
    GUKHYANG,
  );
  assert.equal(
    merged.firstimage,
    'https://tong.visitkorea.or.kr/cms/resource/06/4114406_image2_1.JPG',
  );
});

test('session pin hidden when festival is already on promo row; promo hidden on search', () => {
  const promoCards = [{ item: { contentId: '638576' } }];
  assert.equal(shouldShowSessionPinnedRow('638576', promoCards), false);
  assert.equal(shouldShowSessionPinnedRow('638576', []), true);
  assert.equal(shouldShowSocialPromoHomeRow(false), true);
  assert.equal(shouldShowSocialPromoHomeRow(true), false);
  assert.equal(shouldShowSessionPinnedHomeRow(false, 'all', 'all'), true);
  assert.equal(shouldShowSessionPinnedHomeRow(true, 'all', 'all'), false);
  assert.equal(shouldShowSessionPinnedHomeRow(false, '32', 'all'), false);
  assert.equal(shouldShowSessionPinnedHomeRow(false, 'all', '강릉시'), false);
});

test('chip counts match list groups when session pin stays in panel (no exclude)', () => {
  const gangneungNoodle = {
    contentId: '111',
    title: '강릉 국수 축제',
    eventStartDate: '20261015',
    eventEndDate: '20261018',
    addr1: '강원특별자치도 강릉시 경강로 2111',
  };
  const panel = [
    gangneungNoodle,
    {
      contentId: '112',
      title: 'K-Drone Festival',
      eventStartDate: '20261019',
      eventEndDate: '20261023',
      addr1: '강원특별자치도 강릉시',
    },
    {
      contentId: '113',
      title: '강릉커피축제',
      eventStartDate: '20261021',
      eventEndDate: '20261025',
      addr1: '강원특별자치도 강릉시',
    },
    {
      contentId: '114',
      title: '양양송이연어축제',
      eventStartDate: '20261016',
      eventEndDate: '20261018',
      addr1: '강원특별자치도 양양군',
    },
  ];
  assert.equal(
    shouldShowSessionPinnedHomeRow(false, '32', 'all'),
    false,
    'pin row hidden under sido chip',
  );
  const gangwonCity = auditCityChipCountsMatchGroups(panel, '32');
  assert.equal(gangwonCity.ok, true, JSON.stringify(gangwonCity));
  const gangneungChip = buildCityTags(
    panel.filter((row) => String(row.addr1).includes('강원')),
    { areaCode: '32' },
  ).find((c) => c.label === '강릉시');
  assert.equal(gangneungChip?.count, 3);

  const seoulPanel = [
    {
      contentId: 's1',
      title: '서울 A',
      addr1: '서울특별시 종로구',
    },
    {
      contentId: 's2',
      title: '서울 B',
      addr1: '서울특별시 강남구',
    },
    gangneungNoodle,
  ];
  const seoulAudit = auditCityChipCountsMatchGroups(
    seoulPanel.filter((row) => row.addr1.includes('서울')),
    '1',
  );
  assert.equal(seoulAudit.ok, true, JSON.stringify(seoulAudit));

  const nationwide = auditSidoChipCountsMatchGroups([
    gangneungNoodle,
    {
      contentId: 'g1',
      title: '경남 축제',
      addr1: '경상남도 창원시',
    },
    {
      contentId: 'g2',
      title: '경남 축제 2',
      addr1: '경상남도 진주시',
    },
  ]);
  assert.equal(nationwide.ok, true, JSON.stringify(nationwide));
});

test('promo row filters by region chip; hidden when no match', () => {
  const ready = resolveSocialPromoRow(
    socialPromoFestivals,
    new Map([
      ['638576', GUKHYANG],
      [
        '637693',
        {
          contentId: '637693',
          title: '마산가고파국화축제',
          eventStartDate: '20261031',
          eventEndDate: '20261108',
          addr1: '경상남도 창원시',
        },
      ],
    ]),
    NOW,
    2,
  );
  assert.equal(ready.status, 'ready');
  const nationwide = resolveSocialPromoPresentation(ready, {
    searchActive: false,
    areaCode: 'all',
    cityName: 'all',
  });
  assert.equal(nationwide.show, true);
  assert.equal(nationwide.cards.length, 2);

  const gangwon = resolveSocialPromoPresentation(ready, {
    searchActive: false,
    areaCode: '32',
    cityName: 'all',
  });
  assert.equal(gangwon.show, false);
  assert.equal(gangwon.cards.length, 0);

  const jeonnam = filterSocialPromoCardsByRegion(ready.cards, {
    areaCode: '38',
    cityName: 'all',
  });
  assert.equal(jeonnam.length, 1);
  assert.equal(jeonnam[0].item.contentId, '638576');
});

test('merge adds configured IDs once and search finds 국향', () => {
  const base = [
    { contentId: '637693', title: '마산가고파국화축제', eventStartDate: '20261031', eventEndDate: '20261108' },
  ];
  const supplemental = new Map([['638576', GUKHYANG]]);
  const merged = mergeSocialPromoIntoFestivalItems(
    base,
    socialPromoFestivals,
    supplemental,
    NOW,
  );
  assert.equal(merged.length, 2);
  const ids = merged.map((row) => row.contentId);
  assert.deepEqual(ids.sort(), ['637693', '638576']);
  assert.equal(
    merged.find((r) => r.contentId === '638576').detailAsOf.checkedOnDate,
    '2026.10.13',
  );

  const mergedAgain = mergeSocialPromoIntoFestivalItems(
    merged,
    socialPromoFestivals,
    supplemental,
    NOW,
  );
  assert.equal(mergedAgain.length, 2);

  const hits = filterBySearchQuery(merged, '국향');
  assert.equal(hits.length, 1);
  assert.equal(hits[0].contentId, '638576');
});

test('visible promo cards are excluded from list rows and chip pool', () => {
  const panel = [
    GUKHYANG,
    {
      contentId: '637693',
      title: '마산가고파국화축제',
      eventStartDate: '20261031',
      eventEndDate: '20261108',
    },
    { contentId: '999', title: '기타 축제', eventStartDate: '20261101', eventEndDate: '20261102' },
  ];
  const promoCards = [{ item: GUKHYANG }];
  const ids = contentIdsFromPromoCards(promoCards);
  assert.equal(ids.has('638576'), true);
  const list = excludeFestivalsByContentId(panel, ids);
  assert.equal(list.length, 2);
  assert.equal(list.some((r) => r.contentId === '638576'), false);
});

test('hub wires session pin, promo row, and merge', () => {
  const hub = readFileSync(join(root, 'src/pages/Korea/index.jsx'), 'utf8');
  assert.match(hub, /sessionPinnedDisplay/);
  assert.match(hub, /data-session-pinned-festival/);
  assert.match(hub, /SocialPromoFestivalRow/);
  assert.match(hub, /itemsWithSocialPromo/);
  assert.match(hub, /mergeSocialPromoIntoFestivalItems/);
  assert.match(hub, /festivalViewedPushedRef/);
  assert.match(hub, /festivalItemForSessionPin/);
  assert.match(hub, /resolveSocialPromoRow/);
  assert.match(hub, /resolveSocialPromoPresentation/);
  assert.match(hub, /shouldShowSessionPinnedHomeRow/);
  assert.match(hub, /shouldShowSessionPinnedRow/);
  assert.match(hub, /excludeFestivalsByContentId/);
  assert.match(hub, /panelItemsForList/);
  assert.match(hub, /manualFestivalEntries/);
  const promoRow = readFileSync(
    join(root, 'src/pages/Korea/SocialPromoFestivalRow.jsx'),
    'utf8',
  );
  assert.match(promoRow, /data-social-promo-loading/);
  assert.match(promoRow, /flex-col/);
});

test('promo title copy (GATEO, all visitors)', () => {
  const ko = JSON.parse(
    readFileSync(join(root, 'src/i18n/locales/ko.json'), 'utf8'),
  );
  const en = JSON.parse(
    readFileSync(join(root, 'src/i18n/locales/en.json'), 'utf8'),
  );
  assert.equal(ko.korea.festival.socialPromoTitle, 'GATEO가 소개하는 축제');
  assert.equal(en.korea.festival.socialPromoTitle, 'Festivals featured by GATEO');
  assert.equal(ko.korea.festival.sessionPinnedSectionTitle, '최근 본 축제');
  assert.equal(en.korea.festival.sessionPinnedSectionTitle, 'Recently viewed');
});

test('session pin section label in hub', () => {
  const hub = readFileSync(join(root, 'src/pages/Korea/index.jsx'), 'utf8');
  assert.match(hub, /sessionPinnedSectionTitle/);
  assert.match(hub, /data-session-pinned-festival/);
  assert.doesNotMatch(hub, /excludePinnedFromPanelItems/);
});
