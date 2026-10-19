import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  isDocumentRootBlank,
  maybeReloadBlankPersistedPage,
} from '../../src/shared/lib/persistedBlankPageReload.js';

describe('persistedBlankPageReload', () => {
  it('isDocumentRootBlank is false when root has children', () => {
    const root = { childElementCount: 2 };
    global.document = {
      getElementById: () => root,
      body: { childElementCount: 1 },
    };
    assert.equal(isDocumentRootBlank(), false);
  });

  it('maybeReloadBlankPersistedPage reloads once when persisted and root empty', () => {
    const root = { childElementCount: 0, replaceChildren: () => {} };
    global.document = {
      getElementById: () => root,
      body: { childElementCount: 0 },
    };
    const store = new Map();
    global.sessionStorage = {
      getItem: (k) => store.get(k) ?? null,
      setItem: (k, v) => store.set(k, v),
      removeItem: (k) => store.delete(k),
    };
    let reloadCount = 0;
    global.window = {
      location: { reload: () => {
        reloadCount += 1;
      } },
    };
    const event = { persisted: true };
    assert.equal(maybeReloadBlankPersistedPage(event), true);
    assert.equal(reloadCount, 1);
    assert.equal(maybeReloadBlankPersistedPage(event), false);
    assert.equal(reloadCount, 1);
  });
});
