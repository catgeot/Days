import assert from 'node:assert/strict';
import test from 'node:test';
import {
  getManualFestivalEntry,
  isManualFestivalActive,
  manualFestivalDetailAsOf,
  manualFestivalListItem,
  manualFestivalTourDetail,
  mergeManualFestivalsIntoFestivalItems,
  shouldManualWinOverTourApiRow,
  festivalOmitsOfficialEventHours,
} from '../../src/pages/Korea/manualFestivalEntries.js';
import { resolveFestivalItemSidoCode } from '../../src/pages/Korea/koreaAreaFilter.js';
import { buildFestivalMooniContext } from '../../src/pages/Korea/lib/festivalMooniContext.js';
import { FestivalDetailAsOfLine } from '../../src/pages/Korea/festivalDeepLinkItem.js';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

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
  assert.match(entry.usetimefestival, /18:00~20:00/);
  assert.match(entry.usetimefestivalEn, /18:00–20:00/);
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
