import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  STALE_BUNDLE_RELOAD_COOLDOWN_MS,
  clearStaleBundleReloadGuard,
  decideStaleBundleRecoveryAction,
  getEntryBundleId,
  handleStaleBundleLoadFailure,
  markStaleBundleReloadAttempt,
  readStaleBundleReloadGuard,
  staleBundleGuardKey,
} from '../../src/shared/lib/staleBundleRecovery.js';

function mockStorage() {
  const map = new Map();
  return {
    getItem: (k) => (map.has(k) ? map.get(k) : null),
    setItem: (k, v) => map.set(k, v),
    removeItem: (k) => map.delete(k),
  };
}

describe('staleBundleRecovery guard', () => {
  it('getEntryBundleId prefers main index script over recovery chunk', () => {
    const doc = {
      querySelectorAll: () => [
        { getAttribute: () => '/assets/staleBundleRecovery-wupdhuQV.js' },
        { getAttribute: () => '/assets/index-v_YRsKNe.js' },
      ],
    };
    assert.equal(getEntryBundleId(doc), '/assets/index-v_YRsKNe.js');
  });

  it('reloads once then falls back within cooldown', () => {
    const storage = mockStorage();
    const bundleId = '/assets/index-abc.js';
    const t0 = 1_000_000;

    assert.equal(decideStaleBundleRecoveryAction(storage, bundleId, t0), 'reload');

    markStaleBundleReloadAttempt(storage, bundleId, t0);
    assert.deepEqual(readStaleBundleReloadGuard(storage, bundleId), { at: t0 });

    assert.equal(
      decideStaleBundleRecoveryAction(storage, bundleId, t0 + 1_000),
      'fallback',
    );
    assert.equal(
      decideStaleBundleRecoveryAction(storage, bundleId, t0 + STALE_BUNDLE_RELOAD_COOLDOWN_MS + 1),
      'fallback',
    );
  });

  it('handleStaleBundleLoadFailure triggers reload once only', () => {
    const storage = mockStorage();
    const bundleId = '/assets/index-deadbeef.js';
    let reloadCount = 0;
    const reload = () => {
      reloadCount += 1;
    };

    assert.equal(
      handleStaleBundleLoadFailure(new Error('chunk'), storage, bundleId, { reload, now: 100 }),
      'reload',
    );
    assert.equal(reloadCount, 1);
    assert.equal(
      handleStaleBundleLoadFailure(new Error('chunk'), storage, bundleId, { reload, now: 200 }),
      'fallback',
    );
    assert.equal(reloadCount, 1);
  });

  it('clearStaleBundleReloadGuard allows a fresh reload decision', () => {
    const storage = mockStorage();
    const bundleId = '/assets/index-new.js';
    markStaleBundleReloadAttempt(storage, bundleId, 500);
    clearStaleBundleReloadGuard(storage, bundleId);
    assert.equal(readStaleBundleReloadGuard(storage, bundleId), null);
    assert.equal(decideStaleBundleRecoveryAction(storage, bundleId, 600), 'reload');
    assert.equal(staleBundleGuardKey(bundleId), 'gateo:stale-bundle-reload:/assets/index-new.js');
  });
});
