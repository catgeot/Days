// 영문 추자도 카드 「조회 중…」 정지 — Edge 응답이 없거나 실패해도 경로 폴백으로 끝난다
import assert from 'node:assert/strict';
import test from 'node:test';

const {
  clearFlightRouteEdgeCache,
  resolveFlightRouteHubsForCinema,
  resolveFlightRouteViaEdge,
  withEdgeTimeout,
} = await import('../../src/utils/resolveFlightRouteEdge.js');

const CHUJADO_UI = {
  id: 'mapbox-chujado-island',
  name: 'Chujado Island',
  name_en: 'Chujado Island',
  country: 'South Korea',
  lat: 33.94843182,
  lng: 126.31984797,
  uiPlace: true,
  source: 'mapbox',
};

const TOKYO_UI = {
  id: 'mapbox-shinjuku',
  name: 'Shinjuku',
  name_en: 'Shinjuku',
  country: 'Japan',
  lat: 35.6938,
  lng: 139.7034,
  uiPlace: true,
  source: 'mapbox',
};

const hangingInvoke = () => new Promise(() => {});
const failingInvoke = () => Promise.reject(new Error('network down'));
const emptyInvoke = () => Promise.resolve({ data: { ok: false }, error: null });

test('withEdgeTimeout — 끝나지 않는 promise도 timeout 뒤 null', async () => {
  const started = Date.now();
  const result = await withEdgeTimeout(new Promise(() => {}), 50);
  assert.equal(result, null);
  assert.ok(Date.now() - started < 2000);
  assert.equal(await withEdgeTimeout(Promise.reject(new Error('x')), 50), null);
  assert.deepEqual(await withEdgeTimeout(Promise.resolve({ ok: 1 }), 50), { ok: 1 });
});

for (const [label, invoke] of [
  ['응답 없음(hang)', hangingInvoke],
  ['요청 실패', failingInvoke],
  ['데이터 없음', emptyInvoke],
]) {
  test(`resolveFlightRouteViaEdge — ${label} → null로 빨리 끝남`, async () => {
    clearFlightRouteEdgeCache();
    const started = Date.now();
    const result = await resolveFlightRouteViaEdge({
      originIata: 'PUS',
      destIata: 'NRT',
      invoke,
      timeoutMs: 80,
    });
    assert.equal(result, null);
    assert.ok(Date.now() - started < 2000, 'timeout 안에 settle');
  });

  test(`resolveFlightRouteHubsForCinema — ${label}여도 직항/폴백 경로를 돌려준다`, async () => {
    clearFlightRouteEdgeCache();
    const result = await resolveFlightRouteHubsForCinema(TOKYO_UI, {
      originIata: 'PUS',
      destIata: 'NRT',
      invoke,
      timeoutMs: 80,
    });
    assert.ok(result, '폴백 경로');
    assert.equal(result.destIata, 'NRT');
    assert.ok(Array.isArray(result.hubIatas));
  });
}

test('영문 추자도 카드(국내선)는 Edge를 부르지 않는다 — 「조회 중…」 대기 없음', async () => {
  let called = 0;
  const invoke = () => {
    called += 1;
    return new Promise(() => {});
  };
  for (const originIata of ['ICN', 'GMP']) {
    const result = await resolveFlightRouteHubsForCinema(CHUJADO_UI, {
      originIata,
      destIata: 'CJU',
      invoke,
      timeoutMs: 80,
    });
    assert.equal(result, null, `${originIata}→CJU는 동기 직항 경로 사용`);
  }
  assert.equal(called, 0);
});
