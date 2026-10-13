import assert from 'node:assert/strict';
import test from 'node:test';
import {
  isJwtGatewayRejection,
  loggedInMooniAnswerOk,
  readJwtAlg,
  readJwtRole,
  selectGeminiProxyBearer,
} from '../../src/pages/Home/lib/geminiProxyAuth.js';
import { invokeGeminiProxyWithSession } from '../../src/pages/Home/lib/geminiProxyInvoke.js';
import { GeminiProxyError } from '../../src/pages/Home/lib/geminiProxyError.js';

function b64url(obj) {
  return Buffer.from(JSON.stringify(obj)).toString('base64url');
}

function fakeJwt(alg, role, extra = {}) {
  const header = { alg, typ: 'JWT' };
  if (alg === 'ES256') header.kid = 'test-kid';
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    role,
    sub: role === 'authenticated' ? 'user-1' : '',
    iat: now,
    exp: now + 3600,
    ...extra,
  };
  return `${b64url(header)}.${b64url(payload)}.sig`;
}

const ANON = fakeJwt('HS256', 'anon');
const USER_ES256 = fakeJwt('ES256', 'authenticated');
const USER_HS256 = fakeJwt('HS256', 'authenticated');
const ANSWER = '국향대전은 함평에서 열리는 국화 축제예요.';

function bearerRole(authorization) {
  return readJwtRole(String(authorization || '').replace(/^Bearer\s+/i, ''));
}

function gateway401() {
  return {
    ok: false,
    status: 401,
    data: { code: 'UNAUTHORIZED_ASYMMETRIC_JWT', message: 'Invalid JWT' },
    error: { message: 'Edge Function returned a non-2xx status code' },
  };
}

test('ES256 logged-in session uses the anon bearer, not the user JWT', () => {
  const choice = selectGeminiProxyBearer({ anonKey: ANON, accessToken: USER_ES256 });
  assert.equal(choice.kind, 'anon-fallback');
  assert.equal(choice.bearer, ANON);
  assert.equal(readJwtAlg(choice.bearer), 'HS256');
  assert.equal(readJwtRole(choice.bearer), 'anon');
  assert.notEqual(choice.bearer, USER_ES256);
});

test('legacy HS256 user session still sends the user bearer', () => {
  const choice = selectGeminiProxyBearer({ anonKey: ANON, accessToken: USER_HS256 });
  assert.equal(choice.kind, 'user-hs256');
  assert.equal(choice.bearer, USER_HS256);
  assert.equal(readJwtRole(choice.bearer), 'authenticated');
});

test('logged-out session sends the anon bearer', () => {
  const choice = selectGeminiProxyBearer({ anonKey: ANON, accessToken: null });
  assert.equal(choice.kind, 'anon');
  assert.equal(choice.bearer, ANON);
});

test('logged-in ES256 mooni_chat returns a non-empty answer', async () => {
  const calls = [];
  const result = await invokeGeminiProxyWithSession({
    anonKey: ANON,
    accessToken: USER_ES256,
    task: 'mooni_chat',
    params: { userText: '국향대전 한 줄로 알려줘', history: [] },
    invoke: async ({ authorization }) => {
      calls.push(readJwtAlg(authorization.replace(/^Bearer\s+/i, '')));
      if (bearerRole(authorization) === 'authenticated') return gateway401();
      return {
        ok: true,
        status: 200,
        data: {
          success: true,
          text: ANSWER,
          finishReason: 'STOP',
          truncated: false,
          modelUsed: 'gemini-3.1-flash-lite',
        },
      };
    },
  });
  assert.equal(calls.length, 1);
  assert.equal(calls[0], 'HS256');
  assert.equal(loggedInMooniAnswerOk(result.text), true);
  assert.match(result.text, /국향대전/);
});

test('HS256 user 401 falls back to anon and still returns text', async () => {
  const roles = [];
  const result = await invokeGeminiProxyWithSession({
    anonKey: ANON,
    accessToken: USER_HS256,
    task: 'mooni_chat',
    params: { userText: '마산 국화축제 알려줘' },
    invoke: async ({ authorization }) => {
      const role = bearerRole(authorization);
      roles.push(role);
      if (role === 'authenticated') return gateway401();
      return {
        ok: true,
        status: 200,
        data: { success: true, text: '마산가고파국화축제는 창원 마산에서 열려요.', finishReason: 'STOP' },
      };
    },
  });
  assert.deepEqual(roles, ['authenticated', 'anon']);
  assert.equal(loggedInMooniAnswerOk(result.text), true);
  assert.equal(isJwtGatewayRejection(gateway401()), true);
});

test('empty logged-in answer fails the health check', async () => {
  const result = await invokeGeminiProxyWithSession({
    anonKey: ANON,
    accessToken: USER_ES256,
    task: 'mooni_chat',
    params: { userText: '질문' },
    invoke: async () => ({
      ok: true,
      status: 200,
      data: { success: true, text: '   ', finishReason: 'STOP' },
    }),
  });
  assert.equal(loggedInMooniAnswerOk(result.text), false);
  assert.equal(loggedInMooniAnswerOk(''), false);
  assert.equal(loggedInMooniAnswerOk('죄송합니다.'), false);
});

test('logged-in gateway 401 without a fallback answer throws', async () => {
  await assert.rejects(
    () => invokeGeminiProxyWithSession({
      anonKey: ANON,
      accessToken: USER_HS256,
      task: 'mooni_chat',
      params: { userText: '질문' },
      invoke: async () => gateway401(),
    }),
    (err) => err instanceof GeminiProxyError && err.httpStatus === 401,
  );
});
