import assert from 'node:assert/strict';
import test from 'node:test';
import {
  buildPlacePathWithStrippedServiceModalDeeplink,
  hasRawPlaceServiceModalOpenQuery,
  parsePlaceServiceModalDeeplink,
  preserveServiceModalDeeplinkSearch,
  PLACE_SERVICE_MODAL_OPEN_VALUES,
  stripPlaceServiceModalDeeplinkSearch,
  syncPlaceServiceModalDeeplinkDisplayUrl,
} from '../../src/pages/Home/lib/placeServiceModalDeeplink.js';
import { buildServiceModalOpenEvent } from '../../src/shared/serviceRegion/serviceRegionSearchModel.js';
import { buildPlacePath } from '../../src/utils/placePlannerPath.js';

test('open allows tour and stay only', () => {
  assert.equal(PLACE_SERVICE_MODAL_OPEN_VALUES.has('tour'), true);
  assert.equal(PLACE_SERVICE_MODAL_OPEN_VALUES.has('stay'), true);
  assert.deepEqual(parsePlaceServiceModalDeeplink('open=foo'), { open: null, from: null });
  assert.deepEqual(parsePlaceServiceModalDeeplink('open=tour&from=review'), {
    open: 'tour',
    from: 'review',
  });
  assert.deepEqual(parsePlaceServiceModalDeeplink('open=stay'), { open: 'stay', from: null });
});

test('from must be a short slug', () => {
  assert.deepEqual(parsePlaceServiceModalDeeplink('open=tour&from=Review'), {
    open: 'tour',
    from: null,
  });
  assert.deepEqual(parsePlaceServiceModalDeeplink('open=tour&from=ab'), {
    open: 'tour',
    from: 'ab',
  });
  assert.deepEqual(parsePlaceServiceModalDeeplink('open=tour&from=' + 'a'.repeat(33)), {
    open: 'tour',
    from: null,
  });
});

test('preserve search keeps open and from only', () => {
  assert.equal(
    preserveServiceModalDeeplinkSearch('?open=tour&from=review&lang=ko&q=foo'),
    '?open=tour&from=review',
  );
  assert.equal(preserveServiceModalDeeplinkSearch('?lang=ko'), '');
});

test('buildPlacePath plus deeplink query', () => {
  const path = `${buildPlacePath('kyoto')}${preserveServiceModalDeeplinkSearch('?open=tour&from=review')}`;
  assert.equal(path, '/place/kyoto?open=tour&from=review');
});

test('strip removes open and from only', () => {
  assert.equal(
    stripPlaceServiceModalDeeplinkSearch('?open=tour&from=review&lang=ko&q=foo'),
    '?lang=ko&q=foo',
  );
  assert.equal(stripPlaceServiceModalDeeplinkSearch('?open=foo&from=review&lang=ko'), '?lang=ko');
  assert.equal(stripPlaceServiceModalDeeplinkSearch('?lang=ko'), '?lang=ko');
  assert.equal(hasRawPlaceServiceModalOpenQuery('?open=foo'), true);
  assert.equal(hasRawPlaceServiceModalOpenQuery('?lang=ko'), false);
});

test('buildPlacePathWithStrippedServiceModalDeeplink', () => {
  assert.equal(
    buildPlacePathWithStrippedServiceModalDeeplink('kyoto', {
      search: '?open=stay&from=review&lang=ko',
    }),
    '/place/kyoto?lang=ko',
  );
  assert.equal(
    buildPlacePathWithStrippedServiceModalDeeplink('kyoto', {
      tab: 'planner',
      search: '?open=tour&lang=ko',
    }),
    '/place/kyoto/planner?lang=ko',
  );
});

test('syncPlaceServiceModalDeeplinkDisplayUrl updates address bar only', () => {
  if (typeof window === 'undefined' || typeof window.history?.replaceState !== 'function') return;
  const prevPath = `${window.location.pathname}${window.location.search}`;
  syncPlaceServiceModalDeeplinkDisplayUrl('/place/kyoto?lang=ko');
  assert.equal(window.location.pathname, '/place/kyoto');
  assert.equal(window.location.search, '?lang=ko');
  syncPlaceServiceModalDeeplinkDisplayUrl(prevPath || '/');
});

test('service_modal_open deeplink GA payload', () => {
  const event = buildServiceModalOpenEvent({
    service: 'tour',
    from: 'deeplink',
    ref: 'review',
    slug: 'Kyoto',
  });
  assert.equal(event.name, 'service_modal_open');
  assert.deepEqual(event.params, {
    service: 'tour',
    from: 'deeplink',
    ref: 'review',
    slug: 'kyoto',
  });
  const button = buildServiceModalOpenEvent({ service: 'stay', from: 'button', slug: 'jeju' });
  assert.equal(button.params.from, 'button');
  assert.equal(Object.hasOwn(button.params, 'ref'), false);
});