import assert from 'node:assert/strict';
import { trackEvent, trackMooniOpenIfRising } from '../src/shared/analytics/trackEvent.js';

const calls = [];
globalThis.window = { gtag: (...args) => calls.push(args) };

assert.equal(
  trackMooniOpenIfRising(false, true, {
    placement: 'festival_detail',
    festival_id: '1998564',
    ui_lang: 'ko',
  }),
  true,
);
assert.equal(trackMooniOpenIfRising(true, true, { placement: 'festival_detail' }), false);
assert.equal(trackMooniOpenIfRising(true, false, { placement: 'festival_detail' }), false);
assert.equal(calls.length, 1);
assert.equal(calls[0][1], 'mooni_open');
assert.equal(calls[0][2].festival_id, '1998564');
assert.equal(calls[0][2].placement, 'festival_detail');

delete globalThis.window;
assert.doesNotThrow(() => trackEvent('mooni_open', { placement: 'home' }));
assert.doesNotThrow(() =>
  trackMooniOpenIfRising(false, true, { placement: 'home', ui_lang: 'en' }),
);

console.log('smoke-mooni-open: OK');
