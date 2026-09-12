#!/usr/bin/env node
/**
 * 명승 본문 — ScenicStayStrip (축제 FestivalStayStrip과 동일 EventStayStrip).
 *
 *   npm run smoke:korea-scenic-stay
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { listKoreaScenicSpots } from '../src/pages/Home/lib/koreaScenicSpots.js';
import { resolveThemeCrossLinks } from '../src/pages/Home/lib/koreaThemeCrossLinks.js';
import { canShowMrtStayStrip } from '../src/utils/mrtStayQuery.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

const modalSrc = readFileSync(
  join(root, 'src/pages/KoreaTheme/ThemeSpotDetailModal.jsx'),
  'utf8',
);
const stripSrc = readFileSync(
  join(root, 'src/pages/KoreaTheme/ScenicStayStrip.jsx'),
  'utf8',
);
const eventStripSrc = readFileSync(
  join(root, 'src/pages/WorldEvents/EventStayStrip.jsx'),
  'utf8',
);
const festivalStripSrc = readFileSync(
  join(root, 'src/pages/Korea/FestivalStayStrip.jsx'),
  'utf8',
);
const koSrc = readFileSync(join(root, 'src/i18n/locales/ko.json'), 'utf8');
const qaSrc = readFileSync(
  join(root, 'src/shared/cloudPreview/cloudQaShareLinks.js'),
  'utf8',
);
const vercelSrc = readFileSync(join(root, 'vercel.json'), 'utf8');

assert.match(modalSrc, /ScenicStayStrip/, 'ThemeSpotDetailModal renders ScenicStayStrip');
assert.match(modalSrc, /hideStayStrip/, 'ThemeSpotDetailModal can hide stay strip on POI nested');
assert.match(
  modalSrc,
  /hideStayStrip=\{isApiPoiCross\}/,
  'food/leports/culture nested modals hide stay strip',
);
assert.match(
  modalSrc,
  /!showStayStrip && cross\.stay\?\.keyword/,
  'stay keyword chip only when strip is hidden',
);
{
  const stayJsx = modalSrc.indexOf('<ScenicStayStrip');
  const foodKey = modalSrc.indexOf("korea.theme.spotDetail.nearFood");
  assert.ok(stayJsx >= 0, 'stay strip JSX is in ThemeSpotDetailModal');
  assert.ok(
    stayJsx < foodKey,
    'stay strip is above nearby food (before nearby rails)',
  );
}
assert.match(modalSrc, /GoogleOutboundButton/, 'Google outbound button next to Naver');
assert.match(modalSrc, /spotGoogleSearchUrl/, 'Google search URL uses the same query as Naver');
assert.match(koSrc, /"googleSearchAria"/, 'ko i18n has scenic Google search aria');
assert.doesNotMatch(
  stripSrc,
  /tripWindowPresetsFromEvent/,
  'ScenicStayStrip does not use festival trip presets',
);
assert.match(stripSrc, /EventStayStrip/, 'ScenicStayStrip reuses EventStayStrip');
assert.match(stripSrc, /normalizeMrtStayDates/, 'ScenicStayStrip uses default MRT stay dates');
assert.match(
  eventStripSrc,
  /title \|\| t\('worldEventDetail\.stayStrip\.title'\)/,
  'EventStayStrip supports title override',
);
assert.match(eventStripSrc, /MRT_STAY_PAGE_SIZE/, 'EventStayStrip shows default stay page size (20)');
assert.match(eventStripSrc, /StripListLargeToggle/, 'EventStayStrip has 크게 보기 toggle');
assert.match(eventStripSrc, /listLarge/, 'EventStayStrip enlarges cards in the same rail');
assert.match(eventStripSrc, /overflow-x-auto/, 'EventStayStrip keeps horizontal scroll when enlarged');
assert.match(eventStripSrc, /w-\[220px\]/, 'EventStayStrip large cards are wider, not a vertical stack');
assert.doesNotMatch(eventStripSrc, /grid-cols-1/, 'EventStayStrip large view does not switch to vertical grid');
assert.match(festivalStripSrc, /EventStayStrip/, 'FestivalStayStrip still reuses EventStayStrip');
assert.match(koSrc, /"stayStripHint"/, 'ko i18n has scenic stay strip hint');
assert.match(qaSrc, /slug:\s*'scenic-stay'/, 'cloudQaShareLinks has scenic-stay slug');
assert.match(qaSrc, /cursor\/scenic-stay-692c/, 'cloudQaShareLinks scenic-stay uses feature branch');
assert.match(vercelSrc, /"\/qa\/scenic-stay"/, 'vercel.json redirects /qa/scenic-stay');

const gyeongbokgung = listKoreaScenicSpots().find((s) => s.id === 'gyeongbokgung');
assert.ok(gyeongbokgung, 'gyeongbokgung scenic spot exists');
const bundle = resolveThemeCrossLinks(gyeongbokgung);
assert.ok(bundle.stay?.location, 'gyeongbokgung stay location resolved');
assert.ok(bundle.stay?.keyword, `gyeongbokgung stay keyword (got ${bundle.stay?.keyword})`);
assert.equal(
  canShowMrtStayStrip(bundle.stay.location),
  true,
  'gyeongbokgung location is eligible for MRT stay strip',
);

console.log('smoke-korea-scenic-stay: all assertions passed');
