import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  STALE_BUNDLE_LEAVE_WINDOW_MS,
  STALE_BUNDLE_RELOAD_COOLDOWN_MS,
  STALE_BUNDLE_BOOT_CLEAR_MS,
  cancelStaleBundleBootClear,
  clearStaleBundleReloadGuard,
  decideStaleBundleRecoveryAction,
  getEntryBundleId,
  handleStaleBundleLoadFailure,
  installStaleBundleRecovery,
  markStaleBundleReloadAttempt,
  readStaleBundleReloadGuard,
  resetLazyChunkTracking,
  scheduleStaleBundleBootClear,
  shouldIgnoreStaleBundleSignal,
  staleBundleGuardKey,
  trackLazyChunkLoad,
} from '../../src/shared/lib/staleBundleRecovery.js';

function mockStorage() {
  const map = new Map();
  return {
    getItem: (k) => (map.has(k) ? map.get(k) : null),
    setItem: (k, v) => map.set(k, v),
    removeItem: (k) => map.delete(k),
  };
}

function createLeaveClock() {
  let at = 1_000_000;
  let nextId = 1;
  const timers = new Map();
  const listeners = new Map();
  const target = {
    addEventListener(type, fn) {
      const list = listeners.get(type) || [];
      list.push(fn);
      listeners.set(type, list);
    },
    removeEventListener(type, fn) {
      listeners.set(type, (listeners.get(type) || []).filter((item) => item !== fn));
    },
  };
  const dispatch = (type, event = {}) => {
    for (const fn of [...(listeners.get(type) || [])]) fn(event);
  };
  const schedule = (ms, fn) => {
    const id = nextId;
    nextId += 1;
    timers.set(id, { at: at + ms, fn });
    return id;
  };
  const cancel = (id) => {
    timers.delete(id);
  };
  const advance = (ms) => {
    at += ms;
    let progressed = true;
    while (progressed) {
      progressed = false;
      const due = [...timers.entries()]
        .filter(([, timer]) => timer.at <= at)
        .sort((a, b) => a[1].at - b[1].at);
      for (const [id, timer] of due) {
        if (!timers.has(id)) continue;
        timers.delete(id);
        progressed = true;
        timer.fn();
      }
    }
  };
  return {
    target,
    dispatch,
    schedule,
    cancel,
    advance,
    now: () => at,
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

  it('ignores chunk signals only inside the leave window', () => {
    const start = 5_000;
    const until = start + STALE_BUNDLE_LEAVE_WINDOW_MS;
    assert.equal(STALE_BUNDLE_LEAVE_WINDOW_MS, 2_000);
    assert.equal(shouldIgnoreStaleBundleSignal({ now: start, leavingUntil: until }), true);
    assert.equal(shouldIgnoreStaleBundleSignal({ now: until - 1, leavingUntil: until }), true);
    assert.equal(shouldIgnoreStaleBundleSignal({ now: until, leavingUntil: until }), false);
    assert.equal(shouldIgnoreStaleBundleSignal({ now: start, leavingUntil: 0 }), false);
    assert.equal(shouldIgnoreStaleBundleSignal(), false);
  });

  it('beforeunload then a document that stays reloads once the window ends', () => {
    const clock = createLeaveClock();
    let reloads = 0;
    const uninstall = installStaleBundleRecovery({
      window: clock.target,
      storage: mockStorage(),
      getBundleId: () => '/assets/index-leave.js',
      now: clock.now,
      schedule: clock.schedule,
      cancel: clock.cancel,
      reload: () => {
        reloads += 1;
      },
    });

    clock.dispatch('beforeunload');
    clock.dispatch('vite:preloadError', { preventDefault() {} });
    assert.equal(reloads, 0);

    clock.advance(STALE_BUNDLE_LEAVE_WINDOW_MS - 1);
    clock.dispatch('vite:preloadError', { preventDefault() {} });
    assert.equal(reloads, 0);

    clock.advance(1);
    assert.equal(reloads, 0);
    clock.dispatch('vite:preloadError', { preventDefault() {} });
    assert.equal(reloads, 1);

    uninstall();
  });

  it('pageshow clears the leave window for a bfcache or cancelled stay', () => {
    for (const persisted of [true, false]) {
      const clock = createLeaveClock();
      let reloads = 0;
      const uninstall = installStaleBundleRecovery({
        window: clock.target,
        storage: mockStorage(),
        getBundleId: () => `/assets/index-show-${persisted}.js`,
        now: clock.now,
        schedule: clock.schedule,
        cancel: clock.cancel,
        reload: () => {
          reloads += 1;
        },
      });

      clock.dispatch('beforeunload');
      clock.dispatch('pageshow', { persisted });
      clock.dispatch('vite:preloadError', { preventDefault() {} });
      assert.equal(reloads, 1, `persisted=${persisted}`);
      uninstall();
    }
  });

  it('boot success keeps the reload guard until the grace period runs', () => {
    const storage = mockStorage();
    const bundleId = '/assets/index-boot.js';
    markStaleBundleReloadAttempt(storage, bundleId, 10);
    let scheduledMs = 0;
    let clearFn = null;
    let cancelled = false;
    scheduleStaleBundleBootClear({
      storage,
      bundleId,
      schedule: (ms, fn) => {
        scheduledMs = ms;
        clearFn = fn;
        return 7;
      },
      cancel: () => {
        cancelled = true;
      },
    });
    assert.equal(scheduledMs, STALE_BUNDLE_BOOT_CLEAR_MS);
    assert.deepEqual(readStaleBundleReloadGuard(storage, bundleId), { at: 10 });

    const clock = createLeaveClock();
    let reloads = 0;
    const uninstall = installStaleBundleRecovery({
      window: clock.target,
      storage,
      getBundleId: () => bundleId,
      now: clock.now,
      schedule: clock.schedule,
      cancel: clock.cancel,
      reload: () => {
        reloads += 1;
      },
    });
    clock.dispatch('vite:preloadError', { preventDefault() {} });
    assert.equal(reloads, 0);
    assert.equal(cancelled, true);
    assert.deepEqual(readStaleBundleReloadGuard(storage, bundleId), { at: 10 });

    clearFn();
    assert.equal(readStaleBundleReloadGuard(storage, bundleId), null);
    clock.dispatch('vite:preloadError', { preventDefault() {} });
    assert.equal(reloads, 1);
    uninstall();
    cancelStaleBundleBootClear();
  });

  it('leave window does not cancel the deferred guard clear', () => {
    const storage = mockStorage();
    const bundleId = '/assets/index-leave-boot.js';
    let bootCancels = 0;
    scheduleStaleBundleBootClear({
      storage,
      bundleId,
      schedule: () => 42,
      cancel: () => {
        bootCancels += 1;
      },
    });
    const clock = createLeaveClock();
    const uninstall = installStaleBundleRecovery({
      window: clock.target,
      storage,
      getBundleId: () => bundleId,
      now: clock.now,
      schedule: clock.schedule,
      cancel: clock.cancel,
      reload: () => {},
    });
    clock.dispatch('beforeunload');
    clock.dispatch('vite:preloadError', { preventDefault() {} });
    assert.equal(bootCancels, 0);
    uninstall();
    cancelStaleBundleBootClear();
  });

  it('a lazy chunk that never settles does not clear the reload guard', async () => {
    resetLazyChunkTracking();
    const storage = mockStorage();
    const bundleId = '/assets/index-hang.js';
    markStaleBundleReloadAttempt(storage, bundleId, 10);
    let scheduled = false;
    trackLazyChunkLoad(new Promise(() => {}), {
      storage,
      bundleId,
      schedule: () => {
        scheduled = true;
        return 1;
      },
      cancel: () => {},
    });
    await new Promise((resolve) => setTimeout(resolve, 30));
    assert.equal(scheduled, false);
    assert.deepEqual(readStaleBundleReloadGuard(storage, bundleId), { at: 10 });
    resetLazyChunkTracking();
  });

  it('a settled lazy chunk schedules the guard clear', async () => {
    resetLazyChunkTracking();
    const storage = mockStorage();
    const bundleId = '/assets/index-settled.js';
    markStaleBundleReloadAttempt(storage, bundleId, 10);
    let scheduledMs = 0;
    trackLazyChunkLoad(Promise.resolve({ default() {} }), {
      storage,
      bundleId,
      schedule: (ms) => {
        scheduledMs = ms;
        return 1;
      },
      cancel: () => {},
    });
    await new Promise((resolve) => setTimeout(resolve, 20));
    assert.equal(scheduledMs, STALE_BUNDLE_BOOT_CLEAR_MS);
    assert.deepEqual(readStaleBundleReloadGuard(storage, bundleId), { at: 10 });
    resetLazyChunkTracking();
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
