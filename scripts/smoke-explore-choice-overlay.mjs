#!/usr/bin/env node
/**
 * 탐색홈 — Enter 선택 카드와 타이핑 드롭다운이 같은 후보를 두 겹으로 띄우지 않는지.
 * 네트워크 없음.
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  buildHubDisambiguationCandidates,
  isSearchDisambiguation,
  makeDisambiguationResult,
  resolveCityAttractionHub,
} from '../src/pages/Home/lib/cityAttractionHubs.js';
import {
  enrichSearchCandidateScenicMedia,
  listsForHub,
  localScenicMemberToSuggestion,
  hubAttractionSearchGroupTitle,
} from '../src/pages/Home/lib/koreaLocalScenicLists.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

const modalSrc = readFileSync(
  join(root, 'src/pages/Home/components/SearchDiscoveryModal.jsx'),
  'utf8',
);
assert.match(modalSrc, /const hasChoiceCards = Boolean\(disambiguation/);
assert.match(modalSrc, /!hasChoiceCards/, 'dropdown gated off while choice cards are open');
assert.doesNotMatch(modalSrc, /keepChoiceDropdown/);
assert.doesNotMatch(
  modalSrc,
  /disambiguation\?\.candidates\?\.length\s*\?\s*disambiguation\.candidates/,
);
assert.match(
  modalSrc,
  /!showSearchDropdown && !activeQuickSection && !hasChoiceCards/,
  'guide text hidden while choice cards are open',
);

const hub = resolveCityAttractionHub('옹진');
assert.ok(hub, '옹진 resolves to a city hub');
assert.equal(hub.hubId, 'ongjin');
assert.equal(hub.name, '옹진');

const candidates = buildHubDisambiguationCandidates(hub, []);
assert.ok(candidates.length >= 2, 'choice cards include hub + attractions');
assert.equal(candidates[0].name, '옹진');
assert.equal(candidates[0].badge, '도시');
assert.equal(candidates.some((item) => String(item.name).includes('덕적도')), true);

const deok = candidates.find((item) => String(item.name).includes('덕적도'));
const deokMedia = enrichSearchCandidateScenicMedia(deok);
assert.ok(deokMedia?.imageUrl, '옹진 덕적도 choice card gets GATEO scenic thumb');
assert.equal(listsForHub('ongjin').length, 0, '옹진 has no palgyeong list');
assert.equal(hubAttractionSearchGroupTitle(hub), '옹진 명소');
assert.equal(deokMedia.groupTitle, '옹진 명소');
assert.equal(deokMedia.rankBlurb || '', '', '옹진 섬 is not N경');
assert.equal(candidates[0].kind, 'city');
assert.equal(enrichSearchCandidateScenicMedia(candidates[0]).groupTitle || '', '');

const mungyeong = resolveCityAttractionHub('문경');
assert.ok(mungyeong, '문경 hub');
const mungyeongLists = listsForHub('mungyeong');
assert.ok(mungyeongLists.length >= 1, '문경 팔경 list');
const firstMember = localScenicMemberToSuggestion(
  mungyeongLists[0],
  mungyeong,
  mungyeongLists[0].members[0],
);
assert.equal(firstMember?.rankBlurb, '문경 1경');
assert.equal(firstMember?.groupTitle, '문경 팔경');
assert.ok(firstMember?.imageUrl, '문경 1경 새재계곡 overlay thumb');

const jinnam = localScenicMemberToSuggestion(
  mungyeongLists[0],
  mungyeong,
  mungyeongLists[0].members.find((m) => m.attractionName === '진남교반'),
);
assert.ok(jinnam?.imageUrl, '문경 진남교반 GATEO curated thumb');

const ssangyong = enrichSearchCandidateScenicMedia({
  name: '쌍용계곡',
  hubId: 'mungyeong',
  kind: 'attraction',
});
assert.ok(ssangyong?.imageUrl, '문경 쌍용계곡 explore enrich gets palgyeong overlay');

const saejaeGateo = enrichSearchCandidateScenicMedia({
  name: '문경새재',
  hubId: 'mungyeong',
  kind: 'attraction',
});
assert.ok(saejaeGateo?.imageUrl, '문경새재 GATEO curated thumb on explore enrich');

const seonyudong = localScenicMemberToSuggestion(
  mungyeongLists[0],
  mungyeong,
  mungyeongLists[0].members.find((m) => m.attractionName === '선유동계곡'),
);
assert.ok(seonyudong?.imageUrl, '문경 2경 선유동계곡 overlay thumb');

const yongchu = localScenicMemberToSuggestion(
  mungyeongLists[0],
  mungyeong,
  mungyeongLists[0].members.find((m) => m.attractionName === '용추계곡'),
);
assert.ok(yongchu?.imageUrl, '문경 3경 용추계곡 overlay thumb');

const gyeongcheon = localScenicMemberToSuggestion(
  mungyeongLists[0],
  mungyeong,
  mungyeongLists[0].members.find((m) => m.attractionName === '경천호'),
);
assert.ok(gyeongcheon?.imageUrl, '문경 7경 경천호 overlay thumb');

const museum = enrichSearchCandidateScenicMedia({
  name: '문경석탄박물관',
  hubId: 'mungyeong',
  kind: 'attraction',
});
assert.equal(museum?.contentId, '2599737', '문경석탄박물관 curated contentId for TourAPI thumb');
assert.ok(museum?.imageUrl, '문경석탄박물관 contentId overlay thumb');
assert.equal(hubAttractionSearchGroupTitle(mungyeong), '', '문경 keeps palgyeong group only');

const cards = makeDisambiguationResult('옹진', candidates, {
  title: `'${hub.name}' → 도시와 명소를 골라주세요`,
});
assert.equal(isSearchDisambiguation(cards), true);
assert.match(String(cards.title || ''), /도시와 명소를 골라주세요/);

const suggestionListSrc = readFileSync(
  join(root, 'src/pages/Home/components/SearchDiscovery/SearchSuggestionList.jsx'),
  'utf8',
);
assert.doesNotMatch(suggestionListSrc, /grid-cols-1 sm:grid-cols-2/);
assert.match(suggestionListSrc, /rankBlurb/);
assert.match(suggestionListSrc, /SearchResultThumb/);
assert.match(suggestionListSrc, /function useMissingTourAttractionThumbs/);
assert.match(suggestionListSrc, /resolveSearchScenicMedia/);

const qa = readFileSync(join(root, 'src/shared/cloudPreview/cloudQaShareLinks.js'), 'utf8');
assert.match(qa, /slug:\s*'explore-search'/);
assert.match(qa, /cursor\/explore-search-d14b/);
const vercel = readFileSync(join(root, 'vercel.json'), 'utf8');
assert.match(vercel, /\/qa\/explore-search/);
assert.match(vercel, /days-git-cursor-explore-search-d14b/);

console.log(
  `PASS explore-choice-overlay (옹진 hub + ${candidates.length} choice cards, dropdown gated)`,
);
