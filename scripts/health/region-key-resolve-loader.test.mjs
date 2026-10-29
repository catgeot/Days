import assert from 'node:assert/strict';
import test from 'node:test';

import { GATEO_ENV_FLAG_NAMES } from '../../src/shared/gateoFeatureFlags.js';

async function withAllAssetsFlags(siteSearch, allAssets, fn) {
  const siteKey = GATEO_ENV_FLAG_NAMES.SITE_SEARCH;
  const allKey = GATEO_ENV_FLAG_NAMES.SITE_SEARCH_ALL_ASSETS;
  const prevSite = globalThis.__VITE_ENV__[siteKey];
  const prevAll = globalThis.__VITE_ENV__[allKey];
  globalThis.__VITE_ENV__[siteKey] = siteSearch ? '1' : '';
  globalThis.__VITE_ENV__[allKey] = allAssets ? '1' : '';
  try {
    return await fn();
  } finally {
    globalThis.__VITE_ENV__[siteKey] = prevSite;
    globalThis.__VITE_ENV__[allKey] = prevAll;
  }
}

test('loadSiteSearchRegionKeyResolve dynamic import when rollout flags on', async () => {
  await withAllAssetsFlags(true, true, async () => {
    const { loadSiteSearchRegionKeyResolve } = await import(
      '../../src/pages/Home/lib/siteSearchAllAssets/loadRegionKeyResolve.js'
    );
    const mod = await loadSiteSearchRegionKeyResolve();
    assert.ok(mod);
    assert.equal(typeof mod.resolveRegionKey, 'function');
  });
});

test('loadSiteSearchRegionKeyResolve returns null when flags off', async () => {
  await withAllAssetsFlags(false, false, async () => {
    const { loadSiteSearchRegionKeyResolve } = await import(
      '../../src/pages/Home/lib/siteSearchAllAssets/loadRegionKeyResolve.js'
    );
    assert.equal(await loadSiteSearchRegionKeyResolve(), null);
  });
});
