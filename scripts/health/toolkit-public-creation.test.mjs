import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { resolveToolkitCreationGate } from '../../supabase/functions/_shared/toolkitCreationGate.js';

test('registered slug uses registered mode', () => {
  assert.deepEqual(
    resolveToolkitCreationGate({ slug: 'phuket', canonicalPlaceId: 'phuket', isKnownSlug: true }),
    { ok: true, mode: 'registered', placeId: 'phuket' },
  );
});

test('unregistered uiPlace (Khao Lak) is allowed for any user', () => {
  assert.deepEqual(
    resolveToolkitCreationGate({ slug: 'khao-lak', canonicalPlaceId: 'khao-lak', isKnownSlug: false }),
    { ok: true, mode: 'unregistered', placeId: 'khao-lak' },
  );
  assert.deepEqual(
    resolveToolkitCreationGate({ slug: '카오락', canonicalPlaceId: '카오락', isKnownSlug: false }),
    { ok: true, mode: 'unregistered', placeId: '카오락' },
  );
  assert.deepEqual(
    resolveToolkitCreationGate({ slug: '', canonicalPlaceId: 'search-123', isKnownSlug: false }),
    { ok: true, mode: 'unregistered', placeId: 'search-123' },
  );
});

test('unregistered creation still rejects unusable place_id keys', () => {
  assert.equal(resolveToolkitCreationGate({ slug: '', canonicalPlaceId: '', isKnownSlug: false }).ok, false);
  assert.equal(resolveToolkitCreationGate({ slug: '', canonicalPlaceId: 'a\nb', isKnownSlug: false }).ok, false);
  assert.equal(
    resolveToolkitCreationGate({ slug: '', canonicalPlaceId: 'https://example.com/x', isKnownSlug: false }).ok,
    false,
  );
  assert.equal(
    resolveToolkitCreationGate({ slug: '', canonicalPlaceId: 'x'.repeat(121), isKnownSlug: false }).ok,
    false,
  );
});

test('edge wires the gate and no longer rejects unregistered places', () => {
  const src = readFileSync(new URL('../../supabase/functions/update-place-toolkit/index.ts', import.meta.url), 'utf8');
  assert.match(src, /resolveToolkitCreationGate/);
  assert.doesNotMatch(src, /forbidden: unregistered place/);
  assert.match(src, /creationGate\.mode === 'registered'/);
  assert.match(src, /forbidden: toolkit overwrite requires admin|unauthorized: toolkit overwrite requires admin/);
});
