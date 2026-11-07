import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

import {
  GATEO_ENV_FLAG_NAMES,
  isGateoSelfReelsEnabled,
  isGateoSelfReelsFixtureEnabled,
} from '../src/shared/gateoFeatureFlags.js';
import { isSelfReelsRouteEnabled } from '../src/pages/SelfReels/isSelfReelsRouteEnabled.js';

const EMPTY_MESSAGE = '확인할 영상이 없어요.';

const ROOT_FILES = [
  'src/App.jsx',
  'src/pages/SelfReels/SelfReelsPage.jsx',
  'src/pages/Home/index.jsx',
  'src/pages/Home/lib/siteSearchOpen.js',
  'src/pages/Home/data/koglReels.js',
  'scripts/kogl-reels.test.mjs',
  'vite.config.js',
  'scripts/generate-sitemap.cjs',
];

function read(rel) {
  return fs.readFileSync(new URL(`../${rel}`, import.meta.url), 'utf8');
}

function withViteEnv(patch, fn) {
  const prev = { ...globalThis.__VITE_ENV__ };
  globalThis.__VITE_ENV__ = { ...prev, ...patch };
  try {
    return fn();
  } finally {
    globalThis.__VITE_ENV__ = prev;
  }
}

test('self reels flag and route default off', () => {
  const page = GATEO_ENV_FLAG_NAMES.SELF_REELS;
  const fixture = GATEO_ENV_FLAG_NAMES.SELF_REELS_FIXTURE;
  withViteEnv({ [page]: '', [fixture]: '' }, () => {
    assert.equal(isGateoSelfReelsEnabled(), false);
    assert.equal(isSelfReelsRouteEnabled(), false);
    assert.equal(isGateoSelfReelsFixtureEnabled(), false);
  });
});

test('self reels route is on only for flag value 1', () => {
  const page = GATEO_ENV_FLAG_NAMES.SELF_REELS;
  for (const value of ['0', 'true', 'yes', 'on', 'false']) {
    withViteEnv({ [page]: value }, () => {
      assert.equal(isGateoSelfReelsEnabled(), false, value);
      assert.equal(isSelfReelsRouteEnabled(), false, value);
    });
  }
  withViteEnv({ [page]: '1' }, () => {
    assert.equal(isGateoSelfReelsEnabled(), true);
    assert.equal(isSelfReelsRouteEnabled(), true);
  });
});

test('fixture flag does not enable the route or itself without the page flag', () => {
  const page = GATEO_ENV_FLAG_NAMES.SELF_REELS;
  const fixture = GATEO_ENV_FLAG_NAMES.SELF_REELS_FIXTURE;
  withViteEnv({ [page]: '', [fixture]: '1' }, () => {
    assert.equal(isSelfReelsRouteEnabled(), false);
    assert.equal(isGateoSelfReelsFixtureEnabled(), false);
  });
  withViteEnv({ [page]: '1', [fixture]: '1' }, () => {
    assert.equal(isSelfReelsRouteEnabled(), true);
    assert.equal(isGateoSelfReelsFixtureEnabled(), true);
  });
  withViteEnv({ [page]: '1', [fixture]: '' }, () => {
    assert.equal(isGateoSelfReelsFixtureEnabled(), false);
  });
});

test('/reels is a lazy route only while the page flag is on', () => {
  const app = read('src/App.jsx');
  assert.match(app, /const selfReelsOn = isSelfReelsRouteEnabled\(\)/);
  assert.match(
    app,
    /selfReelsOn\s*\?\s*lazy\(\(\) => import\('\.\/pages\/SelfReels\/SelfReelsPage\.jsx'\)\)/,
  );
  assert.match(app, /\{selfReelsOn && SelfReelsPage \? \([\s\S]*?path="\/reels"/);
  const homeRoute = app.slice(app.indexOf('path="/"'), app.indexOf('path="/korea/theme/top10"'));
  assert.doesNotMatch(homeRoute, /reels/);
  assert.doesNotMatch(app, /<Route path="\/"[\s\S]*path="\/reels"/);
});

test('shell keeps noindex and empty notice when the fixture feed is off', () => {
  const page = read('src/pages/SelfReels/SelfReelsPage.jsx');
  assert.match(page, /name="robots" content="noindex"/);
  assert.match(page, /확인할 영상이 없어요\./);
  assert.equal(EMPTY_MESSAGE, '확인할 영상이 없어요.');
  assert.match(page, /isGateoSelfReelsFixtureEnabled/);
  assert.doesNotMatch(page, /youtube|YouTubePlayerView|KOGL_REELS_RAW/i);
});

test('home, search, kogl contract, and sitemap do not reference the new route', () => {
  const home = read('src/pages/Home/index.jsx');
  const search = read('src/pages/Home/lib/siteSearchOpen.js');
  const kogl = read('src/pages/Home/data/koglReels.js');
  const koglTest = read('scripts/kogl-reels.test.mjs');
  const vite = read('vite.config.js');
  const sitemap = read('scripts/generate-sitemap.cjs');
  for (const source of [home, search, kogl, koglTest, vite, sitemap]) {
    assert.doesNotMatch(source, /VITE_GATEO_SELF_REELS|SelfReelsPage|\/reels/);
  }
  assert.match(koglTest, /KOGL_REELS_RAW\.length, 10/);
  assert.equal(ROOT_FILES.length, 8);
});
