#!/usr/bin/env node
/**
 * 지자체 팔경·구경 resolve 스모크 — 회귀(속초·낙산사) + SSOT·검색 브리지.
 * Usage: node scripts/smoke-korea-local-scenic-lists.mjs [extraListQuery...]
 */
import assert from 'node:assert';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import {
  resolveCityAttractionHub,
  resolveHubAttraction,
} from '../src/pages/Home/lib/cityAttractionHubs.js';
import {
  listKoreaLocalScenicLists,
  resolveLocalScenicList,
  matchLocalScenicListForScenicSearch,
  matchLocalScenicListsForQuery,
  buildLocalScenicListHubCluster,
  spotMatchesLocalScenicListMember,
  listsForHub,
  localScenicListDisplayTitle,
  localScenicMemberToSuggestion,
  mergeLocalScenicMembersIntoScenicSpots,
  groupNearbySpotsWithLocalScenic,
} from '../src/pages/Home/lib/koreaLocalScenicLists.js';
import {
  filterScenicSpotsByQuery,
  normalizeScenicQuery,
} from '../src/pages/Home/lib/scenicSearch.js';
import { listKoreaScenicSpots } from '../src/pages/Home/lib/koreaScenicSpots.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const searchSrc = readFileSync(
  join(root, 'src/pages/Home/lib/searchSuggestions.js'),
  'utf8',
);
const scenicSrc = readFileSync(join(root, 'src/pages/Home/lib/scenicSearch.js'), 'utf8');

// 회귀 — 기존 hub·명소 resolve 유지
const sokcho = resolveCityAttractionHub('속초');
assert.ok(sokcho?.hubId === 'sokcho', '속초 → sokcho hub');
const naksansa = resolveHubAttraction('낙산사');
assert.ok(naksansa?.hub?.hubId === 'yangyang', '낙산사 → yangyang hub');

// SSOT 구조
const lists = listKoreaLocalScenicLists();
assert.ok(Array.isArray(lists), 'lists is array');

for (const list of lists) {
  const hit = resolveLocalScenicList(list.title);
  assert.ok(hit?.list?.listId === list.listId, `resolveLocalScenicList ${list.listId}`);
  const cluster = buildLocalScenicListHubCluster(list, hit.hub);
  assert.ok(cluster.length >= 1, `cluster ${list.listId}`);
  for (const alias of list.aliases || []) {
    assert.ok(
      resolveLocalScenicList(alias)?.list?.listId === list.listId,
      `alias resolve ${list.listId} / ${alias}`,
    );
  }
}

// scenicSearch 브리지 wiring
assert.ok(
  scenicSrc.includes('matchLocalScenicListForScenicSearch'),
  'scenicSearch imports local scenic bridge',
);
assert.ok(
  scenicSrc.includes('spotMatchesLocalScenicListMember'),
  'scenicSearch filters curated members',
);

// searchSuggestions 브리지 wiring
assert.ok(
  searchSrc.includes('resolveLocalScenicList'),
  'searchSuggestions imports resolveLocalScenicList',
);
assert.ok(
  searchSrc.includes('buildLocalScenicListHubCluster'),
  'searchSuggestions expands list cluster',
);
assert.ok(
  searchSrc.includes('pushLocalScenicMembersFirst'),
  'searchSuggestions prepends palgyeong members before hub cluster',
);
{
  const idxMembers = searchSrc.indexOf('pushLocalScenicMembersFirst(exactHub');
  const idxSpots = searchSrc.indexOf('const spotHits');
  assert.ok(
    idxMembers >= 0 && idxSpots >= 0 && idxMembers < idxSpots,
    '문경 팔경 members are pushed before travel spots',
  );
}
assert.ok(
  searchSrc.includes('slice(0, 24)'),
  'searchSuggestions raises result cap for palgyeong group',
);

const suggestionListSrc = readFileSync(
  join(root, 'src/pages/Home/components/SearchDiscovery/SearchSuggestionList.jsx'),
  'utf8',
);
assert.ok(
  suggestionListSrc.includes('groupTitle'),
  'SearchSuggestionList renders groupTitle subtitle',
);
const scenicPageSrc = readFileSync(
  join(root, 'src/pages/KoreaTheme/ScenicPage.jsx'),
  'utf8',
);
assert.ok(
  scenicPageSrc.includes('mergeLocalScenicMembersIntoScenicSpots'),
  'ScenicPage merges N경 into curated ul',
);
assert.ok(
  !scenicPageSrc.includes('festival-home-pod'),
  'ScenicPage has no festival home pod marker',
);
const festivalSrc = readFileSync(
  join(root, 'src/pages/Korea/FestivalDetailSheet.jsx'),
  'utf8',
);
assert.ok(
  festivalSrc.includes('groupNearbySpotsWithLocalScenic'),
  'FestivalDetailSheet groups palgyeong inside nearAttractions',
);
assert.ok(
  !festivalSrc.includes('homeFestivalPod'),
  'FestivalDetailSheet has no home festival pod',
);

