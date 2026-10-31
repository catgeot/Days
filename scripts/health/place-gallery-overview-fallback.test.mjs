import assert from 'node:assert/strict';
import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';
import { splitPlaceOverview } from '../../src/components/PlaceCard/common/placeOverviewText.js';
import {
  getPlaceOverviewDescForDisplay,
  getLocalizedPlaceDesc,
  overviewTextIsKoreanOnly,
} from '../../src/pages/Home/lib/placeSeoText.js';
import { isSyntheticOrEmptyPlaceDesc, shouldUsePlaceGalleryReadonlyOverview } from '../../src/pages/Home/lib/placeDescText.js';
import { attractionToPlacePin, listCityAttractionHubs } from '../../src/pages/Home/lib/cityAttractionHubs.js';
import { isGateoPlaceGalleryOverviewFallbackEnabled } from '../../src/shared/gateoFeatureFlags.js';
import { resolveTourApiPlace } from '../../src/utils/tourApiMatch.js';
import {
  hydratePlaceGalleryOverview,
  resetPlaceGalleryOverviewCacheForTests,
} from '../../src/pages/Home/lib/hydratePlaceGalleryOverview.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');

function gitDiffAgainstBaseBranch(paths) {
  const baseRef = process.env.GITHUB_BASE_REF
    ? `origin/${process.env.GITHUB_BASE_REF}`
    : 'origin/main';
  try {
    return execSync(`git diff ${baseRef} -- ${paths}`, { cwd: root, encoding: 'utf8' });
  } catch (err) {
    throw new Error(`Could not diff Home files against ${baseRef}: ${err?.message || err}`);
  }
}

test('gallery overview flag defaults on', () => {
  assert.equal(isGateoPlaceGalleryOverviewFallbackEnabled(), true);
  globalThis.__VITE_ENV__ = { VITE_GATEO_PLACE_GALLERY_OVERVIEW_FALLBACK: '0' };
  assert.equal(isGateoPlaceGalleryOverviewFallbackEnabled(), false);
  delete globalThis.__VITE_ENV__;
});

test('flag OFF — splitPlaceOverview uses getLocalizedPlaceDesc (EN hides hangul desc)', () => {
  globalThis.__VITE_ENV__ = { VITE_GATEO_PLACE_GALLERY_OVERVIEW_FALLBACK: '0' };
  const pin = {
    slug: 'gyeongbokgung-palace',
    name: '경복궁',
    desc: '조선 왕조의 법궁입니다.',
    placeChatIntroApplied: true,
  };
  assert.equal(getLocalizedPlaceDesc(pin, 'en'), '');
  assert.equal(splitPlaceOverview(pin, 'en').fixed, '');
  delete globalThis.__VITE_ENV__;
});

test('flag ON — splitPlaceOverview ignores Home ensure desc (readonly hydrate only)', () => {
  const pin = {
    slug: 'gyeongbokgung-palace',
    name: '경복궁',
    parentCity: '서울',
    uiPlace: true,
    desc: 'AI가 쓴 경복궁 영문 소개문입니다.',
    placeChatIntroApplied: true,
  };
  assert.equal(shouldUsePlaceGalleryReadonlyOverview(pin), true);
  assert.equal(splitPlaceOverview(pin, 'en').fixed, '');
  assert.equal(splitPlaceOverview(pin, 'ko').fixed, '');
});

