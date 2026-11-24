import assert from 'node:assert/strict';
import test from 'node:test';
import {
  dropSyntheticFestivalShadows,
  festivalRowsShareEdition,
  getManualFestivalEntry,
  isManualFestivalActive,
  isSyntheticFestivalContentId,
  manualFestivalDetailAsOf,
  manualFestivalListItem,
  manualFestivalTourDetail,
  mergeManualFestivalsIntoFestivalItems,
  shouldManualWinOverTourApiRow,
  festivalEditionEndedForItem,
  festivalOmitsOfficialEventHours,
} from '../../src/pages/Korea/manualFestivalEntries.js';
import { projectFestivalDeepLink } from '../../src/pages/Korea/festivalDeepLinkItem.js';
import { buildFestivalDetailSummary } from '../../src/pages/Korea/lib/festivalDetailSummary.js';
import { resolveFestivalItemSidoCode } from '../../src/pages/Korea/koreaAreaFilter.js';
import { buildFestivalMooniContext } from '../../src/pages/Korea/lib/festivalMooniContext.js';
import { FestivalDetailAsOfLine } from '../../src/pages/Korea/festivalDeepLinkItem.js';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

test('synthetic manual row is dropped once a TourAPI row shares the edition', () => {
  const NOW = new Date('2026-11-20T03:00:00Z');
  const tour = {
    contentId: '1139979',
    title: '논산양촌곶감축제',
    eventStartDate: '20261211',
    eventEndDate: '20261213',
    addr1: '충청남도 논산시 양촌면',
  };
  const synthetic = {
    contentId: '9026112001',
    title: '논산 양촌 곶감 축제',
    eventStartDate: '20261211',
    eventEndDate: '20261213',
    addr1: '충청남도 논산시 양촌면 양촌리 454',
  };
  assert.equal(isSyntheticFestivalContentId(synthetic.contentId), true);
  assert.equal(isSyntheticFestivalContentId(tour.contentId), false);
  assert.equal(festivalRowsShareEdition(tour, synthetic), true);
  assert.equal(getManualFestivalEntry('9026112001'), null);

  const merged = mergeManualFestivalsIntoFestivalItems([tour, synthetic], NOW);
  const nonsan = merged.filter((row) => String(row.title || '').includes('논산'));
  assert.equal(nonsan.length, 1);
  assert.equal(nonsan[0].contentId, '1139979');

  const otherCity = {
    ...synthetic,
    addr1: '전라남도 여수시 중앙동',
  };
  assert.equal(festivalRowsShareEdition(tour, otherCity), false);
  assert.equal(dropSyntheticFestivalShadows([tour, otherCity]).length, 2);

  const otherStart = { ...synthetic, eventStartDate: '20251211' };
  assert.equal(festivalRowsShareEdition(tour, otherStart), false);
  assert.equal(dropSyntheticFestivalShadows([tour, otherStart]).length, 2);

  const noSigungu = { ...synthetic, addr1: '' };
  assert.equal(festivalRowsShareEdition(tour, noSigungu), true);
  assert.equal(dropSyntheticFestivalShadows([tour, noSigungu])[0].contentId, '1139979');
});

test('remaining manual festival rows do not share an edition', () => {
  const NOW = new Date('2026-06-01T03:00:00Z');
  const ids = ['638576', '235076'];
  const items = ids.map((id) => manualFestivalListItem(getManualFestivalEntry(id), NOW));
  assert.equal(items.every(Boolean), true);
  for (let i = 0; i < items.length; i += 1) {
    for (let j = i + 1; j < items.length; j += 1) {
      assert.equal(
        festivalRowsShareEdition(items[i], items[j]),
        false,
        `${items[i].contentId} vs ${items[j].contentId}`,
      );
    }
  }
  const listed = mergeManualFestivalsIntoFestivalItems([], NOW).map((row) => row.contentId);
  assert.deepEqual(listed.sort(), [...ids].sort());
});