const mungyeongLists = matchLocalScenicListsForQuery('문경');
assert.ok(
  mungyeongLists.some((l) => l.listId === 'mungyeong-palgyeong'),
  '문경 hub → 문경 팔경 list',
);
const aliasLists = matchLocalScenicListsForQuery('문경 팔경');
assert.ok(
  aliasLists.length === 1 && aliasLists[0].listId === 'mungyeong-palgyeong',
  '문경 팔경 alias beats hub absorption',
);
const mungyeongHub = resolveCityAttractionHub('문경');
assert.equal(
  localScenicListDisplayTitle(mungyeongLists[0], mungyeongHub),
  '문경 팔경',
  'display title 문경 팔경 (not SSOT 문경8경)',
);
assert.ok(listsForHub('mungyeong').length >= 1, 'listsForHub mungyeong');

const memberRows = listsForHub('mungyeong').flatMap((list) =>
  (list.members || [])
    .map((member) => localScenicMemberToSuggestion(list, mungyeongHub, member))
    .filter(Boolean),
);
assert.ok(memberRows.length >= 3, '문경 팔경 member suggestions');
assert.ok(
  memberRows.every((s) => s.groupTitle === '문경 팔경'),
  'member groupTitle 문경 팔경',
);
assert.ok(
  memberRows.some((s) => s.name === '새재계곡'),
  '새재계곡 under 문경 팔경',
);
assert.ok(
  resolveLocalScenicList('문경 팔경')?.list?.listId === 'mungyeong-palgyeong',
  '문경 팔경 alias resolves list (hub aliases do not swallow it)',
);

const merged = mergeLocalScenicMembersIntoScenicSpots([], 'mungyeong');
assert.ok(merged.length >= 8, 'scenic ul injects 문경 팔경 members without scenic JSON');
assert.equal(merged[0].groupTitle, '문경 팔경');
assert.ok(
  merged.every((s) => s.source === 'localScenicList' || s.groupTitle === '문경 팔경'),
  'injected rows are list members not koreaScenicSpots writes',
);
const jinnam = merged.find((s) => s.attractionName === '진남교반');
assert.ok(jinnam?.imageUrl, '진남교반 palgyeong member gets GATEO curated thumb');
assert.equal(jinnam?.contentId, '126570', '진남교반 inherits curated contentId');

const groupedNearby = groupNearbySpotsWithLocalScenic(
  [{ name: '문경새재', contentId: '123' }],
  { hubId: 'mungyeong' },
);
assert.ok(groupedNearby.groups[0]?.title === '문경 팔경', 'nearby group title');
assert.ok(
  groupedNearby.groups[0].items.some((i) => i.name === '새재계곡'),
  'nearby injects SSOT member',
);
assert.ok(
  groupedNearby.rest.some((i) => i.name === '문경새재'),
  'non-member nearby stays in rest',
);

// curated 멤버 필터 (리스트 있을 때만)
const curated = listKoreaScenicSpots();
for (const list of lists) {
  const scenicHit = matchLocalScenicListForScenicSearch(list.title);
  assert.ok(scenicHit?.listId === list.listId, `scenic list match ${list.listId}`);
  const filtered = filterScenicSpotsByQuery(curated, list.title);
  for (const spot of filtered) {
    assert.ok(
      spotMatchesLocalScenicListMember(spot, list),
      `curated filter member ${list.listId} / ${spot.id || spot.name}`,
    );
  }
}

// 빈 쿼리·미매칭
assert.equal(filterScenicSpotsByQuery(curated, '').length, curated.length);
assert.equal(
  filterScenicSpotsByQuery(curated, 'zzzz-no-local-scenic-xxxx').length,
  filterScenicSpotsByQuery(curated, 'zzzz-no-local-scenic-xxxx').length,
);
assert.equal(normalizeScenicQuery('  홍천 팔경 '), '홍천팔경');

const extra = process.argv.slice(2);
for (const q of extra) {
  const hit = resolveLocalScenicList(q);
  if (!hit) {
    console.error(`FAIL: no resolve for "${q}"`);
    process.exit(1);
  }
  console.log(`OK extra: "${q}" → ${hit.list.listId}`);
}

console.log(`smoke-korea-local-scenic-lists: PASS (${lists.length} lists)`);
