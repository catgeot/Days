#!/usr/bin/env node
/**
 * 탐색창 Enter — 타이핑 제안에 보이는 장소를 AI 교정(화암동굴)보다 우선.
 * 네트워크 없음.
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  resolveHubAttraction,
  resolveCityAttractionHub,
  hubToSuggestion,
  attractionToSuggestion,
  buildHubDisambiguationCandidates,
} from '../src/pages/Home/lib/cityAttractionHubs.js';
import {
  resolveExploreSearchAlias,
  buildMapboxSearchQueries,
} from '../src/pages/Home/lib/exploreSearchAliases.js';
import {
  preferEnterSuggestion,
  placeNameMatchesSearchQuery,
  resolveEnterSearchCanonical,
} from '../src/pages/Home/lib/searchEnterMatch.js';
import { resolveExploreCityHubExact } from '../src/pages/Home/lib/exploreHubResolve.js';
import { resolveSettlement } from '../src/pages/Home/lib/mapboxSettlementPlaces.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

const hit = resolveHubAttraction('광천성굴');
assert.ok(hit, '광천성굴 → hub attraction');
assert.equal(hit.hub.hubId, 'pyeongchang');
assert.equal(hit.attraction.name, '광천선굴');
assert.equal(resolveHubAttraction('광천선굴')?.attraction?.lat, 37.518306);
assert.equal(resolveEnterSearchCanonical('광천성굴'), '광천선굴');
assert.equal(resolveEnterSearchCanonical('광천동굴'), '광천선굴');
assert.equal(resolveEnterSearchCanonical('Gwangcheon Cave'), '광천선굴');
assert.equal(resolveExploreSearchAlias('광천성굴')?.canonical, '광천선굴');
assert.ok(buildMapboxSearchQueries('광천동굴').includes('광천선굴'));

const seongul = attractionToSuggestion(hit.hub, hit.attraction);
const hwaam = {
  id: 'hub-attr-jeongseon-화암동굴',
  name: '화암동굴',
  name_en: 'HwaAm Cave',
  lat: 37.3504,
  lng: 128.6703,
  source: 'hub',
};
const gwangjuDong = {
  id: 'geocode-gwangcheon-dong',
  name: '광천동',
  name_en: 'Gwangcheon-dong',
  lat: 35.165,
  lng: 126.88,
  source: 'geocode',
};

assert.equal(placeNameMatchesSearchQuery('광천선굴', seongul), true);
assert.equal(placeNameMatchesSearchQuery('광천성굴', seongul), true);
assert.equal(placeNameMatchesSearchQuery('광천선굴', hwaam), false);
assert.equal(placeNameMatchesSearchQuery('광천선굴', gwangjuDong), false);
assert.equal(placeNameMatchesSearchQuery('광', seongul), false);

assert.equal(
  preferEnterSuggestion('광천선굴', [hwaam, seongul, gwangjuDong])?.name,
  '광천선굴',
  'Enter picks 광천선굴 over 화암동굴',
);
assert.equal(
  preferEnterSuggestion('광천성굴', [hwaam, seongul])?.name,
  '광천선굴',
  '광천성굴 Enter still picks 광천선굴',
);
assert.equal(preferEnterSuggestion('광천선굴', [hwaam, gwangjuDong]), null);

const mokpoHub = resolveCityAttractionHub('목포');
assert.ok(mokpoHub, '목포 hub exact');
const mokpoCluster = [
  hubToSuggestion(mokpoHub),
  ...mokpoHub.attractions.map((attraction) => attractionToSuggestion(mokpoHub, attraction)),
];
assert.equal(
  preferEnterSuggestion('목포', mokpoCluster),
  null,
  '목포 Enter는 도시 카드 점프 없이 선택 리스트',
);
assert.equal(
  preferEnterSuggestion('목포시', mokpoCluster),
  null,
  '목포시 alias Enter도 선택 리스트',
);
assert.equal(
  preferEnterSuggestion('유달산', mokpoCluster)?.name,
  '유달산',
  '명소 exact Enter는 해당 카드',
);

const suggestionsSrc = readFileSync(
  join(root, 'src/pages/Home/lib/searchSuggestions.js'),
  'utf8',
);
assert.match(
  suggestionsSrc,
  /\[prefer, hubCard, \.\.\.others\]/,
  'Enter 명소 exact는 히트 명소를 허브보다 앞에',
);

const modalSrc = readFileSync(
  join(root, 'src/pages/Home/components/SearchDiscoveryModal.jsx'),
  'utf8',
);
assert.match(modalSrc, /preferEnterSuggestion/);
assert.match(modalSrc, /visiblePick/);

const handlerSrc = readFileSync(join(root, 'src/pages/Home/hooks/useHomeHandlers.js'), 'utf8');
assert.match(handlerSrc, /이름 불일치 교정 캐시 무시/);
assert.match(handlerSrc, /preferEnterSuggestion\(query, await buildHybridSearchSuggestions/);

assert.ok(!resolveCityAttractionHub('마산'), '마산은 창원 hub alias 아님');
assert.equal(resolveExploreCityHubExact('마산'), null, '마산 Enter는 창원 hub exact 아님');
const masanSettlement = resolveSettlement('마산');
assert.ok(masanSettlement, '마산 정착지 SSOT');
assert.equal(masanSettlement.settlement.placeId, 'changwon-masan');
assert.match(
  suggestionsSrc,
  /resolveExploreCityHubExact/,
  '탐색 제안은 정착지 우선 hub exact',
);
assert.match(
  handlerSrc,
  /resolveExploreCityHubExact/,
  'Enter handler는 정착지 우선 hub exact',
);

const daejeonHub = resolveCityAttractionHub('대전');
assert.ok(daejeonHub, '대전 hub');
const sinjungang = buildHubDisambiguationCandidates(daejeonHub, []).find(
  (c) => c.name === '신중앙시장',
);
assert.ok(sinjungang, '대전 선택 카드에 신중앙시장');
assert.equal(
  sinjungang.contentId,
  '1434477',
  '신중앙시장 theme Tour ID (대전 중앙시장)',
);

console.log(
  'PASS smoke-search-enter-match (광천선굴 Enter ≠ 화암동굴 · 목포 hub Enter = 리스트 · 마산≠창원 · 대전 신중앙 1434477)',
);
