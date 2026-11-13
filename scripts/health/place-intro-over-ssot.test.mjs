import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';

import {
  GATEO_ENV_FLAG_NAMES,
  isGateoPlaceIntroOverSsotEnabled,
} from '../../src/shared/gateoFeatureFlags.js';
import {
  PLACE_INTRO_LOCKED_SLUGS,
  isPlaceIntroLockedSlug,
} from '../../src/data/placeIntroLocked.js';
import { isPlaceIntroCuratedCopyProtected, isPlaceIntroLocked } from '../../src/pages/Home/lib/placeIntroProtection.js';
import { needsPlaceChatIntroHydration } from '../../src/pages/Home/lib/placeDescText.js';
import { overlaySessionCuration } from '../../src/pages/Home/lib/placeRouteHydrate.js';
import { getLocalizedPlaceDesc } from '../../src/pages/Home/lib/placeSeoText.js';
import { peekCachedPlaceChatIntroEn } from '../../src/pages/Home/lib/placeChatIntroDisplay.js';
import { savePlaceChatIntroLocal } from '../../src/pages/Home/lib/placeChatIntro.js';
import { installPlaceIntroMockStorage } from './place-chat-intro-ensure-fetch-mock.mjs';

const root = new URL('../..', import.meta.url).pathname;
const FLAG = GATEO_ENV_FLAG_NAMES.PLACE_INTRO_OVER_SSOT;

function withFlag(value, fn) {
  const prev = globalThis.__VITE_ENV__?.[FLAG];
  try {
    if (value === undefined) delete globalThis.__VITE_ENV__[FLAG];
    else globalThis.__VITE_ENV__[FLAG] = value;
    fn();
  } finally {
    if (prev === undefined) delete globalThis.__VITE_ENV__[FLAG];
    else globalThis.__VITE_ENV__[FLAG] = prev;
  }
}

test('VITE_GATEO_PLACE_INTRO_OVER_SSOT defaults off', () => {
  withFlag(undefined, () => {
    assert.equal(isGateoPlaceIntroOverSsotEnabled(), false);
  });
  withFlag('1', () => {
    assert.equal(isGateoPlaceIntroOverSsotEnabled(), true);
  });
});

test('locked slug SSOT includes khao-lak · cairo · paris · editorial', () => {
  assert.ok(isPlaceIntroLockedSlug('khao-lak'));
  assert.ok(isPlaceIntroLockedSlug('cairo'));
  assert.ok(isPlaceIntroLockedSlug('paris'));
  assert.ok(isPlaceIntroLockedSlug('rome'));
  assert.ok(PLACE_INTRO_LOCKED_SLUGS.includes('bangkok'));
});

test('flag off — SSOT yap unchanged', () => {
  const yap = {
    slug: 'yap',
    name: '야프',
    country: '미크로네시아 연방',
    desc: '태평양에 자리한 섬으로, 전통 석전 화폐로 유명합니다.',
  };
  withFlag(undefined, () => {
    assert.equal(needsPlaceChatIntroHydration(yap), false);
  });
});

test('flag on — yap SSOT hydrates · khao-lak locked · palgyeong protected', () => {
  const yap = {
    slug: 'yap',
    name: '야프',
    country: '미크로네시아 연방',
    desc: '태평양에 자리한 섬으로, 전통 석전 화폐로 유명합니다.',
  };
  const khao = {
    slug: 'khao-lak',
    name: '카오락',
    desc: '태국 팡아주 안다만 해안의 휴양 동네예요.',
  };
  const birae = {
    name: '비래폭포',
    parentCity: '합천',
    localScenicListId: 'hwacheon-gugyeong',
    desc: '합천 지역의 대표 명승으로, 계곡과 폭포가 어우러진 자연 경관입니다.',
  };
  withFlag('1', () => {
    assert.equal(needsPlaceChatIntroHydration(yap), true);
    assert.equal(needsPlaceChatIntroHydration(khao), false);
    assert.equal(isPlaceIntroLocked(khao), true);
    assert.equal(needsPlaceChatIntroHydration(birae), false);
    assert.equal(isPlaceIntroCuratedCopyProtected(birae), true);
  });
});

test('placeChatIntroApplied blocks re-hydrate and overlaySessionCuration keeps intro', () => {
  const session = {
    slug: 'yap',
    name: '야프',
    desc: '무니 요약이 적용된 본문입니다.',
    placeChatIntroApplied: true,
  };
  const ssot = {
    slug: 'yap',
    name: '야프',
    desc: 'SSOT 실문장은 여기 있습니다.',
  };
  withFlag('1', () => {
    assert.equal(needsPlaceChatIntroHydration(session), false);
    const merged = overlaySessionCuration(ssot, { selectedLocation: session });
    assert.equal(merged.desc, session.desc);
    assert.equal(merged.placeChatIntroApplied, true);
  });
});

test('EN display prefers cached @en intro over placeSeoEnOverrides when flag on', () => {
  installPlaceIntroMockStorage();
  const yap = {
    slug: 'yap',
    name: '야프',
    name_en: 'Yap',
    desc: '한글 무니 요약.',
    placeChatIntroApplied: true,
  };
  savePlaceChatIntroLocal(
    'Yap',
    'Yap is a quiet Micronesian island known for stone money traditions and calm lagoons. Visitors enjoy coastal walks and local dance culture.',
    'en',
  );
  withFlag('1', () => {
    const en = getLocalizedPlaceDesc(yap, 'en');
    assert.match(en, /stone money traditions/);
    assert.equal(peekCachedPlaceChatIntroEn(yap), en);
  });
});

test('handlePlaceIntroReady documents placeChatIntroApplied in Home source', () => {
  const home = readFileSync(join(root, 'src/pages/Home/index.jsx'), 'utf8');
  assert.match(home, /placeChatIntroApplied:\s*true/);
  assert.match(home, /needsPlaceChatIntroHydration\(prev\)/);
});
