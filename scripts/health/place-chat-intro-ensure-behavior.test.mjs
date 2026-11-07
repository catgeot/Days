import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import {
  ACCEPTED_FIXTURE_INTRO,
  installPlaceIntroEnsureFetchMock,
  installPlaceIntroMockStorage,
} from './place-chat-intro-ensure-fetch-mock.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const worker = join(root, 'scripts/health/place-chat-intro-ensure-once-worker.mjs');

function runWorker(env) {
  const res = spawnSync(
    process.execPath,
    ['--import', join(root, 'scripts/register-src-esm.mjs'), worker],
    {
      cwd: root,
      env: { ...process.env, ...env },
      encoding: 'utf8',
    },
  );
  assert.equal(res.status, 0, res.stderr || res.stdout);
  return JSON.parse(res.stdout.trim());
}

test('동시 ensure 2회 — gemini·save 각 1회', async () => {
  installPlaceIntroMockStorage();
  const counters = installPlaceIntroEnsureFetchMock({ geminiDelayMs: 120 });
  const { ensurePlaceChatIntroForLocation, resetPlaceChatIntroEnsureStateForTests } = await import(
    '../../src/pages/Home/lib/placeChatIntro.js'
  );
  resetPlaceChatIntroEnsureStateForTests();

  const loc = { slug: 'concurrent-a', name: '동시호출섬', country: '격리테스트국' };
  const [a, b] = await Promise.all([
    ensurePlaceChatIntroForLocation(loc, { lng: 'ko' }),
    ensurePlaceChatIntroForLocation(loc, { lng: 'ko' }),
  ]);
  assert.equal(a, b);
  assert.ok(a?.includes('격리테스트섬'));
  assert.equal(counters.geminiCalls, 1, 'gemini');
  assert.equal(counters.saveCalls, 1, 'save RPC');
  assert.ok(counters.maxConcurrentGemini <= 1, '단일 inflight');
});

test('생성 실패 — RPC·유효 localStorage 없음, 동일 세션 재호출 억제', async () => {
  installPlaceIntroMockStorage();
  const counters = installPlaceIntroEnsureFetchMock({ geminiMode: 'empty' });
  const {
    ensurePlaceChatIntroForLocation,
    loadPlaceChatIntroLocal,
    resolvePlaceChatIntroPersistKey,
    resetPlaceChatIntroEnsureStateForTests,
  } = await import('../../src/pages/Home/lib/placeChatIntro.js');
  resetPlaceChatIntroEnsureStateForTests();

  const loc = { slug: 'gen-fail', name: '생성실패섬', country: '격리테스트국' };
  const persistKey = resolvePlaceChatIntroPersistKey(loc, 'ko');
  assert.ok(persistKey);

  const first = await ensurePlaceChatIntroForLocation(loc, { lng: 'ko' });
  assert.equal(first, null);
  assert.equal(counters.geminiCalls, 1);
  assert.equal(counters.saveCalls, 0);
  assert.equal(loadPlaceChatIntroLocal(persistKey, 'ko'), null);

  const second = await ensurePlaceChatIntroForLocation(loc, { lng: 'ko' });
  assert.equal(second, null);
  assert.equal(counters.geminiCalls, 1, 'introEnsureFailed — 동일 세션 재생성 없음');
  assert.equal(counters.saveCalls, 0);
});

test('생성 실패 후 새 JS 컨텍스트(정상 방문) — 회복 가능', () => {
  const failed = runWorker({
    PLACE_INTRO_GEMINI_MODE: 'empty',
    PLACE_INTRO_FIXTURE: 'gen-fail-recovery',
  });
  assert.equal(failed.gemini, 1);
  assert.equal(failed.save, 0);
  assert.equal(failed.text, null);

  const recovered = runWorker({
    PLACE_INTRO_GEMINI_MODE: 'ok',
    PLACE_INTRO_FIXTURE: 'gen-fail-recovery',
  });
  assert.equal(recovered.gemini, 1, '새 페이지 로드급 컨텍스트에서 재시도');
  assert.equal(recovered.save, 1);
  assert.ok(recovered.text);
});

test('저장 실패 — 생성 1회·RPC 실패·local에는 저장(제품), 동일 세션 재호출 시 generate 0', async () => {
  installPlaceIntroMockStorage();
  const counters = installPlaceIntroEnsureFetchMock({ saveFail: true });
  const {
    ensurePlaceChatIntroForLocation,
    loadPlaceChatIntroLocal,
    resolvePlaceChatIntroPersistKey,
    resetPlaceChatIntroEnsureStateForTests,
  } = await import('../../src/pages/Home/lib/placeChatIntro.js');
  resetPlaceChatIntroEnsureStateForTests();

  const loc = { slug: 'save-fail', name: '저장실패섬', country: '격리테스트국' };
  const persistKey = resolvePlaceChatIntroPersistKey(loc, 'ko');
  const first = await ensurePlaceChatIntroForLocation(loc, { lng: 'ko' });
  assert.ok(first?.includes('격리테스트섬'));
  assert.equal(counters.geminiCalls, 1);
  assert.equal(counters.saveCalls, 1);
  const local = loadPlaceChatIntroLocal(persistKey, 'ko');
  assert.equal(local, ACCEPTED_FIXTURE_INTRO, 'persist: RPC 실패해도 localStorage 먼저 기록(제품)');

  counters.geminiCalls = 0;
  counters.saveCalls = 0;
  const second = await ensurePlaceChatIntroForLocation(loc, { lng: 'ko' });
  assert.ok(second);
  assert.equal(counters.geminiCalls, 0, 'local hit — 재생성 없음');
  assert.equal(counters.saveCalls, 0, '캐시 hit — 재저장 없음');
});
