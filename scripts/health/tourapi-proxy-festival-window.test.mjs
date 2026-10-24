import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  FESTIVAL_WINDOW_ARRANGE,
  FESTIVAL_WINDOW_PAGE_ROWS,
  festivalWindowFetchLooksIncomplete,
  mergeFestivalPages,
  splitFestivalWindowRange,
} from '../../supabase/functions/tourapi-proxy/festival_window.mjs';

const item = (contentId, title = 'Fest', start = '20261107') => ({
  contentId,
  title,
  eventStartDate: start,
});

test('stable fetch params — large page size and arrange A', () => {
  assert.equal(FESTIVAL_WINDOW_PAGE_ROWS, 500);
  assert.equal(FESTIVAL_WINDOW_ARRANGE, 'A');
});

test('mergeFestivalPages dedupes by contentId across pages', () => {
  const pages = [
    {
      ok: true,
      rawCount: 3,
      items: [item('235076'), item('111'), item('222')],
    },
    {
      ok: true,
      rawCount: 3,
      items: [item('235076'), item('333')],
    },
  ];
  const merged = mergeFestivalPages(pages);
  assert.equal(merged.length, 4);
  assert.ok(merged.some((r) => r.contentId === '235076'));
});

test('festivalWindowFetchLooksIncomplete — duplicate pages or short of totalCount', () => {
  const dupPages = [
    { ok: true, rawCount: 350, items: [item('1'), item('2'), item('1')] },
  ];
  const mergedDup = mergeFestivalPages(dupPages);
  assert.equal(festivalWindowFetchLooksIncomplete(dupPages, mergedDup), true);

  const shortPages = [
    { ok: true, rawCount: 350, items: [item('1'), item('2')] },
  ];
  const mergedShort = mergeFestivalPages(shortPages);
  assert.equal(festivalWindowFetchLooksIncomplete(shortPages, mergedShort), true);

  const completePages = [
    { ok: true, rawCount: 2, items: [item('1'), item('2')] },
  ];
  const mergedOk = mergeFestivalPages(completePages);
  assert.equal(festivalWindowFetchLooksIncomplete(completePages, mergedOk), false);
});

test('splitFestivalWindowRange — contiguous 2-month chunks', () => {
  const chunks = splitFestivalWindowRange('20261001', '20261231', 2);
  assert.ok(chunks.length >= 2);
  assert.equal(chunks[0].eventStartDate, '20261001');
  assert.equal(chunks[chunks.length - 1].eventEndDate, '20261231');
  for (let i = 1; i < chunks.length; i += 1) {
    const prevEnd = chunks[i - 1].eventEndDate;
    const nextStart = chunks[i].eventStartDate;
    assert.ok(nextStart > prevEnd);
  }
});
