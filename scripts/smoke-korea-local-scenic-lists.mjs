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
  hubAttractionSearchGroupTitle,
  localScenicMemberSpotId,
  mergeLocalScenicMembersIntoScenicSpots,
  groupNearbySpotsWithLocalScenic,
  missingNearbyThumbContentIds,
  hasTourContentId,
  isNearbyAttractionRowClickable,
  mergeNearbyRowWithLocalScenicDetail,
  resolveLocalScenicListSpotById,
  listLocalScenicMemberJobs,
  lookupLocalScenicPhotoByContentId,
  lookupLocalScenicMemberOverlayForSpot,
  resolveLocalScenicRowFirstImage,
  resolveSearchScenicMedia,
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
assert.ok(
  suggestionListSrc.includes('rankBlurb'),
  'SearchSuggestionList renders palgyeong rankBlurb',
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
  scenicPageSrc.includes('lookupLocalScenicPhotoByContentId'),
  'ScenicPage fills empty Tour thumbs from palgyeong overlay contentId',
);
assert.ok(
  scenicPageSrc.includes('tourListMissingContentIds'),
  'ScenicPage fills empty Tour list thumbs via live TourAPI firstimage',
);
assert.ok(
  scenicPageSrc.includes('rememberKoreaTourAttractionFirstImage'),
  'ScenicPage caches live TourAPI firstimage for Tour list thumbs',
);
const tourFirstImageSrc = readFileSync(
  join(root, 'src/utils/fetchTourApiAttractionDetail.js'),
  'utf8',
);
assert.ok(
  /export async function fetchTourApiFirstImage[\s\S]*detailImage/.test(
    tourFirstImageSrc,
  ),
  'fetchTourApiFirstImage uses detailImage when firstimage is empty',
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
assert.equal(memberRows[0].rankBlurb, '문경 1경', '탐색 제안 행 부제 문경 1경');
assert.ok(
  memberRows.some((s) => s.rankBlurb === '문경 2경'),
  '탐색 제안에 문경 2경 표기',
);
const ongjinHub = resolveCityAttractionHub('옹진');
assert.equal(listsForHub('ongjin').length, 0, '옹진 has no palgyeong list');
assert.equal(
  hubAttractionSearchGroupTitle(ongjinHub),
  '옹진 명소',
  '옹진 fallback group is 명소 not 팔경',
);
assert.equal(hubAttractionSearchGroupTitle(mungyeongHub), '');
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

const miyak = resolveLocalScenicListSpotById('local-scenic:hongcheon-palgyeong:미약골');
assert.equal(miyak?.contentId, '2613261', '미약골 JSON contentId 유지');
assert.ok(miyak?.imageUrl?.includes('p_20210208082101687jnf379'), '미약골 홍천군 공식 사진');
assert.ok(miyak?.overview?.includes('구룡령로 3748-8'), '미약골 주소');
assert.ok(miyak?.overview?.includes('용소계곡'), '미약골≠용소계곡');
assert.ok(
  lookupLocalScenicPhotoByContentId('2613261')?.imageUrl?.includes('p_20210208082101687jnf379'),
  '미약골 Tour 빈 썸네일 overlay 2613261',
);
assert.ok(
  resolveSearchScenicMedia({ hubId: 'hongcheon', name: '미약골', contentId: '2613261' })
    .imageUrl?.includes('p_20210208082101687jnf379'),
  '홍천 팔경 미약골 검색 썸네일',
);
const garyeong = resolveLocalScenicListSpotById('local-scenic:hongcheon-palgyeong:가령폭포');
assert.equal(garyeong?.contentId, '125658', '가령폭포 JSON contentId 유지');
assert.ok(garyeong?.imageUrl?.includes('p_202102180508378213s06jQ'), '가령폭포 홍천군 공식 사진');
assert.equal(garyeong?.galleryUrls?.length, 3, '가령폭포 공식 사진 3장');
assert.ok(garyeong?.overview?.includes('와야리 산12-1'), '가령폭포 주소');
assert.ok(garyeong?.overview?.includes('동해'), '가령폭포≠동해 용추');
assert.notEqual(miyak?.imageUrl, garyeong?.imageUrl, '미약골·가령폭포 썸네일 다름');
assert.ok(
  lookupLocalScenicPhotoByContentId('125658')?.imageUrl?.includes('p_202102180508378213s06jQ'),
  '가령폭포 Tour 빈 썸네일 overlay 125658',
);
assert.ok(
  resolveLocalScenicRowFirstImage(
    { id: 'local-scenic:hongcheon-palgyeong:가령폭포', contentId: '125658', hubId: 'hongcheon' },
    new Map([['125658', 'https://tong.visitkorea.or.kr/cms/resource/other.jpg']]),
  )?.includes('p_202102180508378213s06jQ'),
  '가령폭포 오버레이가 Tour firstimage보다 우선',
);
const hongcheonList = lists.find((l) => l.listId === 'hongcheon-palgyeong');
const garyeongSuggest = localScenicMemberToSuggestion(
  hongcheonList,
  resolveCityAttractionHub('hongcheon'),
  hongcheonList?.members?.find((m) => m.attractionName === '가령폭포'),
);
assert.ok(
  garyeongSuggest?.imageUrl?.includes('p_202102180508378213s06jQ'),
  '홍천 팔경 드롭다운 가령폭포 썸네일',
);

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

const injeNearby = groupNearbySpotsWithLocalScenic([], { hubId: 'inje' });
const injeGroup = injeNearby.groups.find((g) => g.listId === 'inje-palgyeong');
assert.ok(injeGroup?.title?.includes('인제'), 'inje nearby group title');
for (const name of ['대청봉', '내린천계곡', '방동약수', '대승폭포', '합강정']) {
  const row = injeGroup?.items?.find((i) => i.name === name);
  assert.ok(
    String(row?.firstImage || row?.imageUrl || '').includes('injetour.co.kr'),
    `inje 팔경 ${name} overlay thumb`,
  );
}
assert.ok(
  !missingNearbyThumbContentIds(injeNearby).includes('125723'),
  '방동약수 thumb from overlay not async-only',
);

const damyangNearby = groupNearbySpotsWithLocalScenic([], { hubId: 'damyang' });
const damyangGroup = damyangNearby.groups.find((g) => g.listId === 'damyang-other');
const gamagol = damyangGroup?.items?.find((i) => i.name === '가마골용소');
assert.ok(gamagol?.localScenicListId === 'damyang-other', '담양10경 가마골용소 nearby row');
assert.ok(
  isNearbyAttractionRowClickable(gamagol),
  '담양10경 가마골용소 — contentId 없어도 오버레이로 클릭 가능',
);
const gamagolModal = mergeNearbyRowWithLocalScenicDetail(gamagol);
assert.ok(
  String(gamagolModal?.overview || '').includes('가마골용소'),
  '담양10경 가마골용소 modal overview',
);
const chuwol = damyangGroup?.items?.find((i) => i.name === '추월산');
assert.ok(chuwol?.imageUrl?.includes('visitkorea'), '담양10경 추월산 nearby Tour thumb');
const geumseong = damyangGroup?.items?.find((i) => i.name === '금성산성');
assert.ok(geumseong?.imageUrl?.includes('visitkorea'), '담양10경 금성산성 nearby Tour thumb');

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
assert.equal(mujuGucheon[0]?.groupTitle, '구천동 33경');
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
assert.equal(yeongdongHancheon[0]?.blurb, '한천 1경', '한천팔경 1행 부제 한천 1경');
assert.equal(yeongdongYangsan[0]?.blurb, '양산 1경', '양산팔경 1행 부제 양산 1경');
assert.ok(
  yeongdongHancheon.every((s) => String(s.blurb || '').startsWith('한천 ')),
  '한천팔경 행 부제 한천 N경',
);
assert.ok(
  yeongdongYangsan.every((s) => String(s.blurb || '').startsWith('양산 ')),
  '양산팔경 행 부제 양산 N경',
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
assert.ok(
  hancheonSearch.every((s) => String(s.blurb || '').startsWith('한천 ')),
  '한천 검색 행 부제 한천 N경 (영동 N경 아님)',
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

const hamanMerged = mergeLocalScenicMembersIntoScenicSpots([], 'haman');
const hamanNine = hamanMerged.filter((s) => s.localScenicListId === 'haman-gugyeong');
assert.equal(hamanNine.length, 9, '함안9경 9명');
assert.equal(hamanNine[0]?.groupTitle, '함안 구경');
assert.equal(hamanNine[0]?.blurb, '함안 1경');
const hamanDeficitNames = [
  '말이산고분군',
  '악양의 꽃길과 노을',
  '무진정의 사계',
  '연꽃테마파크의 아라홍련',
  '장춘사의 산사풍경',
  '합강정과 반구정의 해돋이',
  '대평늪의 늪지식물',
];
const hamanDeficit = hamanNine.filter((s) => hamanDeficitNames.includes(s.attractionName));
assert.equal(hamanDeficit.length, 7, '함안9경 결손 7명');
assert.ok(
  hamanDeficit.every((s) => s.overview && s.imageUrl),
  '함안 결손 7명 overlay 사진·개요',
);
assert.ok(
  hamanDeficit.every((s) => !s.contentId),
  '함안 결손 JSON contentId 없음 유지',
);
assert.equal(
  new Set(hamanDeficit.map((s) => s.imageUrl)).size,
  7,
  '함안 결손 7명 썸네일 서로 다름',
);
const hamanMari = resolveLocalScenicListSpotById('local-scenic:haman-gugyeong:말이산고분군');
assert.ok(hamanMari?.overview?.includes('말이산'), '함안 말이산 overlay overview');
const hamanLotus = resolveLocalScenicListSpotById(
  'local-scenic:haman-gugyeong:연꽃테마파크의아라홍련',
);
assert.ok(hamanLotus?.overview?.includes('아라홍련'), '함안 아라홍련 overlay overview');
const hamanMarsh = resolveLocalScenicListSpotById(
  'local-scenic:haman-gugyeong:대평늪의늪지식물',
);
assert.ok(hamanMarsh?.overview?.includes('천연기념물'), '함안 대평늪 overlay overview');

const sacheonMerged = mergeLocalScenicMembersIntoScenicSpots([], 'sacheon');
const sacheonNine = sacheonMerged.filter((s) => s.localScenicListId === 'sacheon-gugyeong');
assert.equal(sacheonNine.length, 9, '사천9경 9명');
assert.equal(sacheonNine[0]?.groupTitle, '사천 구경');
assert.equal(sacheonNine[0]?.blurb, '사천 1경');
const sacheonDeficitNames = [
  '삼천포대교와 사천바다케이블카',
  '남일대 코끼리바위',
  '선진리성 벚꽃',
  '봉명산 다솔사',
  '비토섬 갯벌',
  '용두공원과 청룡사 겹벚꽃',
];
const sacheonDeficit = sacheonNine.filter((s) =>
  sacheonDeficitNames.includes(s.attractionName),
);
assert.equal(sacheonDeficit.length, 6, '사천9경 결손 6명');
assert.ok(
  sacheonDeficit.every((s) => s.overview && s.imageUrl),
  '사천 결손 6명 overlay 사진·개요',
);
assert.ok(
  sacheonDeficit.every((s) => !s.contentId),
  '사천 결손 JSON contentId 없음 유지',
);
assert.equal(
  new Set(sacheonDeficit.map((s) => s.imageUrl)).size,
  6,
  '사천 결손 6명 썸네일 서로 다름',
);
const sacheonCable = resolveLocalScenicListSpotById(
  'local-scenic:sacheon-gugyeong:삼천포대교와사천바다케이블카',
);
assert.ok(sacheonCable?.overview?.includes('케이블카'), '사천 케이블카 overlay overview');
const sacheonNamil = resolveLocalScenicListSpotById(
  'local-scenic:sacheon-gugyeong:남일대코끼리바위',
);
assert.ok(sacheonNamil?.overview?.includes('코끼리'), '사천 남일대 overlay overview');

const icheonMerged = mergeLocalScenicMembersIntoScenicSpots([], 'icheon');
const icheonNine = icheonMerged.filter((s) => s.localScenicListId === 'icheon-gugyeong');
assert.equal(icheonNine.length, 9, '이천9경 9명');
assert.equal(icheonNine[0]?.groupTitle, '이천 구경');
assert.equal(icheonNine[0]?.blurb, '이천 1경');
const icheonDeficitNames = [
  '노성산 말머리바위',
  '도드람산 삼봉',
  '반룡송',
  '사기막골도예촌',
  '설봉산 삼형제 바위',
  '애련정',
];
const icheonDeficit = icheonNine.filter((s) => icheonDeficitNames.includes(s.attractionName));
assert.equal(icheonDeficit.length, 6, '이천9경 결손 6명');
assert.ok(
  icheonDeficit.every((s) => s.overview && s.imageUrl),
  '이천 결손 6명 overlay 사진·개요',
);
assert.ok(
  icheonDeficit.every((s) => !s.contentId),
  '이천 결손 JSON contentId 없음 유지',
);
assert.equal(
  new Set(icheonDeficit.map((s) => s.imageUrl)).size,
  6,
  '이천 결손 6명 썸네일 서로 다름',
);
const icheonHorse = resolveLocalScenicListSpotById(
  'local-scenic:icheon-gugyeong:노성산말머리바위',
);
assert.ok(icheonHorse?.overview?.includes('말머리'), '이천 노성산 overlay overview');
const icheonPine = resolveLocalScenicListSpotById('local-scenic:icheon-gugyeong:반룡송');
assert.ok(icheonPine?.overview?.includes('천연기념물'), '이천 반룡송 overlay overview');
const icheonPottery = resolveLocalScenicListSpotById(
  'local-scenic:icheon-gugyeong:사기막골도예촌',
);
assert.ok(icheonPottery?.overview?.includes('도예'), '이천 사기막골 overlay overview');
const icheonPavilion = resolveLocalScenicListSpotById('local-scenic:icheon-gugyeong:애련정');
assert.ok(icheonPavilion?.overview?.includes('애련정'), '이천 애련정 overlay overview');

const changnyeongMerged = mergeLocalScenicMembersIntoScenicSpots([], 'changnyeong');
const changnyeongNine = changnyeongMerged.filter(
  (s) => s.localScenicListId === 'changnyeong-gugyeong',
);
assert.equal(changnyeongNine.length, 9, '창녕구경 9명');
assert.equal(changnyeongNine[0]?.groupTitle, '창녕 구경');
assert.equal(changnyeongNine[0]?.blurb, '창녕 1경');
const changnyeongDeficitNames = [
  '우포늪과 따오기',
  '화왕산 억새와 진달래',
  '낙동강유채축제와 남지개비리',
  '만옥정공원과 신라진흥왕척경비, 술정리동삼층석탑',
  '교동과 송현동고분군',
  '3·1민속문화제와 영산만년교',
];
const changnyeongDeficit = changnyeongNine.filter((s) =>
  changnyeongDeficitNames.includes(s.attractionName),
);
assert.equal(changnyeongDeficit.length, 6, '창녕구경 결손 6명');
assert.ok(
  changnyeongDeficit.every((s) => s.overview && s.imageUrl),
  '창녕 결손 6명 overlay 사진·개요',
);
assert.ok(
  changnyeongDeficit.every((s) => !s.contentId),
  '창녕 결손 JSON contentId 없음 유지',
);
assert.equal(
  new Set(changnyeongDeficit.map((s) => s.imageUrl)).size,
  6,
  '창녕 결손 6명 썸네일 서로 다름',
);
const cngUpo = resolveLocalScenicListSpotById('local-scenic:changnyeong-gugyeong:우포늪과따오기');
assert.ok(cngUpo?.overview?.includes('따오기'), '창녕 우포늪 overlay overview');
const cngHwawang = resolveLocalScenicListSpotById(
  'local-scenic:changnyeong-gugyeong:화왕산억새와진달래',
);
assert.ok(cngHwawang?.overview?.includes('억새'), '창녕 화왕산 overlay overview');
const cngGaebiri = resolveLocalScenicListSpotById(
  'local-scenic:changnyeong-gugyeong:낙동강유채축제와남지개비리',
);
assert.ok(cngGaebiri?.overview?.includes('개비리'), '창녕 남지개비리 overlay overview');
const cngManok = resolveLocalScenicListSpotById(
  'local-scenic:changnyeong-gugyeong:만옥정공원과신라진흥왕척경비,술정리동삼층석탑',
);
assert.ok(cngManok?.overview?.includes('척경비'), '창녕 만옥정 overlay overview');
const cngTomb = resolveLocalScenicListSpotById(
  'local-scenic:changnyeong-gugyeong:교동과송현동고분군',
);
assert.ok(cngTomb?.overview?.includes('고분'), '창녕 고분군 overlay overview');
const cngMannyeon = resolveLocalScenicListSpotById(
  'local-scenic:changnyeong-gugyeong:3·1민속문화제와영산만년교',
);
assert.ok(cngMannyeon?.overview?.includes('만년교'), '창녕 만년교 overlay overview');

const jinjuMerged = mergeLocalScenicMembersIntoScenicSpots([], 'jinju');
const jinjuEight = jinjuMerged.filter((s) => s.localScenicListId === 'jinju-palgyeong');
assert.equal(jinjuEight.length, 8, '진주8경 8명');
assert.equal(jinjuEight[0]?.groupTitle, '진주 팔경');
assert.equal(jinjuEight[0]?.blurb, '진주 1경');
const jinjuDeficitNames = [
  '남강 의암',
  '뒤벼리',
  '새벼리',
  '망진산 봉수대',
  '비봉산의 봄',
  '월아산 해돋이',
];
const jinjuDeficit = jinjuEight.filter((s) => jinjuDeficitNames.includes(s.attractionName));
assert.equal(jinjuDeficit.length, 6, '진주8경 결손 6명');
assert.ok(
  jinjuDeficit.every((s) => s.overview && s.imageUrl),
  '진주 결손 6명 overlay 사진·개요',
);
assert.ok(
  jinjuDeficit.every((s) => !s.contentId),
  '진주 결손 JSON contentId 없음 유지',
);
assert.equal(
  new Set(jinjuDeficit.map((s) => s.imageUrl)).size,
  6,
  '진주 결손 6명 썸네일 서로 다름',
);
const jinjuUiam = resolveLocalScenicListSpotById('local-scenic:jinju-palgyeong:남강의암');
assert.ok(jinjuUiam?.overview?.includes('의암'), '진주 의암 overlay overview');
const jinjuDwibyeori = resolveLocalScenicListSpotById('local-scenic:jinju-palgyeong:뒤벼리');
assert.ok(jinjuDwibyeori?.overview?.includes('절벽'), '진주 뒤벼리 overlay overview');
const jinjuSaebyeori = resolveLocalScenicListSpotById('local-scenic:jinju-palgyeong:새벼리');
assert.ok(jinjuSaebyeori?.overview?.includes('석류공원'), '진주 새벼리 overlay overview');
const jinjuMangjin = resolveLocalScenicListSpotById('local-scenic:jinju-palgyeong:망진산봉수대');
assert.ok(jinjuMangjin?.overview?.includes('봉수'), '진주 망진산 overlay overview');
const jinjuBibong = resolveLocalScenicListSpotById('local-scenic:jinju-palgyeong:비봉산의봄');
assert.ok(jinjuBibong?.overview?.includes('진산'), '진주 비봉산 overlay overview');
const jinjuWola = resolveLocalScenicListSpotById('local-scenic:jinju-palgyeong:월아산해돋이');
assert.ok(jinjuWola?.overview?.includes('해돋이'), '진주 월아산 overlay overview');

const jincheonMerged = mergeLocalScenicMembersIntoScenicSpots([], 'jincheon');
const jincheonEight = jincheonMerged.filter((s) => s.localScenicListId === 'jincheon-palgyeong');
assert.equal(jincheonEight.length, 8, '상산팔경 8명');
assert.equal(jincheonEight[0]?.groupTitle, '진천 팔경');
assert.equal(jincheonEight[0]?.blurb, '진천 1경');
const jincheonDeficitNames = [
  '평사낙안',
  '우담제월',
  '금계완사',
  '상산모운',
  '어은계석',
  '적대청람',
];
const jincheonDeficit = jincheonEight.filter((s) =>
  jincheonDeficitNames.includes(s.attractionName),
);
assert.equal(jincheonDeficit.length, 6, '상산팔경 결손 6명');
assert.ok(
  jincheonDeficit.every((s) => s.overview && s.imageUrl),
  '진천 결손 6명 overlay 사진·개요',
);
assert.ok(
  jincheonDeficit.every((s) => !s.contentId),
  '진천 결손 JSON contentId 없음 유지',
);
assert.equal(
  new Set(jincheonDeficit.map((s) => s.imageUrl)).size,
  6,
  '진천 결손 6명 썸네일 서로 다름',
);
const jcPyeongsa = resolveLocalScenicListSpotById('local-scenic:jincheon-palgyeong:평사낙안');
assert.ok(jcPyeongsa?.overview?.includes('백사장'), '진천 평사낙안 overlay overview');
const jcUdam = resolveLocalScenicListSpotById('local-scenic:jincheon-palgyeong:우담제월');
assert.ok(jcUdam?.overview?.includes('우담'), '진천 우담제월 overlay overview');
const jcGeumgye = resolveLocalScenicListSpotById('local-scenic:jincheon-palgyeong:금계완사');
assert.ok(jcGeumgye?.overview?.includes('금계'), '진천 금계완사 overlay overview');
const jcSangsan = resolveLocalScenicListSpotById('local-scenic:jincheon-palgyeong:상산모운');
assert.ok(jcSangsan?.overview?.includes('상산'), '진천 상산모운 overlay overview');
const jcEoeun = resolveLocalScenicListSpotById('local-scenic:jincheon-palgyeong:어은계석');
assert.ok(jcEoeun?.overview?.includes('정송강사'), '진천 어은계석 overlay overview');
const jcJeokdae = resolveLocalScenicListSpotById('local-scenic:jincheon-palgyeong:적대청람');
assert.ok(jcJeokdae?.overview?.includes('암벽'), '진천 적대청람 overlay overview');

const guryeMerged = mergeLocalScenicMembersIntoScenicSpots([], 'gurye');
const guryeTen = guryeMerged.filter((s) => s.localScenicListId === 'gurye-other');
assert.equal(guryeTen.length, 10, '구례10경 10명');
assert.equal(guryeTen[0]?.groupTitle, '구례 10경');
assert.equal(guryeTen[0]?.blurb, '구례 1경');
const guryeDeficitNames = [
  '노고단 운해',
  '반야봉 낙조',
  '피아골 단풍',
  '산동 산수유꽃',
  '노고단 설경',
];
const guryeDeficit = guryeTen.filter((s) =>
  guryeDeficitNames.includes(s.attractionName),
);
assert.equal(guryeDeficit.length, 5, '구례10경 결손 5명');
assert.ok(
  guryeDeficit.every((s) => s.overview && s.imageUrl),
  '구례 결손 5명 overlay 사진·개요',
);
assert.ok(
  guryeDeficit.every((s) => !s.contentId),
  '구례 결손 JSON contentId 없음 유지',
);
assert.equal(
  new Set(guryeDeficit.map((s) => s.imageUrl)).size,
  5,
  '구례 결손 5명 썸네일 서로 다름',
);
const gyeUnhae = resolveLocalScenicListSpotById('local-scenic:gurye-other:노고단운해');
assert.ok(gyeUnhae?.overview?.includes('운해'), '구례 노고단 운해 overlay overview');
const gyeBanya = resolveLocalScenicListSpotById('local-scenic:gurye-other:반야봉낙조');
assert.ok(gyeBanya?.overview?.includes('낙조'), '구례 반야봉 낙조 overlay overview');
const gyePiagol = resolveLocalScenicListSpotById('local-scenic:gurye-other:피아골단풍');
assert.ok(gyePiagol?.overview?.includes('삼홍'), '구례 피아골 단풍 overlay overview');
const gyeSandong = resolveLocalScenicListSpotById('local-scenic:gurye-other:산동산수유꽃');
assert.ok(gyeSandong?.overview?.includes('산수유'), '구례 산동 산수유꽃 overlay overview');
const gyeSnow = resolveLocalScenicListSpotById('local-scenic:gurye-other:노고단설경');
assert.ok(gyeSnow?.overview?.includes('설화'), '구례 노고단 설경 overlay overview');

const gangjinMerged = mergeLocalScenicMembersIntoScenicSpots([], 'gangjin');
const gangjinTwelve = gangjinMerged.filter((s) => s.localScenicListId === 'gangjin-other');
assert.equal(gangjinTwelve.length, 12, '강진12경 12명');
assert.equal(gangjinTwelve[0]?.groupTitle, '강진 12경');
assert.equal(gangjinTwelve[0]?.blurb, '강진 1경');
const gangjinHub = resolveCityAttractionHub('gangjin');
const gangjinList = resolveLocalScenicList('강진12경')?.list;
assert.ok(gangjinList?.listId === 'gangjin-other', '강진12경 resolve');
const gangjinGlobeMembers = (gangjinList.members || [])
  .map((member) => localScenicMemberToSuggestion(gangjinList, gangjinHub, member))
  .filter(Boolean);
assert.ok(
  gangjinGlobeMembers.every((s) => s.groupTitle === '강진 12경'),
  '지구본 강진 멤버 groupTitle 강진 12경',
);
const gangjinSearch = filterScenicSpotsByQuery(listKoreaScenicSpots(), '강진', {
  injectLocalScenic: true,
});
const gangjinSearchPalgyeong = gangjinSearch.filter(
  (s) => s.localScenicListId === 'gangjin-other',
);
assert.equal(gangjinSearchPalgyeong.length, 12, '명승 강진 검색 12경 12행');
assert.ok(
  gangjinSearchPalgyeong.every((s) => s.groupTitle === '강진 12경'),
  '명승 강진 검색 그룹명 강진 12경',
);
const gangjinDeficitNames = [
  '월출산',
  '가학산',
  '백야김좌진기념관',
  '남도별미식문화박물관',
  '강진청자박물관',
];
const gangjinDeficit = gangjinTwelve.filter((s) =>
  gangjinDeficitNames.includes(s.attractionName),
);
assert.equal(gangjinDeficit.length, 5, '강진12경 결손 5명');
assert.ok(
  gangjinDeficit.every((s) => s.overview && s.imageUrl),
  '강진 결손 5명 overlay 사진·개요',
);
assert.ok(
  gangjinDeficit.every((s) => !s.contentId),
  '강진 결손 JSON contentId 없음 유지',
);
assert.equal(
  new Set(gangjinDeficit.map((s) => s.imageUrl)).size,
  5,
  '강진 결손 5명 썸네일 서로 다름',
);
const gjWolchul = resolveLocalScenicListSpotById('local-scenic:gangjin-other:월출산');
assert.ok(gjWolchul?.overview?.includes('경포대'), '강진 월출산 overlay overview');
const gjGahak = resolveLocalScenicListSpotById('local-scenic:gangjin-other:가학산');
assert.ok(gjGahak?.overview?.includes('제전마을'), '강진 가학산 overlay overview');
const gjBaekya = resolveLocalScenicListSpotById('local-scenic:gangjin-other:백야김좌진기념관');
assert.ok(gjBaekya?.overview?.includes('청산리'), '강진 백야김좌진기념관 overlay overview');
const gjNamdo = resolveLocalScenicListSpotById('local-scenic:gangjin-other:남도별미식문화박물관');
assert.ok(gjNamdo?.overview?.includes('사의재'), '강진 남도별미식문화박물관 overlay overview');
const gjCeladon = resolveLocalScenicListSpotById('local-scenic:gangjin-other:강진청자박물관');
assert.ok(gjCeladon?.overview?.includes('고려청자'), '강진 청자박물관 overlay overview');
const gjVillage = resolveLocalScenicListSpotById('local-scenic:gangjin-other:청자단지');
assert.ok(gjVillage?.imageUrl, '강진 청자단지 overlay 썸네일');
assert.ok(gjVillage?.overview?.includes('청자촌'), '강진 청자단지 overlay overview');
assert.notEqual(gjVillage?.imageUrl, gjCeladon?.imageUrl, '청자단지·청자박물관 썸네일 다름');
assert.ok(
  gangjinGlobeMembers.find((s) => s.name === '청자단지')?.imageUrl,
  '지구본 청자단지 썸네일',
);

const gunsanMerged = mergeLocalScenicMembersIntoScenicSpots([], 'gunsan');
const gunsanEight = gunsanMerged.filter((s) => s.localScenicListId === 'gunsan-palgyeong');
assert.equal(gunsanEight.length, 8, '선유8경 8명');
const gunsanDeficitNames = ['선유낙조', '명사십리', '망주폭포', '월영단풍', '무산십이봉'];
const gunsanDeficit = gunsanEight.filter((s) => gunsanDeficitNames.includes(s.attractionName));
assert.equal(gunsanDeficit.length, 5, '선유8경 결손 5명');
assert.ok(
  gunsanDeficit.every((s) => s.overview && s.imageUrl),
  '군산 결손 5명 overlay 사진·개요',
);
assert.ok(
  gunsanDeficit.every((s) => !s.contentId),
  '군산 결손 JSON contentId 없음 유지',
);
assert.equal(
  new Set(gunsanDeficit.map((s) => s.imageUrl)).size,
  5,
  '군산 결손 5명 썸네일 서로 다름',
);
const gsNakjo = resolveLocalScenicListSpotById('local-scenic:gunsan-palgyeong:선유낙조');
assert.ok(gsNakjo?.overview?.includes('낙조기관'), '군산 선유낙조 overlay overview');
const gsMyeongsa = resolveLocalScenicListSpotById('local-scenic:gunsan-palgyeong:명사십리');
assert.ok(gsMyeongsa?.overview?.includes('선유도해수욕장'), '군산 명사십리 overlay overview');
const gsMangju = resolveLocalScenicListSpotById('local-scenic:gunsan-palgyeong:망주폭포');
assert.ok(gsMangju?.overview?.includes('솔섬'), '군산 망주폭포 overlay overview');
const gsWolyeong = resolveLocalScenicListSpotById('local-scenic:gunsan-palgyeong:월영단풍');
assert.ok(gsWolyeong?.overview?.includes('월영봉'), '군산 월영단풍 overlay overview');
const gsMusan = resolveLocalScenicListSpotById('local-scenic:gunsan-palgyeong:무산십이봉');
assert.ok(gsMusan?.overview?.includes('방축도'), '군산 무산십이봉 overlay overview');

const geumsanMerged = mergeLocalScenicMembersIntoScenicSpots([], 'geumsan');
const geumsanTen = geumsanMerged.filter((s) => s.localScenicListId === 'geumsan-sipgyeong');
assert.equal(geumsanTen.length, 10, '금산10경 10명');
const geumsanDeficitNames = [
  '산림문화 힐링명소',
  '금산인삼 세계농업유산',
  '인삼·약령시장',
  '월영산 원골',
  '태조태실 요광은행나무',
];
const geumsanDeficit = geumsanTen.filter((s) => geumsanDeficitNames.includes(s.attractionName));
assert.equal(geumsanDeficit.length, 5, '금산10경 결손 5명');
assert.ok(
  geumsanDeficit.every((s) => s.overview && s.imageUrl),
  '금산 결손 5명 overlay 사진·개요',
);
assert.ok(
  geumsanDeficit.every((s) => !s.contentId),
  '금산 결손 JSON contentId 없음 유지',
);
assert.equal(
  new Set(geumsanDeficit.map((s) => s.imageUrl)).size,
  5,
  '금산 결손 5명 썸네일 서로 다름',
);
const geumForest = resolveLocalScenicListSpotById('local-scenic:geumsan-sipgyeong:산림문화힐링명소');
assert.ok(geumForest?.overview?.includes('산림문화타운'), '금산 산림문화 힐링명소 overlay overview');
const geumGiahs = resolveLocalScenicListSpotById(
  'local-scenic:geumsan-sipgyeong:금산인삼세계농업유산',
);
assert.ok(geumGiahs?.overview?.includes('세계중요농업유산'), '금산 세계농업유산 overlay overview');
const geumMarket = resolveLocalScenicListSpotById('local-scenic:geumsan-sipgyeong:인삼·약령시장');
assert.ok(geumMarket?.overview?.includes('인삼의 거리'), '금산 인삼·약령시장 overlay overview');
const geumWol = resolveLocalScenicListSpotById('local-scenic:geumsan-sipgyeong:월영산원골');
assert.ok(geumWol?.overview?.includes('달을 맞이'), '금산 월영산 원골 overlay overview');
const geumTaejo = resolveLocalScenicListSpotById(
  'local-scenic:geumsan-sipgyeong:태조태실요광은행나무',
);
assert.ok(geumTaejo?.overview?.includes('태조대왕태실'), '금산 태조태실 overlay overview');
assert.ok(geumTaejo?.overview?.includes('천연기념물'), '금산 요광은행나무 overlay overview');
assert.ok(
  String(geumTaejo?.imageUrl || '').includes('geumsan.go.kr'),
  '금산 요광은행나무 썸네일은 금산군 은행나무 공식 사진',
);
assert.ok(
  !String(geumTaejo?.imageUrl || '').includes('3559888'),
  '금산 요광은행나무 썸네일이 태실 사진이 아님',
);
assert.ok(
  (geumTaejo?.galleryUrls || []).some((u) => String(u).includes('khs.go.kr')),
  '금산 요광은행나무 갤러리에 국가유산청 은행나무 사진',
);
assert.ok(
  !(geumTaejo?.galleryUrls || []).some((u) => String(u).includes('355988')),
  '금산 요광은행나무 갤러리에 태실 사진 없음',
);

const geumSeodae = resolveLocalScenicListSpotById(
  'local-scenic:geumsan-sipgyeong:서대산산꽃세상',
);
assert.ok(geumSeodae?.imageUrl, '금산 서대산 산꽃세상 overlay 썸네일');
assert.ok(geumSeodae?.overview?.includes('산벚꽃'), '금산 서대산 산꽃세상 overlay overview');
assert.equal(geumSeodae?.contentId, '127518', '금산 서대산 JSON contentId 유지');
const geumJinak = resolveLocalScenicListSpotById(
  'local-scenic:geumsan-sipgyeong:금산진악산',
);
assert.ok(geumJinak?.imageUrl, '금산 진악산 overlay 썸네일');
assert.ok(geumJinak?.overview?.includes('개삼터'), '금산 진악산 overlay overview');
assert.equal(geumJinak?.contentId, '126811', '금산 진악산 JSON contentId 유지');
assert.notEqual(geumSeodae?.imageUrl, geumJinak?.imageUrl, '서대산·진악산 썸네일 다름');
assert.equal(
  lookupLocalScenicPhotoByContentId('127518')?.imageUrl,
  geumSeodae.imageUrl,
  'Tour 서대산 contentId 127518 → 산꽃세상 오버레이',
);
assert.equal(
  lookupLocalScenicPhotoByContentId('126811')?.imageUrl,
  geumJinak.imageUrl,
  'Tour 진악산 contentId 126811 → 진악산 오버레이',
);

const geumsanGlobe = filterScenicSpotsByQuery(listKoreaScenicSpots(), '금산', {
  injectLocalScenic: true,
});
assert.ok(
  geumsanGlobe.find((s) => s.attractionName === '서대산 산꽃세상')?.imageUrl,
  '금산 검색 팔경 서대산 산꽃세상 썸네일',
);
assert.ok(
  geumsanGlobe.find((s) => s.attractionName === '금산 진악산')?.imageUrl,
  '금산 검색 팔경 금산 진악산 썸네일',
);
assert.ok(
  geumsanGlobe.find((s) => s.attractionName === '태조태실 요광은행나무')?.imageUrl?.includes(
    'geumsan.go.kr',
  ),
  '금산 검색 팔경 요광은행나무 금산군 사진',
);

const namhaeMerged = mergeLocalScenicMembersIntoScenicSpots([], 'namhae');
const namhaeTwelve = namhaeMerged.filter((s) => s.localScenicListId === 'namhae-sipgyeong');
assert.equal(namhaeTwelve.length, 12, '남해12경 12명');
assert.equal(namhaeTwelve[0]?.groupTitle, '남해 12경');
assert.ok(
  namhaeTwelve.every((s) => s.groupTitle === '남해 12경'),
  '남해12경 그룹명 남해 12경 (십경 아님)',
);
assert.equal(
  localScenicListDisplayTitle(
    listKoreaLocalScenicLists().find((l) => l.listId === 'namhae-sipgyeong'),
  ),
  '남해 12경',
);
assert.equal(
  localScenicListDisplayTitle(
    listKoreaLocalScenicLists().find((l) => l.listId === 'hadong-sipgyeong'),
  ),
  '하동 십경',
);
for (const list of listKoreaLocalScenicLists()) {
  if (!/12경\s*$/u.test(String(list.title || ''))) continue;
  const display = localScenicListDisplayTitle(list);
  assert.match(
    display,
    /12경$/,
    `${list.listId} 표시명이 12경 (got ${display})`,
  );
}
const namhaeDeficitNames = [
  '남해 금산과 보리암',
  '창선교와 남해지족해협 죽방렴',
  '서포 김만중 선생 유허와 노도',
  '남해 물건리 방조어부림과 물미해안',
  '창선-삼천포대교',
];
const namhaeDeficit = namhaeTwelve.filter((s) => namhaeDeficitNames.includes(s.attractionName));
assert.equal(namhaeDeficit.length, 5, '남해12경 결손 5명');
assert.ok(
  namhaeDeficit.every((s) => s.overview && s.imageUrl),
  '남해 결손 5명 overlay 사진·개요',
);
assert.ok(
  namhaeDeficit.every((s) => !s.contentId),
  '남해 결손 JSON contentId 없음 유지',
);
assert.equal(
  new Set(namhaeDeficit.map((s) => s.imageUrl)).size,
  5,
  '남해 결손 5명 썸네일 서로 다름',
);
const nhBoriam = resolveLocalScenicListSpotById('local-scenic:namhae-sipgyeong:남해금산과보리암');
assert.ok(nhBoriam?.overview?.includes('보리암'), '남해 금산과 보리암 overlay overview');
assert.ok(nhBoriam?.overview?.includes('3대 기도처'), '남해 보리암 3대 기도처');
const nhJuk = resolveLocalScenicListSpotById(
  'local-scenic:namhae-sipgyeong:창선교와남해지족해협죽방렴',
);
assert.ok(nhJuk?.overview?.includes('죽방렴'), '남해 죽방렴 overlay overview');
assert.ok(nhJuk?.overview?.includes('명승'), '남해 죽방렴 명승');
const nhNodo = resolveLocalScenicListSpotById(
  'local-scenic:namhae-sipgyeong:서포김만중선생유허와노도',
);
assert.ok(nhNodo?.overview?.includes('김만중'), '남해 노도 overlay overview');
assert.ok(nhNodo?.overview?.includes('구운몽'), '남해 노도 구운몽');
const nhForest = resolveLocalScenicListSpotById(
  'local-scenic:namhae-sipgyeong:남해물건리방조어부림과물미해안',
);
assert.ok(nhForest?.overview?.includes('방조어부림'), '남해 방조어부림 overlay overview');
assert.ok(nhForest?.overview?.includes('천연기념물'), '남해 방조어부림 천연기념물');
const nhBridge = resolveLocalScenicListSpotById('local-scenic:namhae-sipgyeong:창선-삼천포대교');
assert.ok(nhBridge?.overview?.includes('3.4km'), '남해 창선-삼천포대교 overlay overview');
assert.notEqual(
  nhBridge?.imageUrl,
  'https://tong.visitkorea.or.kr/cms2/website/65/2704865.jpg',
  '남해 대교 썸네일이 사천 케이블카 사진이 아님',
);
assert.notEqual(
  nhBridge?.imageUrl,
  'https://tong.visitkorea.or.kr/cms2/website/24/2705324.jpg',
  '남해 대교 썸네일이 사천9경 교량 사진과 다름',
);

const namhaeGlobe = filterScenicSpotsByQuery(listKoreaScenicSpots(), '남해', {
  injectLocalScenic: true,
});
const namhaeGlobeTwelve = namhaeGlobe.filter(
  (s) => s.localScenicListId === 'namhae-sipgyeong',
);
assert.equal(namhaeGlobeTwelve.length, 12, '남해 검색 남해12경 12행');
assert.ok(
  namhaeGlobeTwelve.every((s) => s.groupTitle === '남해 12경'),
  '남해 검색 그룹명 남해 12경',
);
assert.ok(
  namhaeGlobe.find((s) => s.attractionName === '남해 금산과 보리암')?.imageUrl,
  '남해 검색 팔경 금산과 보리암 썸네일',
);
assert.ok(
  namhaeGlobe.find((s) => s.attractionName === '창선-삼천포대교')?.imageUrl,
  '남해 검색 팔경 창선-삼천포대교 썸네일',
);
assert.ok(
  namhaeGlobe.find((s) => s.attractionName === '서포 김만중 선생 유허와 노도')?.overview?.includes(
    '김만중',
  ),
  '남해 검색 팔경 노도 개요',
);

const pohangMerged = mergeLocalScenicMembersIntoScenicSpots([], 'pohang');
const pohangTwelve = pohangMerged.filter((s) => s.localScenicListId === 'pohang-sipgyeong');
assert.equal(pohangTwelve.length, 12, '포항12경 12명');
assert.equal(pohangTwelve[0]?.groupTitle, '포항 12경');
assert.ok(
  pohangTwelve.every((s) => s.groupTitle === '포항 12경'),
  '포항12경 그룹명 포항 12경 (십경 아님)',
);
assert.equal(
  localScenicListDisplayTitle(
    listKoreaLocalScenicLists().find((l) => l.listId === 'pohang-sipgyeong'),
  ),
  '포항 12경',
);
const pohangDeficitNames = [
  '호미곶 일출',
  '내연산 12폭포',
  '운제산 오어사 사계',
  '영일대 포스코 야경',
  '철길숲 불의 정원',
];
const pohangDeficit = pohangTwelve.filter((s) => pohangDeficitNames.includes(s.attractionName));
assert.equal(pohangDeficit.length, 5, '포항12경 결손 5명');
assert.ok(
  pohangDeficit.every((s) => s.overview && s.imageUrl),
  '포항 결손 5명 overlay 사진·개요',
);
assert.ok(
  pohangDeficit.every((s) => !s.contentId),
  '포항 결손 JSON contentId 없음 유지',
);
assert.equal(
  new Set(pohangDeficit.map((s) => s.imageUrl)).size,
  5,
  '포항 결손 5명 썸네일 서로 다름',
);
const phHomi = resolveLocalScenicListSpotById('local-scenic:pohang-sipgyeong:호미곶일출');
assert.ok(phHomi?.overview?.includes('상생의 손'), '포항 호미곶 overlay overview');
assert.ok(phHomi?.overview?.includes('최동단'), '포항 호미곶 최동단');
const phFalls = resolveLocalScenicListSpotById('local-scenic:pohang-sipgyeong:내연산12폭포');
assert.ok(phFalls?.overview?.includes('연산폭포'), '포항 내연산 overlay overview');
assert.ok(phFalls?.overview?.includes('관음폭포'), '포항 내연산 관음폭포');
const phOeo = resolveLocalScenicListSpotById('local-scenic:pohang-sipgyeong:운제산오어사사계');
assert.ok(phOeo?.overview?.includes('오어사'), '포항 오어사 overlay overview');
assert.ok(phOeo?.overview?.includes('보물 제1280호'), '포항 오어사 범종');
const phYeongil = resolveLocalScenicListSpotById('local-scenic:pohang-sipgyeong:영일대포스코야경');
assert.ok(phYeongil?.overview?.includes('해상 누각'), '포항 영일대 overlay overview');
assert.ok(phYeongil?.overview?.includes('LED'), '포항 포스코 야경 LED');
assert.notEqual(
  phYeongil?.imageUrl,
  'https://tong.visitkorea.or.kr/cms/resource/79/4078979_image2_1.jpg',
  '영일대 포스코 야경 썸네일이 GATEO 영일대해수욕장 사진이 아님',
);
assert.notEqual(
  phYeongil?.imageUrl,
  'https://tong.visitkorea.or.kr/cms/resource/63/4078963_image2_1.jpg',
  '영일대 포스코 야경 썸네일이 스페이스워크 사진이 아님',
);
const phRail = resolveLocalScenicListSpotById('local-scenic:pohang-sipgyeong:철길숲불의정원');
assert.ok(phRail?.overview?.includes('4.3km'), '포항 철길숲 overlay overview');
assert.ok(phRail?.overview?.includes('천연가스'), '포항 불의정원 천연가스');
assert.ok(phRail?.imageUrl?.includes('pohang.go.kr'), '포항 철길숲 포항시 공식 사진');

const pohangGlobe = filterScenicSpotsByQuery(listKoreaScenicSpots(), '포항', {
  injectLocalScenic: true,
});
const pohangGlobeTwelve = pohangGlobe.filter(
  (s) => s.localScenicListId === 'pohang-sipgyeong',
);
assert.equal(pohangGlobeTwelve.length, 12, '포항 검색 포항12경 12행');
assert.ok(
  pohangGlobeTwelve.every((s) => s.groupTitle === '포항 12경'),
  '포항 검색 그룹명 포항 12경',
);
assert.ok(
  pohangGlobe.find((s) => s.attractionName === '호미곶 일출')?.imageUrl,
  '포항 검색 팔경 호미곶 일출 썸네일',
);
assert.ok(
  pohangGlobe.find((s) => s.attractionName === '철길숲 불의 정원')?.overview?.includes(
    '불의정원',
  ),
  '포항 검색 팔경 철길숲 개요',
);

const anyangMerged = mergeLocalScenicMembersIntoScenicSpots([], 'anyang');
const anyangNine = anyangMerged.filter((s) => s.localScenicListId === 'anyang-gugyeong');
assert.equal(anyangNine.length, 9, '안양9경 9명');
assert.equal(anyangNine[0]?.groupTitle, '안양 구경');
const anyangDeficitNames = ['망해암일몰', '수리산성지', '평촌1번가 문화의거리', '만안교'];
const anyangDeficit = anyangNine.filter((s) => anyangDeficitNames.includes(s.attractionName));
assert.equal(anyangDeficit.length, 4, '안양9경 결손 4명');
assert.ok(
  anyangDeficit.every((s) => s.overview && s.imageUrl),
  '안양 결손 4명 overlay 사진·개요',
);
assert.ok(
  anyangDeficit.every((s) => !s.contentId),
  '안양 결손 JSON contentId 없음 유지',
);
assert.equal(
  new Set(anyangDeficit.map((s) => s.imageUrl)).size,
  4,
  '안양 결손 4명 썸네일 서로 다름',
);
const ayMang = resolveLocalScenicListSpotById('local-scenic:anyang-gugyeong:망해암일몰');
assert.ok(ayMang?.overview?.includes('혜경궁 홍씨'), '안양 망해암 overlay overview');
assert.ok(ayMang?.overview?.includes('서해 낙조'), '안양 망해암 서해 낙조');
assert.ok(ayMang?.imageUrl?.includes('anyang.go.kr'), '안양 망해암 안양시 공식 사진');
const aySuri = resolveLocalScenicListSpotById('local-scenic:anyang-gugyeong:수리산성지');
assert.ok(aySuri?.overview?.includes('최경환'), '안양 수리산성지 overlay overview');
assert.ok(aySuri?.overview?.includes('기해박해'), '안양 수리산성지 기해박해');
assert.ok(aySuri?.imageUrl?.includes('/DATA/tour/21/'), '안양 수리산성지 안양시 성지 사진');
const ayPyeong = resolveLocalScenicListSpotById(
  'local-scenic:anyang-gugyeong:평촌1번가문화의거리',
);
assert.ok(ayPyeong?.overview?.includes('범계역'), '안양 평촌1번가 overlay overview');
assert.ok(ayPyeong?.overview?.includes('버스킹'), '안양 평촌1번가 버스킹');
assert.ok(ayPyeong?.imageUrl?.includes('/DATA/tour/22/'), '안양 평촌1번가 안양시 거리 사진');
const ayManan = resolveLocalScenicListSpotById('local-scenic:anyang-gugyeong:만안교');
assert.ok(ayManan?.overview?.includes('사도세자'), '안양 만안교 overlay overview');
assert.ok(ayManan?.overview?.includes('1795년'), '안양 만안교 1795년');
assert.ok(ayManan?.imageUrl?.includes('74C657E2'), '안양 만안교 대표 사진');
assert.notEqual(ayMang?.imageUrl, ayManan?.imageUrl, '망해암·만안교 썸네일 다름');

const anyangGlobe = filterScenicSpotsByQuery(listKoreaScenicSpots(), '안양', {
  injectLocalScenic: true,
});
const anyangGlobeNine = anyangGlobe.filter((s) => s.localScenicListId === 'anyang-gugyeong');
assert.equal(anyangGlobeNine.length, 9, '안양 검색 안양9경 9행');
assert.ok(
  anyangGlobeNine.every((s) => s.groupTitle === '안양 구경'),
  '안양 검색 그룹명 안양 구경',
);
assert.ok(
  anyangGlobe.find((s) => s.attractionName === '망해암일몰')?.imageUrl,
  '안양 검색 팔경 망해암일몰 썸네일',
);
assert.ok(
  anyangGlobe.find((s) => s.attractionName === '만안교')?.overview?.includes('만안교'),
  '안양 검색 팔경 만안교 개요',
);

const jeungpyeongMerged = mergeLocalScenicMembersIntoScenicSpots([], 'jeungpyeong');
const jeungpyeongNine = jeungpyeongMerged.filter(
  (s) => s.localScenicListId === 'jeungpyeong-gugyeong',
);
assert.equal(jeungpyeongNine.length, 9, '증평구경 9명');
assert.equal(jeungpyeongNine[0]?.groupTitle, '증평 구경');
const jeungpyeongDeficitNames = [
  '좌구산 천문대',
  '삼기저수지 등잔길',
  '추성산성',
  '연병호 항일역사공원',
];
const jeungpyeongDeficit = jeungpyeongNine.filter((s) =>
  jeungpyeongDeficitNames.includes(s.attractionName),
);
assert.equal(jeungpyeongDeficit.length, 4, '증평구경 결손 4명');
assert.ok(
  jeungpyeongDeficit.every((s) => s.overview && s.imageUrl),
  '증평 결손 4명 overlay 사진·개요',
);
assert.ok(
  jeungpyeongDeficit.every((s) => !s.contentId),
  '증평 결손 JSON contentId 없음 유지',
);
assert.equal(
  new Set(jeungpyeongDeficit.map((s) => s.imageUrl)).size,
  4,
  '증평 결손 4명 썸네일 서로 다름',
);
const jpStar = resolveLocalScenicListSpotById('local-scenic:jeungpyeong-gugyeong:좌구산천문대');
assert.ok(jpStar?.overview?.includes('356mm'), '증평 좌구산 천문대 overlay overview');
assert.ok(jpStar?.overview?.includes('솟점말길'), '증평 좌구산 천문대 주소');
assert.ok(jpStar?.imageUrl?.includes('TUCN_201802050508247131'), '증평 천문대 군 공식 사진');
const jpSamgi = resolveLocalScenicListSpotById(
  'local-scenic:jeungpyeong-gugyeong:삼기저수지등잔길',
);
assert.ok(jpSamgi?.overview?.includes('3km'), '증평 등잔길 overlay overview');
assert.ok(jpSamgi?.overview?.includes('탐방데크'), '증평 등잔길 탐방데크');
assert.ok(jpSamgi?.imageUrl?.includes('3450336'), '증평 등잔길 한국관광공사 사진');
const jpChu = resolveLocalScenicListSpotById('local-scenic:jeungpyeong-gugyeong:추성산성');
assert.ok(jpChu?.overview?.includes('사적 제527호'), '증평 추성산성 overlay overview');
assert.ok(jpChu?.overview?.includes('토축산성'), '증평 추성산성 토축산성');
assert.ok(jpChu?.imageUrl?.includes('1626405'), '증평 추성산성 국가유산 사진');
const jpYeon = resolveLocalScenicListSpotById(
  'local-scenic:jeungpyeong-gugyeong:연병호항일역사공원',
);
assert.ok(jpYeon?.overview?.includes('2016년'), '증평 연병호 overlay overview');
assert.ok(jpYeon?.overview?.includes('산정길'), '증평 연병호 산정길');
assert.ok(jpYeon?.imageUrl?.includes('107492'), '증평 연병호 기록관 사진');
assert.notEqual(jpStar?.imageUrl, jpSamgi?.imageUrl, '천문대·등잔길 썸네일 다름');

const jwagusanForest = listKoreaScenicSpots().find(
  (s) => s.id === 'jwagusan-recreation-forest' || s.attractionName === '증평 좌구산휴양림',
);
assert.ok(jwagusanForest?.imageUrl, 'GATEO 선정 좌구산휴양림 썸네일');
assert.notEqual(
  jpStar?.imageUrl,
  jwagusanForest?.imageUrl,
  '천문대 썸네일은 좌구산휴양림과 다름',
);

const jeungpyeongGlobe = filterScenicSpotsByQuery(listKoreaScenicSpots(), '증평', {
  injectLocalScenic: true,
});
const jeungpyeongGlobeNine = jeungpyeongGlobe.filter(
  (s) => s.localScenicListId === 'jeungpyeong-gugyeong',
);
assert.equal(jeungpyeongGlobeNine.length, 9, '증평 검색 증평구경 9행');
assert.ok(
  jeungpyeongGlobeNine.every((s) => s.groupTitle === '증평 구경'),
  '증평 검색 그룹명 증평 구경',
);
assert.ok(
  jeungpyeongGlobe.find((s) => s.attractionName === '좌구산 천문대')?.imageUrl,
  '증평 검색 팔경 좌구산 천문대 썸네일',
);
assert.ok(
  jeungpyeongGlobe
    .find((s) => s.attractionName === '연병호 항일역사공원')
    ?.overview?.includes('연병호'),
  '증평 검색 팔경 연병호 개요',
);

const gyeryongMerged = mergeLocalScenicMembersIntoScenicSpots([], 'gyeryong');
const gyeryongNine = gyeryongMerged.filter(
  (s) => s.localScenicListId === 'gyeryong-gugyeong',
);
assert.equal(gyeryongNine.length, 9, '계룡9경 9명');
assert.equal(gyeryongNine[0]?.groupTitle, '계룡 구경');
const gyeryongDeficitNames = [
  '향적산 국사봉',
  '숫용추',
  '암용추',
  '계룡대 통일탑',
];
const gyeryongDeficit = gyeryongNine.filter((s) =>
  gyeryongDeficitNames.includes(s.attractionName),
);
assert.equal(gyeryongDeficit.length, 4, '계룡9경 결손 4명');
assert.ok(
  gyeryongDeficit.every((s) => s.overview && s.imageUrl),
  '계룡 결손 4명 overlay 사진·개요',
);
assert.ok(
  gyeryongDeficit.every((s) => !s.contentId),
  '계룡 결손 JSON contentId 없음 유지',
);
assert.equal(
  new Set(gyeryongDeficit.map((s) => s.imageUrl)).size,
  4,
  '계룡 결손 4명 썸네일 서로 다름',
);
const grGuksa = resolveLocalScenicListSpotById(
  'local-scenic:gyeryong-gugyeong:향적산국사봉',
);
assert.ok(grGuksa?.overview?.includes('574m'), '계룡 향적산 국사봉 overlay overview');
assert.ok(grGuksa?.overview?.includes('향한리'), '계룡 향적산 국사봉 향한리');
assert.ok(
  grGuksa?.imageUrl?.includes('sub06020204_img01'),
  '계룡 국사봉 시 공식 사진',
);
const grSut = resolveLocalScenicListSpotById('local-scenic:gyeryong-gugyeong:숫용추');
assert.ok(grSut?.overview?.includes('서용추'), '계룡 숫용추 overlay overview');
assert.ok(grSut?.overview?.includes('10m'), '계룡 숫용추 10m 폭포');
assert.ok(grSut?.imageUrl?.includes('YDCLKBZE'), '계룡 숫용추 시 공식 사진');
const grAm = resolveLocalScenicListSpotById('local-scenic:gyeryong-gugyeong:암용추');
assert.ok(grAm?.overview?.includes('동용추'), '계룡 암용추 overlay overview');
assert.ok(grAm?.overview?.includes('12m'), '계룡 암용추 12m');
assert.ok(grAm?.imageUrl?.includes('K69Z04LL'), '계룡 암용추 시 공식 사진');
const grUni = resolveLocalScenicListSpotById(
  'local-scenic:gyeryong-gugyeong:계룡대통일탑',
);
assert.ok(grUni?.overview?.includes('36m'), '계룡 통일탑 overlay overview');
assert.ok(grUni?.overview?.includes('충·의·지'), '계룡 통일탑 충의지인용');
assert.ok(grUni?.imageUrl?.includes('7de9c26193dec2a10ac8431a9a12e589'), '계룡 통일탑 시 공식 사진');
assert.notEqual(grGuksa?.imageUrl, grSut?.imageUrl, '국사봉·숫용추 썸네일 다름');
assert.notEqual(grAm?.imageUrl, grUni?.imageUrl, '암용추·통일탑 썸네일 다름');

const gyeryongPark = listKoreaScenicSpots().find(
  (s) => s.id === 'gyeryongsan-national-park' || s.attractionName === '계룡산국립공원',
);
assert.ok(gyeryongPark?.imageUrl, 'GATEO 선정 계룡산국립공원 썸네일');
assert.notEqual(
  grGuksa?.imageUrl,
  gyeryongPark?.imageUrl,
  '국사봉 썸네일 ≠ GATEO 선정 계룡산국립공원',
);

const gyeryongGlobe = filterScenicSpotsByQuery(listKoreaScenicSpots(), '계룡', {
  injectLocalScenic: true,
});
const gyeryongGlobeNine = gyeryongGlobe.filter(
  (s) => s.localScenicListId === 'gyeryong-gugyeong',
);
assert.equal(gyeryongGlobeNine.length, 9, '계룡 검색 계룡9경 9행');
assert.ok(
  gyeryongGlobeNine.every((s) => s.groupTitle === '계룡 구경'),
  '계룡 검색 그룹명 계룡 구경',
);
assert.ok(
  gyeryongGlobe.find((s) => s.attractionName === '향적산 국사봉')?.imageUrl,
  '계룡 검색 팔경 향적산 국사봉 썸네일',
);
assert.ok(
  gyeryongGlobe.find((s) => s.attractionName === '계룡대 통일탑')?.overview?.includes('통일탑'),
  '계룡 검색 팔경 통일탑 개요',
);

const nonsanMerged = mergeLocalScenicMembersIntoScenicSpots([], 'nonsan');
const nonsanEleven = nonsanMerged.filter((s) => s.localScenicListId === 'nonsan-other');
assert.equal(nonsanEleven.length, 11, '논산11경 11명');
assert.equal(nonsanEleven[0]?.groupTitle, '논산 11경');
const nonsanDeficitNames = [
  '대둔산 수락계곡',
  '강경포구와 근대역사거리',
  '노성산성과 명재고택',
  '종학당과 한국유교문화진흥원',
];
const nonsanDeficit = nonsanEleven.filter((s) =>
  nonsanDeficitNames.includes(s.attractionName),
);
assert.equal(nonsanDeficit.length, 4, '논산11경 결손 4명');
assert.ok(
  nonsanDeficit.every((s) => s.overview && s.imageUrl),
  '논산 결손 4명 overlay 사진·개요',
);
assert.ok(
  nonsanDeficit.every((s) => !s.contentId),
  '논산 결손 JSON contentId 없음 유지',
);
assert.equal(
  new Set(nonsanDeficit.map((s) => s.imageUrl)).size,
  4,
  '논산 결손 4명 썸네일 서로 다름',
);
const nsSurak = resolveLocalScenicListSpotById(
  'local-scenic:nonsan-other:대둔산수락계곡',
);
assert.ok(nsSurak?.overview?.includes('호남의 소금강'), '논산 수락계곡 overlay overview');
assert.ok(nsSurak?.overview?.includes('마천대'), '논산 수락계곡 마천대');
assert.ok(nsSurak?.imageUrl?.includes('sub020201_img03'), '논산 수락계곡 시 공식 사진');
const nsGang = resolveLocalScenicListSpotById(
  'local-scenic:nonsan-other:강경포구와근대역사거리',
);
assert.ok(nsGang?.overview?.includes('택리지'), '논산 강경포구 overlay overview');
assert.ok(nsGang?.overview?.includes('1919년'), '논산 강경포구 3·1 만세');
assert.ok(nsGang?.imageUrl?.includes('sub020201_img07'), '논산 강경포구 시 공식 사진');
const nsNoseong = resolveLocalScenicListSpotById(
  'local-scenic:nonsan-other:노성산성과명재고택',
);
assert.ok(nsNoseong?.overview?.includes('1709'), '논산 명재고택 overlay overview');
assert.ok(nsNoseong?.overview?.includes('590m'), '논산 노성산성 둘레');
assert.ok(nsNoseong?.imageUrl?.includes('sub020201_img08'), '논산 명재고택 시 공식 사진');
const nsJonghak = resolveLocalScenicListSpotById(
  'local-scenic:nonsan-other:종학당과한국유교문화진흥원',
);
assert.ok(nsJonghak?.overview?.includes('1643'), '논산 종학당 overlay overview');
assert.ok(nsJonghak?.overview?.includes('윤순거'), '논산 종학당 윤순거');
assert.ok(nsJonghak?.imageUrl?.includes('sub020201_img11'), '논산 종학당 시 공식 사진');
assert.notEqual(nsSurak?.imageUrl, nsGang?.imageUrl, '수락계곡·강경포구 썸네일 다름');
assert.notEqual(nsNoseong?.imageUrl, nsJonghak?.imageUrl, '명재고택·종학당 썸네일 다름');

const daedunsanPark = listKoreaScenicSpots().find(
  (s) => s.id === 'daedunsan' || s.attractionName === '대둔산',
);
assert.ok(daedunsanPark?.imageUrl, 'GATEO 선정 대둔산 썸네일');
assert.notEqual(
  nsSurak?.imageUrl,
  daedunsanPark?.imageUrl,
  '수락계곡 썸네일 ≠ GATEO 선정 대둔산',
);

const nonsanGlobe = filterScenicSpotsByQuery(listKoreaScenicSpots(), '논산', {
  injectLocalScenic: true,
});
const nonsanGlobeEleven = nonsanGlobe.filter((s) => s.localScenicListId === 'nonsan-other');
assert.equal(nonsanGlobeEleven.length, 11, '논산 검색 논산11경 11행');
assert.ok(
  nonsanGlobeEleven.every((s) => s.groupTitle === '논산 11경'),
  '논산 검색 그룹명 논산 11경',
);
assert.ok(
  nonsanGlobe.find((s) => s.attractionName === '대둔산 수락계곡')?.imageUrl,
  '논산 검색 팔경 수락계곡 썸네일',
);
assert.ok(
  nonsanGlobe
    .find((s) => s.attractionName === '종학당과 한국유교문화진흥원')
    ?.overview?.includes('종학당'),
  '논산 검색 팔경 종학당 개요',
);
const nsYangchonThumb = lookupLocalScenicPhotoByContentId('2750930');
assert.ok(
  nsYangchonThumb?.imageUrl?.includes('20240129135124_00g51rm9'),
  '논산 양촌자연휴양림 Tour 빈 썸네일 overlay',
);
const nsHistoryThumb = lookupLocalScenicPhotoByContentId('946844');
assert.ok(
  nsHistoryThumb?.imageUrl?.includes('3082135'),
  '논산 강경역사관 Tour 빈 썸네일 overlay',
);
const nsNogangThumb = lookupLocalScenicPhotoByContentId('1956315');
assert.ok(
  nsNogangThumb?.imageUrl?.includes('20221222134750_005oh6xhh6'),
  '논산 노강서원 Tour 빈 썸네일 overlay',
);
assert.equal(
  new Set(
    [nsYangchonThumb, nsHistoryThumb, nsNogangThumb].map((s) => s.imageUrl),
  ).size,
  3,
  '논산 Tour 빈 썸네일 3건 서로 다름',
);
assert.ok(
  lookupLocalScenicPhotoByContentId('127160')?.imageUrl?.includes('3590496'),
  '영덕 하저해수욕장 Tour 빈 썸네일 overlay',
);
assert.ok(
  lookupLocalScenicPhotoByContentId('2599737')?.imageUrl?.includes('4059797'),
  '문경석탄박물관 Tour 빈 썸네일 overlay',
);
assert.ok(
  lookupLocalScenicPhotoByContentId('553447')?.imageUrl?.includes('201611080750465200'),
  '진도 조도(조도6군도) Tour 빈 썸네일 overlay',
);
assert.ok(
  lookupLocalScenicPhotoByContentId('553447')?.imageUrl?.includes('jindo.go.kr'),
  '진도 조도 Tour 썸네일은 진도군 공식 사진',
);
assert.notEqual(
  nsHistoryThumb?.imageUrl,
  nsGang?.imageUrl,
  '강경역사관 썸네일 ≠ 강경포구 팔경 썸네일',
);

const cheonanMerged = mergeLocalScenicMembersIntoScenicSpots([], 'cheonan');
const cheonanEight = cheonanMerged.filter((s) => s.localScenicListId === 'cheonan-palgyeong');
assert.equal(cheonanEight.length, 8, '천안8경 8명');
assert.equal(cheonanEight[0]?.groupTitle, '천안 팔경');
const cheonanDeficitNames = [
  '유관순열사사적지',
  '태조산 왕건길과 청동대좌불',
  '아라리오조각광장',
  '봉선홍경사갈기비',
];
const cheonanDeficit = cheonanEight.filter((s) =>
  cheonanDeficitNames.includes(s.attractionName),
);
assert.equal(cheonanDeficit.length, 4, '천안8경 결손 4명');
assert.ok(
  cheonanDeficit.every((s) => s.overview && s.imageUrl),
  '천안 결손 4명 overlay 사진·개요',
);
assert.ok(
  cheonanDeficit.every((s) => !s.contentId),
  '천안 결손 JSON contentId 없음 유지',
);
assert.equal(
  new Set(cheonanDeficit.map((s) => s.imageUrl)).size,
  4,
  '천안 결손 4명 썸네일 서로 다름',
);
const cnYu = resolveLocalScenicListSpotById(
  'local-scenic:cheonan-palgyeong:유관순열사사적지',
);
assert.ok(cnYu?.overview?.includes('아우내장터'), '천안 유관순 overlay overview');
assert.ok(cnYu?.overview?.includes('사적'), '천안 유관순 사적');
assert.ok(cnYu?.imageUrl?.includes('TUCN_202311160351371300'), '천안 유관순 시 공식 사진');
const cnTaejo = resolveLocalScenicListSpotById(
  'local-scenic:cheonan-palgyeong:태조산왕건길과청동대좌불',
);
assert.ok(cnTaejo?.overview?.includes('청동대불'), '천안 태조산 overlay overview');
assert.ok(cnTaejo?.overview?.includes('15m'), '천안 청동대좌불 높이');
assert.ok(cnTaejo?.imageUrl?.includes('TT_202602090307011892'), '천안 태조산 시 공식 사진');
const cnArario = resolveLocalScenicListSpotById(
  'local-scenic:cheonan-palgyeong:아라리오조각광장',
);
assert.ok(cnArario?.overview?.includes('28점'), '천안 아라리오 overlay overview');
assert.ok(cnArario?.overview?.includes('국무총리상'), '천안 아라리오 국무총리상');
assert.ok(cnArario?.imageUrl?.includes('TUCN_202311160356224720'), '천안 아라리오 시 공식 사진');
const cnStele = resolveLocalScenicListSpotById(
  'local-scenic:cheonan-palgyeong:봉선홍경사갈기비',
);
assert.ok(cnStele?.overview?.includes('최충'), '천안 갈기비 overlay overview');
assert.ok(cnStele?.overview?.includes('1026'), '천안 갈기비 1026');
assert.ok(cnStele?.imageUrl?.includes('TT_202602090337447340'), '천안 갈기비 시 공식 사진');
assert.notEqual(cnYu?.imageUrl, cnTaejo?.imageUrl, '유관순·태조산 썸네일 다름');
assert.notEqual(cnArario?.imageUrl, cnStele?.imageUrl, '아라리오·갈기비 썸네일 다름');

const gakwonsaPark = listKoreaScenicSpots().find(
  (s) => s.id === 'gakwonsa' || s.attractionName === '각원사',
);
assert.ok(gakwonsaPark?.imageUrl, 'GATEO 선정 각원사 썸네일');
assert.notEqual(
  cnTaejo?.imageUrl,
  gakwonsaPark?.imageUrl,
  '태조산 청동대좌불 썸네일 ≠ GATEO 선정 각원사',
);

const cheonanGlobe = filterScenicSpotsByQuery(listKoreaScenicSpots(), '천안', {
  injectLocalScenic: true,
});
const cheonanGlobeEight = cheonanGlobe.filter((s) => s.localScenicListId === 'cheonan-palgyeong');
assert.equal(cheonanGlobeEight.length, 8, '천안 검색 천안8경 8행');
assert.ok(
  cheonanGlobeEight.every((s) => s.groupTitle === '천안 팔경'),
  '천안 검색 그룹명 천안 팔경',
);
assert.ok(
  cheonanGlobe.find((s) => s.attractionName === '유관순열사사적지')?.imageUrl,
  '천안 검색 팔경 유관순열사사적지 썸네일',
);
assert.ok(
  cheonanGlobe
    .find((s) => s.attractionName === '봉선홍경사갈기비')
    ?.overview?.includes('갈기비'),
  '천안 검색 팔경 갈기비 개요',
);

const jindoMerged = mergeLocalScenicMembersIntoScenicSpots([], 'jindo');
const jindoTen = jindoMerged.filter((s) => s.localScenicListId === 'jindo-other');
assert.equal(jindoTen.length, 10, '진도10경 10명');
assert.equal(jindoTen[0]?.groupTitle, '진도 10경');
const jindoDeficitNames = ['조도관음도', '의장대', '돈대산', '하조대'];
const jindoDeficit = jindoTen.filter((s) => jindoDeficitNames.includes(s.attractionName));
assert.equal(jindoDeficit.length, 4, '진도10경 결손 4명');
assert.ok(
  jindoDeficit.every((s) => s.overview && s.imageUrl),
  '진도 결손 4명 overlay 사진·개요',
);
assert.ok(
  jindoDeficit.every((s) => !s.contentId),
  '진도 결손 JSON contentId 없음 유지',
);
assert.equal(
  new Set(jindoDeficit.map((s) => s.imageUrl)).size,
  4,
  '진도 결손 4명 썸네일 서로 다름',
);
assert.ok(
  jindoDeficit.every((s) => String(s.imageUrl).includes('jindo.go.kr')),
  '진도 결손 썸네일은 진도군 공식 사진',
);

const jdGwaneum = resolveLocalScenicListSpotById('local-scenic:jindo-other:조도관음도');
assert.ok(jdGwaneum?.overview?.includes('조도 6군도'), '진도 조도관음도 overlay overview');
assert.ok(jdGwaneum?.overview?.includes('가사도'), '진도 조도관음도 가사도');
assert.ok(
  jdGwaneum?.imageUrl?.includes('201611080739579140'),
  '진도 조도관음도 군 공식 사진',
);

const jdUijang = resolveLocalScenicListSpotById('local-scenic:jindo-other:의장대');
assert.ok(jdUijang?.overview?.includes('도리산'), '진도 의장대 overlay overview');
assert.ok(jdUijang?.overview?.includes('전망 데크'), '진도 의장대 전망 데크');
assert.ok(jdUijang?.imageUrl?.includes('201611080750470042'), '진도 의장대 군 공식 사진');

const jdDondae = resolveLocalScenicListSpotById('local-scenic:jindo-other:돈대산');
assert.ok(jdDondae?.overview?.includes('231m'), '진도 돈대산 overlay overview');
assert.ok(jdDondae?.overview?.includes('봉수대'), '진도 돈대산 봉수대');
assert.ok(jdDondae?.imageUrl?.includes('201611080750465200'), '진도 돈대산 군 공식 사진');

const jdHajo = resolveLocalScenicListSpotById('local-scenic:jindo-other:하조대');
assert.ok(jdHajo?.overview?.includes('하조도등대'), '진도 하조대 overlay overview');
assert.ok(jdHajo?.overview?.includes('1909'), '진도 하조대 1909');
assert.ok(jdHajo?.overview?.includes('조도등대길 429'), '진도 하조대 등대 주소');
assert.ok(!jdHajo?.overview?.includes('양양'), '진도 하조대 개요에 양양 없음');
assert.ok(!jdHajo?.overview?.includes('하륜'), '진도 하조대 개요에 양양 설화 없음');
assert.ok(jdHajo?.imageUrl?.includes('201612230215081201'), '진도 하조대 군 공식 사진');
assert.ok(
  jdHajo?.imageUrl?.includes('jindo.go.kr'),
  '진도 하조대 썸네일은 진도군 하조도등대',
);
assert.notEqual(jdGwaneum?.imageUrl, jdUijang?.imageUrl, '조도관음도·의장대 썸네일 다름');
assert.notEqual(jdDondae?.imageUrl, jdHajo?.imageUrl, '돈대산·하조대 썸네일 다름');

const yangyangHajoBeach = listKoreaScenicSpots().find((s) => s.id === 'hajodae-beach');
assert.ok(yangyangHajoBeach?.imageUrl, '양양 하조대해수욕장 GATEO 선정 썸네일');
assert.notEqual(
  jdHajo?.imageUrl,
  yangyangHajoBeach?.imageUrl,
  '진도 하조대 썸네일 ≠ 양양 하조대해수욕장',
);

const jindoGlobe = filterScenicSpotsByQuery(listKoreaScenicSpots(), '진도', {
  injectLocalScenic: true,
});
const jindoGlobeTen = jindoGlobe.filter((s) => s.localScenicListId === 'jindo-other');
assert.equal(jindoGlobeTen.length, 10, '진도 검색 진도10경 10행');
assert.ok(
  jindoGlobeTen.every((s) => s.groupTitle === '진도 10경'),
  '진도 검색 그룹명 진도 10경',
);
assert.ok(
  jindoGlobe.find((s) => s.attractionName === '하조대')?.imageUrl?.includes('jindo.go.kr'),
  '진도 검색 팔경 하조대 진도군 썸네일',
);
assert.ok(
  jindoGlobe.find((s) => s.attractionName === '조도관음도')?.overview?.includes('조도 6군도'),
  '진도 검색 팔경 조도관음도 개요',
);

const hampyeongMerged = mergeLocalScenicMembersIntoScenicSpots([], 'hampyeong');
const hampyeongEight = hampyeongMerged.filter((s) => s.localScenicListId === 'hampyeong-palgyeong');
assert.equal(hampyeongEight.length, 8, '함평8경 8명');
assert.equal(hampyeongEight[0]?.groupTitle, '함평 팔경');
const hampyeongDeficitNames = ['백제고도', '모악산', '삼호천', '청계산'];
const hampyeongDeficit = hampyeongEight.filter((s) =>
  hampyeongDeficitNames.includes(s.attractionName),
);
assert.equal(hampyeongDeficit.length, 4, '함평8경 결손 4명');
assert.ok(
  hampyeongDeficit.every((s) => s.overview && s.imageUrl),
  '함평 결손 4명 overlay 사진·개요',
);
assert.ok(
  hampyeongDeficit.every((s) => !s.contentId),
  '함평 결손 JSON contentId 없음 유지',
);
assert.equal(
  new Set(hampyeongDeficit.map((s) => s.imageUrl)).size,
  4,
  '함평 결손 4명 썸네일 서로 다름',
);
assert.ok(
  hampyeongDeficit.every((s) => String(s.imageUrl).includes('tong.visitkorea.or.kr')),
  '함평 결손 썸네일은 한국관광공사 공식 사진',
);

const hpBaekje = resolveLocalScenicListSpotById('local-scenic:hampyeong-palgyeong:백제고도');
assert.ok(hpBaekje?.overview?.includes('예덕리'), '함평 백제고도 overlay overview');
assert.ok(hpBaekje?.overview?.includes('신덕'), '함평 백제고도 신덕 고분');
assert.ok(hpBaekje?.overview?.includes('사적'), '함평 백제고도 사적');
assert.ok(!hpBaekje?.overview?.includes('부여'), '함평 백제고도 개요에 부여 없음');
assert.ok(!hpBaekje?.overview?.includes('백제문화단지'), '함평 백제고도 개요에 백제문화단지 없음');
assert.ok(hpBaekje?.imageUrl?.includes('3536122'), '함평 백제고도 한국관광공사 고분 사진');

const hpMoak = resolveLocalScenicListSpotById('local-scenic:hampyeong-palgyeong:모악산');
assert.ok(hpMoak?.overview?.includes('348m'), '함평 모악산 overlay overview');
assert.ok(hpMoak?.overview?.includes('해보면'), '함평 모악산 해보면');
assert.ok(hpMoak?.overview?.includes('꽃무릇공원'), '함평 모악산 꽃무릇공원');
assert.ok(!hpMoak?.overview?.includes('전주'), '함평 모악산 개요에 전주 없음');
assert.ok(!hpMoak?.overview?.includes('김제'), '함평 모악산 개요에 김제 없음');
assert.ok(!hpMoak?.overview?.includes('도립공원'), '함평 모악산 개요에 도립공원 없음');
assert.ok(hpMoak?.imageUrl?.includes('3061145'), '함평 모악산 꽃무릇공원 공식 사진');
assert.ok(!hpMoak?.imageUrl?.includes('3061070'), '함평 모악산 썸네일 ≠ 용천사 GATEO 선정');

const hpSamho = resolveLocalScenicListSpotById('local-scenic:hampyeong-palgyeong:삼호천');
assert.ok(hpSamho?.overview?.includes('함평천수변공원'), '함평 삼호천 overlay overview');
assert.ok(hpSamho?.overview?.includes('기산영수'), '함평 삼호천 기산영수');
assert.ok(!hpSamho?.overview?.includes('창원'), '함평 삼호천 개요에 창원 없음');
assert.ok(!hpSamho?.overview?.includes('고막천'), '함평 삼호천 개요에 고막천 없음');
assert.ok(hpSamho?.imageUrl?.includes('3081704'), '함평 삼호천 함평천수변공원 공식 사진');

const hpCheong = resolveLocalScenicListSpotById('local-scenic:hampyeong-palgyeong:청계산');
assert.ok(hpCheong?.overview?.includes('청계'), '함평 청계산 overlay overview');
assert.ok(hpCheong?.overview?.includes('군유산'), '함평 청계산 군유산');
assert.ok(hpCheong?.overview?.includes('신광면'), '함평 청계산 신광면');
assert.ok(!hpCheong?.overview?.includes('과천'), '함평 청계산 개요에 과천 없음');
assert.ok(!hpCheong?.overview?.includes('서울'), '함평 청계산 개요에 서울 없음');
assert.ok(hpCheong?.imageUrl?.includes('3061121'), '함평 청계산 양재리 이팝나무 공식 사진');
assert.notEqual(hpBaekje?.imageUrl, hpMoak?.imageUrl, '백제고도·모악산 썸네일 다름');
assert.notEqual(hpSamho?.imageUrl, hpCheong?.imageUrl, '삼호천·청계산 썸네일 다름');

const gimjeMoak = listKoreaScenicSpots().find((s) => s.id === 'moaksan');
assert.ok(gimjeMoak?.imageUrl, '김제 모악산 GATEO 선정 썸네일');
assert.notEqual(hpMoak?.imageUrl, gimjeMoak?.imageUrl, '함평 모악산 썸네일 ≠ 김제 모악산');
const yongcheonsaHp = listKoreaScenicSpots().find((s) => s.id === 'yongcheonsa-hampyeong');
assert.ok(yongcheonsaHp?.imageUrl?.includes('3061070'), '용천사 함평 GATEO 선정 썸네일');
assert.notEqual(
  hpMoak?.imageUrl,
  yongcheonsaHp?.imageUrl,
  '함평 모악산 썸네일 ≠ 용천사 함평',
);

const hampyeongGlobe = filterScenicSpotsByQuery(listKoreaScenicSpots(), '함평', {
  injectLocalScenic: true,
});
const hampyeongGlobeEight = hampyeongGlobe.filter(
  (s) => s.localScenicListId === 'hampyeong-palgyeong',
);
assert.equal(hampyeongGlobeEight.length, 8, '함평 검색 함평8경 8행');
assert.ok(
  hampyeongGlobeEight.every((s) => s.groupTitle === '함평 팔경'),
  '함평 검색 그룹명 함평 팔경',
);
assert.ok(
  hampyeongGlobe.find((s) => s.attractionName === '백제고도')?.imageUrl?.includes('3536122'),
  '함평 검색 팔경 백제고도 한국관광공사 썸네일',
);
assert.ok(
  hampyeongGlobe.find((s) => s.attractionName === '모악산')?.overview?.includes('348m'),
  '함평 검색 팔경 모악산 개요',
);
const hpEco = hampyeongEight.find((s) => s.attractionName === '함평자연생태공원');
const hpExpo = hampyeongEight.find((s) => s.attractionName === '함평엑스포공원');
assert.ok(hpEco?.imageUrl?.includes('3536105'), '함평 1경 자연생태공원 TourAPI 사진');
assert.ok(hpExpo?.imageUrl?.includes('4065063'), '함평 2경 엑스포공원 나비축제 사진');
assert.notEqual(hpEco?.imageUrl, hpExpo?.imageUrl, '함평 1경·2경 썸네일 다름');
assert.equal(
  new Set(hampyeongEight.map((s) => s.imageUrl).filter(Boolean)).size,
  8,
  '함평8경 썸네일 8장 서로 다름',
);
assert.ok(
  hampyeongGlobe.find((s) => s.attractionName === '함평엑스포공원')?.imageUrl?.includes('4065063'),
  '함평 검색 팔경 엑스포공원 나비축제 썸네일',
);
assert.notEqual(
  hampyeongGlobe.find((s) => s.attractionName === '함평자연생태공원')?.imageUrl,
  hampyeongGlobe.find((s) => s.attractionName === '함평엑스포공원')?.imageUrl,
  '함평 검색 1경·2경 썸네일 다름',
);

const haenamMerged = mergeLocalScenicMembersIntoScenicSpots([], 'haenam');
const haenamEight = haenamMerged.filter((s) => s.localScenicListId === 'haenam-palgyeong');
assert.equal(haenamEight.length, 8, '해남8경 8명');
assert.equal(haenamEight[0]?.groupTitle, '해남 팔경');
const haenamDeficitNames = [
  '해남 구 목포구등대 낙조 전망대',
  '해남윤씨 옥우당',
  '미황사 및 도솔암',
  '울돌목',
];
const haenamDeficit = haenamEight.filter((s) =>
  haenamDeficitNames.includes(s.attractionName),
);
assert.equal(haenamDeficit.length, 4, '해남8경 결손 4명');
assert.ok(
  haenamDeficit.every((s) => s.overview && s.imageUrl),
  '해남 결손 4명 overlay 사진·개요',
);
assert.ok(
  haenamDeficit.every((s) => !s.contentId),
  '해남 결손 JSON contentId 없음 유지',
);
assert.equal(
  new Set(haenamDeficit.map((s) => s.imageUrl)).size,
  4,
  '해남 결손 4명 썸네일 서로 다름',
);
assert.ok(
  haenamDeficit.every((s) => String(s.imageUrl).includes('tong.visitkorea.or.kr')),
  '해남 결손 썸네일은 한국관광공사 공식 사진',
);

const hnLight = resolveLocalScenicListSpotById(
  'local-scenic:haenam-palgyeong:해남구목포구등대낙조전망대',
);
assert.ok(hnLight?.overview?.includes('주광낙조'), '해남 구 목포구등대 overlay overview');
assert.ok(hnLight?.overview?.includes('화원면'), '해남 구 목포구등대 화원면');
assert.ok(hnLight?.overview?.includes('매봉길 582'), '해남 구 목포구등대 주소');
assert.ok(hnLight?.overview?.includes('379호'), '해남 구 목포구등대 등록문화재');
assert.ok(!hnLight?.overview?.includes('고하도'), '해남 구 목포구등대 개요에 고하도 없음');
assert.ok(hnLight?.imageUrl?.includes('3563584'), '해남 구 목포구등대 한국관광공사 사진');

const hnOkudang = resolveLocalScenicListSpotById('local-scenic:haenam-palgyeong:해남윤씨옥우당');
assert.ok(hnOkudang?.overview?.includes('연봉녹우'), '해남 옥우당 overlay overview');
assert.ok(hnOkudang?.overview?.includes('녹우당'), '해남 옥우당 녹우당');
assert.ok(hnOkudang?.overview?.includes('녹우당길 135'), '해남 옥우당 주소');
assert.ok(!hnOkudang?.overview?.includes('보길도'), '해남 옥우당 개요에 보길도 없음');
assert.ok(hnOkudang?.imageUrl?.includes('689220'), '해남 옥우당 녹우당 공식 사진');

const hnMihwang = resolveLocalScenicListSpotById('local-scenic:haenam-palgyeong:미황사및도솔암');
assert.ok(hnMihwang?.overview?.includes('달마도솔'), '해남 미황사·도솔암 overlay overview');
assert.ok(hnMihwang?.overview?.includes('도솔암'), '해남 미황사·도솔암 도솔암');
assert.ok(hnMihwang?.overview?.includes('미황사길 164'), '해남 미황사 주소');
assert.ok(!hnMihwang?.overview?.includes('선운산'), '해남 도솔암 개요에 선운산 없음');
assert.ok(!hnMihwang?.overview?.includes('두륜산'), '해남 도솔암 개요에 두륜산 없음');
assert.ok(hnMihwang?.imageUrl?.includes('3591506'), '해남 도솔암 한국관광공사 사진');

const hnUldol = resolveLocalScenicListSpotById('local-scenic:haenam-palgyeong:울돌목');
assert.ok(hnUldol?.overview?.includes('명량노도'), '해남 울돌목 overlay overview');
assert.ok(hnUldol?.overview?.includes('문내면'), '해남 울돌목 문내면');
assert.ok(hnUldol?.overview?.includes('스카이워크'), '해남 울돌목 스카이워크');
assert.ok(!hnUldol?.overview?.includes('군내면'), '해남 울돌목 개요에 진도 군내면 없음');
assert.ok(hnUldol?.imageUrl?.includes('3007809'), '해남 울돌목 스카이워크 공식 사진');
assert.notEqual(hnLight?.imageUrl, hnOkudang?.imageUrl, '등대·옥우당 썸네일 다름');
assert.notEqual(hnMihwang?.imageUrl, hnUldol?.imageUrl, '도솔암·울돌목 썸네일 다름');

const daeheungsa = listKoreaScenicSpots().find((s) => s.id === 'daeheungsa');
assert.ok(daeheungsa?.imageUrl, '해남 대흥사 GATEO 선정 썸네일');
assert.notEqual(hnMihwang?.imageUrl, daeheungsa?.imageUrl, '미황사·도솔암 썸네일 ≠ 대흥사');

const haenamGlobe = filterScenicSpotsByQuery(listKoreaScenicSpots(), '해남', {
  injectLocalScenic: true,
});
const haenamGlobeEight = haenamGlobe.filter((s) => s.localScenicListId === 'haenam-palgyeong');
assert.equal(haenamGlobeEight.length, 8, '해남 검색 해남8경 8행');
assert.ok(
  haenamGlobeEight.every((s) => s.groupTitle === '해남 팔경'),
  '해남 검색 그룹명 해남 팔경',
);
assert.ok(
  haenamGlobe.find((s) => s.attractionName === '해남 구 목포구등대 낙조 전망대')?.imageUrl?.includes(
    '3563584',
  ),
  '해남 검색 팔경 구 목포구등대 한국관광공사 썸네일',
);
assert.ok(
  haenamGlobe.find((s) => s.attractionName === '울돌목')?.overview?.includes('문내면'),
  '해남 검색 팔경 울돌목 개요',
);

const hongseongMerged = mergeLocalScenicMembersIntoScenicSpots([], 'hongseong');
const hongseongTwelve = hongseongMerged.filter((s) => s.localScenicListId === 'hongseong-other');
assert.equal(hongseongTwelve.length, 12, '홍성12경 12명');
assert.equal(hongseongTwelve[0]?.groupTitle, '홍성 12경');
const hongseongDeficitNames = [
  '만해한용운생가지',
  '선상문선생 유허지',
  '고암이응노 생가 기념관',
  '그림같은수목원',
];
const hongseongDeficit = hongseongTwelve.filter((s) =>
  hongseongDeficitNames.includes(s.attractionName),
);
assert.equal(hongseongDeficit.length, 4, '홍성12경 결손 4명');
assert.ok(
  hongseongDeficit.every((s) => s.overview && s.imageUrl),
  '홍성 결손 4명 overlay 사진·개요',
);
assert.ok(
  hongseongDeficit.every((s) => !s.contentId),
  '홍성 결손 JSON contentId 없음 유지',
);
assert.equal(
  new Set(hongseongDeficit.map((s) => s.imageUrl)).size,
  4,
  '홍성 결손 4명 썸네일 서로 다름',
);
assert.ok(
  hongseongDeficit.every((s) => String(s.imageUrl).includes('hongseong.go.kr')),
  '홍성 결손 썸네일은 홍성군 공식 사진',
);

const hsManhae = resolveLocalScenicListSpotById('local-scenic:hongseong-other:만해한용운생가지');
assert.ok(hsManhae?.overview?.includes('제7경'), '홍성 만해 overlay overview');
assert.ok(hsManhae?.overview?.includes('결성면'), '홍성 만해 결성면');
assert.ok(hsManhae?.overview?.includes('만해로318번길 83'), '홍성 만해 주소');
assert.ok(hsManhae?.overview?.includes('제75호'), '홍성 만해 기념물');
assert.ok(!hsManhae?.overview?.includes('인제'), '홍성 만해 개요에 인제 없음');
assert.ok(!hsManhae?.overview?.includes('백담사'), '홍성 만해 개요에 백담사 없음');
assert.ok(hsManhae?.imageUrl?.includes('TUCN_202011200459391045'), '홍성 만해 군 공식 사진');

const hsSeong = resolveLocalScenicListSpotById('local-scenic:hongseong-other:선상문선생유허지');
assert.ok(hsSeong?.overview?.includes('성삼문선생유허지'), '홍성 선상문=성삼문 overlay overview');
assert.ok(hsSeong?.overview?.includes('홍북읍'), '홍성 성삼문 홍북읍');
assert.ok(hsSeong?.overview?.includes('매죽헌길 403-12'), '홍성 성삼문 주소');
assert.ok(hsSeong?.overview?.includes('제5호'), '홍성 성삼문 기념물');
assert.ok(hsSeong?.imageUrl?.includes('TUCN_202011270145581511'), '홍성 성삼문 군 공식 사진');

const hsLee = resolveLocalScenicListSpotById('local-scenic:hongseong-other:고암이응노생가기념관');
assert.ok(hsLee?.overview?.includes('이응노의 집'), '홍성 이응노 overlay overview');
assert.ok(hsLee?.overview?.includes('이응노로 61-7'), '홍성 이응노 주소');
assert.ok(hsLee?.overview?.includes('2011년 11월 8일'), '홍성 이응노 개관');
assert.ok(!hsLee?.overview?.includes('대전'), '홍성 이응노 개요에 대전 없음');
assert.ok(hsLee?.imageUrl?.includes('TUCN_202011200428043631'), '홍성 이응노 군 공식 사진');

const hsGarden = resolveLocalScenicListSpotById('local-scenic:hongseong-other:그림같은수목원');
assert.ok(hsGarden?.overview?.includes('제12경'), '홍성 그림같은수목원 overlay overview');
assert.ok(hsGarden?.overview?.includes('광천읍'), '홍성 그림같은수목원 광천읍');
assert.ok(hsGarden?.overview?.includes('충서로400번길 102-36'), '홍성 그림같은수목원 주소');
assert.ok(hsGarden?.overview?.includes('1,330여 종'), '홍성 그림같은수목원 수종');
assert.ok(!hsGarden?.overview?.includes('구례'), '홍성 그림같은수목원 개요에 구례 없음');
assert.ok(hsGarden?.imageUrl?.includes('TUCN_202011200511080921'), '홍성 그림같은수목원 군 공식 사진');
assert.notEqual(hsManhae?.imageUrl, hsSeong?.imageUrl, '만해·성삼문 썸네일 다름');
assert.notEqual(hsLee?.imageUrl, hsGarden?.imageUrl, '이응노·수목원 썸네일 다름');

const guryeArboretum = listKoreaScenicSpots().find((s) => s.id === 'gurye-arboretum');
assert.ok(guryeArboretum?.imageUrl, '구례 수목원 GATEO 선정 썸네일');
assert.notEqual(
  hsGarden?.imageUrl,
  guryeArboretum?.imageUrl,
  '홍성 그림같은수목원 썸네일 ≠ 구례 수목원',
);

const hongseongGlobe = filterScenicSpotsByQuery(listKoreaScenicSpots(), '홍성', {
  injectLocalScenic: true,
});
const hongseongGlobeTwelve = hongseongGlobe.filter(
  (s) => s.localScenicListId === 'hongseong-other',
);
assert.equal(hongseongGlobeTwelve.length, 12, '홍성 검색 홍성12경 12행');
assert.ok(
  hongseongGlobeTwelve.every((s) => s.groupTitle === '홍성 12경'),
  '홍성 검색 그룹명 홍성 12경',
);
assert.ok(
  hongseongGlobe.find((s) => s.attractionName === '만해한용운생가지')?.imageUrl?.includes(
    'TUCN_202011200459391045',
  ),
  '홍성 검색 팔경 만해 군 공식 썸네일',
);
assert.ok(
  hongseongGlobe.find((s) => s.attractionName === '선상문선생 유허지')?.overview?.includes(
    '성삼문선생유허지',
  ),
  '홍성 검색 팔경 선상문=성삼문 개요',
);

const hsYong = resolveLocalScenicListSpotById('local-scenic:hongseong-other:홍성용봉산');
assert.ok(hsYong?.overview?.includes('제3경'), '홍성 용봉산 overlay overview');
assert.ok(hsYong?.overview?.includes('홍북읍'), '홍성 용봉산 홍북읍');
assert.ok(!hsYong?.overview?.includes('자연휴양림'), '홍성 용봉산 개요에 휴양림 없음');
assert.ok(hsYong?.imageUrl?.includes('TUCN_202011130259425353'), '홍성 용봉산 군 공식 사진');

const hsOseo = resolveLocalScenicListSpotById('local-scenic:hongseong-other:오서산');
assert.ok(hsOseo?.overview?.includes('제4경'), '홍성 오서산 overlay overview');
assert.ok(hsOseo?.overview?.includes('광천읍'), '홍성 오서산 광천읍');
assert.ok(hsOseo?.imageUrl?.includes('TUCN_202011270102041141'), '홍성 오서산 군 공식 사진');

const hsJuk = resolveLocalScenicListSpotById('local-scenic:hongseong-other:죽도');
assert.ok(hsJuk?.overview?.includes('제5경'), '홍성 죽도 overlay overview');
assert.ok(hsJuk?.overview?.includes('서부면'), '홍성 죽도 서부면');
assert.ok(hsJuk?.overview?.includes('죽도길 86'), '홍성 죽도 주소');
assert.ok(!hsJuk?.overview?.includes('영덕'), '홍성 죽도 개요에 영덕 없음');
assert.ok(hsJuk?.imageUrl?.includes('TUCN_202011271144168288'), '홍성 죽도 군 공식 사진');

const hsUisa = resolveLocalScenicListSpotById('local-scenic:hongseong-other:홍주의사총');
assert.ok(hsUisa?.overview?.includes('제11경'), '홍성 홍주의사총 overlay overview');
assert.ok(hsUisa?.overview?.includes('의사로 79'), '홍성 홍주의사총 주소');
assert.ok(hsUisa?.overview?.includes('사적'), '홍성 홍주의사총 사적');
assert.ok(hsUisa?.imageUrl?.includes('TUCN_202011200614597037'), '홍성 홍주의사총 군 공식 사진');

const hsEmptyThumbs = [hsYong, hsOseo, hsJuk, hsUisa].map((s) => s.imageUrl);
assert.equal(new Set(hsEmptyThumbs).size, 4, '홍성 QA 빈 썸네일 4건 서로 다름');
assert.ok(
  lookupLocalScenicPhotoByContentId('125821')?.imageUrl?.includes('TUCN_202011130259425353'),
  '홍성 용봉산 Tour 빈 썸네일 overlay 125821',
);
assert.ok(
  lookupLocalScenicPhotoByContentId('126746')?.imageUrl?.includes('TUCN_202011270102041141'),
  '홍성 오서산 Tour 빈 썸네일 overlay 126746',
);
assert.ok(
  lookupLocalScenicPhotoByContentId('126721')?.imageUrl?.includes('TUCN_202011271144168288'),
  '홍성 죽도 Tour 빈 썸네일 overlay 126721',
);
assert.ok(
  lookupLocalScenicPhotoByContentId('125993')?.imageUrl?.includes('TUCN_202011200614597037'),
  '홍성 홍주의사총 Tour 빈 썸네일 overlay 125993',
);
assert.ok(
  hongseongGlobe.find((s) => s.attractionName === '홍주의사총')?.imageUrl?.includes(
    'TUCN_202011200614597037',
  ),
  '홍성 검색 팔경 홍주의사총 군 공식 썸네일',
);
assert.ok(
  hongseongGlobe.find((s) => s.attractionName === '오서산')?.imageUrl?.includes(
    'TUCN_202011270102041141',
  ),
  '홍성 검색 팔경 오서산 군 공식 썸네일',
);
assert.ok(
  hongseongTwelve.find((s) => s.attractionName === '홍주의사총')?.imageUrl?.includes(
    'TUCN_202011200614597037',
  ),
  '홍성12경 리스트 홍주의사총 썸네일',
);

const hwasunMerged = mergeLocalScenicMembersIntoScenicSpots([], 'hwasun');
const hwasunEleven = hwasunMerged.filter((s) => s.localScenicListId === 'hwasun-other');
assert.equal(hwasunEleven.length, 11, '화순11경 11명');
assert.equal(hwasunEleven[0]?.groupTitle, '화순 11경');
const hwasunDeficitNames = [
  '백아산 하늘다리',
  '고인돌 유적지',
  '수만리 철쭉공원',
  '화순 꽃강길 음악분수',
];
const hwasunDeficit = hwasunEleven.filter((s) =>
  hwasunDeficitNames.includes(s.attractionName),
);
assert.equal(hwasunDeficit.length, 4, '화순11경 결손 4명');
assert.ok(
  hwasunDeficit.every((s) => s.overview && s.imageUrl),
  '화순 결손 4명 overlay 사진·개요',
);
assert.ok(
  hwasunDeficit.every((s) => !s.contentId),
  '화순 결손 JSON contentId 없음 유지',
);
assert.equal(
  new Set(hwasunDeficit.map((s) => s.imageUrl)).size,
  4,
  '화순 결손 4명 썸네일 서로 다름',
);
assert.ok(
  hwasunDeficit.every((s) => String(s.imageUrl).includes('hwasun.go.kr')),
  '화순 결손 썸네일은 화순군 공식 사진',
);

const hwSky = resolveLocalScenicListSpotById('local-scenic:hwasun-other:백아산하늘다리');
assert.ok(hwSky?.overview?.includes('제3경'), '화순 백아산 overlay overview');
assert.ok(hwSky?.overview?.includes('백아면'), '화순 백아산 백아면');
assert.ok(hwSky?.overview?.includes('백아로 1310-56'), '화순 백아산 주소');
assert.ok(hwSky?.overview?.includes('66m'), '화순 백아산 현수교 길이');
assert.ok(hwSky?.imageUrl?.includes('sub_010103_sdimg01'), '화순 백아산 군 공식 사진');

const hwDolmen = resolveLocalScenicListSpotById('local-scenic:hwasun-other:고인돌유적지');
assert.ok(hwDolmen?.overview?.includes('제4경'), '화순 고인돌 overlay overview');
assert.ok(hwDolmen?.overview?.includes('효산리'), '화순 고인돌 효산리');
assert.ok(hwDolmen?.overview?.includes('대신리'), '화순 고인돌 대신리');
assert.ok(hwDolmen?.overview?.includes('세계문화유산'), '화순 고인돌 유네스코');
assert.ok(!hwDolmen?.overview?.includes('고창'), '화순 고인돌 개요에 고창 없음');
assert.ok(hwDolmen?.imageUrl?.includes('sub_010104_sdimg01'), '화순 고인돌 군 공식 사진');

const hwAzalea = resolveLocalScenicListSpotById('local-scenic:hwasun-other:수만리철쭉공원');
assert.ok(hwAzalea?.overview?.includes('제5경'), '화순 수만리 overlay overview');
assert.ok(hwAzalea?.overview?.includes('안양산로 258'), '화순 수만리 주소');
assert.ok(hwAzalea?.overview?.includes('한국의 알프스'), '화순 수만리 알프스');
assert.ok(hwAzalea?.overview?.includes('치유숲'), '화순 수만리≠만연산 치유숲 구분');
assert.ok(hwAzalea?.imageUrl?.includes('sub_010105_sdimg01'), '화순 수만리 군 공식 사진');

const hwFountain = resolveLocalScenicListSpotById(
  'local-scenic:hwasun-other:화순꽃강길음악분수',
);
assert.ok(hwFountain?.overview?.includes('제10경'), '화순 꽃강길 overlay overview');
assert.ok(hwFountain?.overview?.includes('대리 481'), '화순 꽃강길 주소');
assert.ok(hwFountain?.overview?.includes('2023년 10월'), '화순 꽃강길 개장');
assert.ok(hwFountain?.overview?.includes('개미산'), '화순 꽃강길 개미산 전망대');
assert.ok(hwFountain?.imageUrl?.includes('sub_010111_sdimg01'), '화순 꽃강길 군 공식 사진');
assert.notEqual(hwSky?.imageUrl, hwDolmen?.imageUrl, '백아산·고인돌 썸네일 다름');
assert.notEqual(hwAzalea?.imageUrl, hwFountain?.imageUrl, '수만리·꽃강길 썸네일 다름');

const manyeonsanForest = listKoreaScenicSpots().find((s) => s.id === 'manyeonsan-healing-forest');
assert.ok(manyeonsanForest?.imageUrl, '만연산 치유숲 GATEO 선정 썸네일');
assert.notEqual(
  hwAzalea?.imageUrl,
  manyeonsanForest?.imageUrl,
  '화순 수만리 철쭉공원 썸네일 ≠ 만연산 치유숲',
);

const gochangDolmen = listKoreaScenicSpots().find((s) => s.id === 'gochang-dolmen-sites');
assert.ok(gochangDolmen?.imageUrl, '고창 고인돌 GATEO 선정 썸네일');
assert.notEqual(
  hwDolmen?.imageUrl,
  gochangDolmen?.imageUrl,
  '화순 고인돌 썸네일 ≠ 고창 고인돌',
);

const hwasunGlobe = filterScenicSpotsByQuery(listKoreaScenicSpots(), '화순', {
  injectLocalScenic: true,
});
const hwasunGlobeEleven = hwasunGlobe.filter((s) => s.localScenicListId === 'hwasun-other');
assert.equal(hwasunGlobeEleven.length, 11, '화순 검색 화순11경 11행');
assert.ok(
  hwasunGlobeEleven.every((s) => s.groupTitle === '화순 11경'),
  '화순 검색 그룹명 화순 11경',
);
assert.ok(
  hwasunGlobe.find((s) => s.attractionName === '백아산 하늘다리')?.imageUrl?.includes(
    'sub_010103_sdimg01',
  ),
  '화순 검색 팔경 백아산 군 공식 썸네일',
);
assert.ok(
  hwasunGlobe.find((s) => s.attractionName === '화순 꽃강길 음악분수')?.overview?.includes(
    '대리 481',
  ),
  '화순 검색 팔경 꽃강길 개요',
);

const hwForest = resolveLocalScenicListSpotById('local-scenic:hwasun-other:연둔리숲정이');
assert.ok(hwForest?.overview?.includes('제7경'), '화순 연둔리 overlay overview');
assert.ok(hwForest?.overview?.includes('동복면'), '화순 연둔리 동복면');
assert.ok(hwForest?.overview?.includes('둔동1길 38'), '화순 연둔리 주소');
assert.ok(hwForest?.overview?.includes('아름다운 마을 숲'), '화순 연둔리 마을 숲');
assert.ok(hwForest?.overview?.includes('수양버들'), '화순 연둔리 수양버들');
assert.ok(!hwForest?.overview?.includes('만연산 치유숲은'), '화순 연둔리 개요에 만연산 본문 없음');
assert.ok(hwForest?.imageUrl?.includes('sub_010107_sdimg01'), '화순 연둔리 군 공식 사진');
assert.equal(hwForest?.contentId, '3014431', '화순 연둔리 JSON contentId 유지');
assert.notEqual(hwForest?.imageUrl, hwAzalea?.imageUrl, '연둔리 썸네일 ≠ 수만리 철쭉');
assert.ok(
  lookupLocalScenicPhotoByContentId('3014431')?.imageUrl?.includes('sub_010107_sdimg01'),
  '화순 연둔리 Tour 빈 썸네일 overlay 3014431',
);
assert.ok(
  hwasunGlobe.find((s) => s.attractionName === '연둔리 숲정이')?.imageUrl?.includes(
    'sub_010107_sdimg01',
  ),
  '화순 검색 팔경 연둔리 군 공식 썸네일',
);
assert.ok(
  hwasunEleven.find((s) => s.attractionName === '연둔리 숲정이')?.imageUrl?.includes(
    'sub_010107_sdimg01',
  ),
  '화순11경 리스트 연둔리 썸네일',
);
const hwForestSearch = resolveSearchScenicMedia({
  hubId: 'hwasun',
  name: '화순동복연둔리숲정이',
  contentId: '3014431',
});
assert.ok(
  hwForestSearch.imageUrl?.includes('sub_010107_sdimg01'),
  '탐색 검색 Tour 행 화순동복연둔리숲정이 썸네일',
);
assert.equal(hwForestSearch.contentId, '3014431', '탐색 검색 연둔리 contentId');
const hwForestSuggest = localScenicMemberToSuggestion(
  lists.find((l) => l.listId === 'hwasun-other'),
  resolveCityAttractionHub('hwasun'),
  lists
    .find((l) => l.listId === 'hwasun-other')
    ?.members?.find((m) => m.attractionName === '연둔리 숲정이'),
);
assert.ok(
  hwForestSuggest?.imageUrl?.includes('sub_010107_sdimg01'),
  '탐색 드롭다운 연둔리 숲정이 썸네일',
);

const geojeMerged = mergeLocalScenicMembersIntoScenicSpots([], 'geoje');
const geojeNine = geojeMerged.filter((s) => s.localScenicListId === 'geoje-gugyeong');
assert.equal(geojeNine.length, 9, '거제9경 9명');
assert.equal(geojeNine[0]?.groupTitle, '거제 구경');
const geojeDeficitNames = ['학동몽돌해수욕장', '거제포로수용소유적공원', '공곶이·내도'];
const geojeDeficit = geojeNine.filter((s) => geojeDeficitNames.includes(s.attractionName));
assert.equal(geojeDeficit.length, 3, '거제9경 결손 3명');
assert.ok(
  geojeDeficit.every((s) => s.overview && s.imageUrl),
  '거제 결손 3명 overlay 사진·개요',
);
assert.ok(
  geojeDeficit.every((s) => !s.contentId),
  '거제 결손 JSON contentId 없음 유지',
);
assert.equal(
  new Set(geojeDeficit.map((s) => s.imageUrl)).size,
  3,
  '거제 결손 3명 썸네일 서로 다름',
);

const gjHakdong = resolveLocalScenicListSpotById(
  'local-scenic:geoje-gugyeong:학동몽돌해수욕장',
);
assert.ok(gjHakdong?.overview?.includes('제4경'), '거제 학동 overlay overview');
assert.ok(gjHakdong?.overview?.includes('학동 흑진주 몽돌해변'), '거제 학동 공식명');
assert.ok(gjHakdong?.overview?.includes('학동6길 18-1'), '거제 학동 주소');
assert.ok(gjHakdong?.overview?.includes('자연의 소리 100선'), '거제 학동 소리 100선');
assert.ok(gjHakdong?.overview?.includes('고성 학동마을'), '거제 학동≠고성 학동마을 구분');
assert.ok(gjHakdong?.imageUrl?.includes('1047555'), '거제 학동 공사 공식 사진');

const gjPow = resolveLocalScenicListSpotById(
  'local-scenic:geoje-gugyeong:거제포로수용소유적공원',
);
assert.ok(gjPow?.overview?.includes('제6경'), '거제 포로수용소 overlay overview');
assert.ok(gjPow?.overview?.includes('계룡로 61'), '거제 포로수용소 주소');
assert.ok(gjPow?.overview?.includes('문화재자료 제99호'), '거제 포로수용소 문화재');
assert.ok(gjPow?.overview?.includes('17만 3천'), '거제 포로수용소 수용 규모');
assert.ok(gjPow?.imageUrl?.includes('2440885'), '거제 포로수용소 공사 공식 사진');
assert.notEqual(gjHakdong?.imageUrl, gjPow?.imageUrl, '학동·포로수용소 썸네일 다름');

const gjGonggoji = resolveLocalScenicListSpotById(
  'local-scenic:geoje-gugyeong:공곶이·내도',
);
assert.ok(gjGonggoji?.overview?.includes('제7경'), '거제 공곶이 overlay overview');
assert.ok(gjGonggoji?.overview?.includes('와현리 94-2'), '거제 공곶이 주소');
assert.ok(gjGonggoji?.overview?.includes('강명식'), '거제 공곶이 조성');
assert.ok(gjGonggoji?.overview?.includes('구조라선착장'), '거제 내도 선착장');
assert.ok(gjGonggoji?.overview?.includes('외도보타니아'), '거제 공곶이≠외도 구분');
assert.ok(gjGonggoji?.imageUrl?.includes('3495061'), '거제 공곶이 공사 공식 사진');
assert.ok(
  (gjGonggoji?.galleryUrls || []).some((u) => String(u).includes('3576042')),
  '거제 공곶이 갤러리에 내도 사진',
);
assert.notEqual(gjGonggoji?.imageUrl, gjHakdong?.imageUrl, '공곶이·학동 썸네일 다름');
assert.notEqual(gjGonggoji?.imageUrl, gjPow?.imageUrl, '공곶이·포로수용소 썸네일 다름');

const geojeGlobe = filterScenicSpotsByQuery(listKoreaScenicSpots(), '거제', {
  injectLocalScenic: true,
});
const geojeGlobeNine = geojeGlobe.filter((s) => s.localScenicListId === 'geoje-gugyeong');
assert.equal(geojeGlobeNine.length, 9, '거제 검색 거제9경 9행');
assert.ok(
  geojeGlobeNine.every((s) => s.groupTitle === '거제 구경'),
  '거제 검색 팔경 groupTitle 거제 구경',
);
assert.ok(
  geojeGlobe.find((s) => s.attractionName === '학동몽돌해수욕장')?.imageUrl?.includes(
    '1047555',
  ),
  '거제 검색 팔경 학동 공사 썸네일',
);
assert.ok(
  geojeGlobe.find((s) => s.attractionName === '공곶이·내도')?.overview?.includes(
    '와현리 94-2',
  ),
  '거제 검색 팔경 공곶이 개요',
);

const gjGonggojiSearch = resolveSearchScenicMedia({
  hubId: 'geoje',
  name: '공곶이',
  contentId: '2536196',
});
assert.ok(
  gjGonggojiSearch.imageUrl?.includes('3495061'),
  '탐색 검색 Tour 행 공곶이 썸네일',
);
assert.equal(gjGonggojiSearch.contentId, '2536196', '탐색 검색 공곶이 contentId');

const gjGarden = resolveLocalScenicListSpotById(
  'local-scenic:geoje-gugyeong:거제식물원',
);
assert.equal(gjGarden?.contentId, '2648073', '거제 식물원 JSON contentId 유지');
assert.ok(gjGarden?.overview?.includes('제5경'), '거제 식물원 overlay overview');
assert.ok(gjGarden?.overview?.includes('정글돔'), '거제 식물원 정글돔');
assert.ok(gjGarden?.overview?.includes('거제남서로 3595'), '거제 식물원 주소');
assert.ok(gjGarden?.overview?.includes('외도보타니아'), '거제 식물원≠외도 구분');
assert.ok(gjGarden?.imageUrl?.includes('3521017'), '거제 식물원 공사 공식 사진');

const gjMaemi = resolveLocalScenicListSpotById(
  'local-scenic:geoje-gugyeong:매미성',
);
assert.equal(gjMaemi?.contentId, '2536133', '거제 매미성 JSON contentId 유지');
assert.ok(gjMaemi?.overview?.includes('제9경'), '거제 매미성 overlay overview');
assert.ok(gjMaemi?.overview?.includes('복항길 29'), '거제 매미성 주소');
assert.ok(gjMaemi?.overview?.includes('백순삼'), '거제 매미성 조성');
assert.ok(gjMaemi?.overview?.includes('매미면가'), '거제 매미성≠식당 구분');
assert.ok(gjMaemi?.imageUrl?.includes('3092092'), '거제 매미성 공사 공식 사진');
assert.notEqual(gjGarden?.imageUrl, gjMaemi?.imageUrl, '식물원·매미성 썸네일 다름');
assert.notEqual(gjGarden?.imageUrl, gjHakdong?.imageUrl, '식물원·학동 썸네일 다름');
assert.notEqual(gjMaemi?.imageUrl, gjGonggoji?.imageUrl, '매미성·공곶이 썸네일 다름');

const gjGardenSearch = resolveSearchScenicMedia({
  hubId: 'geoje',
  name: '거제 식물원',
  contentId: '2648073',
});
assert.ok(
  gjGardenSearch.imageUrl?.includes('3521017'),
  '탐색 드롭다운 거제 식물원 썸네일',
);
assert.equal(gjGardenSearch.contentId, '2648073', '탐색 거제 식물원 contentId');

const gjMaemiSearch = resolveSearchScenicMedia({
  hubId: 'geoje',
  name: '매미성',
  contentId: '2536133',
});
assert.ok(
  gjMaemiSearch.imageUrl?.includes('3092092'),
  '탐색 드롭다운 매미성 썸네일',
);
assert.equal(gjMaemiSearch.contentId, '2536133', '탐색 매미성 contentId');

const gjGujoraSearch = resolveSearchScenicMedia({
  hubId: 'geoje',
  name: '구조라해수욕장',
});
assert.ok(
  gjGujoraSearch.imageUrl?.includes('3519210'),
  '탐색 드롭다운 구조라해수욕장 썸네일',
);
assert.ok(
  lookupLocalScenicPhotoByContentId('583071')?.imageUrl?.includes('3519210'),
  '거제 검색 Tour 행 구조라해수욕장 썸네일',
);
assert.ok(
  lookupLocalScenicPhotoByContentId('2756617')?.imageUrl?.includes('1250082'),
  '거제 검색 Tour 행 동백섬 지심도터미널 썸네일',
);
assert.ok(
  geojeGlobe.find((s) => s.attractionName === '거제 식물원')?.imageUrl?.includes(
    '3521017',
  ),
  '거제 검색 팔경 식물원 공사 썸네일',
);
assert.ok(
  geojeGlobe.find((s) => s.attractionName === '매미성')?.imageUrl?.includes(
    '3092092',
  ),
  '거제 검색 팔경 매미성 공사 썸네일',
);

const donghaeMerged = mergeLocalScenicMembersIntoScenicSpots([], 'donghae');
const donghaeNine = donghaeMerged.filter((s) => s.localScenicListId === 'donghae-bijing');
assert.equal(donghaeNine.length, 9, '동해비경 9명');
assert.equal(donghaeNine[0]?.groupTitle, '동해 명소');
const donghaeDeficitNames = ['호해정', '할미바위', '초록봉'];
const donghaeDeficit = donghaeNine.filter((s) =>
  donghaeDeficitNames.includes(s.attractionName),
);
assert.equal(donghaeDeficit.length, 3, '동해비경 결손 3명');
assert.ok(
  donghaeDeficit.every((s) => s.overview && s.imageUrl),
  '동해 결손 3명 overlay 사진·개요',
);
assert.ok(
  donghaeDeficit.every((s) => !s.contentId),
  '동해 결손 JSON contentId 없음 유지',
);
assert.equal(
  new Set(donghaeDeficit.map((s) => s.imageUrl)).size,
  3,
  '동해 결손 3명 썸네일 서로 다름',
);
assert.ok(
  donghaeDeficit.every((s) => String(s.imageUrl).includes('dh.go.kr')),
  '동해 결손 3명 동해시 공식 사진',
);

const dhHohae = resolveLocalScenicListSpotById('local-scenic:donghae-bijing:호해정');
assert.ok(dhHohae?.overview?.includes('구미동 산2'), '동해 호해정 주소');
assert.ok(dhHohae?.overview?.includes('광복'), '동해 호해정 광복 기념');
assert.ok(dhHohae?.overview?.includes('천하괴석'), '동해 호해정 추사 현액');
assert.ok(dhHohae?.overview?.includes('강릉 경포 호해정'), '동해 호해정≠강릉 호해정 구분');
assert.ok(dhHohae?.overview?.includes('해암정'), '동해 호해정≠추암 해암정 구분');
assert.ok(dhHohae?.imageUrl?.includes('lC3E'), '동해 호해정 시 공식 사진');

const dhHalmi = resolveLocalScenicListSpotById('local-scenic:donghae-bijing:할미바위');
assert.ok(dhHalmi?.overview?.includes('구미동 산1'), '동해 할미바위 주소');
assert.ok(dhHalmi?.overview?.includes('2.5m'), '동해 할미바위 지름');
assert.ok(dhHalmi?.overview?.includes('흔들바위'), '동해 할미바위 흔들바위');
assert.ok(dhHalmi?.overview?.includes('삼척·고성 할미바위'), '동해 할미바위≠삼척 구분');
assert.ok(dhHalmi?.imageUrl?.includes('24451037_RxXo'), '동해 할미바위 시 공식 사진');
assert.notEqual(dhHohae?.imageUrl, dhHalmi?.imageUrl, '호해정·할미바위 썸네일 다름');

const dhChorok = resolveLocalScenicListSpotById('local-scenic:donghae-bijing:초록봉');
assert.ok(dhChorok?.overview?.includes('8경 중 8경'), '동해 초록봉 overlay overview');
assert.ok(dhChorok?.overview?.includes('종합경기장'), '동해 초록봉 등산 코스');
assert.ok(dhChorok?.overview?.includes('천곡동'), '동해 초록봉 주소');
assert.ok(dhChorok?.overview?.includes('두타산'), '동해 초록봉≠두타산 구분');
assert.ok(dhChorok?.imageUrl?.includes('23227431_f3xe'), '동해 초록봉 시 공식 사진');
assert.notEqual(dhChorok?.imageUrl, dhHohae?.imageUrl, '초록봉·호해정 썸네일 다름');
assert.notEqual(dhChorok?.imageUrl, dhHalmi?.imageUrl, '초록봉·할미바위 썸네일 다름');

const donghaeGlobe = filterScenicSpotsByQuery(listKoreaScenicSpots(), '동해', {
  injectLocalScenic: true,
});
const donghaeGlobeNine = donghaeGlobe.filter((s) => s.localScenicListId === 'donghae-bijing');
assert.equal(donghaeGlobeNine.length, 9, '동해 검색 동해비경 9행');
assert.ok(
  donghaeGlobeNine.every((s) => s.groupTitle === '동해 명소'),
  '동해 검색 팔경 groupTitle 동해 명소',
);
assert.ok(
  donghaeGlobe.find((s) => s.attractionName === '호해정')?.imageUrl?.includes('lC3E'),
  '동해 검색 팔경 호해정 시 썸네일',
);
assert.ok(
  donghaeGlobe.find((s) => s.attractionName === '초록봉')?.overview?.includes('종합경기장'),
  '동해 검색 팔경 초록봉 개요',
);

const dhYongchu = resolveLocalScenicListSpotById('local-scenic:donghae-bijing:용추폭포');
const dhBanseok = resolveLocalScenicListSpotById('local-scenic:donghae-bijing:무릉반석');
const dhMangsang = resolveLocalScenicListSpotById(
  'local-scenic:donghae-bijing:동해망상해수욕장',
);
assert.ok(dhYongchu?.imageUrl?.includes('kzKl'), '동해 용추폭포 시 공식 사진');
assert.ok(dhYongchu?.overview?.includes('무릉계곡'), '동해 용추폭포 무릉계곡 명승');
assert.ok(dhYongchu?.overview?.includes('문경 용추계곡'), '동해 용추폭포≠문경 용추 구분');
assert.ok(dhBanseok?.imageUrl?.includes('NxfT'), '동해 무릉반석 시 공식 사진');
assert.ok(dhBanseok?.overview?.includes('무릉선원'), '동해 무릉반석 석각');
assert.ok(dhBanseok?.overview?.includes('용추폭포'), '동해 무릉반석≠용추폭포 구분');
assert.notEqual(dhYongchu?.imageUrl, dhBanseok?.imageUrl, '용추폭포·무릉반석 썸네일 다름');
assert.ok(dhMangsang?.imageUrl?.includes('U7Rc'), '동해 망상해변 시 공식 사진');
assert.ok(dhMangsang?.overview?.includes('동해대로 6270-10'), '동해 망상 주소');
assert.ok(dhMangsang?.overview?.includes('어달해변'), '동해 망상≠어달 구분');
assert.notEqual(dhMangsang?.imageUrl, dhYongchu?.imageUrl, '망상·용추 썸네일 다름');

const tourSameValley = new Map([
  ['125673', 'https://example.invalid/mureung-valley.jpg'],
]);
assert.ok(
  resolveLocalScenicRowFirstImage(dhYongchu, tourSameValley)?.includes('kzKl'),
  '명승 리스트 용추 Tour 125673보다 오버레이 우선',
);
assert.ok(
  resolveLocalScenicRowFirstImage(dhBanseok, tourSameValley)?.includes('NxfT'),
  '명승 리스트 무릉반석 Tour 125673보다 오버레이 우선',
);
assert.notEqual(
  resolveLocalScenicRowFirstImage(dhYongchu, tourSameValley),
  resolveLocalScenicRowFirstImage(dhBanseok, tourSameValley),
  'Tour 같은 contentId여도 용추·반석 썸네일 다름',
);
assert.ok(
  lookupLocalScenicMemberOverlayForSpot({
    id: 'donghae-mangsang-beach',
    hubId: 'donghae',
    name: '동해 망상해수욕장',
    attractionName: '동해 망상해수욕장',
    localScenicListId: 'donghae-bijing',
  })?.imageUrl?.includes('U7Rc'),
  'GATEO 망상 행도 팔경 오버레이',
);
assert.ok(
  resolveLocalScenicRowFirstImage(
    {
      id: 'donghae-mangsang-beach',
      hubId: 'donghae',
      name: '동해 망상해수욕장',
      contentId: '125713',
      localScenicListId: 'donghae-bijing',
    },
    new Map([['125713', 'https://example.invalid/mangsang-letters.jpg']]),
  )?.includes('U7Rc'),
  '명승 리스트 망상 Tour firstimage보다 오버레이 우선',
);

const donghaeWithThumbs = donghaeNine.filter((s) => s.imageUrl);
assert.ok(
  donghaeWithThumbs.length >= 8,
  '동해비경 썸네일 8명 이상(만경대는 Tour 런타임)',
);
assert.equal(
  new Set(donghaeWithThumbs.map((s) => s.imageUrl)).size,
  donghaeWithThumbs.length,
  '동해비경 있는 썸네일은 서로 다름',
);

const dhMangsangSearch = resolveSearchScenicMedia({
  hubId: 'donghae',
  name: '동해 망상해수욕장',
});
assert.ok(
  dhMangsangSearch.imageUrl?.includes('U7Rc'),
  '탐색 드롭다운 동해 망상해수욕장 썸네일',
);
assert.ok(
  resolveSearchScenicMedia({
    hubId: 'donghae',
    name: '동해 망상해수욕장',
    imageUrl: 'https://example.invalid/mangsang-letters.jpg',
  }).imageUrl?.includes('U7Rc'),
  '탐색 검색 망상 Tour 기존 썸네일보다 오버레이 우선',
);
assert.ok(
  lookupLocalScenicPhotoByContentId('125713')?.imageUrl?.includes('U7Rc'),
  '동해 검색 Tour 행 망상해수욕장 썸네일',
);
assert.ok(
  lookupLocalScenicPhotoByContentId('125708')?.imageUrl?.includes('ZL0E'),
  '동해 명승 검색 Tour 행 어달해변 썸네일',
);
assert.notEqual(
  lookupLocalScenicPhotoByContentId('125713')?.imageUrl,
  lookupLocalScenicPhotoByContentId('125708')?.imageUrl,
  '망상·어달 Tour 썸네일 다름',
);

const yeonggwangMerged = mergeLocalScenicMembersIntoScenicSpots([], 'yeonggwang');
const yeonggwangNine = yeonggwangMerged.filter(
  (s) => s.localScenicListId === 'yeonggwang-gugyeong',
);
assert.equal(yeonggwangNine.length, 9, '영광9경 9명');
assert.equal(yeonggwangNine[0]?.groupTitle, '영광 구경');
const yeonggwangDeficitNames = ['황금산', '왕글공원', '백학촌'];
const yeonggwangDeficit = yeonggwangNine.filter((s) =>
  yeonggwangDeficitNames.includes(s.attractionName),
);
assert.equal(yeonggwangDeficit.length, 3, '영광9경 결손 3명');
assert.ok(
  yeonggwangDeficit.every((s) => s.overview && s.imageUrl),
  '영광 결손 3명 overlay 사진·개요',
);
assert.ok(
  yeonggwangDeficit.every((s) => !s.contentId),
  '영광 결손 JSON contentId 없음 유지',
);
assert.equal(
  new Set(yeonggwangDeficit.map((s) => s.imageUrl)).size,
  3,
  '영광 결손 3명 썸네일 서로 다름',
);

const ygHwang = resolveLocalScenicListSpotById('local-scenic:yeonggwang-gugyeong:황금산');
assert.ok(ygHwang?.overview?.includes('백수해안도로'), '영광 황금산 overlay 백수해안도로');
assert.ok(ygHwang?.overview?.includes('해안로 957'), '영광 황금산 주소');
assert.ok(ygHwang?.overview?.includes('서산'), '영광 황금산≠서산 황금산 구분');
assert.ok(ygHwang?.overview?.includes('한빛원전'), '영광 황금산≠한빛원전 구분');
assert.ok(ygHwang?.imageUrl?.includes('1672400'), '영광 황금산 백수해안도로 공식 사진');

const ygWang = resolveLocalScenicListSpotById('local-scenic:yeonggwang-gugyeong:왕글공원');
assert.ok(ygWang?.overview?.includes('숲쟁이'), '영광 왕글공원 overlay 숲쟁이');
assert.ok(ygWang?.overview?.includes('명승'), '영광 왕글공원 명승');
assert.ok(ygWang?.overview?.includes('백제문화로'), '영광 왕글공원 주소');
assert.ok(ygWang?.overview?.includes('법성포'), '영광 왕글공원≠법성포 포구 구분');
assert.ok(ygWang?.imageUrl?.includes('3057538'), '영광 왕글공원 숲쟁이 공식 사진');

const ygHak = resolveLocalScenicListSpotById('local-scenic:yeonggwang-gugyeong:백학촌');
assert.ok(ygHak?.overview?.includes('백학리'), '영광 백학촌 overlay 백학리');
assert.ok(ygHak?.overview?.includes('물무산'), '영광 백학촌 물무산');
assert.ok(ygHak?.overview?.includes('연천'), '영광 백학촌≠연천 백학 구분');
assert.ok(ygHak?.imageUrl?.includes('2676388'), '영광 백학촌 물무산 황톳길 공식 사진');
assert.notEqual(ygHwang?.imageUrl, ygWang?.imageUrl, '황금산·왕글공원 썸네일 다름');
assert.notEqual(ygHwang?.imageUrl, ygHak?.imageUrl, '황금산·백학촌 썸네일 다름');
assert.notEqual(ygWang?.imageUrl, ygHak?.imageUrl, '왕글공원·백학촌 썸네일 다름');

const yeonggwangGlobe = filterScenicSpotsByQuery(listKoreaScenicSpots(), '영광', {
  injectLocalScenic: true,
});
const yeonggwangGlobeNine = yeonggwangGlobe.filter(
  (s) => s.localScenicListId === 'yeonggwang-gugyeong',
);
assert.equal(yeonggwangGlobeNine.length, 9, '영광 검색 영광9경 9행');
assert.ok(
  yeonggwangGlobeNine.every((s) => s.groupTitle === '영광 구경'),
  '영광 검색 팔경 groupTitle 영광 구경',
);
assert.ok(
  yeonggwangGlobe.find((s) => s.attractionName === '황금산')?.imageUrl?.includes('1672400'),
  '영광 검색 팔경 황금산 썸네일',
);
assert.ok(
  yeonggwangGlobe.find((s) => s.attractionName === '왕글공원')?.overview?.includes('숲쟁이'),
  '영광 검색 팔경 왕글공원 개요',
);
assert.ok(
  yeonggwangGlobe.find((s) => s.attractionName === '백학촌')?.overview?.includes('물무산'),
  '영광 검색 팔경 백학촌 개요',
);
assert.ok(
  lookupLocalScenicPhotoByContentId('126248')?.imageUrl?.includes('2831192'),
  '영광 검색 Tour 행 불갑산도립공원 detailImage 썸네일',
);
assert.ok(
  lookupLocalScenicPhotoByContentId('126248')?.galleryUrls?.some((u) =>
    String(u).includes('2996250'),
  ),
  '불갑산도립공원 갤러리에 축제 연등 사진',
);
assert.ok(
  !lookupLocalScenicPhotoByContentId('126248')?.imageUrl?.includes('3379065'),
  '불갑산도립공원 썸네일은 불갑사 GATEO 사진이 아님',
);

const goheungMerged = mergeLocalScenicMembersIntoScenicSpots([], 'goheung');
const goheungTen = goheungMerged.filter((s) => s.localScenicListId === 'goheung-other');
assert.equal(goheungTen.length, 10, '고흥10경 10명');
assert.equal(goheungTen[0]?.groupTitle, '고흥 10경');
const goheungDeficitNames = ['쑥섬', '금산 해안경관', '고흥만 수변노을공원'];
const goheungDeficit = goheungTen.filter((s) =>
  goheungDeficitNames.includes(s.attractionName),
);
assert.equal(goheungDeficit.length, 3, '고흥10경 결손 3명');
assert.ok(
  goheungDeficit.every((s) => s.overview && s.imageUrl),
  '고흥 결손 3명 overlay 사진·개요',
);
assert.ok(
  goheungDeficit.every((s) => !s.contentId),
  '고흥 결손 JSON contentId 없음 유지',
);
assert.equal(
  new Set(goheungDeficit.map((s) => s.imageUrl)).size,
  3,
  '고흥 결손 3명 썸네일 서로 다름',
);

const ghSsuk = resolveLocalScenicListSpotById('local-scenic:goheung-other:쑥섬');
assert.ok(ghSsuk?.overview?.includes('애도'), '고흥 쑥섬 overlay 애도');
assert.ok(ghSsuk?.overview?.includes('나로도항길 120-7'), '고흥 쑥섬 주소');
assert.ok(ghSsuk?.overview?.includes('소록도'), '고흥 쑥섬≠소록도 구분');
assert.ok(ghSsuk?.overview?.includes('나로우주센터'), '고흥 쑥섬≠나로우주센터 구분');
assert.ok(ghSsuk?.imageUrl?.includes('3502479'), '고흥 쑥섬 한국관광공사 수국정원 사진');

const ghGeum = resolveLocalScenicListSpotById('local-scenic:goheung-other:금산해안경관');
assert.ok(ghGeum?.overview?.includes('거금도'), '고흥 금산 해안경관 overlay 거금도');
assert.ok(ghGeum?.overview?.includes('거금일주로 1234'), '고흥 금산 해안경관 주소');
assert.ok(ghGeum?.overview?.includes('충남 금산'), '고흥 금산≠충남 금산군 구분');
assert.ok(ghGeum?.overview?.includes('남해 금산'), '고흥 금산≠남해 금산 보리암 구분');
assert.ok(ghGeum?.imageUrl?.includes('1155388928'), '고흥 금산 해안경관 소원동산 공식 사진');

const ghSunset = resolveLocalScenicListSpotById(
  'local-scenic:goheung-other:고흥만수변노을공원',
);
assert.ok(ghSunset?.overview?.includes('도덕면'), '고흥만 수변노을공원 overlay 도덕면');
assert.ok(ghSunset?.overview?.includes('고흥만로 1132-14'), '고흥만 수변노을공원 주소');
assert.ok(ghSunset?.overview?.includes('남열'), '고흥만 수변노을공원≠남열 해돋이 구분');
assert.ok(ghSunset?.overview?.includes('백수해안도로'), '고흥만 수변노을공원≠영광 백수 구분');
assert.ok(ghSunset?.imageUrl?.includes('1602298624'), '고흥만 수변노을공원 노을 공식 사진');
assert.notEqual(ghSsuk?.imageUrl, ghGeum?.imageUrl, '쑥섬·금산 해안경관 썸네일 다름');
assert.notEqual(ghSsuk?.imageUrl, ghSunset?.imageUrl, '쑥섬·수변노을공원 썸네일 다름');
assert.notEqual(ghGeum?.imageUrl, ghSunset?.imageUrl, '금산 해안경관·수변노을공원 썸네일 다름');

const goheungGlobe = filterScenicSpotsByQuery(listKoreaScenicSpots(), '고흥', {
  injectLocalScenic: true,
});
const goheungGlobeTen = goheungGlobe.filter((s) => s.localScenicListId === 'goheung-other');
assert.equal(goheungGlobeTen.length, 10, '고흥 검색 고흥10경 10행');
assert.ok(
  goheungGlobeTen.every((s) => s.groupTitle === '고흥 10경'),
  '고흥 검색 팔경 groupTitle 고흥 10경',
);
assert.ok(
  goheungGlobe.find((s) => s.attractionName === '쑥섬')?.imageUrl?.includes('3502479'),
  '고흥 검색 팔경 쑥섬 썸네일',
);
assert.ok(
  goheungGlobe.find((s) => s.attractionName === '금산 해안경관')?.overview?.includes('거금도'),
  '고흥 검색 팔경 금산 해안경관 개요',
);
assert.ok(
  goheungGlobe
    .find((s) => s.attractionName === '고흥만 수변노을공원')
    ?.overview?.includes('도덕면'),
  '고흥 검색 팔경 고흥만 수변노을공원 개요',
);

const ghForest = resolveLocalScenicListSpotById(
  'local-scenic:goheung-other:팔영산자연휴양림',
);
assert.ok(ghForest?.overview?.includes('팔영로 1347-418'), '고흥 팔영산 휴양림 주소');
assert.ok(ghForest?.overview?.includes('능가사'), '고흥 팔영산 휴양림≠능가사 구분');
assert.ok(ghForest?.overview?.includes('편백치유의 숲'), '고흥 팔영산 휴양림≠편백치유숲 구분');
assert.ok(ghForest?.overview?.includes('영남용바위'), '고흥 팔영산 휴양림≠영남용바위 구분');
assert.ok(ghForest?.imageUrl?.includes('2380877'), '고흥 팔영산 휴양림 산림문화휴양관 사진');
assert.equal(ghForest?.contentId, '125426', '고흥 팔영산 휴양림 JSON contentId 유지');
assert.ok(
  lookupLocalScenicPhotoByContentId('125426')?.imageUrl?.includes('2380877'),
  '고흥 검색 Tour 행 팔영산자연휴양림 썸네일',
);
assert.ok(
  lookupLocalScenicPhotoByContentId('2782706')?.imageUrl?.includes('2788863'),
  '고흥 검색 Tour 행 영남용바위 썸네일',
);
assert.ok(
  lookupLocalScenicPhotoByContentId('2782706')?.galleryUrls?.some((u) =>
    String(u).includes('2788862'),
  ),
  '영남용바위 갤러리에 용두암 안내판 사진',
);
assert.notEqual(
  lookupLocalScenicPhotoByContentId('125426')?.imageUrl,
  lookupLocalScenicPhotoByContentId('2782706')?.imageUrl,
  '팔영산 휴양림·영남용바위 썸네일 다름',
);
assert.notEqual(ghForest?.imageUrl, ghSsuk?.imageUrl, '팔영산 휴양림·쑥섬 썸네일 다름');
assert.ok(
  goheungTen.every((s) => s.attractionName !== '영남용바위'),
  '영남용바위는 고흥10경 멤버 아님',
);
assert.ok(
  goheungGlobe.find((s) => s.attractionName === '팔영산 자연휴양림')?.imageUrl?.includes(
    '2380877',
  ),
  '고흥 검색 팔경 팔영산 자연휴양림 썸네일',
);

const gimhaeMerged = mergeLocalScenicMembersIntoScenicSpots([], 'gimhae');
const gimhaeNine = gimhaeMerged.filter((s) => s.localScenicListId === 'gimhae-gugyeong');
assert.equal(gimhaeNine.length, 9, '김해9경 9명');
assert.equal(gimhaeNine[0]?.groupTitle, '김해 구경');
const gimhaeDeficitNames = [
  '화포천습지 생태공원',
  '경전철에서 바라본 가야유적',
  '분산(천문대)전경 및 운무',
];
const gimhaeDeficit = gimhaeNine.filter((s) =>
  gimhaeDeficitNames.includes(s.attractionName),
);
assert.equal(gimhaeDeficit.length, 3, '김해9경 결손 3명');
assert.ok(
  gimhaeDeficit.every((s) => s.overview && s.imageUrl),
  '김해 결손 3명 overlay 사진·개요',
);
assert.ok(
  gimhaeDeficit.every((s) => !s.contentId),
  '김해 결손 JSON contentId 없음 유지',
);
assert.equal(
  new Set(gimhaeDeficit.map((s) => s.imageUrl)).size,
  3,
  '김해 결손 3명 썸네일 서로 다름',
);

const gimHwapo = resolveLocalScenicListSpotById(
  'local-scenic:gimhae-gugyeong:화포천습지생태공원',
);
assert.ok(gimHwapo?.overview?.includes('한림로 183-300'), '김해 화포천습지 주소');
assert.ok(gimHwapo?.overview?.includes('하천형 배후습지'), '김해 화포천습지 overlay 배후습지');
assert.ok(gimHwapo?.overview?.includes('우포늪'), '김해 화포천습지≠창녕 우포늪 구분');
assert.ok(gimHwapo?.overview?.includes('주남저수지'), '김해 화포천습지≠창원 주남 구분');
assert.ok(gimHwapo?.overview?.includes('봉하마을'), '김해 화포천습지≠봉하마을 구분');
assert.ok(gimHwapo?.imageUrl?.includes('2563907'), '김해 화포천습지 한국관광공사 아침 사진');

const gimGaya = resolveLocalScenicListSpotById(
  'local-scenic:gimhae-gugyeong:경전철에서바라본가야유적',
);
assert.ok(gimGaya?.overview?.includes('박물관역'), '김해 경전철 가야유적 overlay 박물관역');
assert.ok(gimGaya?.overview?.includes('수로왕릉역'), '김해 경전철 가야유적 수로왕릉역');
assert.ok(gimGaya?.overview?.includes('대성동고분군'), '김해 경전철 가야유적 대성동고분군');
assert.ok(gimGaya?.overview?.includes('왕릉로 26'), '김해 경전철 가야유적≠3경 수로왕릉 구분');
assert.ok(gimGaya?.overview?.includes('가야테마파크'), '김해 경전철 가야유적≠가야테마파크 구분');
assert.ok(gimGaya?.imageUrl?.includes('3392365'), '김해 경전철 가야유적 대성동고분군 사진');
assert.ok(!gimGaya?.imageUrl?.includes('3510645'), '김해 경전철 가야유적≠수로왕릉 GATEO 사진');

const gimAstro = resolveLocalScenicListSpotById(
  'local-scenic:gimhae-gugyeong:분산(천문대)전경및운무',
);
assert.ok(gimAstro?.overview?.includes('가야테마길 254'), '김해 분산 천문대 주소');
assert.ok(gimAstro?.overview?.includes('어방동'), '김해 분산 천문대 overlay 어방동');
assert.ok(gimAstro?.overview?.includes('좌구산'), '김해 분산 천문대≠증평 좌구산 구분');
assert.ok(gimAstro?.overview?.includes('가야테마파크'), '김해 분산 천문대≠가야테마파크 구분');
assert.ok(gimAstro?.imageUrl?.includes('3362120'), '김해 분산 천문대 한국관광공사 사진');
assert.notEqual(gimHwapo?.imageUrl, gimGaya?.imageUrl, '화포천·경전철 가야유적 썸네일 다름');
assert.notEqual(gimHwapo?.imageUrl, gimAstro?.imageUrl, '화포천·분산 천문대 썸네일 다름');
assert.notEqual(gimGaya?.imageUrl, gimAstro?.imageUrl, '경전철 가야유적·분산 천문대 썸네일 다름');

const gimhaeGlobe = filterScenicSpotsByQuery(listKoreaScenicSpots(), '김해', {
  injectLocalScenic: true,
});
const gimhaeGlobeNine = gimhaeGlobe.filter((s) => s.localScenicListId === 'gimhae-gugyeong');
assert.equal(gimhaeGlobeNine.length, 9, '김해 검색 김해9경 9행');
assert.ok(
  gimhaeGlobeNine.every((s) => s.groupTitle === '김해 구경'),
  '김해 검색 팔경 groupTitle 김해 구경',
);
assert.ok(
  gimhaeGlobe.find((s) => s.attractionName === '화포천습지 생태공원')?.imageUrl?.includes(
    '2563907',
  ),
  '김해 검색 팔경 화포천습지 썸네일',
);
assert.ok(
  gimhaeGlobe
    .find((s) => s.attractionName === '경전철에서 바라본 가야유적')
    ?.overview?.includes('박물관역'),
  '김해 검색 팔경 경전철 가야유적 개요',
);
assert.ok(
  gimhaeGlobe
    .find((s) => s.attractionName === '분산(천문대)전경 및 운무')
    ?.overview?.includes('어방동'),
  '김해 검색 팔경 분산 천문대 개요',
);

const daeguMerged = mergeLocalScenicMembersIntoScenicSpots([], 'daegu');
const daeguTwelve = daeguMerged.filter((s) => s.localScenicListId === 'daegu-sipgyeong');
assert.equal(daeguTwelve.length, 12, '대구12경 12명');
assert.equal(daeguTwelve[0]?.groupTitle, '대구 12경');
const daeguDeficitNames = [
  '대구 국채보상운동 기념공원',
  '대구 달성토성',
  '대구 경상감영과 옛골목',
];
const daeguDeficit = daeguTwelve.filter((s) => daeguDeficitNames.includes(s.attractionName));
assert.equal(daeguDeficit.length, 3, '대구12경 결손 3명');
assert.ok(
  daeguDeficit.every((s) => s.overview && s.imageUrl),
  '대구 결손 3명 overlay 사진·개요',
);
assert.ok(
  daeguDeficit.every((s) => !s.contentId),
  '대구 결손 JSON contentId 없음 유지',
);
assert.equal(
  new Set(daeguDeficit.map((s) => s.imageUrl)).size,
  3,
  '대구 결손 3명 썸네일 서로 다름',
);

const dgGukchae = resolveLocalScenicListSpotById(
  'local-scenic:daegu-sipgyeong:대구국채보상운동기념공원',
);
assert.ok(dgGukchae?.overview?.includes('국채보상로 670'), '대구 국채보상공원 주소');
assert.ok(dgGukchae?.overview?.includes('달구벌'), '대구 국채보상공원 overlay 달구벌대종');
assert.ok(dgGukchae?.overview?.includes('동성로'), '대구 국채보상공원≠9경 동성로 구분');
assert.ok(dgGukchae?.overview?.includes('2·28'), '대구 국채보상공원≠2·28공원 구분');
assert.ok(dgGukchae?.imageUrl?.includes('3515186'), '대구 국채보상공원 달구벌대종 사진');

const dgDalseong = resolveLocalScenicListSpotById('local-scenic:daegu-sipgyeong:대구달성토성');
assert.ok(dgDalseong?.overview?.includes('달성공원로 35'), '대구 달성토성 주소');
assert.ok(dgDalseong?.overview?.includes('사적 제62호'), '대구 달성토성 overlay 사적 62호');
assert.ok(dgDalseong?.overview?.includes('관풍루'), '대구 달성토성 overlay 관풍루');
assert.ok(dgDalseong?.overview?.includes('달성습지'), '대구 달성토성≠달성군 습지 구분');
assert.ok(dgDalseong?.overview?.includes('유달산'), '대구 달성토성≠목포 유달산 달성공원 구분');
assert.ok(dgDalseong?.imageUrl?.includes('1018426'), '대구 달성토성 관풍루 사진');

const dgGamyeong = resolveLocalScenicListSpotById(
  'local-scenic:daegu-sipgyeong:대구경상감영과옛골목',
);
assert.ok(dgGamyeong?.overview?.includes('경상감영길 99'), '대구 경상감영 주소');
assert.ok(dgGamyeong?.overview?.includes('선화당'), '대구 경상감영 overlay 선화당');
assert.ok(dgGamyeong?.overview?.includes('사적 제538호'), '대구 경상감영 overlay 사적 538호');
assert.ok(dgGamyeong?.overview?.includes('상주'), '대구 경상감영≠상주 태평성대 구분');
assert.ok(dgGamyeong?.overview?.includes('충청감영'), '대구 경상감영≠공주 충청감영 구분');
assert.ok(dgGamyeong?.overview?.includes('계산예가'), '대구 경상감영≠계산예가 2코스 구분');
assert.ok(dgGamyeong?.imageUrl?.includes('3310544'), '대구 경상감영 선화당 항공 사진');
assert.notEqual(dgGukchae?.imageUrl, dgDalseong?.imageUrl, '국채보상·달성토성 썸네일 다름');
assert.notEqual(dgGukchae?.imageUrl, dgGamyeong?.imageUrl, '국채보상·경상감영 썸네일 다름');
assert.notEqual(dgDalseong?.imageUrl, dgGamyeong?.imageUrl, '달성토성·경상감영 썸네일 다름');

const daeguGlobe = filterScenicSpotsByQuery(listKoreaScenicSpots(), '대구', {
  injectLocalScenic: true,
});
const daeguGlobeTwelve = daeguGlobe.filter((s) => s.localScenicListId === 'daegu-sipgyeong');
assert.equal(daeguGlobeTwelve.length, 12, '대구 검색 대구12경 12행');
assert.ok(
  daeguGlobeTwelve.every((s) => s.groupTitle === '대구 12경'),
  '대구 검색 팔경 groupTitle 대구 12경',
);
assert.ok(
  daeguGlobe.find((s) => s.attractionName === '대구 국채보상운동 기념공원')?.imageUrl?.includes(
    '3515186',
  ),
  '대구 검색 팔경 국채보상공원 썸네일',
);
assert.ok(
  daeguGlobe.find((s) => s.attractionName === '대구 달성토성')?.overview?.includes('관풍루'),
  '대구 검색 팔경 달성토성 개요',
);
assert.ok(
  daeguGlobe
    .find((s) => s.attractionName === '대구 경상감영과 옛골목')
    ?.overview?.includes('선화당'),
  '대구 검색 팔경 경상감영 개요',
);

const yeosuMerged = mergeLocalScenicMembersIntoScenicSpots([], 'yeosu');
const yeosuTen = yeosuMerged.filter((s) => s.localScenicListId === 'yeosu-other');
assert.equal(yeosuTen.length, 10, '여수10경 10명');
assert.equal(yeosuTen[0]?.groupTitle, '여수 10경');
const yeosuDeficitNames = [
  '여수세계박람회장',
  '여수 밤바다와 산단 야경',
  '여수해상케이블카',
];
const yeosuDeficit = yeosuTen.filter((s) => yeosuDeficitNames.includes(s.attractionName));
assert.equal(yeosuDeficit.length, 3, '여수10경 결손 3명');
assert.ok(
  yeosuDeficit.every((s) => s.overview && s.imageUrl),
  '여수 결손 3명 overlay 사진·개요',
);
assert.ok(
  yeosuDeficit.every((s) => !s.contentId),
  '여수 결손 JSON contentId 없음 유지',
);
assert.equal(
  new Set(yeosuDeficit.map((s) => s.imageUrl)).size,
  3,
  '여수 결손 3명 썸네일 서로 다름',
);

const ysExpo = resolveLocalScenicListSpotById('local-scenic:yeosu-other:여수세계박람회장');
assert.ok(ysExpo?.overview?.includes('박람회길 1'), '여수 박람회장 주소');
assert.ok(ysExpo?.overview?.includes('빅오'), '여수 박람회장 overlay 빅오');
assert.ok(ysExpo?.overview?.includes('섬박람회'), '여수 박람회장≠2026 섬박람회 구분');
assert.ok(ysExpo?.overview?.includes('함평'), '여수 박람회장≠함평엑스포 구분');
assert.ok(ysExpo?.imageUrl?.includes('17439999170773_2'), '여수 박람회장 엑스포장 항공 사진');

const ysNight = resolveLocalScenicListSpotById('local-scenic:yeosu-other:여수밤바다와산단야경');
assert.ok(ysNight?.overview?.includes('종화동'), '여수 밤바다 주소 종화동');
assert.ok(ysNight?.overview?.includes('화치동'), '여수 산단 전망대 화치동');
assert.ok(ysNight?.overview?.includes('광양만'), '여수 밤바다≠광양만 야경 구분');
assert.ok(ysNight?.overview?.includes('이순신대교'), '여수 밤바다≠10경 이순신대교 구분');
assert.ok(ysNight?.imageUrl?.includes('17439998378816'), '여수 밤바다 남산공원 야경 사진');

const ysCable = resolveLocalScenicListSpotById('local-scenic:yeosu-other:여수해상케이블카');
assert.ok(ysCable?.overview?.includes('돌산로 3600-1'), '여수 케이블카 돌산 주소');
assert.ok(ysCable?.overview?.includes('오동도로 116'), '여수 케이블카 자산 주소');
assert.ok(ysCable?.overview?.includes('목포'), '여수 케이블카≠목포해상케이블카 구분');
assert.ok(ysCable?.overview?.includes('사천'), '여수 케이블카≠사천바다케이블카 구분');
assert.ok(ysCable?.imageUrl?.includes('1682640297'), '여수 케이블카 캐빈 사진');
assert.notEqual(ysExpo?.imageUrl, ysNight?.imageUrl, '박람회장·밤바다 썸네일 다름');
assert.notEqual(ysExpo?.imageUrl, ysCable?.imageUrl, '박람회장·케이블카 썸네일 다름');
assert.notEqual(ysNight?.imageUrl, ysCable?.imageUrl, '밤바다·케이블카 썸네일 다름');

const yeosuGlobe = filterScenicSpotsByQuery(listKoreaScenicSpots(), '여수', {
  injectLocalScenic: true,
});
const yeosuGlobeTen = yeosuGlobe.filter((s) => s.localScenicListId === 'yeosu-other');
assert.equal(yeosuGlobeTen.length, 10, '여수 검색 여수10경 10행');
assert.ok(
  yeosuGlobeTen.every((s) => s.groupTitle === '여수 10경'),
  '여수 검색 팔경 groupTitle 여수 10경',
);
assert.ok(
  yeosuGlobe.find((s) => s.attractionName === '여수세계박람회장')?.imageUrl?.includes(
    '17439999170773_2',
  ),
  '여수 검색 팔경 박람회장 썸네일',
);
assert.ok(
  yeosuGlobe.find((s) => s.attractionName === '여수 밤바다와 산단 야경')?.overview?.includes(
    '화치동',
  ),
  '여수 검색 팔경 밤바다 개요',
);
assert.ok(
  yeosuGlobe.find((s) => s.attractionName === '여수해상케이블카')?.overview?.includes('돌산공원'),
  '여수 검색 팔경 케이블카 개요',
);

const ysJinnam = resolveLocalScenicListSpotById('local-scenic:yeosu-other:진남관');
assert.equal(ysJinnam?.contentId, '126386', '여수 진남관 JSON contentId 유지');
assert.ok(ysJinnam?.overview?.includes('동문로 11'), '여수 진남관 주소 동문로');
assert.ok(ysJinnam?.overview?.includes('국보'), '여수 진남관 국보');
assert.ok(ysJinnam?.overview?.includes('이순신광장'), '여수 진남관≠이순신광장 구분');
assert.ok(ysJinnam?.imageUrl?.includes('jinnam_2'), '여수 진남관 10경 전경 사진');
assert.ok(
  lookupLocalScenicPhotoByContentId('126386')?.imageUrl?.includes('jinnam_2'),
  '여수 진남관 Tour 빈 썸네일 overlay 126386',
);
const ysJinnamSearch = resolveSearchScenicMedia({
  hubId: 'yeosu',
  name: '진남관',
  contentId: '126386',
});
assert.ok(ysJinnamSearch.imageUrl?.includes('jinnam_2'), '탐색홈 여수10경 진남관 썸네일');
assert.ok(
  resolveSearchScenicMedia({
    name: '여수 진남관',
    contentId: '126386',
  }).imageUrl?.includes('jinnam_2'),
  '탐색 검색 Tour 행 여수 진남관 썸네일',
);
const ysJinnamSuggest = localScenicMemberToSuggestion(
  lists.find((l) => l.listId === 'yeosu-other'),
  resolveCityAttractionHub('yeosu'),
  lists
    .find((l) => l.listId === 'yeosu-other')
    ?.members?.find((m) => m.attractionName === '진남관'),
);
assert.ok(ysJinnamSuggest?.imageUrl?.includes('jinnam_2'), '탐색 드롭다운 진남관 썸네일');

const ysBridge = resolveLocalScenicListSpotById('local-scenic:yeosu-other:여수이순신대교');
assert.equal(ysBridge?.contentId, '2778041', '여수 이순신대교 JSON contentId 유지');
assert.ok(ysBridge?.overview?.includes('묘도동'), '여수 이순신대교 주소 묘도동');
assert.ok(ysBridge?.overview?.includes('광양이순신대교'), '여수 이순신대교≠광양9경 구분');
assert.ok(ysBridge?.overview?.includes('홍보관'), '여수 이순신대교≠홍보관 구분');
assert.ok(ysBridge?.imageUrl?.includes('yisunsin2'), '여수 이순신대교 10경 항공 사진');
assert.ok(!ysBridge?.imageUrl?.includes('scenic04'), '여수 이순신대교 사진 ≠ 광양 scenic04');
const gyBridge = resolveLocalScenicListSpotById('local-scenic:gwangyang-gugyeong:광양이순신대교');
assert.notEqual(ysBridge?.imageUrl, gyBridge?.imageUrl, '여수·광양 이순신대교 썸네일 다름');
assert.ok(
  lookupLocalScenicPhotoByContentId('2778041')?.imageUrl?.includes('yisunsin2'),
  '여수 이순신대교 Tour 빈 썸네일 overlay 2778041',
);
assert.ok(
  resolveSearchScenicMedia({
    hubId: 'yeosu',
    name: '여수 이순신대교',
    contentId: '2778041',
  }).imageUrl?.includes('yisunsin2'),
  '탐색홈 여수10경 이순신대교 썸네일',
);
assert.ok(
  resolveSearchScenicMedia({
    name: '이순신대교홍보관',
    contentId: '2778041',
  }).imageUrl?.includes('yisunsin2'),
  '탐색 검색 Tour 행 이순신대교홍보관 썸네일',
);
const ysBridgeSuggest = localScenicMemberToSuggestion(
  lists.find((l) => l.listId === 'yeosu-other'),
  resolveCityAttractionHub('yeosu'),
  lists
    .find((l) => l.listId === 'yeosu-other')
    ?.members?.find((m) => m.attractionName === '여수 이순신대교'),
);
assert.ok(ysBridgeSuggest?.imageUrl?.includes('yisunsin2'), '탐색 드롭다운 여수 이순신대교 썸네일');
assert.ok(
  yeosuGlobe.find((s) => s.attractionName === '진남관')?.imageUrl?.includes('jinnam_2'),
  '여수 검색 팔경 진남관 썸네일',
);
assert.ok(
  yeosuGlobe.find((s) => s.attractionName === '여수 이순신대교')?.imageUrl?.includes('yisunsin2'),
  '여수 검색 팔경 이순신대교 썸네일',
);
assert.ok(
  yeosuTen
    .filter((s) => ['진남관', '여수 이순신대교'].includes(s.attractionName))
    .every((s) => s.imageUrl),
  '여수10경 리스트 진남관·이순신대교 썸네일',
);

const yecheonMerged = mergeLocalScenicMembersIntoScenicSpots([], 'yecheon');
const yecheonEight = yecheonMerged.filter((s) => s.localScenicListId === 'yecheon-palgyeong');
assert.equal(yecheonEight.length, 8, '예천8경 8명');
assert.equal(yecheonEight[0]?.groupTitle, '예천 팔경');
const yecheonDeficitNames = ['금당실 전통마을과 송림', '예천곤충생태원', '석송령'];
const yecheonDeficit = yecheonEight.filter((s) => yecheonDeficitNames.includes(s.attractionName));
assert.equal(yecheonDeficit.length, 3, '예천8경 결손 3명');
assert.ok(
  yecheonDeficit.every((s) => s.overview && s.imageUrl),
  '예천 결손 3명 overlay 사진·개요',
);
assert.ok(
  yecheonDeficit.every((s) => !s.contentId),
  '예천 결손 JSON contentId 없음 유지',
);
assert.equal(
  new Set(yecheonDeficit.map((s) => s.imageUrl)).size,
  3,
  '예천 결손 3명 썸네일 서로 다름',
);

const ycGeum = resolveLocalScenicListSpotById('local-scenic:yecheon-palgyeong:금당실전통마을과송림');
assert.ok(ycGeum?.overview?.includes('금당실길 52-4'), '예천 금당실 주소');
assert.ok(ycGeum?.overview?.includes('십승지'), '예천 금당실 overlay 십승지');
assert.ok(ycGeum?.overview?.includes('469'), '예천 금당실 송림 천연기념물 469');
assert.ok(ycGeum?.overview?.includes('초간정'), '예천 금당실≠초간정 구분');
assert.ok(ycGeum?.overview?.includes('하회'), '예천 금당실≠안동 하회 구분');
assert.ok(ycGeum?.imageUrl?.includes('geumdangsil'), '예천 금당실 8경 고택 사진');

const ycInsect = resolveLocalScenicListSpotById('local-scenic:yecheon-palgyeong:예천곤충생태원');
assert.ok(ycInsect?.overview?.includes('은풍로 1045'), '예천 곤충생태원 주소');
assert.ok(ycInsect?.overview?.includes('효자면'), '예천 곤충생태원 효자면');
assert.ok(ycInsect?.overview?.includes('바이오엑스포'), '예천 곤충생태원 overlay 엑스포');
assert.ok(ycInsect?.overview?.includes('함평'), '예천 곤충생태원≠함평엑스포 구분');
assert.ok(ycInsect?.overview?.includes('은풍면'), '예천 곤충생태원≠은풍면 구분');
assert.ok(ycInsect?.imageUrl?.includes('/insect/img.png'), '예천 곤충생태원 8경 항공 사진');

const ycSeok = resolveLocalScenicListSpotById('local-scenic:yecheon-palgyeong:석송령');
assert.ok(ycSeok?.overview?.includes('천향리'), '예천 석송령 주소 천향리');
assert.ok(ycSeok?.overview?.includes('294'), '예천 석송령 천연기념물 294');
assert.ok(ycSeok?.overview?.includes('이수목'), '예천 석송령 overlay 이수목');
assert.ok(ycSeok?.overview?.includes('정이품송'), '예천 석송령≠보은 정이품송 구분');
assert.ok(ycSeok?.overview?.includes('금당실 송림'), '예천 석송령≠금당실 송림 구분');
assert.ok(ycSeok?.imageUrl?.includes('seogsonglyeong'), '예천 석송령 8경 전경 사진');

assert.notEqual(ycGeum?.imageUrl, ycInsect?.imageUrl, '금당실·곤충생태원 썸네일 다름');
assert.notEqual(ycGeum?.imageUrl, ycSeok?.imageUrl, '금당실·석송령 썸네일 다름');
assert.notEqual(ycInsect?.imageUrl, ycSeok?.imageUrl, '곤충생태원·석송령 썸네일 다름');

const yecheonGlobe = filterScenicSpotsByQuery(listKoreaScenicSpots(), '예천', {
  injectLocalScenic: true,
});
const yecheonGlobeEight = yecheonGlobe.filter((s) => s.localScenicListId === 'yecheon-palgyeong');
assert.equal(yecheonGlobeEight.length, 8, '예천 검색 예천8경 8행');
assert.ok(
  yecheonGlobeEight.every((s) => s.groupTitle === '예천 팔경'),
  '예천 검색 팔경 groupTitle 예천 팔경',
);
assert.ok(
  yecheonGlobe.find((s) => s.attractionName === '금당실 전통마을과 송림')?.imageUrl?.includes(
    'geumdangsil',
  ),
  '예천 검색 팔경 금당실 썸네일',
);
assert.ok(
  yecheonGlobe.find((s) => s.attractionName === '예천곤충생태원')?.overview?.includes('무당벌레'),
  '예천 검색 팔경 곤충생태원 개요',
);
assert.ok(
  yecheonGlobe.find((s) => s.attractionName === '석송령')?.overview?.includes('석평마을'),
  '예천 검색 팔경 석송령 개요',
);

const ycSillaThumb = lookupLocalScenicPhotoByContentId('1910438');
assert.ok(
  ycSillaThumb?.imageUrl?.includes('main_scroll_img3.jpg'),
  '예천 신라식물원 Tour 빈 썸네일 overlay 1910438',
);
assert.ok(
  ycSillaThumb?.imageUrl?.includes('web.archive.org'),
  '예천 신라식물원 썸네일은 공식 홈페이지 전경 Wayback HTTPS',
);
assert.ok(
  !ycSillaThumb?.imageUrl?.includes('/insect/'),
  '예천 신라식물원 썸네일 ≠ 곤충생태원',
);
assert.notEqual(
  ycSillaThumb?.imageUrl,
  ycInsect?.imageUrl,
  '신라식물원 썸네일 ≠ 예천곤충생태원',
);
const ycSillaSearch = resolveSearchScenicMedia({
  name: '신라식물원',
  contentId: '1910438',
});
assert.ok(
  ycSillaSearch.imageUrl?.includes('main_scroll_img3.jpg'),
  '명승홈 검색 Tour 행 신라식물원 썸네일',
);
assert.equal(ycSillaSearch.contentId, '1910438', '명승홈 검색 신라식물원 contentId');
assert.ok(
  ycSillaThumb.galleryUrls?.some((u) => String(u).includes('main_scroll_img2.jpg')),
  '예천 신라식물원 갤러리 정원 전경',
);
assert.ok(
  ycSillaThumb.galleryUrls?.some((u) => String(u).includes('main_scroll_img1.jpg')),
  '예천 신라식물원 갤러리 입구 간판',
);

const ycMarket = listKoreaScenicSpots().find((s) => s.id === 'yonggung-market');
assert.ok(ycMarket, '예천 용궁시장 GATEO 선정');
assert.ok(
  ycMarket.imageUrl?.includes('tv.trip/1n2d.trip08.png'),
  '용궁시장 썸네일은 군 공식 시장 사진',
);
assert.ok(
  !ycMarket.imageUrl?.includes('3542707'),
  '용궁시장 썸네일 ≠ 회룡포 항공 3542707',
);
assert.ok(
  ycMarket.galleryUrls?.every((u) => !String(u).includes('3542707')),
  '용궁시장 갤러리 ≠ 회룡포',
);
const ycMarketOverlay = lookupLocalScenicMemberOverlayForSpot(ycMarket);
assert.ok(
  ycMarketOverlay?.imageUrl?.includes('1n2d.trip08.png'),
  '용궁시장 overlay 군 공식 시장',
);
assert.ok(ycMarketOverlay?.overview?.includes('오일장'), '용궁시장 overlay 오일장');
assert.ok(
  ycMarketOverlay?.overview?.includes('읍부리 장터'),
  '용궁시장 overlay는 회룡포가 아니라 읍부리 장터',
);
const ycMarketSearch = resolveSearchScenicMedia({
  id: 'yonggung-market',
  hubId: 'yecheon',
  name: '용궁시장',
  imageUrl: 'https://tong.visitkorea.or.kr/cms/resource/07/3542707_image2_1.jpg',
});
assert.ok(
  ycMarketSearch.imageUrl?.includes('1n2d.trip08.png'),
  '명승홈 검색 용궁시장이 회룡포 사진을 덮음',
);

const incheonMerged = mergeLocalScenicMembersIntoScenicSpots([], 'incheon');
const incheonNine = incheonMerged.filter((s) => s.localScenicListId === 'incheon-gugyeong');
assert.equal(incheonNine.length, 9, '인천9경 9명');
assert.equal(incheonNine[0]?.groupTitle, '인천 구경');
const incheonDeficitNames = [
  '인천 계양 아라온',
  '인천 영종 씨사이드파크',
  '인천 강화읍 원도심',
];
const incheonDeficit = incheonNine.filter((s) => incheonDeficitNames.includes(s.attractionName));
assert.equal(incheonDeficit.length, 3, '인천9경 결손 3명');
assert.ok(
  incheonDeficit.every((s) => s.overview && s.imageUrl),
  '인천 결손 3명 overlay 사진·개요',
);
assert.ok(
  incheonDeficit.every((s) => !s.contentId),
  '인천 결손 JSON contentId 없음 유지',
);
assert.equal(
  new Set(incheonDeficit.map((s) => s.imageUrl)).size,
  3,
  '인천 결손 3명 썸네일 서로 다름',
);

const icAraon = resolveLocalScenicListSpotById('local-scenic:incheon-gugyeong:인천계양아라온');
assert.ok(icAraon?.overview?.includes('장기동 109-1'), '인천 아라온 주소');
assert.ok(icAraon?.overview?.includes('황어광장'), '인천 아라온 overlay 황어광장');
assert.ok(icAraon?.overview?.includes('수향원'), '인천 아라온 overlay 수향원');
assert.ok(icAraon?.overview?.includes('아라폭포'), '인천 아라온≠아라폭포 구분');
assert.ok(icAraon?.imageUrl?.includes('giwaterway'), '인천 아라온 경인아라뱃길 사진');

const icSeaside = resolveLocalScenicListSpotById('local-scenic:incheon-gugyeong:인천영종씨사이드파크');
assert.ok(icSeaside?.overview?.includes('구읍로 75'), '인천 씨사이드파크 주소');
assert.ok(icSeaside?.overview?.includes('5.6km'), '인천 씨사이드파크 overlay 5.6km');
assert.ok(icSeaside?.overview?.includes('을왕리'), '인천 씨사이드파크≠을왕리 구분');
assert.ok(icSeaside?.imageUrl?.includes('2609702'), '인천 씨사이드파크 Tour 사진');

const icGanghwa = resolveLocalScenicListSpotById('local-scenic:incheon-gugyeong:인천강화읍원도심');
assert.ok(icGanghwa?.overview?.includes('용흥궁'), '인천 강화읍 원도심 overlay 용흥궁');
assert.ok(icGanghwa?.overview?.includes('고려궁지'), '인천 강화읍 원도심 overlay 고려궁지');
assert.ok(icGanghwa?.overview?.includes('전등사'), '인천 강화읍 원도심≠전등사 구분');
assert.ok(icGanghwa?.imageUrl?.includes('storywalk1'), '인천 강화읍 원도심 스토리워크 사진');

assert.notEqual(icAraon?.imageUrl, icSeaside?.imageUrl, '아라온·씨사이드파크 썸네일 다름');
assert.notEqual(icAraon?.imageUrl, icGanghwa?.imageUrl, '아라온·강화읍 원도심 썸네일 다름');
assert.notEqual(icSeaside?.imageUrl, icGanghwa?.imageUrl, '씨사이드파크·강화읍 원도심 썸네일 다름');

const incheonGlobe = filterScenicSpotsByQuery(listKoreaScenicSpots(), '인천9경', {
  injectLocalScenic: true,
});
const incheonGlobeNine = incheonGlobe.filter((s) => s.localScenicListId === 'incheon-gugyeong');
assert.equal(incheonGlobeNine.length, 9, '인천 검색 인천9경 9행');
assert.ok(
  incheonGlobe.find((s) => s.attractionName === '인천 계양 아라온')?.overview?.includes('빛의 거리'),
  '인천 검색 9경 아라온 개요',
);
assert.ok(
  incheonGlobe.find((s) => s.attractionName === '인천 영종 씨사이드파크')?.imageUrl?.includes('2609702'),
  '인천 검색 9경 씨사이드파크 썸네일',
);
assert.ok(
  incheonGlobe.find((s) => s.attractionName === '인천 강화읍 원도심')?.overview?.includes('도보해설'),
  '인천 검색 9경 강화읍 원도심 개요',
);

const yangguMerged = mergeLocalScenicMembersIntoScenicSpots([], 'yanggu');
const yangguNine = yangguMerged.filter((s) => s.localScenicListId === 'yanggu-gugyeong');
assert.equal(yangguNine.length, 9, '양구9경 9명');
assert.equal(yangguNine[0]?.groupTitle, '양구 구경');
const yangguDeficitNames = ['양구 수목원', '양구 봉화산', '양구 상무룡 출렁다리'];
const yangguDeficit = yangguNine.filter((s) => yangguDeficitNames.includes(s.attractionName));
assert.equal(yangguDeficit.length, 3, '양구9경 결손 3명');
assert.ok(
  yangguDeficit.every((s) => s.overview && s.imageUrl),
  '양구 결손 3명 overlay 사진·개요',
);
assert.ok(
  yangguDeficit.every((s) => !s.contentId),
  '양구 결손 JSON contentId 없음 유지',
);
assert.equal(
  new Set(yangguDeficit.map((s) => s.imageUrl)).size,
  3,
  '양구 결손 3명 썸네일 서로 다름',
);

const ygArb = resolveLocalScenicListSpotById('local-scenic:yanggu-gugyeong:양구수목원');
assert.ok(ygArb?.overview?.includes('숨골로310번길 132'), '양구 수목원 주소');
assert.ok(ygArb?.overview?.includes('도내 6번째 공립 수목원'), '양구 수목원 overlay 공립 수목원');
assert.ok(ygArb?.overview?.includes('구례 수목원'), '양구 수목원≠구례 수목원 구분');
assert.ok(ygArb?.imageUrl?.includes('img_introduce_01'), '양구 수목원 공식 홈 사진');

const ygBong = resolveLocalScenicListSpotById('local-scenic:yanggu-gugyeong:양구봉화산');
assert.ok(ygBong?.overview?.includes('국토정중앙면 죽리'), '양구 봉화산 주소');
assert.ok(ygBong?.overview?.includes('875m'), '양구 봉화산 overlay 875m');
assert.ok(ygBong?.overview?.includes('중랑 봉화산'), '양구 봉화산≠서울 중랑 봉화산 구분');
assert.ok(ygBong?.imageUrl?.includes('7-2.jpg'), '양구 봉화산 협회 7경 사진');

const ygBridge = resolveLocalScenicListSpotById('local-scenic:yanggu-gugyeong:양구상무룡출렁다리');
assert.ok(ygBridge?.overview?.includes('간척월명로 1719-21'), '양구 상무룡 출렁다리 주소');
assert.ok(ygBridge?.overview?.includes('335m'), '양구 상무룡 출렁다리 overlay 335m');
assert.ok(ygBridge?.overview?.includes('백아산 하늘다리'), '양구 상무룡≠화순 하늘다리 구분');
assert.ok(ygBridge?.imageUrl?.includes('8-4.png'), '양구 상무룡 출렁다리 협회 8경 사진');

assert.notEqual(ygArb?.imageUrl, ygBong?.imageUrl, '수목원·봉화산 썸네일 다름');
assert.notEqual(ygArb?.imageUrl, ygBridge?.imageUrl, '수목원·상무룡 썸네일 다름');
assert.notEqual(ygBong?.imageUrl, ygBridge?.imageUrl, '봉화산·상무룡 썸네일 다름');

const yangguGlobe = filterScenicSpotsByQuery(listKoreaScenicSpots(), '양구9경', {
  injectLocalScenic: true,
});
const yangguGlobeNine = yangguGlobe.filter((s) => s.localScenicListId === 'yanggu-gugyeong');
assert.equal(yangguGlobeNine.length, 9, '양구 검색 양구9경 9행');
assert.ok(
  yangguGlobe.find((s) => s.attractionName === '양구 수목원')?.overview?.includes('공립 수목원'),
  '양구 검색 9경 수목원 개요',
);
assert.ok(
  yangguGlobe.find((s) => s.attractionName === '양구 봉화산')?.imageUrl?.includes('7-2.jpg'),
  '양구 검색 9경 봉화산 썸네일',
);
assert.ok(
  yangguGlobe.find((s) => s.attractionName === '양구 상무룡 출렁다리')?.overview?.includes('파로호'),
  '양구 검색 9경 상무룡 출렁다리 개요',
);

const jeongeupMerged = mergeLocalScenicMembersIntoScenicSpots([], 'jeongeup');
const jeongeupNine = jeongeupMerged.filter((s) => s.localScenicListId === 'jeongeup-gugyeong');
assert.equal(jeongeupNine.length, 9, '정읍9경 9명');
assert.equal(jeongeupNine[0]?.groupTitle, '정읍 구경');
const jeongeupDeficitNames = ['동학농민혁명기념공원', '용산호', '월영습지와 솔티숲'];
const jeongeupDeficit = jeongeupNine.filter((s) => jeongeupDeficitNames.includes(s.attractionName));
assert.equal(jeongeupDeficit.length, 3, '정읍9경 결손 3명');
assert.ok(
  jeongeupDeficit.every((s) => s.overview && s.imageUrl),
  '정읍 결손 3명 overlay 사진·개요',
);
assert.ok(
  jeongeupDeficit.every((s) => !s.contentId),
  '정읍 결손 JSON contentId 없음 유지',
);
assert.equal(
  new Set(jeongeupDeficit.map((s) => s.imageUrl)).size,
  3,
  '정읍 결손 3명 썸네일 서로 다름',
);

const jeDh = resolveLocalScenicListSpotById('local-scenic:jeongeup-gugyeong:동학농민혁명기념공원');
assert.ok(jeDh?.overview?.includes('동학로 742'), '정읍 동학농민혁명기념공원 주소');
assert.ok(jeDh?.overview?.includes('황토현'), '정읍 동학 overlay 황토현');
assert.ok(jeDh?.overview?.includes('전주 동학농민혁명기념관'), '정읍 동학≠전주 기념관 구분');
assert.ok(jeDh?.imageUrl?.includes('175305752440905'), '정읍 동학 4경 공식 사진');

const jeYs = resolveLocalScenicListSpotById('local-scenic:jeongeup-gugyeong:용산호');
assert.ok(jeYs?.overview?.includes('신정동 132-11'), '정읍 용산호 주소');
assert.ok(jeYs?.overview?.includes('642m'), '정읍 용산호 overlay 642m');
assert.ok(jeYs?.overview?.includes('옥정호'), '정읍 용산호≠임실 옥정호 구분');
assert.ok(jeYs?.imageUrl?.includes('175305752442925'), '정읍 용산호 6경 공식 사진');

const jeWy = resolveLocalScenicListSpotById('local-scenic:jeongeup-gugyeong:월영습지와솔티숲');
assert.ok(jeWy?.overview?.includes('쌍암동 1029'), '정읍 월영습지 주소');
assert.ok(jeWy?.overview?.includes('습지보호지역'), '정읍 월영습지 overlay 습지보호지역');
assert.ok(jeWy?.overview?.includes('월영교'), '정읍 월영습지≠안동 월영교 구분');
assert.ok(jeWy?.imageUrl?.includes('175021230997132'), '정읍 월영습지 8경 공식 사진');

assert.notEqual(jeDh?.imageUrl, jeYs?.imageUrl, '동학·용산호 썸네일 다름');
assert.notEqual(jeDh?.imageUrl, jeWy?.imageUrl, '동학·월영습지 썸네일 다름');
assert.notEqual(jeYs?.imageUrl, jeWy?.imageUrl, '용산호·월영습지 썸네일 다름');

const jeongeupGlobe = filterScenicSpotsByQuery(listKoreaScenicSpots(), '정읍9경', {
  injectLocalScenic: true,
});
const jeongeupGlobeNine = jeongeupGlobe.filter((s) => s.localScenicListId === 'jeongeup-gugyeong');
assert.equal(jeongeupGlobeNine.length, 9, '정읍 검색 정읍9경 9행');
assert.ok(
  jeongeupGlobe.find((s) => s.attractionName === '동학농민혁명기념공원')?.overview?.includes('불멸'),
  '정읍 검색 9경 동학 개요',
);
assert.ok(
  jeongeupGlobe.find((s) => s.attractionName === '용산호')?.imageUrl?.includes('175305752442925'),
  '정읍 검색 9경 용산호 썸네일',
);
assert.ok(
  jeongeupGlobe.find((s) => s.attractionName === '월영습지와 솔티숲')?.overview?.includes('솔티숲'),
  '정읍 검색 9경 월영습지 개요',
);

const jeongseonMerged = mergeLocalScenicMembersIntoScenicSpots([], 'jeongseon');
const jeongseonEight = jeongseonMerged.filter((s) => s.localScenicListId === 'jeongseon-palgyeong');
assert.equal(jeongseonEight.length, 8, '화암8경 8명');
assert.equal(jeongseonEight[0]?.groupTitle, '정선 팔경');
const jeongseonDeficitNames = ['거북바위', '용마소', '화표주'];
const jeongseonDeficit = jeongseonEight.filter((s) =>
  jeongseonDeficitNames.includes(s.attractionName),
);
assert.equal(jeongseonDeficit.length, 3, '화암8경 결손 3명');
assert.ok(
  jeongseonDeficit.every((s) => s.overview && s.imageUrl),
  '정선 결손 3명 overlay 사진·개요',
);
assert.ok(
  jeongseonDeficit.every((s) => !s.contentId),
  '정선 결손 JSON contentId 없음 유지',
);
assert.equal(
  new Set(jeongseonDeficit.map((s) => s.imageUrl)).size,
  3,
  '정선 결손 3명 썸네일 서로 다름',
);

const jsGebuk = resolveLocalScenicListSpotById('local-scenic:jeongseon-palgyeong:거북바위');
assert.ok(jsGebuk?.overview?.includes('화암리 336-1'), '정선 거북바위 주소');
assert.ok(jsGebuk?.overview?.includes('둘레 6m'), '정선 거북바위 overlay 둘레 6m');
assert.ok(jsGebuk?.overview?.includes('여수 거북바위'), '정선 거북바위≠여수 거북바위 구분');
assert.ok(jsGebuk?.imageUrl?.includes('img-geobukbawi.jpg'), '정선 거북바위 공식 사진');

const jsYongma = resolveLocalScenicListSpotById('local-scenic:jeongseon-palgyeong:용마소');
assert.ok(jsYongma?.overview?.includes('화암리 1306-1'), '정선 용마소 주소');
assert.ok(jsYongma?.overview?.includes('용사소'), '정선 용마소 overlay 용사소');
assert.ok(jsYongma?.overview?.includes('용산호'), '정선 용마소≠정읍 용산호 구분');
assert.ok(jsYongma?.imageUrl?.includes('img-yongmaso.jpg'), '정선 용마소 공식 사진');

const jsHwapyo = resolveLocalScenicListSpotById('local-scenic:jeongseon-palgyeong:화표주');
assert.ok(jsHwapyo?.overview?.includes('화암리 329-4'), '정선 화표주 주소');
assert.ok(jsHwapyo?.overview?.includes('돌기둥 두 개'), '정선 화표주 overlay 돌기둥');
assert.ok(jsHwapyo?.overview?.includes('도담삼봉'), '정선 화표주≠단양 도담삼봉 구분');
assert.ok(jsHwapyo?.imageUrl?.includes('img-hwapyoju.jpg'), '정선 화표주 공식 사진');

assert.notEqual(jsGebuk?.imageUrl, jsYongma?.imageUrl, '거북바위·용마소 썸네일 다름');
assert.notEqual(jsGebuk?.imageUrl, jsHwapyo?.imageUrl, '거북바위·화표주 썸네일 다름');
assert.notEqual(jsYongma?.imageUrl, jsHwapyo?.imageUrl, '용마소·화표주 썸네일 다름');

const jeongseonGlobe = filterScenicSpotsByQuery(listKoreaScenicSpots(), '화암8경', {
  injectLocalScenic: true,
});
const jeongseonGlobeEight = jeongseonGlobe.filter(
  (s) => s.localScenicListId === 'jeongseon-palgyeong',
);
assert.equal(jeongseonGlobeEight.length, 8, '정선 검색 화암8경 8행');
assert.ok(
  jeongseonGlobe.find((s) => s.attractionName === '거북바위')?.overview?.includes('수호'),
  '정선 검색 8경 거북바위 개요',
);
assert.ok(
  jeongseonGlobe.find((s) => s.attractionName === '용마소')?.imageUrl?.includes('img-yongmaso.jpg'),
  '정선 검색 8경 용마소 썸네일',
);
assert.ok(
  jeongseonGlobe.find((s) => s.attractionName === '화표주')?.overview?.includes('짚신'),
  '정선 검색 8경 화표주 개요',
);

const taebaekMerged = mergeLocalScenicMembersIntoScenicSpots([], 'taebaek');
const taebaekEight = taebaekMerged.filter((s) => s.localScenicListId === 'taebaek-palgyeong');
assert.equal(taebaekEight.length, 8, '태백8경 8명');
assert.equal(taebaekEight[0]?.groupTitle, '태백 팔경');
const taebaekDeficitNames = ['장성하부고생대화석산지', '용연굴', '절골마을관리휴양지'];
const taebaekDeficit = taebaekEight.filter((s) =>
  taebaekDeficitNames.includes(s.attractionName),
);
assert.equal(taebaekDeficit.length, 3, '태백8경 결손 3명');
assert.ok(
  taebaekDeficit.every((s) => s.overview && s.imageUrl),
  '태백 결손 3명 overlay 사진·개요',
);
assert.ok(
  taebaekDeficit.every((s) => !s.contentId),
  '태백 결손 JSON contentId 없음 유지',
);
assert.equal(
  new Set(taebaekDeficit.map((s) => s.imageUrl)).size,
  3,
  '태백 결손 3명 썸네일 서로 다름',
);

const tbFossil = resolveLocalScenicListSpotById(
  'local-scenic:taebaek-palgyeong:장성하부고생대화석산지',
);
assert.ok(tbFossil?.overview?.includes('장성동 산42-2'), '태백 화석산지 주소');
assert.ok(tbFossil?.overview?.includes('천연기념물'), '태백 화석산지 overlay 천연기념물');
assert.ok(tbFossil?.overview?.includes('직운산층'), '태백 화석산지 overlay 직운산층');
assert.ok(tbFossil?.overview?.includes('전남 장성'), '태백 화석산지≠전남 장성 구분');
assert.ok(tbFossil?.imageUrl?.includes('1630197.jpg'), '태백 화석산지 국가유산청 사진');

const tbCave = resolveLocalScenicListSpotById('local-scenic:taebaek-palgyeong:용연굴');
assert.ok(tbCave?.overview?.includes('태백로 283-29'), '태백 용연굴 주소');
assert.ok(tbCave?.overview?.includes('해발 920m'), '태백 용연굴 overlay 920m');
assert.ok(tbCave?.overview?.includes('화암동굴'), '태백 용연굴≠정선 화암동굴 구분');
assert.ok(tbCave?.imageUrl?.includes('geoplace--10-03.jpg'), '태백 용연굴 지질공원 사진');

const tbJeol = resolveLocalScenicListSpotById('local-scenic:taebaek-palgyeong:절골마을관리휴양지');
assert.ok(tbJeol?.overview?.includes('오투로 116'), '태백 절골 주소');
assert.ok(tbJeol?.overview?.includes('절골힐링캠핑장'), '태백 절골 overlay 캠핑장');
assert.ok(tbJeol?.overview?.includes('고원자연휴양림'), '태백 절골≠고원휴양림 구분');
assert.ok(tbJeol?.imageUrl?.includes('sub_3_9_img4.jpg'), '태백 절골 공단 사진');

assert.notEqual(tbFossil?.imageUrl, tbCave?.imageUrl, '화석산지·용연굴 썸네일 다름');
assert.notEqual(tbFossil?.imageUrl, tbJeol?.imageUrl, '화석산지·절골 썸네일 다름');
assert.notEqual(tbCave?.imageUrl, tbJeol?.imageUrl, '용연굴·절골 썸네일 다름');

const taebaekGlobe = filterScenicSpotsByQuery(listKoreaScenicSpots(), '태백8경', {
  injectLocalScenic: true,
});
const taebaekGlobeEight = taebaekGlobe.filter((s) => s.localScenicListId === 'taebaek-palgyeong');
assert.equal(taebaekGlobeEight.length, 8, '태백 검색 태백8경 8행');
assert.ok(
  taebaekGlobe.find((s) => s.attractionName === '장성하부고생대화석산지')?.overview?.includes('삼엽충'),
  '태백 검색 8경 화석산지 개요',
);
assert.ok(
  taebaekGlobe.find((s) => s.attractionName === '용연굴')?.imageUrl?.includes('geoplace--10-03.jpg'),
  '태백 검색 8경 용연굴 썸네일',
);
assert.ok(
  taebaekGlobe.find((s) => s.attractionName === '절골마을관리휴양지')?.overview?.includes('본적사지'),
  '태백 검색 8경 절골 개요',
);

const uijeongbuMerged = mergeLocalScenicMembersIntoScenicSpots([], 'uijeongbu');
const uijeongbuEight = uijeongbuMerged.filter((s) => s.localScenicListId === 'uijeongbu-palgyeong');
assert.equal(uijeongbuEight.length, 8, '의정부8경 8명');
assert.equal(uijeongbuEight[0]?.groupTitle, '의정부 팔경');
const uijeongbuDeficitNames = ['수락산 도정봉', '의정부경전철', '의정부제일시장'];
const uijeongbuDeficit = uijeongbuEight.filter((s) =>
  uijeongbuDeficitNames.includes(s.attractionName),
);
assert.equal(uijeongbuDeficit.length, 3, '의정부8경 결손 3명');
assert.ok(
  uijeongbuDeficit.every((s) => s.overview && s.imageUrl),
  '의정부 결손 3명 overlay 사진·개요',
);
assert.ok(
  uijeongbuDeficit.every((s) => !s.contentId),
  '의정부 결손 JSON contentId 없음 유지',
);
assert.equal(
  new Set(uijeongbuDeficit.map((s) => s.imageUrl)).size,
  3,
  '의정부 결손 3명 썸네일 서로 다름',
);

const ujPeak = resolveLocalScenicListSpotById('local-scenic:uijeongbu-palgyeong:수락산도정봉');
assert.ok(ujPeak?.overview?.includes('장암동'), '의정부 도정봉 주소');
assert.ok(ujPeak?.overview?.includes('해발 526m'), '의정부 도정봉 overlay 526m');
assert.ok(ujPeak?.overview?.includes('기차바위'), '의정부 도정봉 overlay 기차바위');
assert.ok(ujPeak?.overview?.includes('당고개'), '의정부 도정봉≠노원 당고개 구분');
assert.ok(ujPeak?.overview?.includes('수락계곡'), '의정부 도정봉≠논산 수락계곡 구분');
assert.ok(ujPeak?.imageUrl?.includes('img_view03.png'), '의정부 도정봉 시 공식 사진');

const ujLrt = resolveLocalScenicListSpotById('local-scenic:uijeongbu-palgyeong:의정부경전철');
assert.ok(ujLrt?.overview?.includes('발곡'), '의정부 경전철 overlay 발곡');
assert.ok(ujLrt?.overview?.includes('2012'), '의정부 경전철 overlay 2012');
assert.ok(ujLrt?.overview?.includes('부산김해경전철'), '의정부 경전철≠김해 경전철 구분');
assert.ok(ujLrt?.overview?.includes('가야유적'), '의정부 경전철≠김해9경 가야유적 구분');
assert.ok(ujLrt?.imageUrl?.includes('img_view05_01.png'), '의정부 경전철 시 공식 사진');

const ujMarket = resolveLocalScenicListSpotById('local-scenic:uijeongbu-palgyeong:의정부제일시장');
assert.ok(ujMarket?.overview?.includes('시민로121번길 43-2'), '의정부 제일시장 주소');
assert.ok(ujMarket?.overview?.includes('1978'), '의정부 제일시장 overlay 1978');
assert.ok(ujMarket?.overview?.includes('부대찌개거리'), '의정부 제일시장≠부대찌개거리 구분');
assert.ok(ujMarket?.imageUrl?.includes('img_view07.png'), '의정부 제일시장 시 공식 사진');
assert.ok(!ujMarket?.imageUrl?.includes('3083097'), '의정부 제일시장≠부대찌개거리 GATEO 사진');

assert.notEqual(ujPeak?.imageUrl, ujLrt?.imageUrl, '도정봉·경전철 썸네일 다름');
assert.notEqual(ujPeak?.imageUrl, ujMarket?.imageUrl, '도정봉·제일시장 썸네일 다름');
assert.notEqual(ujLrt?.imageUrl, ujMarket?.imageUrl, '경전철·제일시장 썸네일 다름');

const uijeongbuGlobe = filterScenicSpotsByQuery(listKoreaScenicSpots(), '의정부8경', {
  injectLocalScenic: true,
});
const uijeongbuGlobeEight = uijeongbuGlobe.filter(
  (s) => s.localScenicListId === 'uijeongbu-palgyeong',
);
assert.equal(uijeongbuGlobeEight.length, 8, '의정부 검색 의정부8경 8행');
assert.ok(
  uijeongbuGlobe.find((s) => s.attractionName === '수락산 도정봉')?.overview?.includes('526m'),
  '의정부 검색 8경 도정봉 개요',
);
assert.ok(
  uijeongbuGlobe.find((s) => s.attractionName === '의정부경전철')?.imageUrl?.includes('img_view05_01.png'),
  '의정부 검색 8경 경전철 썸네일',
);
assert.ok(
  uijeongbuGlobe.find((s) => s.attractionName === '의정부제일시장')?.overview?.includes('십자마당'),
  '의정부 검색 8경 제일시장 개요',
);

const tongyeongMerged = mergeLocalScenicMembersIntoScenicSpots([], 'tongyeong');
const tongyeongEight = tongyeongMerged.filter((s) => s.localScenicListId === 'tongyeong-palgyeong');
assert.equal(tongyeongEight.length, 8, '통영팔경 8명');
assert.equal(tongyeongEight[0]?.groupTitle, '통영 팔경');
const tongyeongDeficitNames = ['남망산공원', '한산도제승당', '통영운하 야경'];
const tongyeongDeficit = tongyeongEight.filter((s) =>
  tongyeongDeficitNames.includes(s.attractionName),
);
assert.equal(tongyeongDeficit.length, 3, '통영팔경 결손 3명');
assert.ok(
  tongyeongDeficit.every((s) => s.overview && s.imageUrl),
  '통영 결손 3명 overlay 사진·개요',
);
assert.ok(
  tongyeongDeficit.every((s) => !s.contentId),
  '통영 결손 JSON contentId 없음 유지',
);
assert.equal(
  new Set(tongyeongDeficit.map((s) => s.imageUrl)).size,
  3,
  '통영 결손 3명 썸네일 서로 다름',
);

const tyPark = resolveLocalScenicListSpotById('local-scenic:tongyeong-palgyeong:남망산공원');
assert.ok(tyPark?.overview?.includes('남망공원길 29'), '통영 남망산공원 주소');
assert.ok(tyPark?.overview?.includes('1997'), '통영 남망산공원 overlay 1997');
assert.ok(tyPark?.overview?.includes('조각공원'), '통영 남망산공원 overlay 조각공원');
assert.ok(tyPark?.overview?.includes('동피랑'), '통영 남망산공원≠동피랑 구분');
assert.ok(tyPark?.overview?.includes('디피랑'), '통영 남망산공원≠디피랑 매표 구분');
assert.ok(tyPark?.imageUrl?.includes('3349727_image2_1.jpg'), '통영 남망산공원 공사 공식 사진');

const tyJe = resolveLocalScenicListSpotById('local-scenic:tongyeong-palgyeong:한산도제승당');
assert.ok(tyJe?.overview?.includes('한산일주로 70'), '통영 제승당 주소');
assert.ok(tyJe?.overview?.includes('사적'), '통영 제승당 overlay 사적');
assert.ok(tyJe?.overview?.includes('운주당'), '통영 제승당 overlay 운주당');
assert.ok(tyJe?.overview?.includes('세병관'), '통영 제승당≠세병관 구분');
assert.ok(tyJe?.overview?.includes('현충사'), '통영 제승당≠아산 현충사 구분');
assert.ok(tyJe?.imageUrl?.includes('3558314_image2_1.jpg'), '통영 제승당 공사 공식 사진');

const tyCanal = resolveLocalScenicListSpotById('local-scenic:tongyeong-palgyeong:통영운하야경');
assert.ok(tyCanal?.overview?.includes('당동'), '통영 운하 주소');
assert.ok(tyCanal?.overview?.includes('1932'), '통영 운하 overlay 1932');
assert.ok(tyCanal?.overview?.includes('3중 교통'), '통영 운하 overlay 3중 교통');
assert.ok(tyCanal?.overview?.includes('여수 밤바다'), '통영 운하≠여수 밤바다 구분');
assert.ok(tyCanal?.overview?.includes('광양만'), '통영 운하≠광양만 야경 구분');
assert.ok(tyCanal?.imageUrl?.includes('3534988_image2_1.jpg'), '통영 운하 공사 공식 사진');
assert.ok(!tyCanal?.imageUrl?.includes('3534987'), '통영 운하≠축제 인물 사진');

assert.notEqual(tyPark?.imageUrl, tyJe?.imageUrl, '남망산·제승당 썸네일 다름');
assert.notEqual(tyPark?.imageUrl, tyCanal?.imageUrl, '남망산·운하 썸네일 다름');
assert.notEqual(tyJe?.imageUrl, tyCanal?.imageUrl, '제승당·운하 썸네일 다름');

const tongyeongGlobe = filterScenicSpotsByQuery(listKoreaScenicSpots(), '통영팔경', {
  injectLocalScenic: true,
});
const tongyeongGlobeEight = tongyeongGlobe.filter(
  (s) => s.localScenicListId === 'tongyeong-palgyeong',
);
assert.equal(tongyeongGlobeEight.length, 8, '통영 검색 통영팔경 8행');
assert.ok(
  tongyeongGlobe.find((s) => s.attractionName === '남망산공원')?.overview?.includes('1997'),
  '통영 검색 8경 남망산공원 개요',
);
assert.ok(
  tongyeongGlobe.find((s) => s.attractionName === '한산도제승당')?.imageUrl?.includes('3558314_image2_1.jpg'),
  '통영 검색 8경 제승당 썸네일',
);
assert.ok(
  tongyeongGlobe.find((s) => s.attractionName === '통영운하 야경')?.overview?.includes('판데목'),
  '통영 검색 8경 운하 개요',
);

const tyYong = resolveLocalScenicListSpotById(
  'local-scenic:tongyeong-palgyeong:연화도용머리',
);
assert.equal(tyYong?.contentId, '127103', '통영 연화도 용머리 JSON contentId 유지');
assert.ok(tyYong?.overview?.includes('욕지면 연화리'), '통영 연화도 용머리 주소');
assert.ok(tyYong?.overview?.includes('네 개 바위섬'), '통영 연화도 용머리 overlay 바위섬');
assert.ok(tyYong?.overview?.includes('제주 용머리해안'), '통영 연화도 용머리≠제주 용머리해안');
assert.ok(tyYong?.overview?.includes('연화사'), '통영 연화도 용머리≠연화사 법당');
assert.ok(tyYong?.imageUrl?.includes('utour.go.kr'), '통영 연화도 용머리 U투어 공식 사진');
assert.ok(tyYong?.imageUrl?.includes('idx=16550'), '통영 연화도 용머리 용머리 능선 사진');
assert.ok(!tyYong?.imageUrl?.includes('pstatic.net'), '통영 연화도 용머리≠네이버 핫링크');
assert.ok(tyYong?.homepage?.includes('utour.go.kr'), '통영 연화도 용머리 공식 홈 U투어');
assert.ok(tyYong?.homepage?.includes('idx=1660'), '통영 연화도 용머리 공식 홈 연화도 페이지');
assert.ok(!/badaland/i.test(String(tyYong?.homepage || '')), '통영 연화도 용머리≠badaland.com');
assert.ok(
  lookupLocalScenicPhotoByContentId('127103')?.homepage?.includes('idx=1660'),
  '통영 검색 Tour 행 연화도(통영) 127103 공식 홈',
);
assert.ok(
  tongyeongEight.find((s) => s.attractionName === '연화도 용머리')?.imageUrl?.includes(
    'idx=16550',
  ),
  '통영팔경 1경 연화도 용머리 썸네일',
);
assert.ok(
  lookupLocalScenicPhotoByContentId('127103')?.imageUrl?.includes('idx=16550'),
  '통영 검색 Tour 행 연화도(통영) 127103 썸네일',
);
const tyYongSearch = resolveSearchScenicMedia({
  hubId: 'tongyeong',
  name: '연화도(통영)',
  contentId: '127103',
});
assert.ok(
  tyYongSearch.imageUrl?.includes('idx=16550'),
  '명승 검색 연화도(통영) 썸네일',
);
assert.equal(tyYongSearch.contentId, '127103', '명승 검색 연화도(통영) contentId');

const tyYi = lookupLocalScenicMemberOverlayForSpot({
  hubId: 'tongyeong',
  attractionName: '이순신공원',
});
assert.ok(tyYi?.overview?.includes('정량동 688-1'), '통영 이순신공원 주소');
assert.ok(tyYi?.overview?.includes('17.3m'), '통영 이순신공원 overlay 동상');
assert.ok(tyYi?.overview?.includes('남망산공원'), '통영 이순신공원≠남망산공원');
assert.ok(tyYi?.overview?.includes('여수 이순신공원'), '통영 이순신공원≠여수 이순신공원');
assert.ok(tyYi?.imageUrl?.includes('3479192_image2_1.jpg'), '통영 이순신공원 공사 공식 사진');
assert.ok(!tyYi?.imageUrl?.includes('3072989'), '통영 이순신공원≠화장실 사진');
const tyYiSearch = resolveSearchScenicMedia({
  hubId: 'tongyeong',
  name: '이순신공원',
});
assert.ok(
  tyYiSearch.imageUrl?.includes('3479192_image2_1.jpg'),
  '탐색홈 이순신공원 썸네일',
);
assert.ok(
  lookupLocalScenicPhotoByContentId('584970')?.imageUrl?.includes('3479192_image2_1.jpg'),
  '통영 검색 Tour 행 이순신공원 584970 썸네일',
);
assert.ok(
  !lookupLocalScenicPhotoByContentId('2782775')?.imageUrl,
  '통영 검색 삼덕항 2782775 공식 사진 없음 유지',
);
assert.notEqual(tyYong?.imageUrl, tyYi?.imageUrl, '연화도 용머리·이순신공원 썸네일 다름');
assert.notEqual(tyYong?.imageUrl, tyPark?.imageUrl, '연화도 용머리·남망산 썸네일 다름');
assert.notEqual(tyYi?.imageUrl, tyPark?.imageUrl, '이순신공원·남망산 썸네일 다름');

const gwangjuGiMerged = mergeLocalScenicMembersIntoScenicSpots([], 'gwangju_gi');
const gwangjuGiEight = gwangjuGiMerged.filter((s) => s.localScenicListId === 'gwangju-gi-palgyeong');
assert.equal(gwangjuGiEight.length, 8, '광주8경 8명');
assert.equal(gwangjuGiEight[0]?.groupTitle, '경기 광주 팔경');
assert.deepEqual(
  gwangjuGiEight.map((s) => s.attractionName),
  [
    '경기광주 남한산성',
    '분원도요지 & 팔당물안개공원',
    '경안천습지생태공원',
    '앵자봉 & 천진암',
    '무갑산',
    '태화산',
    '경기도자박물관',
    '중대물빛공원',
  ],
  '광주8경 시 공식 8명 순서',
);
assert.ok(
  !gwangjuGiEight.some((s) => s.attractionName === '송정사'),
  '광주8경≠송정사',
);
assert.ok(
  !gwangjuGiEight.some((s) => s.attractionName === '화담숲'),
  '광주8경≠화담숲',
);
assert.ok(
  !gwangjuGiEight.some((s) => s.attractionName === '곤지암도자공원'),
  '광주8경≠곤지암도자공원',
);
assert.ok(
  listKoreaScenicSpots().some(
    (s) => s.hubId === 'gwangju_gi' && s.attractionName === '화담숲',
  ),
  '화담숲 GATEO 선정 유지',
);
assert.ok(
  listKoreaScenicSpots().some(
    (s) => s.hubId === 'gwangju_gi' && s.attractionName === '곤지암도자공원',
  ),
  '곤지암도자공원 GATEO 선정 유지',
);
const gjBunwon = resolveLocalScenicListSpotById(
  'local-scenic:gwangju-gi-palgyeong:분원도요지&팔당물안개공원',
);
assert.ok(gjBunwon?.overview && gjBunwon?.imageUrl, '광주 분원도요지 overlay 사진·개요');
assert.ok(!gjBunwon?.contentId, '광주 분원도요지 JSON contentId 없음 유지');
assert.ok(gjBunwon?.overview?.includes('남종면'), '광주 분원도요지 주소 남종면');
assert.ok(gjBunwon?.overview?.includes('분원리 116'), '광주 분원도요지 분원리');
assert.ok(gjBunwon?.overview?.includes('귀여리 596'), '광주 분원도요지 팔당물안개공원');
assert.ok(gjBunwon?.overview?.includes('경기도자박물관'), '광주 분원도요지≠7경 박물관');
assert.ok(gjBunwon?.overview?.includes('화담숲'), '광주 분원도요지≠화담숲');
assert.ok(gjBunwon?.imageUrl?.includes('img_pardang2.png'), '광주 분원도요지 시 공식 사진');
assert.ok(gjBunwon?.homepage?.includes('mId=0101020000'), '광주 분원도요지 공식 홈 2경');
const gjAengja = resolveLocalScenicListSpotById('local-scenic:gwangju-gi-palgyeong:앵자봉&천진암');
assert.ok(gjAengja?.overview && gjAengja?.imageUrl, '광주 앵자봉 overlay 사진·개요');
assert.ok(!gjAengja?.contentId, '광주 앵자봉 JSON contentId 없음 유지');
assert.ok(gjAengja?.overview?.includes('퇴촌면'), '광주 앵자봉 주소 퇴촌면');
assert.ok(gjAengja?.overview?.includes('667m'), '광주 앵자봉 overlay 667m');
assert.ok(gjAengja?.overview?.includes('천진암'), '광주 앵자봉 overlay 천진암');
assert.ok(gjAengja?.overview?.includes('무등산'), '광주 앵자봉≠광주광역시 무등산');
assert.ok(gjAengja?.imageUrl?.includes('img_aengjabong1.png'), '광주 앵자봉 시 공식 사진');
assert.ok(gjAengja?.homepage?.includes('mId=0101040000'), '광주 앵자봉 공식 홈 4경');
const gjMugap = resolveLocalScenicListSpotById('local-scenic:gwangju-gi-palgyeong:무갑산');
assert.ok(gjMugap?.overview && gjMugap?.imageUrl, '광주 무갑산 overlay 사진·개요');
assert.ok(!gjMugap?.contentId, '광주 무갑산 JSON contentId 없음 유지');
assert.ok(gjMugap?.overview?.includes('초월읍'), '광주 무갑산 주소 초월읍');
assert.ok(gjMugap?.overview?.includes('578m'), '광주 무갑산 overlay 578m');
assert.ok(gjMugap?.overview?.includes('팔당호'), '광주 무갑산 overlay 팔당호');
assert.ok(gjMugap?.overview?.includes('무등산'), '광주 무갑산≠광주광역시 무등산');
assert.ok(gjMugap?.overview?.includes('태화산'), '광주 무갑산≠6경 태화산');
assert.ok(gjMugap?.overview?.includes('무갑사'), '광주 무갑산≠무갑사 법당');
assert.ok(gjMugap?.imageUrl?.includes('img_mugabsan3.png'), '광주 무갑산 시 공식 사진');
assert.ok(gjMugap?.homepage?.includes('mId=0101050000'), '광주 무갑산 공식 홈 5경');
assert.ok(!gjMugap?.imageUrl?.includes('img_taehwasan'), '광주 무갑산≠태화산 공식 사진');
const gjTaehwa = resolveLocalScenicListSpotById('local-scenic:gwangju-gi-palgyeong:태화산');
assert.ok(gjTaehwa?.overview && gjTaehwa?.imageUrl, '광주 태화산 overlay 사진·개요');
assert.ok(!gjTaehwa?.contentId, '광주 태화산 JSON contentId 없음 유지');
assert.ok(gjTaehwa?.overview?.includes('도척면'), '광주 태화산 주소 도척면');
assert.ok(gjTaehwa?.overview?.includes('664m'), '광주 태화산 overlay 664m');
assert.ok(gjTaehwa?.overview?.includes('마곡사'), '광주 태화산≠공주 마곡사');
assert.ok(gjTaehwa?.imageUrl?.includes('img_taehwasan1.png'), '광주 태화산 시 공식 사진');
assert.ok(gjTaehwa?.homepage?.includes('mId=0101060000'), '광주 태화산 공식 홈 6경');
assert.notEqual(gjMugap?.imageUrl, gjTaehwa?.imageUrl, '무갑산·태화산 썸네일 다름');
const gjDoja = resolveLocalScenicListSpotById('local-scenic:gwangju-gi-palgyeong:경기도자박물관');
assert.ok(gjDoja?.overview && gjDoja?.imageUrl, '광주 경기도자박물관 overlay 사진·개요');
assert.ok(!gjDoja?.contentId, '광주 경기도자박물관 JSON contentId 없음 유지');
assert.ok(gjDoja?.overview?.includes('경충대로 727'), '광주 경기도자박물관 주소');
assert.ok(gjDoja?.overview?.includes('곤지암도자공원'), '광주 경기도자박물관≠곤지암도자공원');
assert.ok(gjDoja?.overview?.includes('화담숲'), '광주 경기도자박물관≠화담숲');
assert.ok(gjDoja?.imageUrl?.includes('img_ggdoja1.png'), '광주 경기도자박물관 시 공식 사진');
assert.ok(gjDoja?.homepage?.includes('mId=0101070000'), '광주 경기도자박물관 공식 홈 7경');
assert.ok(!resolveLocalScenicListSpotById('local-scenic:gwangju-gi-palgyeong:송정사'), '광주 송정사 팔경 제외');
const gwangjuGiGlobe = filterScenicSpotsByQuery(listKoreaScenicSpots(), '광주8경', {
  injectLocalScenic: true,
});
const gwangjuGiGlobeEight = gwangjuGiGlobe.filter(
  (s) => s.localScenicListId === 'gwangju-gi-palgyeong',
);
assert.equal(gwangjuGiGlobeEight.length, 8, '광주 검색 광주8경 8행');
assert.ok(
  gwangjuGiGlobe.find((s) => s.attractionName === '무갑산')?.overview?.includes('578m'),
  '광주 검색 8경 무갑산 개요',
);
assert.ok(
  gwangjuGiGlobe.find((s) => s.attractionName === '무갑산')?.imageUrl?.includes('img_mugabsan3.png'),
  '광주 검색 8경 무갑산 썸네일',
);
assert.ok(
  gwangjuGiGlobeEight.some((s) => s.attractionName === '분원도요지 & 팔당물안개공원'),
  '광주 검색 8경 2경 분원도요지',
);
assert.ok(
  gwangjuGiGlobeEight.some((s) => s.attractionName === '경기도자박물관'),
  '광주 검색 8경 7경 경기도자박물관',
);
assert.ok(
  !gwangjuGiGlobeEight.some((s) => s.attractionName === '송정사'),
  '광주 검색 8경≠송정사',
);
assert.ok(
  !gwangjuGiGlobeEight.some((s) => s.attractionName === '화담숲'),
  '광주 검색 8경≠화담숲',
);

const mokpoMerged = mergeLocalScenicMembersIntoScenicSpots([], 'mokpo');
const mokpoNine = mokpoMerged.filter((s) => s.localScenicListId === 'mokpo-gugyeong');
assert.equal(mokpoNine.length, 9, '목포9경 9명');
assert.equal(mokpoNine[0]?.groupTitle, '목포 구경');
const mokpoDeficitNames = ['목포진', '다도해 전경'];
const mokpoDeficit = mokpoNine.filter((s) => mokpoDeficitNames.includes(s.attractionName));
assert.equal(mokpoDeficit.length, 2, '목포9경 결손 2명');
assert.ok(
  mokpoDeficit.every((s) => s.overview && s.imageUrl),
  '목포 결손 2명 overlay 사진·개요',
);
assert.ok(
  mokpoDeficit.every((s) => !s.contentId),
  '목포 결손 JSON contentId 없음 유지',
);
assert.equal(
  new Set(mokpoDeficit.map((s) => s.imageUrl)).size,
  2,
  '목포진·다도해 전경 썸네일 다름',
);
const mpJin = resolveLocalScenicListSpotById('local-scenic:mokpo-gugyeong:목포진');
assert.ok(mpJin?.overview && mpJin?.imageUrl, '목포 목포진 overlay 사진·개요');
assert.ok(!mpJin?.contentId, '목포 목포진 JSON contentId 없음 유지');
assert.ok(mpJin?.overview?.includes('만호동'), '목포 목포진 주소 만호동');
assert.ok(mpJin?.overview?.includes('1439'), '목포 목포진 overlay 세종 21년');
assert.ok(mpJin?.overview?.includes('2014'), '목포 목포진 overlay 2014 복원');
assert.ok(mpJin?.overview?.includes('137호'), '목포 목포진 overlay 문화재자료 137호');
assert.ok(mpJin?.overview?.includes('목포구등대'), '목포 목포진≠해남 구 목포구등대');
assert.ok(mpJin?.overview?.includes('달성토성'), '목포 목포진≠대구 달성토성');
assert.ok(mpJin?.imageUrl?.includes('mokpojin_intro.jpg'), '목포 목포진 시 공식 사진');
assert.ok(mpJin?.homepage?.includes('/nineplace/mokpojin'), '목포 목포진 공식 홈');
const mpDado = resolveLocalScenicListSpotById('local-scenic:mokpo-gugyeong:다도해전경');
assert.ok(mpDado?.overview && mpDado?.imageUrl, '목포 다도해 전경 overlay 사진·개요');
assert.ok(!mpDado?.contentId, '목포 다도해 전경 JSON contentId 없음 유지');
assert.ok(mpDado?.overview?.includes('고하도'), '목포 다도해 전경 overlay 고하도');
assert.ok(mpDado?.overview?.includes('외달도'), '목포 다도해 전경 overlay 외달도');
assert.ok(mpDado?.overview?.includes('유달산'), '목포 다도해 전경 overlay 유달산 조망');
assert.ok(mpDado?.overview?.includes('목포대교'), '목포 다도해 전경≠2경 목포대교');
assert.ok(mpDado?.overview?.includes('해상국립공원'), '목포 다도해 전경≠진도 다도해해상국립공원');
assert.ok(mpDado?.overview?.includes('해상케이블카'), '목포 다도해 전경≠목포해상케이블카');
assert.ok(mpDado?.imageUrl?.includes('archipelago1.jpg'), '목포 다도해 전경 시 공식 사진');
assert.ok(mpDado?.homepage?.includes('/nineplace/archipelago'), '목포 다도해 전경 공식 홈');
assert.notEqual(mpJin?.imageUrl, mpDado?.imageUrl, '목포진·다도해 전경 썸네일 다름');
assert.ok(!mpDado?.imageUrl?.includes('mokpojin'), '다도해 전경≠목포진 공식 사진');
const mokpoGlobe = filterScenicSpotsByQuery(listKoreaScenicSpots(), '목포9경', {
  injectLocalScenic: true,
});
const mokpoGlobeNine = mokpoGlobe.filter((s) => s.localScenicListId === 'mokpo-gugyeong');
assert.equal(mokpoGlobeNine.length, 9, '목포 검색 목포9경 9행');
assert.ok(
  mokpoGlobe.find((s) => s.attractionName === '목포진')?.overview?.includes('1439'),
  '목포 검색 9경 목포진 개요',
);
assert.ok(
  mokpoGlobe.find((s) => s.attractionName === '목포진')?.imageUrl?.includes('mokpojin_intro.jpg'),
  '목포 검색 9경 목포진 썸네일',
);
assert.ok(
  mokpoGlobe.find((s) => s.attractionName === '다도해 전경')?.imageUrl?.includes('archipelago1.jpg'),
  '목포 검색 9경 다도해 전경 썸네일',
);

const muanMerged = mergeLocalScenicMembersIntoScenicSpots([], 'muan');
const muanNine = muanMerged.filter((s) => s.localScenicListId === 'muan-gugyeong');
assert.equal(muanNine.length, 9, '무안9경 9명');
assert.equal(muanNine[0]?.groupTitle, '무안 구경');
const muanDeficitNames = ['영산강 식영정과 느러지', '톱머리·홀통 해수욕장'];
const muanDeficit = muanNine.filter((s) => muanDeficitNames.includes(s.attractionName));
assert.equal(muanDeficit.length, 2, '무안9경 결손 2명');
assert.ok(
  muanDeficit.every((s) => s.overview && s.imageUrl),
  '무안 결손 2명 overlay 사진·개요',
);
assert.ok(
  muanDeficit.every((s) => !s.contentId),
  '무안 결손 JSON contentId 없음 유지',
);
assert.equal(
  new Set(muanDeficit.map((s) => s.imageUrl)).size,
  2,
  '식영정·톱머리홀통 썸네일 다름',
);
const maSik = resolveLocalScenicListSpotById('local-scenic:muan-gugyeong:영산강식영정과느러지');
assert.ok(maSik?.overview && maSik?.imageUrl, '무안 식영정과 느러지 overlay 사진·개요');
assert.ok(!maSik?.contentId, '무안 식영정과 느러지 JSON contentId 없음 유지');
assert.ok(maSik?.overview?.includes('몽탄면'), '무안 식영정 overlay 몽탄면');
assert.ok(maSik?.overview?.includes('1630'), '무안 식영정 overlay 1630');
assert.ok(maSik?.overview?.includes('237호'), '무안 식영정 overlay 문화재자료 237호');
assert.ok(maSik?.overview?.includes('息營亭'), '무안 식영정 overlay 息營亭');
assert.ok(maSik?.overview?.includes('息影亭'), '무안 식영정≠담양 息影亭');
assert.ok(maSik?.overview?.includes('느러지전망대'), '무안 식영정≠나주 느러지전망대');
assert.ok(maSik?.overview?.includes('한반도지형'), '무안 느러지≠영월 한반도지형');
assert.ok(maSik?.imageUrl?.includes('spring_5_2_200401.jpg'), '무안 식영정 군 공식 항공 사진');
assert.ok(maSik?.homepage?.includes('idx=247'), '무안 식영정 공식 홈');
const maBeach = resolveLocalScenicListSpotById('local-scenic:muan-gugyeong:톱머리·홀통해수욕장');
assert.ok(maBeach?.overview && maBeach?.imageUrl, '무안 톱머리·홀통 overlay 사진·개요');
assert.ok(!maBeach?.contentId, '무안 톱머리·홀통 JSON contentId 없음 유지');
assert.ok(maBeach?.overview?.includes('톱머리길 66'), '무안 톱머리 overlay 주소');
assert.ok(maBeach?.overview?.includes('홀통길 198-1'), '무안 홀통 overlay 주소');
assert.ok(maBeach?.overview?.includes('2km'), '무안 톱머리 overlay 백사장 2km');
assert.ok(maBeach?.overview?.includes('윈드서핑'), '무안 홀통 overlay 윈드서핑');
assert.ok(maBeach?.overview?.includes('도리포'), '무안 톱머리·홀통≠7경 도리포');
assert.ok(maBeach?.overview?.includes('조금나루'), '무안 톱머리·홀통≠조금나루');
assert.ok(maBeach?.imageUrl?.includes('tommeori_2.jpg'), '무안 톱머리 군 공식 사진');
assert.ok(maBeach?.galleryUrls?.some((u) => u.includes('summer_4_200401.jpg')), '무안 홀통 군 공식 사진');
assert.ok(maBeach?.homepage?.includes('tommeori_beach'), '무안 톱머리 공식 홈');
assert.notEqual(maSik?.imageUrl, maBeach?.imageUrl, '식영정·톱머리홀통 썸네일 다름');
assert.ok(!maBeach?.imageUrl?.includes('spring_5'), '톱머리·홀통≠식영정 공식 사진');
const muanGlobe = filterScenicSpotsByQuery(listKoreaScenicSpots(), '무안9경', {
  injectLocalScenic: true,
});
const muanGlobeNine = muanGlobe.filter((s) => s.localScenicListId === 'muan-gugyeong');
assert.equal(muanGlobeNine.length, 9, '무안 검색 무안9경 9행');
assert.ok(
  muanGlobe.find((s) => s.attractionName === '영산강 식영정과 느러지')?.overview?.includes('1630'),
  '무안 검색 9경 식영정 개요',
);
assert.ok(
  muanGlobe
    .find((s) => s.attractionName === '영산강 식영정과 느러지')
    ?.imageUrl?.includes('spring_5_2_200401.jpg'),
  '무안 검색 9경 식영정 썸네일',
);
assert.ok(
  muanGlobe
    .find((s) => s.attractionName === '톱머리·홀통 해수욕장')
    ?.imageUrl?.includes('tommeori_2.jpg'),
  '무안 검색 9경 톱머리·홀통 썸네일',
);
const maSeung = resolveLocalScenicListSpotById('local-scenic:muan-gugyeong:승달산');
assert.equal(maSeung?.contentId, '126614', '무안 승달산 JSON contentId 유지');
assert.ok(maSeung?.overview?.includes('333m'), '무안 승달산 overlay 해발 333m');
assert.ok(maSeung?.overview?.includes('청계면'), '무안 승달산 overlay 청계면');
assert.ok(maSeung?.overview?.includes('법천사 무안'), '무안 승달산≠법천사 무안');
assert.ok(maSeung?.overview?.includes('목포대'), '무안 승달산 overlay 목포대');
assert.ok(maSeung?.imageUrl?.includes('seungdalsan_8.jpg'), '무안 승달산 군 공식 산나리 조망');
assert.ok(maSeung?.homepage?.includes('seungdalsan'), '무안 승달산 공식 홈');
assert.ok(
  lookupLocalScenicPhotoByContentId('126614')?.imageUrl?.includes('seungdalsan_8.jpg'),
  '무안 검색 Tour 행 승달산 126614 썸네일',
);
assert.ok(
  resolveSearchScenicMedia({
    hubId: 'muan',
    name: '승달산',
    contentId: '126614',
  }).imageUrl?.includes('seungdalsan_8.jpg'),
  '탐색홈 무안9경 승달산 썸네일',
);
assert.ok(
  resolveSearchScenicMedia({
    name: '승달산',
    contentId: '126614',
  }).imageUrl?.includes('seungdalsan_8.jpg'),
  '탐색 검색 Tour 행 승달산 썸네일',
);
const maChoeui = resolveLocalScenicListSpotById('local-scenic:muan-gugyeong:초의선사탄생지');
assert.equal(maChoeui?.contentId, '127177', '무안 초의선사탄생지 JSON contentId 유지');
assert.ok(maChoeui?.overview?.includes('초의길 30'), '무안 초의 overlay 초의길 30');
assert.ok(maChoeui?.overview?.includes('1786'), '무안 초의 overlay 1786');
assert.ok(maChoeui?.overview?.includes('왕산리'), '무안 초의 overlay 왕산리');
assert.ok(maChoeui?.overview?.includes('일지암'), '무안 초의≠해남 대흥사 일지암');
assert.ok(maChoeui?.overview?.includes('법천사 무안'), '무안 초의≠법천사 무안');
assert.ok(maChoeui?.imageUrl?.includes('/9/01.jpg'), '무안 초의 군 공식 전경');
assert.ok(maChoeui?.homepage?.includes('historic_site'), '무안 초의 공식 홈');
assert.ok(
  lookupLocalScenicPhotoByContentId('127177')?.imageUrl?.includes('/9/01.jpg'),
  '무안 검색 Tour 행 초의선사탄생지 127177 썸네일',
);
assert.ok(
  resolveSearchScenicMedia({
    hubId: 'muan',
    name: '초의선사탄생지',
    contentId: '127177',
  }).imageUrl?.includes('/9/01.jpg'),
  '탐색홈 무안9경 초의선사탄생지 썸네일',
);
assert.notEqual(maSeung?.imageUrl, maChoeui?.imageUrl, '승달산·초의 썸네일 다름');
assert.ok(!maSeung?.imageUrl?.includes('/9/01.jpg'), '승달산≠초의 공식 사진');
assert.ok(!maChoeui?.imageUrl?.includes('seungdalsan'), '초의≠승달산 공식 사진');
assert.ok(
  muanGlobe.find((s) => s.attractionName === '승달산')?.imageUrl?.includes('seungdalsan_8.jpg'),
  '무안 검색 9경 승달산 썸네일',
);
assert.ok(
  muanGlobe
    .find((s) => s.attractionName === '초의선사탄생지')
    ?.imageUrl?.includes('/9/01.jpg'),
  '무안 검색 9경 초의선사탄생지 썸네일',
);

const boseongMerged = mergeLocalScenicMembersIntoScenicSpots([], 'boseong');
const boseongNine = boseongMerged.filter((s) => s.localScenicListId === 'boseong-gugyeong');
assert.equal(boseongNine.length, 9, '보성9경 9명');
assert.equal(boseongNine[0]?.groupTitle, '보성 구경');
const boseongDeficitNames = ['일림산 용추계곡', '주암호 서재필기념관'];
const boseongDeficit = boseongNine.filter((s) => boseongDeficitNames.includes(s.attractionName));
assert.equal(boseongDeficit.length, 2, '보성9경 결손 2명');
assert.ok(
  boseongDeficit.every((s) => s.overview && s.imageUrl),
  '보성 결손 2명 overlay 사진·개요',
);
assert.ok(
  boseongDeficit.every((s) => !s.contentId),
  '보성 결손 JSON contentId 없음 유지',
);
assert.equal(
  new Set(boseongDeficit.map((s) => s.imageUrl)).size,
  2,
  '용추계곡·서재필기념관 썸네일 다름',
);
const bsIlim = resolveLocalScenicListSpotById('local-scenic:boseong-gugyeong:일림산용추계곡');
assert.ok(bsIlim?.overview && bsIlim?.imageUrl, '보성 일림산 용추계곡 overlay 사진·개요');
assert.ok(!bsIlim?.contentId, '보성 일림산 용추계곡 JSON contentId 없음 유지');
assert.ok(bsIlim?.overview?.includes('웅치면'), '보성 용추계곡 overlay 웅치면');
assert.ok(bsIlim?.overview?.includes('664m'), '보성 용추계곡 overlay 664m');
assert.ok(bsIlim?.overview?.includes('용추폭포'), '보성 용추계곡 overlay 용추폭포');
assert.ok(bsIlim?.overview?.includes('선녀탕'), '보성 용추계곡 overlay 선녀탕');
assert.ok(bsIlim?.overview?.includes('문경8경'), '보성 용추계곡≠문경8경 용추계곡');
assert.ok(bsIlim?.overview?.includes('동해 용추폭포'), '보성 용추계곡≠동해 용추폭포');
assert.ok(bsIlim?.overview?.includes('제암산자연휴양림'), '보성 용추계곡≠6경 제암산자연휴양림');
assert.ok(bsIlim?.imageUrl?.includes('ilrim10.jpg'), '보성 용추계곡 군 공식 폭포 사진');
assert.ok(bsIlim?.galleryUrls?.some((u) => u.includes('ilrim12.jpg')), '보성 용추계곡 군 공식 계곡 사진');
assert.ok(bsIlim?.homepage?.includes('ilrim_yongchoo'), '보성 용추계곡 공식 홈');
const bsSeo = resolveLocalScenicListSpotById('local-scenic:boseong-gugyeong:주암호서재필기념관');
assert.ok(bsSeo?.overview && bsSeo?.imageUrl, '보성 주암호 서재필기념관 overlay 사진·개요');
assert.ok(!bsSeo?.contentId, '보성 서재필기념관 JSON contentId 없음 유지');
assert.ok(bsSeo?.overview?.includes('용암길 8'), '보성 서재필 overlay 용암길 8');
assert.ok(bsSeo?.overview?.includes('1864'), '보성 서재필 overlay 1864');
assert.ok(bsSeo?.overview?.includes('개화문'), '보성 서재필 overlay 개화문');
assert.ok(bsSeo?.overview?.includes('가내길 18-35'), '보성 서재필 overlay 생가 주소');
assert.ok(bsSeo?.overview?.includes('서울 독립문'), '보성 서재필≠서울 독립문');
assert.ok(bsSeo?.overview?.includes('주암호생태습지'), '보성 서재필≠주암호생태습지');
assert.ok(bsSeo?.overview?.includes('대원사'), '보성 서재필≠8경 대원사');
assert.ok(bsSeo?.imageUrl?.includes('seojp2.jpg'), '보성 서재필 군 공식 개화문·동상 사진');
assert.ok(bsSeo?.galleryUrls?.some((u) => u.includes('juam2.jpg')), '보성 서재필 군 공식 주암호 항공');
assert.ok(bsSeo?.homepage?.includes('juam_seojp'), '보성 서재필 공식 홈');
assert.notEqual(bsIlim?.imageUrl, bsSeo?.imageUrl, '용추계곡·서재필 썸네일 다름');
assert.ok(!bsSeo?.imageUrl?.includes('ilrim'), '서재필≠용추계곡 공식 사진');
assert.ok(!bsIlim?.imageUrl?.includes('seojp'), '용추계곡≠서재필 공식 사진');
const boseongGlobe = filterScenicSpotsByQuery(listKoreaScenicSpots(), '보성9경', {
  injectLocalScenic: true,
});
const boseongGlobeNine = boseongGlobe.filter((s) => s.localScenicListId === 'boseong-gugyeong');
assert.equal(boseongGlobeNine.length, 9, '보성 검색 보성9경 9행');
assert.ok(
  boseongGlobe.find((s) => s.attractionName === '일림산 용추계곡')?.overview?.includes('664m'),
  '보성 검색 9경 일림산 용추계곡 개요',
);
assert.ok(
  boseongGlobe
    .find((s) => s.attractionName === '일림산 용추계곡')
    ?.imageUrl?.includes('ilrim10.jpg'),
  '보성 검색 9경 일림산 용추계곡 썸네일',
);
assert.ok(
  boseongGlobe
    .find((s) => s.attractionName === '주암호 서재필기념관')
    ?.imageUrl?.includes('seojp2.jpg'),
  '보성 검색 9경 서재필기념관 썸네일',
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