test('235076 manual entry — TourAPI gap fill, Busan list, expires after 2026-11-07', () => {
  const NOW = new Date('2026-11-01T03:00:00Z');
  const entry = getManualFestivalEntry('235076');
  assert.ok(entry);
  assert.equal(entry.eventStartDate, '20261107');
  assert.equal(entry.eventEndDate, '20261107');
  assert.equal(entry.expiresAfter, '20261107');
  assert.equal(entry.officialHomepage, 'https://www.busanfireworks.com/');
  assert.match(entry.addr1, /부산광역시/);
  assert.match(entry.addr1En, /Gwanganhaebyeon-ro/);
  assert.doesNotMatch(entry.addr1En, /Gwangandaero/i);
  assert.match(entry.eventplace, /광안리/);
  assert.match(entry.playtime, /18:00~20:00/);
  assert.match(entry.playtimeEn, /18:00–20:00/);
  assert.match(entry.images[0].url, /visitkorea\.or\.kr/);

  assert.equal(isManualFestivalActive(entry, NOW), true);
  assert.equal(
    isManualFestivalActive(entry, new Date('2026-11-08T03:00:00Z')),
    false,
  );

  const item = manualFestivalListItem(entry, NOW);
  assert.equal(item.contentId, '235076');
  assert.equal(resolveFestivalItemSidoCode(item), '6');

  const merged = mergeManualFestivalsIntoFestivalItems(
    [{ contentId: '999', title: '기타', eventStartDate: '20261101', eventEndDate: '20261102' }],
    NOW,
  );
  assert.ok(merged.some((row) => row.contentId === '235076'));

  const detail = manualFestivalTourDetail(entry);
  assert.equal(detail.ok, true);
  assert.equal(detail.manual, true);
  assert.match(detail.common.title, /부산불꽃/);
});

test('235076 manual wins over stale TourAPI list row', () => {
  const NOW = new Date('2026-11-01T03:00:00Z');
  const entry = getManualFestivalEntry('235076');
  const staleTour = {
    contentId: '235076',
    title: '부산불꽃축제',
    eventStartDate: '20241102',
    eventEndDate: '20241102',
    addr1: '부산광역시 수영구 (구 일정)',
  };
  assert.equal(shouldManualWinOverTourApiRow(staleTour, entry, NOW), true);
  const merged = mergeManualFestivalsIntoFestivalItems([staleTour], NOW);
  const rows235 = merged.filter((row) => row.contentId === '235076');
  assert.equal(rows235.length, 1);
  assert.equal(rows235[0].eventEndDate, '20261107');
  assert.equal(rows235[0].detailAsOf?.fromManualOfficial, true);
  assert.match(rows235[0].firstimage, /visitkorea\.or\.kr/);
});

test('235076 deep link + detail not ended when TourAPI window row is stale', () => {
  const NOW = new Date('2026-11-01T03:00:00Z');
  const staleTour = {
    contentId: '235076',
    title: '부산불꽃축제',
    eventStartDate: '20241102',
    eventEndDate: '20241102',
    firstimage: 'https://example.invalid/stale.jpg',
  };
  const merged = mergeManualFestivalsIntoFestivalItems([staleTour], NOW);
  const view = projectFestivalDeepLink({
    festivalId: '235076',
    items: merged,
    supplementalItems: [],
    now: NOW,
  });
  assert.equal(view.ended, false);
  assert.equal(view.badge, '');
  assert.equal(view.selected?.eventEndDate, '20261107');

  const detail = manualFestivalTourDetail(getManualFestivalEntry('235076'));
  assert.equal(festivalEditionEndedForItem(view.selected, detail.intro, NOW), false);

  const summary = buildFestivalDetailSummary({
    item: view.selected,
    intro: detail.intro,
    range: '11.7',
    locale: 'ko',
  });
  assert.match(summary.timeText, /18:00~20:00/);
  assert.equal(summary.fee, null);
});

test('638576 stays active without expiresAfter after event end', () => {
  const entry = getManualFestivalEntry('638576');
  assert.equal(entry.expiresAfter, undefined);
  const afterFestival = new Date('2026-11-15T03:00:00Z');
  assert.equal(isManualFestivalActive(entry, afterFestival), true);
  assert.ok(manualFestivalListItem(entry, afterFestival));
});

