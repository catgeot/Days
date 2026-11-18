import assert from 'node:assert/strict';
import test from 'node:test';
import {
  parsePlaceServiceModalDeeplink,
  preserveServiceModalDeeplinkSearch,
  PLACE_SERVICE_MODAL_OPEN_VALUES,
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