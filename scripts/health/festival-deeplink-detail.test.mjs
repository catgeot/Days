import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import {
  ENDED_FESTIVAL_BADGE,
  FESTIVAL_NOT_FOUND_TOAST,
  FestivalEndedBadge,
  festivalItemFromDetail,
  isFestivalEnded,
  projectFestivalDeepLink,
} from '../../src/pages/Korea/festivalDeepLinkItem.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '../..');
const NOW = new Date('2026-10-10T03:00:00Z');

const GUKHYANG_DETAIL = {
  ok: true,
  contentId: '638576',
  stale: true,
  intro: {
    contentId: '638576',
    eventStartDate: '20261023',
    eventEndDate: '20261108',
    sponsor1tel: '061-320-3555',
  },
  common: {
    contentId: '638576',
    title: '대한민국 국향대전',
    addr1: '전라남도 함평군 함평읍 곤재로 27',
    mapx: '126.516',
    mapy: '35.061',
    firstimage: 'https://example.test/gukhyang.jpg',
    tel: '061-320-3555',
  },
};

test('festivalItemFromDetail builds a list-shaped item from intro/common', () => {
  const item = festivalItemFromDetail(GUKHYANG_DETAIL);
  assert.deepEqual(item, {
    contentId: '638576',
    title: '대한민국 국향대전',
    eventStartDate: '20261023',
    eventEndDate: '20261108',
    addr1: '전라남도 함평군 함평읍 곤재로 27',
    mapx: '126.516',
    mapy: '35.061',
    firstimage: 'https://example.test/gukhyang.jpg',
    imageUrl: 'https://example.test/gukhyang.jpg',
    tel: '061-320-3555',
    contentTypeId: '15',
  });

  const fromLower = festivalItemFromDetail({
    ok: true,
    intro: { eventstartdate: '20200102', eventenddate: '20200103', sponsor1tel: '02-1' },
    common: { contentid: '42', title: '지난 축제', addr1: '서울' },
  });
  assert.equal(fromLower.contentId, '42');
  assert.equal(fromLower.eventStartDate, '20200102');
  assert.equal(fromLower.eventEndDate, '20200103');
  assert.equal(fromLower.tel, '02-1');
  assert.equal(fromLower.contentTypeId, '15');
});

test('festivalItemFromDetail fails closed when detail is unusable', () => {
  assert.equal(festivalItemFromDetail(null), null);
  assert.equal(festivalItemFromDetail({ ok: false, intro: { title: '숨김' }, common: { title: '숨김' } }), null);
  assert.equal(festivalItemFromDetail({ ok: true, intro: null, common: null }), null);
  assert.equal(festivalItemFromDetail({ ok: true, intro: {}, common: {} }), null);
});

test('deeplink id missing from the list opens the sheet and keeps the URL', () => {
  const items = [
    { contentId: '637693', title: '마산가고파국화축제', eventEndDate: '20261108' },
    { contentId: '141105', title: '경남고성공룡세계엑스포', eventEndDate: '20261201' },
  ];

  const whileListLoads = projectFestivalDeepLink({
    festivalId: '638576',
    items: [],
    listLoading: true,
    phase: 'idle',
    now: NOW,
  });
  assert.equal(whileListLoads.clearUrl, false);
  assert.equal(whileListLoads.fetch, false);
  assert.equal(whileListLoads.sheet, 'closed');

  const inFlight = projectFestivalDeepLink({
    festivalId: '638576',
    items,
    listLoading: false,
    phase: 'loading',
    now: NOW,
  });
  assert.equal(inFlight.sheet, 'loading');
  assert.equal(inFlight.clearUrl, false);
  assert.equal(inFlight.fetch, false);
  assert.equal(inFlight.toast, null);

  const opened = projectFestivalDeepLink({
    festivalId: '638576',
    items,
    listLoading: false,
    phase: 'ok',
    detail: GUKHYANG_DETAIL,
    now: NOW,
  });
  assert.equal(opened.sheet, 'open');
  assert.equal(opened.clearUrl, false);
  assert.equal(opened.fetch, false);
  assert.equal(opened.selected.title, '대한민국 국향대전');
  assert.equal(opened.ended, false);
  assert.equal(opened.badge, '');

  for (const id of ['637693', '141105']) {
    const listed = projectFestivalDeepLink({
      festivalId: id,
      items,
      listLoading: false,
      phase: 'idle',
      now: NOW,
    });
    assert.equal(listed.sheet, 'open');
    assert.equal(listed.fetch, false);
    assert.equal(listed.clearUrl, false);
    assert.equal(listed.selected.contentId, id);
  }

  const missing = projectFestivalDeepLink({
    festivalId: '999999999',
    items,
    listLoading: false,
    phase: 'miss',
    detail: { ok: false },
    now: NOW,
  });
  assert.equal(missing.sheet, 'closed');
  assert.equal(missing.clearUrl, true);
  assert.equal(missing.toast, FESTIVAL_NOT_FOUND_TOAST);
});

test('ended festival shows the 종료된 축제 badge', () => {
  assert.equal(isFestivalEnded('20261009', NOW), true);
  assert.equal(isFestivalEnded('20261010', NOW), false);
  assert.equal(isFestivalEnded('20261108', NOW), false);
  assert.equal(isFestivalEnded('', NOW), false);

  const ended = projectFestivalDeepLink({
    festivalId: '100',
    items: [],
    listLoading: false,
    phase: 'ok',
    detail: {
      ok: true,
      contentId: '100',
      intro: { eventStartDate: '20200101', eventEndDate: '20200102' },
      common: { contentId: '100', title: '지난 축제', addr1: '서울' },
    },
    now: NOW,
  });
  assert.equal(ended.sheet, 'open');
  assert.equal(ended.clearUrl, false);
  assert.equal(ended.ended, true);
  assert.equal(ended.badge, ENDED_FESTIVAL_BADGE);

  const html = renderToStaticMarkup(
    createElement(FestivalEndedBadge, { label: ended.badge }),
  );
  assert.match(html, /data-festival-ended/);
  assert.match(html, /종료된 축제/);

  const ongoingHtml = renderToStaticMarkup(
    createElement(FestivalEndedBadge, { label: '' }),
  );
  assert.equal(ongoingHtml.includes('종료된 축제'), false);

  const ko = JSON.parse(readFileSync(join(root, 'src/i18n/locales/ko.json'), 'utf8'));
  assert.equal(ko.korea.festival.notFound, FESTIVAL_NOT_FOUND_TOAST);
  assert.equal(ko.korea.festival.detail.endedBadge, ENDED_FESTIVAL_BADGE);

  const sheet = readFileSync(join(root, 'src/pages/Korea/FestivalDetailSheet.jsx'), 'utf8');
  assert.match(sheet, /FestivalEndedBadge/);
  assert.match(sheet, /festivalEnded \? null :/);
  assert.match(sheet, /!festivalEnded && showFestivalStayStrip/);
  assert.match(sheet, /!festivalEnded && showFestivalTnaStrip/);

  const hub = readFileSync(join(root, 'src/pages/Korea/index.jsx'), 'utf8');
  assert.match(hub, /projectFestivalDeepLink/);
  assert.match(hub, /festivalDeepLink\.fetch/);
  assert.match(hub, /festivalDeepLink\.clearUrl/);
  assert.match(hub, /if \(!listed\) return undefined/);
});