test('Home gallery PR drift guard; MOONi session wiring line allowlist', () => {
  const galleryForbidden = [
    /hydratePlaceGalleryOverview/,
    /usePlaceGalleryOverviewHydration/,
    /shouldUsePlaceGalleryReadonlyOverview/,
    /fetchDomesticTourOverviewForLocation/,
    /splitPlaceOverview/,
    /getPlaceOverviewDescForDisplay/,
  ];

  /** Each changed line (+/-) must match one pattern (no broad MOONi keyword gate). */
  const handlersAllow = [
    /^[+-]\s*import .*tripChatUtils/,
    /^[+-].*tripHasPersistedDialogue/,
    /^[+-].*mooniLastChatScopeInput/,
    /^[+-].*persistMooniFreshDraftSession/,
    /^[+-].*resolveMooniResumeTrip/,
    /^[+-].*resumeScope/,
    /^[+-].*scopeOrContext:/,
    /^[+-].*mooniPlaceContext: boundSpot/,
    /^[+-].*boundPlaceLabel \? 'chat\.resume\.placeTrip'/,
    /^[+-].*chat\.resume\.(placeTrip|mooniTrip)/,
    /^[+-].*logCurationHandoff\(/,
    /^[+-].*setChatDraft\(/,
    /^[+-].*setActiveChatId\(/,
    /^[+-].*setInitialQuery\(/,
    /^[+-].*setIsChatOpen\(/,
    /^[+-].*setSavedTrips\(/,
    /^[+-].*setMooniPlaceContext/,
    /^[+-].*setMooniChatEntry/,
    /^[+-].*freshSession/,
    /^[+-].*isMooniRequest/,
    /^[+-].*isSameLocation/,
    /^[+-].*selectedLocation/,
    /^[+-].*targetLat/,
    /^[+-].*targetLng/,
    /^[+-].*locationName/,
    /^[+-].*boundSpot/,
    /^[+-].*boundPlaceLabel/,
    /^[+-].*placeTrip/,
    /^[+-].*is_hidden/,
    /^[+-].*destination ===/,
    /^[+-].*persona/,
    /^[+-].*category/,
    /^[+-].*existingId/,
    /^[+-].*resumedTrip/,
    /^[+-].*장소카드 boundSpot/,
    /^[+-].*\(t\)/,
    /^[+-].*\? /,
    /^[+-].*: 0;/,
    /^[+-].*return;/,
    /^[+-]\s*$/,
    /^[+-]\s*\}\s*$/,
    /^[+-]\s*\)\s*;?\s*$/,
    /^[+-]\s*\}\s*,\s*$/,
    /^[+-]\s*\}\);?\s*$/,
  ];

  const indexAllow = [
    /^[+-]\s*import .*tripChatUtils/,
    /^[+-].*mooniLastChatScopeInput/,
    /^[+-].*persistMooniFreshDraftSession/,
    /^[+-].*handleStartNewMooniChat/,
    /^[+-].*onStartNewChat=/,
    /^[+-].*persistMooniLastChatId/,
    /^[+-].*mooniPlaceContext/,
    /^[+-].*activeChatId/,
    /^[+-].*setActiveChatId/,
    /^[+-].*setInitialQuery/,
    /^[+-].*setChatDraft/,
    /^[+-].*setMooniPlaceContext/,
    /^[+-].*setSelectedLocation/,
    /^[+-].*handleClearMooniPlaceBinding/,
    /^[+-].*mooniChatEntry/,
    /^[+-].*destination === 'MOONi'/,
    /^[+-].*category/,
    /^[+-].*user\?\.id/,
    /^[+-]\s*import .*exploreMonthlyPicks/,
    /^[+-].*readExploreV2QueryParam/,
    /^[+-].*exploreV2QueryNoIndex/,
    /^[+-].*robotsNoIndex/,
    /^[+-].*routeLocation\.pathname\.startsWith\('\/explore'\)/,
    /^[+-].*routeLocation\.search/,
    /^[+-]\s*\(\) =>/,
    /^[+-]\s*$/,
    /^[+-]\s*\}\s*,?\s*$/,
    /^[+-]\s*\)\s*;?\s*$/,
    /^[+-]\s*\]\s*;?\s*$/,
  ];

  function assertDiffAllowlist(rel, allowPatterns) {
    const diff = gitDiffAgainstBaseBranch(rel);
    if (diff.trim() === '') return;
    for (const re of galleryForbidden) {
      assert.doesNotMatch(diff, re, `${rel}: gallery overview PR must not change Home`);
    }
    const changed = diff
      .split('\n')
      .filter((line) => (line.startsWith('+') || line.startsWith('-')) && !line.startsWith('+++') && !line.startsWith('---'));
    for (const line of changed) {
      assert.ok(
        allowPatterns.some((re) => re.test(line)),
        `${rel}: unexpected diff line: ${line}`,
      );
    }
  }

  assertDiffAllowlist('src/pages/Home/hooks/useHomeHandlers.js', handlersAllow);
  assertDiffAllowlist('src/pages/Home/index.jsx', indexAllow);
});

