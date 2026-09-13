#!/usr/bin/env node
/**
 * 축제·명승 본문 마이리얼트립 투어·티켓 카드 섹션 스모크 테스트.
 *
 *   node scripts/smoke-korea-tna-strip.mjs
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { listKoreaScenicSpots } from '../src/pages/Home/lib/koreaScenicSpots.js';
import {
  resolveFestivalThemeCrossLinks,
  resolveThemeCrossLinks,
} from '../src/pages/Home/lib/koreaThemeCrossLinks.js';
import { canShowMrtTnaStrip, resolveMrtTnaQuery } from '../src/utils/mrtTnaQuery.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

const festivalSheetSrc = readFileSync(
  join(root, 'src/pages/Korea/FestivalDetailSheet.jsx'),
  'utf8',
);
const themeModalSrc = readFileSync(
  join(root, 'src/pages/KoreaTheme/ThemeSpotDetailModal.jsx'),
  'utf8',
);
const festivalTnaSrc = readFileSync(
  join(root, 'src/pages/Korea/FestivalTnaStrip.jsx'),
  'utf8',
);
const scenicTnaSrc = readFileSync(
  join(root, 'src/pages/KoreaTheme/ScenicTnaStrip.jsx'),
  'utf8',
);
const eventTnaSrc = readFileSync(
  join(root, 'src/pages/WorldEvents/EventTnaStrip.jsx'),
  'utf8',
);
const affiliateSrc = readFileSync(join(root, 'src/utils/affiliate.js'), 'utf8');
const koSrc = readFileSync(join(root, 'src/i18n/locales/ko.json'), 'utf8');
const enSrc = readFileSync(join(root, 'src/i18n/locales/en.json'), 'utf8');

// 1. 컴포넌트 연결 검증
assert.match(
  festivalSheetSrc,
  /import FestivalTnaStrip from '\.\/FestivalTnaStrip';/,
  'FestivalDetailSheet imports FestivalTnaStrip',
);
assert.match(
  festivalSheetSrc,
  /<FestivalTnaStrip/,
  'FestivalDetailSheet renders FestivalTnaStrip JSX',
);
assert.match(
  themeModalSrc,
  /import ScenicTnaStrip from '\.\/ScenicTnaStrip';/,
  'ThemeSpotDetailModal imports ScenicTnaStrip',
);
assert.match(
  themeModalSrc,
  /<ScenicTnaStrip/,
  'ThemeSpotDetailModal renders ScenicTnaStrip JSX',
);
assert.match(
  themeModalSrc,
  /hideTnaStrip=\{isApiPoiCross\}/,
  'ThemeSpotDetailModal hides TNA strip for nested POI modals',
);
assert.match(
  themeModalSrc,
  /!showTnaStrip && cross\.tna\?\.keyword/,
  'ThemeSpotCrossRail only renders fallback tna chip when strip is hidden',
);

// 2. 위치 순서 검증 (StayStrip 바로 다음 위치)
{
  const stayIdx = festivalSheetSrc.indexOf('<FestivalStayStrip');
  const tnaIdx = festivalSheetSrc.indexOf('<FestivalTnaStrip');
  assert.ok(stayIdx >= 0 && tnaIdx >= 0, 'both strips exist in FestivalDetailSheet');
  assert.ok(stayIdx < tnaIdx, 'FestivalTnaStrip renders after FestivalStayStrip');
}
{
  const stayIdx = themeModalSrc.indexOf('<ScenicStayStrip');
  const tnaIdx = themeModalSrc.indexOf('<ScenicTnaStrip');
  const readMoreIdx = themeModalSrc.indexOf('korea.theme.spotDetail.readMore');
  assert.ok(stayIdx >= 0 && tnaIdx >= 0, 'both strips exist in ThemeSpotDetailModal');
  assert.ok(stayIdx < tnaIdx, 'ScenicTnaStrip renders after ScenicStayStrip');
  assert.ok(tnaIdx < readMoreIdx, 'ScenicTnaStrip renders before readMore section');
}

// 3. 컴포넌트 구현 검증
assert.match(festivalTnaSrc, /EventTnaStrip/, 'FestivalTnaStrip uses EventTnaStrip');
assert.match(scenicTnaSrc, /EventTnaStrip/, 'ScenicTnaStrip uses EventTnaStrip');
assert.match(eventTnaSrc, /buildMrtTnaProductUrl/, 'EventTnaStrip uses buildMrtTnaProductUrl');
assert.match(eventTnaSrc, /buildMrtTnaSearchMoreUrl/, 'EventTnaStrip uses buildMrtTnaSearchMoreUrl');
assert.match(eventTnaSrc, /canShowMrtTnaStrip/, 'EventTnaStrip checks canShowMrtTnaStrip');
assert.match(eventTnaSrc, /MRT_TNA_FETCH_SIZE/, 'EventTnaStrip requests default TNA fetch size (20)');
assert.match(eventTnaSrc, /StripListLargeToggle/, 'EventTnaStrip has 크게 보기 toggle');
assert.match(eventTnaSrc, /listLarge/, 'EventTnaStrip enlarges cards in the same rail');
assert.match(eventTnaSrc, /overflow-x-auto/, 'EventTnaStrip keeps horizontal scroll when enlarged');
assert.match(eventTnaSrc, /w-\[220px\]/, 'EventTnaStrip large cards are wider, not a vertical stack');
assert.doesNotMatch(eventTnaSrc, /grid-cols-1/, 'EventTnaStrip large view does not switch to vertical grid');
assert.match(
  eventTnaSrc,
  /getKlookSearchUrl\(chipPlace,\s*locale\)/,
  'EventTnaStrip builds Klook activities URL from place label, not event title',
);
assert.match(
  eventTnaSrc,
  /getMrtDomesticRentalUrl\(\)/,
  'EventTnaStrip uses MyRealTrip domestic rental landing',
);
assert.match(
  eventTnaSrc,
  /getTripcomTrainUrl/,
  'EventTnaStrip builds Trip.com train URL',
);
assert.match(eventTnaSrc, /klookActivities/, 'EventTnaStrip renders klookActivities chip');
assert.match(eventTnaSrc, /tnaStrip\.rental/, 'EventTnaStrip renders rental chip');
assert.match(eventTnaSrc, /tnaStrip\.train/, 'EventTnaStrip renders train chip');
assert.match(
  eventTnaSrc,
  /TnaOutboundChips/,
  'EventTnaStrip keeps outbound chips below the MRT card rail and empty state',
);
assert.doesNotMatch(
  eventTnaSrc,
  /getKlookRentalUrlByLocation/,
  'EventTnaStrip no longer uses Klook rental for Korea scenic/festival',
);
assert.doesNotMatch(eventTnaSrc, /최저가 비교/, 'EventTnaStrip rental copy is not price-compare');

// 4. i18n 다국어 검증
assert.match(koSrc, /"tnaStripTitle"/, 'ko.json has tnaStripTitle');
assert.match(koSrc, /"tnaStripHint"/, 'ko.json has tnaStripHint');
assert.match(koSrc, /"tnaStrip": \{/, 'ko.json has worldEventDetail.tnaStrip');
assert.match(koSrc, /"klookActivities": "{{place}} 즐길거리 클룩에서 더보기"/, 'ko.json has klookActivities');
assert.match(koSrc, /"rental": "{{place}} 렌터카 보기"/, 'ko.json has rental chip without price compare');
assert.match(koSrc, /"train": "{{place}} 기차표 보기"/, 'ko.json has train chip');
assert.doesNotMatch(koSrc, /렌터카 최저가 비교/, 'ko.json dropped rental price-compare copy');
assert.match(enSrc, /"tnaStripTitle"/, 'en.json has tnaStripTitle');
assert.match(enSrc, /"tnaStripHint"/, 'en.json has tnaStripHint');
assert.match(enSrc, /"tnaStrip": \{/, 'en.json has worldEventDetail.tnaStrip');
assert.match(enSrc, /"klookActivities": "Explore {{place}} activities on Klook"/, 'en.json has klookActivities');
assert.match(enSrc, /"rental": "{{place}} rental cars"/, 'en.json has rental chip');
assert.match(enSrc, /"train": "{{place}} train tickets"/, 'en.json has train chip');
assert.doesNotMatch(enSrc, /Compare \{\{place\}\} rental cars on Klook/, 'en.json dropped Klook rental compare copy');

// 5. 런타임 crossLinks 및 canShowMrtTnaStrip 검증
const scenicSpots = listKoreaScenicSpots();
assert.ok(scenicSpots.length > 0, 'scenic spots exist');

const gyeongbokgung = scenicSpots.find((s) => s.id === 'gyeongbokgung' || s.placeSlug === 'gyeongbokgung');
assert.ok(gyeongbokgung, 'gyeongbokgung scenic spot found');

const scenicCross = resolveThemeCrossLinks({
  hubId: gyeongbokgung.hubId,
  placeSlug: gyeongbokgung.placeSlug,
  name: gyeongbokgung.name,
  region: gyeongbokgung.region,
});
assert.ok(scenicCross.tna, 'scenic spot cross link has tna');
assert.ok(scenicCross.tna.keyword, 'scenic spot tna has keyword');
assert.ok(scenicCross.tna.location, 'scenic spot tna has location');
assert.equal(canShowMrtTnaStrip(scenicCross.tna.location), true, 'scenic spot location is eligible for TNA strip');

// 축제 crossLinks 검증
const sampleFestivalItem = {
  contentId: '12345',
  title: '강릉 커피축제',
  addr1: '강원특별자치도 강릉시 난설헌로 131',
  mapx: 128.91,
  mapy: 37.79,
  areaCode: '32',
};
const festivalCross = resolveFestivalThemeCrossLinks(sampleFestivalItem);
assert.ok(festivalCross.tna, 'festival cross link has tna');
assert.ok(festivalCross.tna.keyword, 'festival tna has keyword');
assert.equal(canShowMrtTnaStrip(festivalCross.tna.location || festivalCross.stay.location), true, 'festival is eligible for TNA strip');
assert.notEqual(festivalCross.tna.keyword, sampleFestivalItem.title, 'festival tna keyword is hub, not event title');

const royalWalkTna = resolveFestivalThemeCrossLinks({
  contentId: 'royal-walk',
  title: '왕가의 산책',
  addr1: '인천광역시 중구 공항로 272 (운서동)',
  mapx: 126.4407,
  mapy: 37.4602,
  areaCode: '2',
});
assert.equal(royalWalkTna.tna?.keyword, '인천', `왕가의 산책 tna keyword (got ${royalWalkTna.tna?.keyword})`);
assert.notEqual(royalWalkTna.tna?.keyword, '왕가의 산책', '왕가의 산책 must not search by event title');
assert.ok(
  !(royalWalkTna.tna?.altKeywords || []).includes('왕가의 산책'),
  '왕가의 산책 altKeywords exclude event title',
);
assert.equal(royalWalkTna.stay?.keyword, '인천', `왕가의 산책 stay keyword (got ${royalWalkTna.stay?.keyword})`);
assert.notEqual(royalWalkTna.stay?.keyword, '옹진', '왕가의 산책 stay is not 옹진');
assert.ok(
  (royalWalkTna.stayAreas || []).length >= 2,
  `왕가의 산책 stayAreas lists parent/adjacent cities (got ${royalWalkTna.stayAreas?.length})`,
);

assert.match(
  festivalTnaSrc,
  /location\?\.hubId/,
  'FestivalTnaStrip labels chips from stay/tna hub, not nearest geo hub',
);
assert.match(
  readFileSync(join(root, 'src/pages/Korea/FestivalStayStrip.jsx'), 'utf8'),
  /stayAreas=\{stayAreas\}/,
  'FestivalStayStrip passes parent/adjacent stayAreas into EventStayStrip',
);

assert.match(
  affiliateSrc,
  /rentalcars\?category=domestic/,
  'affiliate MRT domestic rental landing',
);
assert.match(affiliateSrc, /export function getMrtDomesticRentalUrl/, 'affiliate exports getMrtDomesticRentalUrl');
assert.match(affiliateSrc, /export function getTripcomTrainUrl/, 'affiliate exports getTripcomTrainUrl');
assert.match(affiliateSrc, /\$\{origin\}\/trains\/\?/, 'affiliate Trip.com trains path');

console.log('OK smoke-korea-tna-strip: all assertions passed.');
