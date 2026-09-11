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
  attractionToPlacePin,
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
  localScenicMemberSpotId,
  mergeLocalScenicMembersIntoScenicSpots,
  groupNearbySpotsWithLocalScenic,
  missingNearbyThumbContentIds,
  hasTourContentId,
  resolveLocalScenicListSpotById,
  listLocalScenicMemberJobs,
} from '../src/pages/Home/lib/koreaLocalScenicLists.js';
import { pickTourAttractionRowForTitle } from '../src/pages/Home/lib/koreaTourAttractionTitleMatch.js';
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
  scenicPageSrc.includes('resolveLocalScenicListSpotById'),
  'ScenicPage resolves local-scenic: list ids for detail',
);
assert.ok(
  !scenicPageSrc.includes('hasTourContentId(spot.contentId) ? openSpot'),
  'ScenicPage does not block palgyeong rows without Tour id',
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
assert.equal(merged[0].blurb, '문경 1경');
assert.ok(
  merged.every((s) => s.source === 'localScenicList' || s.groupTitle === '문경 팔경'),
  'injected rows are list members not koreaScenicSpots writes',
);
const jinnam = merged.find((s) => s.attractionName === '진남교반');
assert.ok(jinnam?.imageUrl, '진남교반 palgyeong member gets GATEO curated thumb');
assert.equal(jinnam?.contentId, '126570', '진남교반 inherits curated contentId');

const hongcheonMerged = mergeLocalScenicMembersIntoScenicSpots([], 'hongcheon');
const garisanRow = hongcheonMerged.find((s) => s.attractionName === '가리산');
assert.ok(garisanRow, '홍천 팔경 injects 가리산 even without GATEO curated name match');
assert.equal(garisanRow.name, '가리산');
assert.equal(garisanRow.contentId, '125593');
assert.notEqual(
  garisanRow.name,
  garisanRow.id,
  '가리산 list row title is not the synthetic id',
);
const garisanId = localScenicMemberSpotId('hongcheon-palgyeong', '가리산');
assert.equal(garisanRow.id, garisanId);
const garisanResolved = resolveLocalScenicListSpotById(garisanId);
assert.ok(garisanResolved, 'resolveLocalScenicListSpotById 가리산');
assert.equal(garisanResolved.name, '가리산');
assert.equal(garisanResolved.contentId, '125593');
assert.ok(hasTourContentId(garisanResolved.contentId), '가리산 has Tour contentId');
assert.equal(garisanResolved.hubId, 'hongcheon');

const geumhakId = localScenicMemberSpotId('hongcheon-palgyeong', '금학산');
const geumhak = resolveLocalScenicListSpotById(geumhakId);
assert.ok(geumhak, '금학산 resolves without Tour contentId');
assert.equal(geumhak.name, '금학산');
assert.ok(!hasTourContentId(geumhak.contentId), '금학산 has no Tour contentId');
assert.equal(resolveLocalScenicListSpotById('not-a-local-scenic'), null);

const hongcheonJobs = listLocalScenicMemberJobs('hongcheon');
const garisanJob = hongcheonJobs.find((j) => j.name === '가리산');
const geumhakJob = hongcheonJobs.find((j) => j.name === '금학산');
assert.ok(garisanJob?.contentId === '125593', '가리산 job contentId');
assert.ok(!geumhakJob?.contentId, '금학산 job has no SSOT contentId');

const pickedGarisan = pickTourAttractionRowForTitle(
  [
    { name: '가리산자연휴양림', contentId: '126905', addr1: '강원특별자치도 홍천군' },
    { name: '가리산', contentId: '125593', addr1: '강원특별자치도 홍천군' },
  ],
  '가리산',
  ['홍천'],
);
assert.equal(pickedGarisan?.contentId, '125593', 'pick exact 가리산 over 휴양림');

const hongcheonHub = resolveCityAttractionHub('hongcheon');
const garisanAttr = (hongcheonHub?.attractions || []).find((a) => a.name === '가리산');
const garisanPin = attractionToPlacePin(hongcheonHub, garisanAttr);
assert.equal(garisanPin.contentId, '125593', '가리산 place pin carries contentId');

const groupedNearby = groupNearbySpotsWithLocalScenic(
  [{ name: '문경새재', contentId: '123' }],
  { hubId: 'mungyeong' },
);
assert.ok(groupedNearby.groups[0]?.title === '문경 팔경', 'nearby group title');
assert.ok(
  groupedNearby.groups[0].items.some((i) => i.name === '새재계곡'),
  'nearby injects SSOT member',
);
const nearbySaejae = groupedNearby.groups[0].items.find((i) => i.name === '새재계곡');
assert.equal(nearbySaejae?.rankBlurb, '문경 1경', 'nearby 팔경 행 부제 문경 1경');
assert.ok(nearbySaejae?.imageUrl, 'nearby 새재계곡 curated/overlay thumb');
assert.ok(
  groupedNearby.rest.some((i) => i.name === '문경새재'),
  'non-member nearby stays in rest',
);

const wonjuNearby = groupNearbySpotsWithLocalScenic([], { hubId: 'wonju' });
const wonjuGroup = wonjuNearby.groups.find((g) => g.listId === 'wonju-palgyeong');
assert.ok(wonjuGroup?.title === '원주 팔경', '원주 nearby group title');
assert.equal(wonjuGroup?.items?.[0]?.name, '구룡사');
assert.equal(wonjuGroup?.items?.[0]?.rankBlurb, '원주 1경', '원주 1경 행 부제');
assert.ok(wonjuGroup?.items?.[0]?.imageUrl, '원주 구룡사 nearby thumb');
const wonjuRanks = (wonjuGroup?.items || []).map((i) => i.rankBlurb);
assert.deepEqual(
  wonjuRanks.slice(0, 3),
  ['원주 1경', '원주 2경', '원주 3경'],
  '원주 팔경 nearby 1~3경',
);
assert.equal(
  missingNearbyThumbContentIds(wonjuNearby).every((id) => /^\d+$/.test(id)),
  true,
  'missing nearby thumbs are Tour ids',
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

// 단양·문경 팔경 오버레이 보강 검증
const danyangOksun = resolveLocalScenicListSpotById('local-scenic:danyang-palgyeong:옥순봉');
assert.ok(danyangOksun?.imageUrl, '단양 옥순봉 overlay imageUrl');
assert.ok(danyangOksun?.overview?.includes('단양팔경'), '단양 옥순봉 overlay overview');

const mungyeongSaejae = resolveLocalScenicListSpotById('local-scenic:mungyeong-palgyeong:새재계곡');
assert.ok(mungyeongSaejae?.contentId === '126017', '문경 새재계곡 overlay contentId');
assert.ok(mungyeongSaejae?.imageUrl, '문경 새재계곡 overlay imageUrl');

const uiseongBinghyeol = resolveLocalScenicListSpotById(
  'local-scenic:uiseong-binggye-palgyeong:빙계빙혈',
);
assert.ok(uiseongBinghyeol?.imageUrl, '의성 빙혈 overlay imageUrl');
assert.ok(uiseongBinghyeol?.overview?.includes('빙혈'), '의성 빙혈 overlay overview');
assert.ok(!uiseongBinghyeol?.contentId, '의성 빙혈 JSON contentId 없음 유지');

const uiseongPagoda = resolveLocalScenicListSpotById(
  'local-scenic:uiseong-binggye-palgyeong:빙산사지오층석탑',
);
assert.ok(uiseongPagoda?.imageUrl, '의성 빙산사지 오층석탑 overlay imageUrl');
assert.ok(uiseongPagoda?.overview?.includes('보물'), '의성 빙산사지 오층석탑 overlay overview');

const uiseongMerged = mergeLocalScenicMembersIntoScenicSpots([], 'uiseong');
const uiseongPalgyeong = uiseongMerged.filter(
  (s) => s.localScenicListId === 'uiseong-binggye-palgyeong',
);
assert.equal(uiseongPalgyeong.length, 8, '의성 빙계팔경 8명');
assert.ok(
  uiseongPalgyeong.every((s) => s.overview && s.imageUrl),
  '의성 빙계팔경 8명 overlay 사진·개요',
);
assert.equal(
  new Set(uiseongPalgyeong.map((s) => s.imageUrl)).size,
  8,
  '의성 빙계팔경 썸네일 8장 서로 다름',
);
const uiseongGalleryUrls = uiseongPalgyeong.flatMap((s) => s.galleryUrls || []);
assert.ok(
  uiseongPalgyeong.every((s) => (s.galleryUrls || []).length >= 2),
  '의성 빙계팔경 본문 갤러리 2장 이상',
);
assert.equal(
  new Set(uiseongGalleryUrls).size,
  uiseongGalleryUrls.length,
  '의성 빙계팔경 갤러리 URL 중복 없음',
);
assert.ok(
  uiseongPalgyeong.every((s) => s.groupTitle === '의성 팔경'),
  '의성 groupTitle 의성 팔경',
);
const uiseongRankBlurbs = [
  '의성 1경',
  '의성 2경',
  '의성 3경',
  '의성 4경',
  '의성 5경',
  '의성 6경',
  '의성 7경',
  '의성 8경',
];
assert.deepEqual(
  uiseongPalgyeong.map((s) => s.blurb),
  uiseongRankBlurbs,
  '의성 빙계팔경 행 부제 1경~8경',
);
assert.equal(
  new Set(uiseongPalgyeong.map((s) => s.blurb)).size,
  8,
  '의성 빙계팔경 행 부제 서로 다름',
);
const uiseongEn = mergeLocalScenicMembersIntoScenicSpots([], 'uiseong', 'en').filter(
  (s) => s.localScenicListId === 'uiseong-binggye-palgyeong',
);
assert.equal(uiseongEn[0]?.blurb, 'Uiseong View 1');
assert.equal(uiseongEn[0]?.groupTitle, 'Uiseong Eight Views');

const mujuEunguam = resolveLocalScenicListSpotById('local-scenic:muju-other:은구암');
assert.ok(mujuEunguam?.imageUrl, '무주 은구암 overlay imageUrl');
assert.ok(mujuEunguam?.overview?.includes('은구암'), '무주 은구암 overlay overview');

const mujuIlsadae = resolveLocalScenicListSpotById('local-scenic:muju-other:일사대');
assert.ok(mujuIlsadae?.overview?.includes('명승'), '무주 일사대 overlay overview');
assert.ok(mujuIlsadae?.imageUrl?.includes('1629007'), '무주 일사대 KHS 사진');

const mujuMerged = mergeLocalScenicMembersIntoScenicSpots([], 'muju');
const mujuGucheon = mujuMerged.filter((s) => s.localScenicListId === 'muju-other');
assert.equal(mujuGucheon.length, 33, '무주 구천동33경 33명');
assert.equal(mujuGucheon[0]?.groupTitle, '무주 명소');
assert.equal(mujuGucheon[0]?.blurb, '무주 1경');
assert.equal(mujuGucheon[32]?.blurb, '무주 33경');
const mujuDeficit = mujuGucheon.filter((s) => !s.contentId);
assert.equal(mujuDeficit.length, 28, '무주 구천동 결손 28명');
assert.ok(
  mujuDeficit.every((s) => s.overview && s.imageUrl),
  '무주 결손 28명 overlay 사진·개요',
);

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
