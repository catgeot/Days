import assert from 'node:assert/strict';
import test from 'node:test';
import {
  getManualFestivalEntry,
  manualFestivalDetailAsOf,
  manualFestivalListItem,
  manualFestivalTourDetail,
} from '../../src/pages/Korea/manualFestivalEntries.js';
import { FestivalDetailAsOfLine } from '../../src/pages/Korea/festivalDeepLinkItem.js';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

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
