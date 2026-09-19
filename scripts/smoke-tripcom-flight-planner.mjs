/**
 * 플래너 Trip.com 항공권 검색 — iframe 공백 대신 CTA·툴킷 배너.
 *   npm run smoke:tripcom-flight-planner
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (rel) => readFileSync(join(root, rel), 'utf8');

const affiliate = read('src/utils/affiliate.js');
assert.match(affiliate, /iframeEmbedUsable:\s*false/, 'iframe embed off');
assert.match(affiliate, /adId:\s*'S17104971'/, 'desktop ad id kept');
assert.match(affiliate, /mobileAdId:\s*'S17158794'/, 'mobile ad id kept');
assert.match(
  affiliate,
  /export function buildTripcomPlannerFlightUrl/,
  'flight URL builder',
);

const nav = read('src/components/PlaceCard/common/partnerNavigation.js');
assert.match(
  nav,
  /iframeEmbedUsable !== true[\s\S]*return false/,
  'modal off while iframe unusable',
);

const widget = read(
  'src/components/PlaceCard/tabs/planner/components/TripcomFlightBannerWidget.jsx',
);
assert.match(widget, /iframeEmbedUsable !== true/, 'banner widget CTA fallback');
assert.match(widget, /data-tripcom-flight-banner="cta"/, 'cta marker');
assert.match(widget, /<FlightSearchCta /, 'checklist uses FlightSearchCta');
assert.match(widget, /<WhiteLabelWidget/, 'checklist uses WhiteLabelWidget');

const planner = read('src/components/PlaceCard/tabs/PlannerTab.jsx');
assert.doesNotMatch(
  planner,
  /omitFlightSearchCta/,
  '항공권 카드 검색 배너 생략 금지',
);
assert.match(planner, /<TripcomFlightBannerWidget/, '필수 툴킷 항공 검색 유지');

const toolkit = read(
  'src/components/PlaceCard/tabs/planner/components/ToolkitCard.jsx',
);
assert.match(toolkit, /omitFlightSearchCta = false/, 'toolkit CTA default on');
assert.match(toolkit, /<FlightSearchCta /, 'toolkit FlightSearchCta');

const vercel = read('vercel.json');
assert.match(vercel, /\/qa\/tripcom-flight/, 'vercel.json /qa/tripcom-flight');
assert.match(
  vercel,
  /days-git-cursor-tripcom-flight-widget-3ec3-catgeots-projects\.vercel\.app\/place\/paris\/planner/,
  'qa/tripcom-flight git Preview',
);

const qa = read('src/shared/cloudPreview/cloudQaShareLinks.js');
assert.match(qa, /slug: 'tripcom-flight'/, 'qa share slug');
assert.match(qa, /branch:\s*'cursor\/tripcom-flight-widget-3ec3'/, 'qa share branch');

console.log('OK: tripcom-flight-planner — CTA fallback · toolkit banner · /qa/tripcom-flight');
console.log('SMOKE OK');
