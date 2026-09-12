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
  resolveLocalScenicListFromSearchQuery,
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
import { sortScenicSpotsByPlaceCluster } from '../src/pages/Home/lib/sortScenicSpotsByPlaceCluster.js';

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
  scenicSrc.includes('mergeLocalScenicMembersIntoScenicSpots'),
  'scenicSearch injects palgyeong members into curated search',
);
assert.ok(
  scenicSrc.includes('spotMatchesLocalScenicListMember'),
  'scenicSearch filters curated members',
);

// searchSuggestions 브리지 wiring
assert.ok(
  searchSrc.includes('resolveLocalScenicListFromSearchQuery'),
  'searchSuggestions imports resolveLocalScenicListFromSearchQuery',
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

const gwangyangMerged = mergeLocalScenicMembersIntoScenicSpots([], 'gwangyang');
const gwangyangNine = gwangyangMerged.filter(
  (s) => s.localScenicListId === 'gwangyang-gugyeong',
);
assert.equal(gwangyangNine.length, 9, '광양9경 9명');
assert.equal(gwangyangNine[0]?.groupTitle, '광양 구경');
assert.equal(gwangyangNine[0]?.blurb, '광양 1경');
const gwangyangDeficitNames = [
  '백운산 4대 계곡',
  '백운산 자연휴양림',
  '광양이순신대교',
  '광양만 야경',
  '옥룡사지 동백나무 숲',
  '광양읍수와 이팝나무',
];
const gwangyangDeficit = gwangyangNine.filter((s) =>
  gwangyangDeficitNames.includes(s.attractionName),
);
assert.equal(gwangyangDeficit.length, 6, '광양9경 결손 6명');
assert.ok(
  gwangyangDeficit.every((s) => s.overview && s.imageUrl),
  '광양 결손 6명 overlay 사진·개요',
);
assert.ok(
  gwangyangDeficit.every((s) => !s.contentId),
  '광양 결손 JSON contentId 없음 유지',
);
assert.equal(
  new Set(gwangyangDeficit.map((s) => s.imageUrl)).size,
  6,
  '광양 결손 6명 썸네일 서로 다름',
);
const gyValleys = resolveLocalScenicListSpotById(
  'local-scenic:gwangyang-gugyeong:백운산4대계곡',
);
assert.ok(gyValleys?.overview?.includes('성불'), '광양 4대 계곡 overlay overview');
const gyEupsu = resolveLocalScenicListSpotById(
  'local-scenic:gwangyang-gugyeong:광양읍수와이팝나무',
);
assert.ok(gyEupsu?.overview?.includes('천연기념물'), '광양 읍수 overlay overview');

const hadongMerged = mergeLocalScenicMembersIntoScenicSpots([], 'hadong');
const hadongTen = hadongMerged.filter((s) => s.localScenicListId === 'hadong-sipgyeong');
assert.equal(hadongTen.length, 10, '하동10경 10명');
assert.equal(hadongTen[0]?.groupTitle, '하동 십경');
assert.equal(hadongTen[0]?.blurb, '하동 1경');
const hadongDeficitNames = [
  '화개장터십리벚꽃',
  '금오산 일출과 다도해',
  '쌍계사의 가을',
  '형제봉 철쭉',
  '청학동 삼성궁',
  '하동포구 백사청송',
  '섬호정에서 바라본 섬진강',
];
const hadongDeficit = hadongTen.filter((s) =>
  hadongDeficitNames.includes(s.attractionName),
);
assert.equal(hadongDeficit.length, 7, '하동10경 결손 7명');
assert.ok(
  hadongDeficit.every((s) => s.overview && s.imageUrl),
  '하동 결손 7명 overlay 사진·개요',
);
assert.ok(
  hadongDeficit.every((s) => !s.contentId),
  '하동 결손 JSON contentId 없음 유지',
);
assert.equal(
  new Set(hadongDeficit.map((s) => s.imageUrl)).size,
  7,
  '하동 결손 7명 썸네일 서로 다름',
);
const hdCherry = resolveLocalScenicListSpotById(
  'local-scenic:hadong-sipgyeong:화개장터십리벚꽃',
);
assert.ok(hdCherry?.overview?.includes('혼례길'), '하동 십리벚꽃 overlay overview');
const hdSeomho = resolveLocalScenicListSpotById(
  'local-scenic:hadong-sipgyeong:섬호정에서바라본섬진강',
);
assert.ok(hdSeomho?.overview?.includes('섬호정'), '하동 섬호정 overlay overview');

assert.ok(
  resolveLocalScenicList('하동 십경')?.list?.listId === 'hadong-sipgyeong',
  '표시명 하동 십경 resolve',
);
assert.ok(
  matchLocalScenicListForScenicSearch('하동 십경')?.listId === 'hadong-sipgyeong',
  '표시명 하동 십경 scenic search exact',
);
const hadongSearch = filterScenicSpotsByQuery(listKoreaScenicSpots(), '하동', {
  injectLocalScenic: true,
});
assert.equal(hadongSearch.length >= 10, true, '하동 검색 십경 10명 주입');
assert.equal(hadongSearch[0]?.groupTitle, '하동 십경');
assert.equal(
  hadongSearch.filter((s) => s.localScenicListId === 'hadong-sipgyeong').length,
  10,
  '하동 검색 십경 10행',
);
const hadongSipgyeongSearch = filterScenicSpotsByQuery(
  listKoreaScenicSpots(),
  '하동 십경',
  { injectLocalScenic: true },
);
assert.equal(hadongSipgyeongSearch.length, 10, '하동 십경 검색 10명');
assert.ok(
  hadongSipgyeongSearch.every((s) => s.groupTitle === '하동 십경'),
  '하동 십경 검색 그룹 제목',
);

const hadongTenFromSearch = hadongSearch.filter(
  (s) => s.localScenicListId === 'hadong-sipgyeong',
);
const hadongRestFromSearch = hadongSearch.filter(
  (s) => s.localScenicListId !== 'hadong-sipgyeong',
);
const hadongInterleaved = [];
const hadongMixMax = Math.max(
  hadongTenFromSearch.length,
  hadongRestFromSearch.length,
);
for (let i = 0; i < hadongMixMax; i += 1) {
  if (hadongTenFromSearch[i]) hadongInterleaved.push(hadongTenFromSearch[i]);
  if (hadongRestFromSearch[i]) hadongInterleaved.push(hadongRestFromSearch[i]);
}
const hadongGrouped = sortScenicSpotsByPlaceCluster(hadongInterleaved);
const hadongGroupedTitles = hadongGrouped.map((s) =>
  String(s.groupTitle || '').trim(),
);
const hadongFirstRest = hadongGroupedTitles.findIndex((title) => !title);
assert.equal(hadongFirstRest, 10, '하동 검색 정렬 후 십경 10행이 선두 연속');
assert.ok(
  hadongGroupedTitles.slice(0, 10).every((title) => title === '하동 십경'),
  '하동 검색 십경 그룹이 한 덩어리',
);
assert.ok(
  hadongGroupedTitles.slice(10).every((title) => !title),
  '하동 검색 대표 명소는 십경 뒤에만',
);
assert.equal(hadongGrouped[0]?.blurb, '하동 1경', '하동 검색 선두가 1경');

const yeongdongMerged = mergeLocalScenicMembersIntoScenicSpots([], 'yeongdong');
const yeongdongYangsan = yeongdongMerged.filter(
  (s) => s.localScenicListId === 'yeongdong-yangsan-palgyeong',
);
const yeongdongHancheon = yeongdongMerged.filter(
  (s) => s.localScenicListId === 'yeongdong-hancheon-palgyeong',
);
assert.equal(yeongdongYangsan.length, 8, '양산팔경 8명');
assert.equal(yeongdongHancheon.length, 8, '한천팔경 8명');
const yeongdongYangsanDeficitNames = [
  '비봉산',
  '봉황대',
  '함벽정',
  '여의정',
  '자풍서당',
  '용암',
];
const yeongdongHancheonDeficitNames = [
  '화헌악',
  '용연대',
  '산양벽',
  '청학굴',
  '법존암',
  '사군봉',
  '냉천정',
];
const yeongdongYangsanDeficit = yeongdongYangsan.filter((s) =>
  yeongdongYangsanDeficitNames.includes(s.attractionName),
);
const yeongdongHancheonDeficit = yeongdongHancheon.filter((s) =>
  yeongdongHancheonDeficitNames.includes(s.attractionName),
);
assert.equal(yeongdongYangsanDeficit.length, 6, '양산팔경 결손 6명');
assert.equal(yeongdongHancheonDeficit.length, 7, '한천팔경 결손 7명');
assert.ok(
  [...yeongdongYangsanDeficit, ...yeongdongHancheonDeficit].every(
    (s) => s.overview && s.imageUrl,
  ),
  '영동 결손 13명 overlay 사진·개요',
);
assert.ok(
  [...yeongdongYangsanDeficit, ...yeongdongHancheonDeficit].every((s) => !s.contentId),
  '영동 결손 JSON contentId 없음 유지',
);
assert.equal(
  new Set(
    [...yeongdongYangsanDeficit, ...yeongdongHancheonDeficit].map((s) => s.imageUrl),
  ).size,
  13,
  '영동 결손 13명 썸네일 서로 다름',
);
const ydBibong = resolveLocalScenicListSpotById(
  'local-scenic:yeongdong-yangsan-palgyeong:비봉산',
);
assert.ok(ydBibong?.overview?.includes('양산팔경'), '영동 비봉산 overlay overview');
const ydNaengcheon = resolveLocalScenicListSpotById(
  'local-scenic:yeongdong-hancheon-palgyeong:냉천정',
);
assert.ok(ydNaengcheon?.overview?.includes('냉천정'), '영동 냉천정 overlay overview');

const yeongdongAll = mergeLocalScenicMembersIntoScenicSpots([], 'yeongdong');
assert.equal(yeongdongAll.length, 16, '영동 2개 팔경 16행');
assert.equal(
  new Set(yeongdongAll.map((s) => s.imageUrl).filter(Boolean)).size,
  16,
  '영동 16행 썸네일 16장 모두 고유',
);
const yeongdongHub = resolveCityAttractionHub('yeongdong');
const hancheonList = listKoreaLocalScenicLists().find(
  (l) => l.listId === 'yeongdong-hancheon-palgyeong',
);
const yangsanPalgyeongList = listKoreaLocalScenicLists().find(
  (l) => l.listId === 'yeongdong-yangsan-palgyeong',
);
assert.equal(
  localScenicListDisplayTitle(hancheonList, yeongdongHub),
  '한천팔경',
  '영동 한천 그룹은 공식명 한천팔경 (영동 팔경 아님)',
);
assert.equal(
  localScenicListDisplayTitle(yangsanPalgyeongList, yeongdongHub),
  '양산팔경',
  '영동 양산 그룹은 공식명 양산팔경',
);
assert.ok(
  yeongdongHancheon.every((s) => s.groupTitle === '한천팔경'),
  '한천팔경 행 groupTitle 한천팔경',
);
assert.ok(
  yeongdongYangsan.every((s) => s.groupTitle === '양산팔경'),
  '양산팔경 행 groupTitle 양산팔경',
);

const hancheonSearch = filterScenicSpotsByQuery(
  listKoreaScenicSpots(),
  '한천',
  { injectLocalScenic: true },
);
assert.equal(hancheonSearch.length, 8, '한천 검색 시 한천팔경 8행 주입');
assert.ok(
  hancheonSearch.every((s) => s.localScenicListId === 'yeongdong-hancheon-palgyeong'),
  '한천 검색 결과 전원 한천팔경',
);
assert.equal(
  new Set(hancheonSearch.map((s) => s.imageUrl)).size,
  8,
  '한천 검색 8행 썸네일 서로 다름',
);
assert.ok(
  hancheonSearch.every((s) => s.groupTitle === '한천팔경'),
  '한천 검색 그룹명 한천팔경 (영동 팔경 아님)',
);

assert.equal(
  resolveLocalScenicListFromSearchQuery('한천')?.list?.listId,
  'yeongdong-hancheon-palgyeong',
  '한천 includes → 한천팔경',
);
assert.equal(
  resolveLocalScenicListFromSearchQuery('양산'),
  null,
  '양산 시군 단독은 영동 양산팔경으로 안 묶임',
);
const hancheonGlobeMembers = (hancheonList.members || [])
  .map((member) => localScenicMemberToSuggestion(hancheonList, yeongdongHub, member))
  .filter(Boolean);
assert.equal(hancheonGlobeMembers.length, 8, '한천팔경 지구본 멤버 8행');
assert.ok(
  hancheonGlobeMembers.every((s) => s.groupTitle === '한천팔경'),
  '지구본 한천 멤버 groupTitle 한천팔경',
);
assert.ok(
  searchSrc.includes('resolveLocalScenicListFromSearchQuery(q)'),
  '지구본 검색이 includes 리스트 매칭을 씀',
);

const ysNaewonsa = resolveLocalScenicListSpotById(
  'local-scenic:yangsan-other:내원사계곡',
);
assert.ok(ysNaewonsa?.imageUrl, '양산 내원사계곡 overlay imageUrl');
assert.ok(ysNaewonsa?.overview?.includes('내원사'), '양산 내원사계곡 overlay overview');
assert.equal(ysNaewonsa?.contentId, '126073', '양산 내원사계곡 overlay contentId');

const ysHwangsan = resolveLocalScenicListSpotById(
  'local-scenic:yangsan-other:황산공원',
);
assert.ok(ysHwangsan?.imageUrl, '양산 황산공원 overlay imageUrl');
assert.ok(ysHwangsan?.overview?.includes('황산공원'), '양산 황산공원 overlay overview');
assert.equal(ysHwangsan?.contentId, '2784326', '양산 황산공원 overlay contentId');

const yangsanSearch = filterScenicSpotsByQuery(
  listKoreaScenicSpots(),
  '양산',
  { injectLocalScenic: true },
);
assert.equal(yangsanSearch.length, 15, '양산 검색 시 양산 허브 15곳');
const yangsanSearchNaewon = yangsanSearch.find((s) => s.name === '내원사 계곡');
assert.ok(yangsanSearchNaewon?.imageUrl, '양산 검색 내원사 계곡 사진 있음');
const yangsanSearchHwangsan = yangsanSearch.find((s) => s.name === '황산공원');
assert.ok(yangsanSearchHwangsan?.imageUrl, '양산 검색 황산공원 사진 있음');

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
