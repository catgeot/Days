import assert from 'node:assert/strict';
import test from 'node:test';
import {
  loadProjectJwks,
  resetUserJwtCache,
  resolveRateLimitIdentity,
  verifyEs256UserJwt,
} from '../../supabase/functions/_shared/gemini/userJwt.js';

const SUB = '00000000-0000-4000-8000-0000000000aa';

function b64url(bytes) {
  return Buffer.from(bytes).toString('base64url');
}

async function keyPair(kid) {
  const pair = await crypto.subtle.generateKey(
    { name: 'ECDSA', namedCurve: 'P-256' },
    true,
    ['sign', 'verify'],
  );
  const jwk = await crypto.subtle.exportKey('jwk', pair.publicKey);
  return {
    privateKey: pair.privateKey,
    jwks: [{ kty: 'EC', crv: 'P-256', alg: 'ES256', kid, x: jwk.x, y: jwk.y, use: 'sig' }],
  };
}

async function signUserJwt(privateKey, { kid, sub = SUB, role = 'authenticated', exp, aud = 'authenticated' }) {
  const header = b64url(Buffer.from(JSON.stringify({ alg: 'ES256', typ: 'JWT', kid })));
  const payload = b64url(Buffer.from(JSON.stringify({
    role,
    sub,
    aud,
    iat: exp - 60,
    exp,
  })));
  const sig = await crypto.subtle.sign(
    { name: 'ECDSA', hash: 'SHA-256' },
    privateKey,
    new TextEncoder().encode(`${header}.${payload}`),
  );
  return `${header}.${payload}.${b64url(sig)}`;
}

test('a signed ES256 user token sets the uid and a bad signature does not', async () => {
  const { privateKey, jwks } = await keyPair('kid-1');
  const now = Math.floor(Date.now() / 1000);
  const token = await signUserJwt(privateKey, { kid: 'kid-1', exp: now + 600 });
  const verified = await verifyEs256UserJwt(token, jwks, now);
  assert.deepEqual(verified, { role: 'authenticated', sub: SUB });

  const flipped = `${token.slice(0, -4)}AAAA`;
  assert.equal(await verifyEs256UserJwt(flipped, jwks, now), null);

  const identity = await resolveRateLimitIdentity({
    authorizationRole: 'anon',
    authorizationSub: '',
    userJwt: token,
    jwks,
    nowSec: now,
  });
  assert.equal(identity.userJwt, 'verified');
  assert.equal(identity.role, 'authenticated');
  assert.equal(identity.sub, SUB);
  assert.equal(JSON.stringify(identity).includes(token), false);

  const forged = await resolveRateLimitIdentity({
    authorizationRole: 'anon',
    authorizationSub: '',
    userJwt: flipped,
    jwks,
    nowSec: now,
  });
  assert.equal(forged.userJwt, 'rejected');
  assert.equal(forged.role, 'anon');
  assert.equal(forged.sub, '');
});

test('rejected body token keeps a gateway-verified HS256 user', async () => {
  const identity = await resolveRateLimitIdentity({
    authorizationRole: 'authenticated',
    authorizationSub: 'user-hs256',
    userJwt: 'not-a-jwt',
    jwks: [],
    nowSec: 1_700_000_000,
  });
  assert.equal(identity.userJwt, 'rejected');
  assert.equal(identity.role, 'authenticated');
  assert.equal(identity.sub, 'user-hs256');
});

test('expired, wrong-role, and non-uuid tokens are not a uid', async () => {
  const { privateKey, jwks } = await keyPair('kid-2');
  const now = 1_700_000_000;
  const expired = await signUserJwt(privateKey, { kid: 'kid-2', exp: now - 60 });
  const anon = await signUserJwt(privateKey, { kid: 'kid-2', role: 'anon', exp: now + 600 });
  const badSub = await signUserJwt(privateKey, { kid: 'kid-2', sub: 'user-1', exp: now + 600 });
  assert.equal(await verifyEs256UserJwt(expired, jwks, now), null);
  assert.equal(await verifyEs256UserJwt(anon, jwks, now), null);
  assert.equal(await verifyEs256UserJwt(badSub, jwks, now), null);
});

test('JWKS load is cached and a failed load does not invent keys', async () => {
  resetUserJwtCache();
  let hits = 0;
  const keys = [{ kid: 'k', kty: 'EC', x: 'x', y: 'y' }];
  const fetchImpl = async () => {
    hits += 1;
    return { ok: true, json: async () => ({ keys }) };
  };
  const first = await loadProjectJwks(fetchImpl, 'https://example.supabase.co', 1_000);
  const second = await loadProjectJwks(fetchImpl, 'https://example.supabase.co', 1_000 + 1000);
  assert.equal(hits, 1);
  assert.equal(first, keys);
  assert.equal(second, keys);
  resetUserJwtCache();
  await assert.rejects(
    () => loadProjectJwks(async () => ({ ok: false }), 'https://example.supabase.co', 2_000),
    /jwks_unavailable/,
  );
});
