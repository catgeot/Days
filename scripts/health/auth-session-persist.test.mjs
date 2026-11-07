import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { createClient } from '@supabase/supabase-js';
import { createAuthSessionStorage, gateoAuthOptions } from '../../src/shared/api/authSession.js';

const SRC = fileURLToPath(new URL('../../src/', import.meta.url));

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) walk(path, out);
    else if (/\.(js|jsx)$/.test(name)) out.push(path);
  }
  return out;
}

function memoryBacking() {
  const map = new Map();
  return {
    getItem: (key) => (map.has(key) ? map.get(key) : null),
    setItem: (key, value) => {
      map.set(key, String(value));
    },
    removeItem: (key) => {
      map.delete(key);
    },
    key: (index) => [...map.keys()][index] ?? null,
    get length() {
      return map.size;
    },
  };
}

function sessionPayload() {
  return {
    access_token: 'access-token-persist',
    refresh_token: 'refresh-token-persist',
    expires_in: 3600,
    token_type: 'bearer',
    user: {
      id: 'user-persist',
      aud: 'authenticated',
      email: 'persist@gateo.kr',
      role: 'authenticated',
    },
  };
}

test('login session is still in storage for a new client', async () => {
  const backing = memoryBacking();
  const storage = createAuthSessionStorage(backing);
  const previousFetch = globalThis.fetch;
  globalThis.fetch = async (input) => {
    const url = String(input?.url || input);
    if (!url.includes('/token')) {
      throw new Error(`unexpected auth request ${url}`);
    }
    return new Response(JSON.stringify(sessionPayload()), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  };

  try {
    const first = createClient('https://example.supabase.co', 'public-anon-key', {
      auth: gateoAuthOptions(storage),
    });
    const signed = await first.auth.signInWithPassword({
      email: 'persist@gateo.kr',
      password: 'secret-secret',
    });
    assert.equal(signed.error, null);
    assert.equal(signed.data.user.email, 'persist@gateo.kr');
    let stored = false;
    for (let i = 0; i < backing.length; i += 1) {
      if (String(backing.key(i)).includes('-auth-token')) stored = true;
    }
    assert.equal(stored, true);

    const second = createClient('https://example.supabase.co', 'public-anon-key', {
      auth: gateoAuthOptions(storage),
    });
    const restored = await second.auth.getSession();
    assert.equal(restored.error, null);
    assert.equal(restored.data.session?.user?.email, 'persist@gateo.kr');
  } finally {
    globalThis.fetch = previousFetch;
  }
});

test('quota on the auth key evicts other caches and keeps stay listings and history', () => {
  const backing = memoryBacking();
  backing.setItem('gateo:mrt-stays:v23:seoul', 'x'.repeat(20));
  backing.setItem('days_place_chat_intro:osaka', 'intro');
  backing.setItem('gateo_recent_search_keywords', '["오사카"]');
  backing.setItem('gateo_recent_visited_destinations', '[{"name":"오사카"}]');
  backing.setItem('gateo:travel-agencies:v1:visits', '[{"agencyId":"gyg"}]');
  backing.setItem('gateo:korea-festivals:v1:favorites', '["festival"]');
  backing.setItem('days_guest_trips', '[{"id":"t"}]');
  backing.setItem('savedEmail', 'keep@gateo.kr');
  let failsLeft = 1;
  const original = backing.setItem.bind(backing);
  backing.setItem = (key, value) => {
    if (failsLeft > 0 && String(key).includes('-auth-token')) {
      failsLeft -= 1;
      const error = new Error('quota');
      error.name = 'QuotaExceededError';
      throw error;
    }
    original(key, value);
  };
  const storage = createAuthSessionStorage(backing);
  storage.setItem('sb-example-auth-token', '{"access_token":"a"}');
  assert.equal(backing.getItem('gateo:mrt-stays:v23:seoul'), 'x'.repeat(20));
  assert.equal(backing.getItem('days_place_chat_intro:osaka'), null);
  assert.equal(backing.getItem('gateo_recent_search_keywords'), '["오사카"]');
  assert.equal(backing.getItem('gateo_recent_visited_destinations'), '[{"name":"오사카"}]');
  assert.equal(backing.getItem('gateo:travel-agencies:v1:visits'), '[{"agencyId":"gyg"}]');
  assert.equal(backing.getItem('gateo:korea-festivals:v1:favorites'), '["festival"]');
  assert.equal(backing.getItem('days_guest_trips'), '[{"id":"t"}]');
  assert.equal(backing.getItem('savedEmail'), 'keep@gateo.kr');
  assert.equal(backing.getItem('sb-example-auth-token'), '{"access_token":"a"}');
});

test('quota still full after other caches drops only the oldest stay listing', () => {
  const backing = memoryBacking();
  const older = JSON.stringify({ fetchedAt: 10, payload: { city: 'seoul' } });
  const newer = JSON.stringify({ fetchedAt: 20, payload: { city: 'osaka' } });
  backing.setItem('gateo:mrt-stays:v23:seoul', older);
  backing.setItem('gateo:mrt-stays:v23:osaka', newer);
  backing.setItem('days_place_chat_intro:osaka', 'intro');
  backing.setItem('gateo_recent_search_keywords', '["오사카"]');
  backing.setItem('gateo:travel-agencies:v1:visits', '[{"agencyId":"gyg"}]');
  let failsLeft = 2;
  const original = backing.setItem.bind(backing);
  backing.setItem = (key, value) => {
    if (failsLeft > 0 && String(key).includes('-auth-token')) {
      failsLeft -= 1;
      const error = new Error('quota');
      error.name = 'QuotaExceededError';
      throw error;
    }
    original(key, value);
  };
  const storage = createAuthSessionStorage(backing);
  storage.setItem('sb-example-auth-token', '{"access_token":"a"}');
  assert.equal(backing.getItem('days_place_chat_intro:osaka'), null);
  assert.equal(backing.getItem('gateo:mrt-stays:v23:seoul'), null);
  assert.equal(backing.getItem('gateo:mrt-stays:v23:osaka'), newer);
  assert.equal(backing.getItem('gateo_recent_search_keywords'), '["오사카"]');
  assert.equal(backing.getItem('gateo:travel-agencies:v1:visits'), '[{"agencyId":"gyg"}]');
  assert.equal(backing.getItem('sb-example-auth-token'), '{"access_token":"a"}');
  assert.equal(failsLeft, 0);
});

test('quota with only user records leaves search history in place', () => {
  const backing = memoryBacking();
  backing.setItem('gateo_recent_search_keywords', '["교토"]');
  backing.setItem('gateo:travel-agencies:v1:visits', '[{"agencyId":"gyg"}]');
  let failsLeft = 2;
  const original = backing.setItem.bind(backing);
  backing.setItem = (key, value) => {
    if (failsLeft > 0 && String(key).includes('-auth-token')) {
      failsLeft -= 1;
      const error = new Error('quota');
      error.name = 'QuotaExceededError';
      throw error;
    }
    original(key, value);
  };
  const storage = createAuthSessionStorage(backing);
  assert.throws(
    () => storage.setItem('sb-example-auth-token', '{"access_token":"a"}'),
    (error) => error?.name === 'QuotaExceededError',
  );
  assert.equal(backing.getItem('gateo_recent_search_keywords'), '["교토"]');
  assert.equal(backing.getItem('gateo:travel-agencies:v1:visits'), '[{"agencyId":"gyg"}]');
  assert.equal(backing.getItem('sb-example-auth-token'), null);
});

test('app code does not call auth.getUser on load', () => {
  const hits = walk(SRC).filter((path) => {
    if (path.endsWith(`${join('shared', 'Auth', 'sessionUser.js')}`)) return false;
    const text = readFileSync(path, 'utf8');
    return /auth\.getUser\(/.test(text);
  });
  assert.deepEqual(hits, []);
});