test('638576 manual entry has official fields and as-of line', () => {
  const entry = getManualFestivalEntry('638576');
  assert.ok(entry);
  assert.equal(entry.eventStartDate, '20261023');
  assert.equal(entry.eventEndDate, '20261108');
  assert.equal(entry.officialHomepage, 'https://www.hpftf.or.kr/');
  assert.equal(entry.checkedOn, '2026-10-13');
  assert.match(entry.eventplace, /엑스포공원/);
  assert.ok(entry.images?.[0]?.url);
  assert.match(entry.images[0].credit, /공공누리/);

  const asOf = manualFestivalDetailAsOf(entry);
  assert.equal(asOf.fromManualOfficial, true);
  assert.equal(asOf.checkedOnDate, '2026.10.13');
  assert.equal(asOf.homepage, 'https://www.hpftf.or.kr/');

  const item = manualFestivalListItem(entry);
  assert.equal(item.contentId, '638576');
  assert.equal(item.detailAsOf.checkedOnDate, '2026.10.13');

  const detail = manualFestivalTourDetail(entry);
  assert.equal(detail.ok, true);
  assert.equal(detail.manual, true);
  assert.equal(detail.intro.playtime, '');
  assert.match(detail.intro.usetimefestival, /7,000원/);
  assert.match(detail.intro.usetimefestival, /사전예매 10% 할인\(9\.23~10\.22\)/);
  assert.match(detail.intro.usetimefestival, /함평군민/);
  assert.match(detail.intro.usetimefestival, /만 4세 미만/);
  assert.match(detail.intro.usetimefestival, /장애인\(중증은 보호자 1인 동반 무료\)/);
  assert.equal(detail.intro.playtime, '');
  assert.equal(festivalOmitsOfficialEventHours(item), true);

  const mooni = buildFestivalMooniContext({
    item,
    intro: detail.intro,
    summaryFields: { dateText: '10.23 – 11.08', timeText: '', fee: { text: '7,000원' } },
  });
  assert.equal(mooni.timeText, '');
  assert.doesNotMatch(mooni.overview, /09:00|10:00~18:00/);

  const html = renderToStaticMarkup(
    createElement(FestivalDetailAsOfLine, {
      asOf: item.detailAsOf,
      officialHomepageLabel: '일정·장소는 공식 홈페이지 기준 (2026.10.13 확인)',
      linkLabel: '공식 홈페이지',
    }),
  );
  assert.match(html, /data-festival-detail-asof="official-homepage"/);
  assert.match(html, /2026\.10\.13 확인/);
  assert.match(html, /href="https:\/\/www\.hpftf\.or\.kr\/"/);
});

test('638576 MOONi hours question points to official site, not GATEO detail', async () => {
  const { polishFestivalModelReply, buildMooniBoundFestivalSystemHint } = await import(
    '../../src/shared/korea/mooniKoreaFestivalAssist.js'
  );
  const entry = getManualFestivalEntry('638576');
  const item = manualFestivalListItem(entry);
  const detail = manualFestivalTourDetail(entry);
  const mooni = buildFestivalMooniContext({
    item,
    intro: detail.intro,
    homepage: entry.officialHomepage,
    summaryFields: { dateText: '10.23 – 11.08', timeText: '', fee: { text: '7,000원' } },
  });
  const hint = buildMooniBoundFestivalSystemHint(mooni, 'ko');
  assert.match(hint, /운영 시간이 이 데이터에 없/);
  assert.match(hint, /hpftf\.or\.kr/);
  assert.match(hint, /061-320-2247/);
  assert.match(hint, /GATEO 상세 링크 대신/);

  const polished = polishFestivalModelReply('운영 시간은 상세 페이지에서 확인해요.', {
    contentId: '638576',
    locale: 'ko',
    userText: '운영 시간 알려줘',
    homepage: entry.officialHomepage,
    tel: entry.tel,
    timeText: '',
  });
  assert.match(polished, /\[공식 홈페이지\]\(https:\/\/www\.hpftf\.or\.kr\/\)/);
  assert.match(polished, /061-320-2247/);
  assert.doesNotMatch(polished, /상세 페이지|gateo\.kr/);
});
