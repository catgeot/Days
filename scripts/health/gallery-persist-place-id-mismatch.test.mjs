import assert from 'node:assert/strict';
import { test } from 'node:test';
import { resolveGalleryPersistPlaceIdForModeration } from '../../src/shared/api/placeGalleryPersist.js';

test('moderation placeId prefers canonical when loaded row id is not in DB candidates', () => {
  const id = resolveGalleryPersistPlaceIdForModeration(
    '한글레거시행',
    'tour-128113',
    ['tour-128113', '공주 우금치 전적', '우금치'],
  );
  assert.equal(id, 'tour-128113');
});

test('moderation placeId keeps loaded when it is a valid candidate', () => {
  const id = resolveGalleryPersistPlaceIdForModeration(
    'tour-128113',
    'other',
    ['tour-128113', '공주'],
  );
  assert.equal(id, 'tour-128113');
});

test('moderation placeId falls back when candidates empty (legacy path)', () => {
  const id = resolveGalleryPersistPlaceIdForModeration('row-only', 'canon', []);
  assert.equal(id, 'row-only');
});