test('flag ON — EN shows KO overview body for display helper (non-readonly pins)', () => {
  const pin = {
    slug: 'gyeongbokgung-palace',
    name: '경복궁',
    desc: '조선 왕조의 법궁으로, 광화문과 근정전이 유명한 서울의 대표 고궁입니다.',
    placeChatIntroApplied: true,
  };
  assert.equal(shouldUsePlaceGalleryReadonlyOverview(pin), false);
  assert.match(getPlaceOverviewDescForDisplay(pin, 'en'), /조선/);
  assert.equal(overviewTextIsKoreanOnly(getPlaceOverviewDescForDisplay(pin, 'en')), true);
});

test('read-only hydrate module — no AI persist or save RPC', () => {
  const src = readFileSync(join(root, 'src/pages/Home/lib/hydratePlaceGalleryOverview.js'), 'utf8');
  assert.doesNotMatch(src, /ensurePlaceChatIntroForLocation/);
  assert.doesNotMatch(src, /generatePlaceChatIntroWithAi/);
  assert.doesNotMatch(src, /persistPlaceChatIntroSummary/);
  assert.doesNotMatch(src, /\brpc\s*\(\s*['"]save_place_chat_intro/);
  assert.match(src, /overviewInflight\.get\(key\)/);
  assert.match(src, /overviewMemory\.has\(key\)/);
});

test('hook path — no save RPC or AI ensure', () => {
  const hook = readFileSync(
    join(root, 'src/components/PlaceCard/hooks/usePlaceGalleryOverviewHydration.js'),
    'utf8',
  );
  assert.doesNotMatch(hook, /save_place_chat_intro/);
  assert.doesNotMatch(hook, /persistPlaceChatIntroSummary/);
  assert.doesNotMatch(hook, /ensurePlaceChatIntroForLocation/);
  assert.doesNotMatch(hook, /generatePlaceChatIntroWithAi/);
  assert.match(hook, /shouldUsePlaceGalleryReadonlyOverview/);
});

test('gallery entry views — overview hook only, no ensure or save', () => {
  for (const rel of [
    'src/components/PlaceCard/views/PlaceGalleryView.jsx',
    'src/components/PlaceCard/views/GalleryInfoView.jsx',
    'src/components/PlaceCard/common/placeOverviewText.js',
  ]) {
    const src = readFileSync(join(root, rel), 'utf8');
    assert.doesNotMatch(src, /ensurePlaceChatIntroForLocation/, rel);
    assert.doesNotMatch(src, /generatePlaceChatIntroWithAi/, rel);
    assert.doesNotMatch(src, /persistPlaceChatIntroSummary/, rel);
    assert.doesNotMatch(src, /save_place_chat_intro/, rel);
  }
  assert.match(
    readFileSync(join(root, 'src/components/PlaceCard/views/GalleryInfoView.jsx'), 'utf8'),
    /usePlaceGalleryOverviewHydration/,
  );
});

test('hydrate still runs after Home ensure when gallery readonly pin', async () => {
  resetPlaceGalleryOverviewCacheForTests();
  const pin = {
    slug: 'gyeongbokgung-palace',
    name: '경복궁',
    country: '대한민국',
    parentCity: '서울',
    uiPlace: true,
    desc: 'Home ensure AI text',
    placeChatIntroApplied: true,
  };
  let tourCalls = 0;
  const summary = await hydratePlaceGalleryOverview(pin, {
    lng: 'ko',
    readIntro: async () => '',
    readTour: async () => {
      tourCalls += 1;
      return 'Tour overview from contentId.';
    },
  });
  assert.equal(tourCalls, 1);
  assert.match(summary, /Tour overview/);
  resetPlaceGalleryOverviewCacheForTests();
});

test('in-flight dedup — parallel hydrate shares one inflight promise', async () => {
  resetPlaceGalleryOverviewCacheForTests();
  let introCalls = 0;
  const pin = {
    slug: 'gyeongbokgung-palace',
    name: '경복궁',
    country: '대한민국',
    parentCity: '서울',
    desc: '서울의 명소 · 경복궁',
  };

  const readIntro = async () => {
    introCalls += 1;
    await new Promise((r) => setTimeout(r, 25));
    return '';
  };
  const readTour = async () =>
    '경복궁은 조선 태조 이성계가 1395년에 창건한 조선 왕조의 법궁입니다. 광화문과 근정전이 유명합니다.';

  const [a, b] = await Promise.all([
    hydratePlaceGalleryOverview(pin, { lng: 'ko', readIntro, readTour }),
    hydratePlaceGalleryOverview(pin, { lng: 'ko', readIntro, readTour }),
  ]);
  assert.equal(introCalls, 1, 'intro lookup once per place+locale');
  assert.equal(a, b);
  assert.match(a, /조선 태조/);
  const cached = await hydratePlaceGalleryOverview(pin, { lng: 'ko', readIntro, readTour });
  assert.equal(introCalls, 1, 'memory cache skips repeat intro fetch');
  assert.equal(cached, a);
  resetPlaceGalleryOverviewCacheForTests();
});

test('synthetic hub attraction desc is empty for display when flag on', () => {
  const seoul = listCityAttractionHubs().find((h) => h.hubId === 'seoul');
  const gyeongbok = seoul?.attractions?.find((a) => a.name === '경복궁');
  const pin = attractionToPlacePin(seoul, gyeongbok);
  assert.equal(isSyntheticOrEmptyPlaceDesc(pin), true);
  assert.equal(getPlaceOverviewDescForDisplay(pin, 'ko'), '');
});

test('Gallery UI wires EN korean description label i18n key', () => {
  const scroll = readFileSync(
    join(root, 'src/components/PlaceCard/views/GalleryInfoOverviewScrollContent.jsx'),
    'utf8',
  );
  assert.match(scroll, /descriptionInKorean/);
});

test('fetchDomesticTourOverview (main) uses searchKeyword path not ForLocation shortcut', () => {
  const src = readFileSync(join(root, 'src/utils/tourKeywordPick.js'), 'utf8');
  const match = src.match(/export async function fetchDomesticTourOverview\(placeName\)\s*\{[\s\S]*?\n\}/);
  assert.ok(match, 'fetchDomesticTourOverview body');
  const mainFn = match[0];
  assert.match(mainFn, /lookupTourContentIdByName/);
  assert.doesNotMatch(mainFn, /fetchDomesticTourOverviewForLocation/);
  assert.doesNotMatch(mainFn, /resolveTourContentIdForLocation/);
});

test('fetchDomesticTourOverviewForLocation only wired from gallery hydrate module', () => {
  const hydrateSrc = readFileSync(
    join(root, 'src/pages/Home/lib/hydratePlaceGalleryOverview.js'),
    'utf8',
  );
  assert.match(hydrateSrc, /fetchDomesticTourOverviewForLocation/);
  const homeHandlers = readFileSync(join(root, 'src/pages/Home/hooks/useHomeHandlers.js'), 'utf8');
  assert.doesNotMatch(homeHandlers, /hydratePlaceGalleryOverview/);
  assert.doesNotMatch(homeHandlers, /fetchDomesticTourOverviewForLocation/);
});

test('home intro hydrate keeps ensurePlaceChatIntroForLocation (overseas AI)', () => {
  const homeHandlers = readFileSync(join(root, 'src/pages/Home/hooks/useHomeHandlers.js'), 'utf8');
  assert.match(homeHandlers, /ensurePlaceChatIntroForLocation\(pin, \{ generateIfMissing: true \}\)/);
  const homeIndex = readFileSync(join(root, 'src/pages/Home/index.jsx'), 'utf8');
  assert.match(homeIndex, /ensurePlaceChatIntroForLocation\(focusTarget, \{ generateIfMissing: true \}\)/);
  assert.doesNotMatch(homeIndex, /hydratePlaceGalleryOverview/);
});

test('gyeongbokgung resolves Tour contentId via name', () => {
  const pin = {
    slug: 'gyeongbokgung-palace',
    name: '경복궁',
    country: '대한민국',
    contentId: '126508',
  };
  assert.equal(resolveTourApiPlace(pin)?.contentId, '126508');
});
