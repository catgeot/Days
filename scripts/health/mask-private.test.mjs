import assert from 'node:assert/strict';
import { test } from 'node:test';
import { maskPrivate } from './mask-private.mjs';

const DETAIL =
  'HTTP 429 page_ip_limited from 203.0.113.7 / 2001:db8::1 — used 6000u of 10000u, cost $12 {"quota":{"used":9876,"limit":10000}} eyJhbGciOiJIUzI1NiJ9.a.b';

test('maskPrivate redacts sensitive ops detail', () => {
  const out = maskPrivate(`\u001b[31m${DETAIL}\u001b[39m`);
  assert.doesNotMatch(out, /203\.0\.113\.7/);
  assert.doesNotMatch(out, /2001:db8/);
  assert.doesNotMatch(out, /6000u/);
  assert.doesNotMatch(out, /\$12/);
  assert.doesNotMatch(out, /eyJ/);
  assert.doesNotMatch(out, /9876/);
  assert.doesNotMatch(out, /\u001b/);
});

test('maskPrivate keeps non-sensitive ids', () => {
  const out = maskPrivate('cache_key=list:ko:rolling12 items=3 festival_id=ABC-12');
  assert.match(out, /items=3/);
  assert.match(out, /ABC-12/);
});
