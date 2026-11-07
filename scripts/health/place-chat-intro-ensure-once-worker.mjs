/**
 * 단일 ensure 호출 — 별도 Node 프로세스(모듈 상태 초기화)용. 운영 미호출.
 */
import assert from 'node:assert/strict';
import { installPlaceIntroEnsureFetchMock, installPlaceIntroMockStorage } from './place-chat-intro-ensure-fetch-mock.mjs';

const mode = process.env.PLACE_INTRO_GEMINI_MODE || 'ok';
const fixture = process.env.PLACE_INTRO_FIXTURE || 'worker-default';
const counters = installPlaceIntroEnsureFetchMock({ geminiMode: mode });
installPlaceIntroMockStorage();

const { ensurePlaceChatIntroForLocation, resetPlaceChatIntroEnsureStateForTests } = await import(
  '../../src/pages/Home/lib/placeChatIntro.js'
);
resetPlaceChatIntroEnsureStateForTests();

const loc =
  fixture === 'gen-fail-recovery'
    ? { slug: 'gen-fail-recovery', name: '생성실패회복섬', country: '격리테스트국' }
    : { slug: fixture, name: `워커-${fixture}`, country: '격리테스트국' };

const text = await ensurePlaceChatIntroForLocation(loc, { lng: 'ko' });
process.stdout.write(
  JSON.stringify({
    text: text ? text.slice(0, 40) : null,
    gemini: counters.geminiCalls,
    save: counters.saveCalls,
  }),
);
