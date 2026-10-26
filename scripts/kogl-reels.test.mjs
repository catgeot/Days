import assert from 'node:assert/strict';
import test from 'node:test';

import { GATEO_ENV_FLAG_NAMES, isGateoKoglReelsEnabled } from '../src/shared/gateoFeatureFlags.js';
import {
  KOGL_REELS_RAW,
  getKoglReels,
  isKoglReelsSectionVisible,
} from '../src/pages/Home/data/koglReels.js';

const PLACE_URL_RE = /^https:\/\/www\.gateo\.kr\/.+\/$/;
const BAD_HOST_RE = /gateo\.org|gateo\.jp|^https:\/\/gateo\.kr/;

const REQUIRED_RAW_KEYS = [
  'id',
  'fileId',
  'title',
  'placeUrl',
  'internalPath',
  'credit',
  'license',
];

function withViteEnv(patch, fn) {
  const prev = { ...globalThis.__VITE_ENV__ };
  globalThis.__VITE_ENV__ = { ...prev, ...patch };
  try {
    return fn();
  } finally {
    globalThis.__VITE_ENV__ = prev;
  }
}

test('KOGL_REELS_RAW has 10 entries with unique ids and required fields', () => {
  assert.equal(KOGL_REELS_RAW.length, 10);
  const ids = new Set();
  for (const entry of KOGL_REELS_RAW) {
    for (const key of REQUIRED_RAW_KEYS) {
      assert.ok(entry[key] != null && entry[key] !== '', `missing ${key} on ${entry.id}`);
    }
    assert.ok(!ids.has(entry.id), `duplicate id ${entry.id}`);
    ids.add(entry.id);
    assert.match(entry.placeUrl, PLACE_URL_RE, entry.id);
    assert.ok(!BAD_HOST_RE.test(entry.placeUrl), entry.placeUrl);
    assert.match(entry.credit, /공공누리 제1유형/, entry.id);
    assert.equal(entry.license.type, 'KOGL-1');
    assert.equal(entry.license.edited, true);
  }
});

test('isGateoKoglReelsEnabled follows readGateoEnvFlag (1 only)', () => {
  const key = GATEO_ENV_FLAG_NAMES.KOGL_REELS;
  withViteEnv({ [key]: '1' }, () => {
    assert.equal(isGateoKoglReelsEnabled(), true);
  });
  withViteEnv({ [key]: '' }, () => {
    assert.equal(isGateoKoglReelsEnabled(), false);
  });
});

test('getKoglReels returns [] when base empty or flag off', () => {
  withViteEnv(
    {
      VITE_GATEO_KOGL_REELS: '',
      VITE_GATEO_REELS_BASE_URL: 'https://cdn.example.com',
    },
    () => {
      assert.deepEqual(getKoglReels(), []);
      assert.equal(isKoglReelsSectionVisible(), false);
    },
  );

  withViteEnv(
    {
      VITE_GATEO_KOGL_REELS: '1',
      VITE_GATEO_REELS_BASE_URL: '',
    },
    () => {
      assert.deepEqual(getKoglReels(), []);
      assert.equal(isKoglReelsSectionVisible(), false);
    },
  );
});

test('getKoglReels builds media URLs when flag on and base set', () => {
  withViteEnv(
    {
      VITE_GATEO_KOGL_REELS: '1',
      VITE_GATEO_REELS_BASE_URL: 'https://cdn.example.com/',
    },
    () => {
      const reels = getKoglReels();
      assert.equal(reels.length, 10);
      assert.equal(isKoglReelsSectionVisible(), true);
      const v5 = reels.find((r) => r.id === 'kogl-v5');
      assert.ok(v5);
      assert.equal(v5.src, 'https://cdn.example.com/kogl/v1/v5-720x1280.mp4');
      assert.equal(v5.srcHd, 'https://cdn.example.com/kogl/v1/v5-1080x1920.mp4');
      assert.equal(v5.poster, 'https://cdn.example.com/kogl/v1/v5-poster.webp');
    },
  );
});
