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
assert.match(eventTnaSrc, /listLarge/, 'EventTnaStrip expands cards into a vertical grid');
assert.match(eventTnaSrc, /grid-cols-1 gap-2\.5 sm:grid-cols-2/, 'EventTnaStrip large view stacks cards for vertical scroll');

// 4. i18n 다국어 검증
assert.match(koSrc, /"tnaStripTitle"/, 'ko.json has tnaStripTitle');
assert.match(koSrc, /"tnaStripHint"/, 'ko.json has tnaStripHint');
assert.match(koSrc, /"tnaStrip": \{/, 'ko.json has worldEventDetail.tnaStrip');
assert.match(enSrc, /"tnaStripTitle"/, 'en.json has tnaStripTitle');
assert.match(enSrc, /"tnaStripHint"/, 'en.json has tnaStripHint');
assert.match(enSrc, /"tnaStrip": \{/, 'en.json has worldEventDetail.tnaStrip');

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

console.log('OK smoke-korea-tna-strip: all assertions passed.');
