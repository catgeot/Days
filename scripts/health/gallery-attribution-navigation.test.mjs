import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  navigateGalleryAttributionLink,
  saveGalleryAttributionReturnState,
  consumeGalleryAttributionReturnState,
  readGalleryAttributionReturnState,
  GALLERY_ATTRIBUTION_RETURN_KEY,
} from '../../src/components/PlaceCard/common/galleryAttributionNavigation.js';

test('navigateGalleryAttributionLink always stops propagation on desktop', () => {
  const stops = [];
  const event = {
    preventDefault: () => {},
    stopPropagation: () => stops.push('stop'),
  };
  navigateGalleryAttributionLink(event, {
    placeKey: 'cairo',
    image: { id: 'u-1' },
    href: 'https://unsplash.com/?utm_source=gateo&utm_medium=referral',
    context: 'gallery-grid',
  });
  assert.deepEqual(stops, ['stop']);
});

test('gallery-grid return state stores scroll and is consumed', () => {
  globalThis.sessionStorage = {
    store: new Map(),
    getItem(k) {
      return this.store.get(k) ?? null;
    },
    setItem(k, v) {
      this.store.set(k, v);
    },
    removeItem(k) {
      this.store.delete(k);
    },
  };
  saveGalleryAttributionReturnState({
    placeKey: 'venice',
    image: { id: 'pexels-1' },
    context: 'gallery-grid',
    galleryScrollTop: 416,
  });
  const raw = readGalleryAttributionReturnState();
  assert.equal(raw.context, 'gallery-grid');
  assert.equal(raw.galleryScrollTop, 416);
  const pending = consumeGalleryAttributionReturnState('venice', 'gallery-grid');
  assert.equal(pending.galleryScrollTop, 416);
  assert.equal(sessionStorage.getItem(GALLERY_ATTRIBUTION_RETURN_KEY), null);
});
