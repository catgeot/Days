#!/usr/bin/env node
/**
 * Partner booking handoff — 숙소·투어 카드 고지·CTA · 외부 URL only.
 *
 *   npm run smoke:partner-booking-handoff
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  PARTNER_BOOKING_HANDOFF_FORBIDDEN_CTA,
  resolveLodgingHandoffVariant,
} from '../src/shared/affiliate/partnerBookingHandoff.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

const paths = {
  handoffJs: join(root, 'src/shared/affiliate/partnerBookingHandoff.js'),
  handoffJsx: join(root, 'src/shared/affiliate/PartnerBookingHandoff.jsx'),
  eventStay: join(root, 'src/pages/WorldEvents/EventStayStrip.jsx'),
  eventTna: join(root, 'src/pages/WorldEvents/EventTnaStrip.jsx'),
  globeStay: join(root, 'src/pages/Home/components/GlobeStayStrip.jsx'),
  mrtTnaWidget: join(
    root,
    'src/components/PlaceCard/tabs/planner/components/MrtTnaActivitiesWidget.jsx',
  ),
  ko: join(root, 'src/i18n/locales/ko.json'),
};

for (const [label, p] of Object.entries(paths)) {
  assert.ok(readFileSync(p, 'utf8').length > 0, `${label} readable`);
}

const handoffJsx = readFileSync(paths.handoffJsx, 'utf8');
const eventStay = readFileSync(paths.eventStay, 'utf8');
const eventTna = readFileSync(paths.eventTna, 'utf8');
const globeStay = readFileSync(paths.globeStay, 'utf8');
const mrtTnaWidget = readFileSync(paths.mrtTnaWidget, 'utf8');
const ko = readFileSync(paths.ko, 'utf8');

assert.match(handoffJsx, /data-partner-booking-handoff="cta"/, 'handoff CTA marker');
assert.match(handoffJsx, /target="_blank"/, 'handoff opens external tab');
assert.doesNotMatch(handoffJsx, /gateo\.kr\/pay|checkout|결제창/i, 'no in-GATEO payment UI');

for (const src of [eventStay, eventTna, globeStay, mrtTnaWidget]) {
  assert.match(src, /PartnerBookingHandoff/, 'card strip uses PartnerBookingHandoff');
}

assert.match(eventStay, /kind="lodging"/, 'EventStayStrip lodging handoff kind');
assert.match(eventTna, /kind="tour"/, 'EventTnaStrip tour handoff kind');
assert.match(globeStay, /kind="lodging"/, 'GlobeStayStrip lodging handoff kind');
assert.match(mrtTnaWidget, /kind="tour"/, 'MrtTnaActivitiesWidget tour handoff kind');

assert.match(ko, /파트너 예약 페이지로 이동합니다 · 가격·잔여석은 그쪽 기준/, 'ko notice default');
assert.match(ko, /호텔 보고 예약 시작/, 'ko lodging hotel CTA');
assert.match(ko, /상품 보고 예약 시작/, 'ko tour CTA');

for (const forbidden of PARTNER_BOOKING_HANDOFF_FORBIDDEN_CTA) {
  assert.doesNotMatch(
    handoffJsx,
    new RegExp(forbidden.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')),
    `handoff component avoids forbidden copy: ${forbidden}`,
  );
}

assert.equal(resolveLodgingHandoffVariant({ itemName: '서울 호텔' }), 'lodging-hotel');
assert.equal(resolveLodgingHandoffVariant({ itemName: '제주 펜션' }), 'lodging-mixed');

console.log('OK smoke:partner-booking-handoff');
