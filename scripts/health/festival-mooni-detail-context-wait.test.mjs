import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildFestivalMooniBoundSpot,
  buildFestivalMooniChatOpening,
  patchFestivalBoundSpot,
} from '../../src/pages/Korea/lib/festivalMooniBoundSpot.js';
import {
  festivalContextNeedsDetailWait,
  readFestivalContextForAsk,
} from '../../src/pages/Korea/lib/festivalDetailContextWait.js';
import { buildMooniBoundFestivalSystemHint } from '../../src/shared/korea/mooniKoreaFestivalReplyPolish.js';

const NOW = new Date('2026-11-15T03:00:00Z');

const ITEM = {
  contentId: '2048902',
  title: '해운대 빛축제',
  eventStartDate: '20261128',
  eventEndDate: '20270110',
  addr1: '부산광역시 해운대구 해운대해변로 264',
  mapx: '129.160384',
  mapy: '35.158698',
};

const NEARBY = ['미포항', '해운대 동백섬', '동백공원'];

function earlySpot() {
  return buildFestivalMooniBoundSpot({
    item: ITEM,
    detailPending: true,
    nearbyPlaces: NEARBY,
  });
}

function detailSpot() {
  return buildFestivalMooniBoundSpot({
    item: ITEM,
    detailPending: false,
    nearbyPlaces: NEARBY,
    overview: '백사장 중심에는 길이 12m의 배 조형물이 서 있어요.',
    program: '크루즈게이트\n터널게이트',
    intro: { eventplace: '해운대해수욕장' },
  });
}

test('open context stays on the list row until festival detail is patched in', () => {
  const early = earlySpot();
  const opening = buildFestivalMooniChatOpening(early.festivalContext, { now: NOW });
  assert.equal(early.festivalContext.detailPending, true);
  assert.equal(festivalContextNeedsDetailWait(early.festivalContext), true);
  assert.match(opening, /해운대 빛축제/);
  assert.match(opening, /미포항/);
  assert.doesNotMatch(opening, /크루즈게이트|터널게이트|배 조형물/);

  const patched = patchFestivalBoundSpot(early, detailSpot());
  assert.notEqual(patched, early);
  assert.equal(patched.name, early.name);
  assert.equal(patched.festivalContext.detailPending, false);
  assert.match(patched.festivalContext.program, /크루즈게이트/);
  assert.match(patched.festivalContext.program, /터널게이트/);
  const full = buildFestivalMooniChatOpening(patched.festivalContext, { now: NOW });
  assert.match(full, /크루즈게이트/);
  assert.match(full, /터널게이트/);
  assert.match(full, /배 조형물/);
  assert.match(full, /미포항/);

  const hint = buildMooniBoundFestivalSystemHint(patched.festivalContext, 'ko', NOW);
  assert.match(hint, /크루즈게이트/);
  assert.match(hint, /터널게이트/);
  const earlyHint = buildMooniBoundFestivalSystemHint(early.festivalContext, 'ko', NOW);
  assert.doesNotMatch(earlyHint, /크루즈게이트|터널게이트/);

  assert.equal(patchFestivalBoundSpot(patched, detailSpot()), patched);
});

test('a later nearby-only patch does not drop detail that already arrived', () => {
  const patched = patchFestivalBoundSpot(earlySpot(), detailSpot());
  const kept = patchFestivalBoundSpot(patched, {
    festivalContext: {
      contentId: '2048902',
      nearbyPlaces: NEARBY,
      nearbyRestaurants: [],
      program: '',
      overview: '',
      sceneOverview: '',
      detailPending: false,
    },
  });
  assert.equal(kept, patched);
  assert.match(kept.festivalContext.program, /크루즈게이트/);
});

test('readFestivalContextForAsk sees detail that lands after the send closure', async () => {
  let spot = earlySpot();
  const pending = readFestivalContextForAsk(() => spot, { timeoutMs: 400, intervalMs: 20 });
  setTimeout(() => {
    spot = patchFestivalBoundSpot(spot, detailSpot());
  }, 40);
  const ctx = await pending;
  assert.match(ctx.program, /크루즈게이트/);
  assert.equal(ctx.detailPending, false);
});

test('readFestivalContextForAsk stops waiting once narrative arrives', async () => {
  let spot = earlySpot();
  const started = Date.now();
  const pending = readFestivalContextForAsk(() => spot, { timeoutMs: 500, intervalMs: 20 });
  setTimeout(() => {
    spot = {
      ...spot,
      festivalContext: {
        ...spot.festivalContext,
        detailPending: true,
        program: '터널게이트',
      },
    };
  }, 30);
  const ctx = await pending;
  assert.ok(Date.now() - started < 400);
  assert.match(ctx.program, /터널게이트/);
});

test('readFestivalContextForAsk continues with the list row after the timeout', async () => {
  const spot = earlySpot();
  const started = Date.now();
  const ctx = await readFestivalContextForAsk(() => spot, { timeoutMs: 80, intervalMs: 20 });
  assert.ok(Date.now() - started >= 70);
  assert.equal(ctx.detailPending, true);
  assert.equal(String(ctx.program || ''), '');
});

test('readFestivalContextForAsk does not wait when detail is already settled', async () => {
  const started = Date.now();
  const ctx = await readFestivalContextForAsk(() => detailSpot(), { timeoutMs: 400, intervalMs: 50 });
  assert.ok(Date.now() - started < 80);
  assert.match(ctx.program, /크루즈게이트/);
  const empty = await readFestivalContextForAsk(() => null, { timeoutMs: 200 });
  assert.equal(empty, null);
});
