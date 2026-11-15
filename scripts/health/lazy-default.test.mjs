import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { hasLazyDefault, importLazyDefault } from '../../src/shared/lib/lazyDefault.js';

describe('lazyDefault', () => {
  it('resolves a module that has a default export', async () => {
    const Place = function Place() {};
    const mod = await importLazyDefault(() => Promise.resolve({ default: Place }));
    assert.equal(mod.default, Place);
    assert.equal(hasLazyDefault(mod), true);
  });

  it('does not fulfill when Vite returns undefined after preventDefault', async () => {
    let settled = false;
    const pending = importLazyDefault(() => Promise.resolve(undefined));
    pending.then(() => {
      settled = true;
    }, () => {
      settled = true;
    });
    await new Promise((resolve) => setTimeout(resolve, 30));
    assert.equal(settled, false);
    assert.equal(hasLazyDefault(undefined), false);
    assert.equal(hasLazyDefault({}), false);
  });
});
