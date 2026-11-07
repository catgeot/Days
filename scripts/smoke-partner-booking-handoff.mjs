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
  stayCardBookingAccessibleName,
  tourCardBookingAccessibleName,
} from '../src/shared/affiliate/partnerBookingHandoff.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

const paths = {
  handoffJs: join(root, 'src/shared/affiliate/partnerBookingHandoff.js'),
  handoffJsx: join(root, 'src/shared/affiliate/PartnerBookingHandoff.jsx'),
  stayCardLink: join(root, 'src/shared/affiliate/StayCardBookingLink.jsx'),
  tourCardLink: join(root, 'src/shared/affiliate/TourCardBookingLink.jsx'),
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
const stayCardLink = readFileSync(paths.stayCardLink, 'utf8');
const tourCardLink = readFileSync(paths.tourCardLink, 'utf8');
const eventStay = readFileSync(paths.eventStay, 'utf8');
const eventTna = readFileSync(paths.eventTna, 'utf8');
const globeStay = readFileSync(paths.globeStay, 'utf8');
const mrtTnaWidget = readFileSync(paths.mrtTnaWidget, 'utf8');
const ko = readFileSync(paths.ko, 'utf8');

assert.match(handoffJsx, /data-partner-booking-handoff="cta"/, 'handoff CTA marker');
assert.match(handoffJsx, /target="_blank"/, 'handoff opens external tab');
assert.doesNotMatch(handoffJsx, /gateo\.kr\/pay|checkout|결제창/i, 'no in-GATEO payment UI');

assert.match(globeStay, /StayCardBookingLink/, 'GlobeStayStrip card uses StayCardBookingLink');
assert.match(eventStay, /StayCardBookingLink/, 'EventStayStrip card uses StayCardBookingLink');
assert.match(eventTna, /TourCardBookingLink/, 'EventTnaStrip card uses TourCardBookingLink');
assert.match(mrtTnaWidget, /TourCardBookingLink/, 'MrtTnaActivitiesWidget card uses TourCardBookingLink');
assert.match(stayCardLink, /data-partner-booking-handoff="cta"/, 'StayCardBookingLink booking marker');
assert.match(tourCardLink, /data-partner-booking-handoff="cta"/, 'TourCardBookingLink booking marker');
assert.match(stayCardLink, /rel="noopener noreferrer sponsored"/, 'StayCardBookingLink sponsored rel');
assert.match(tourCardLink, /rel="noopener noreferrer sponsored"/, 'TourCardBookingLink sponsored rel');

assert.match(eventStay, /StayListPartnerNotice/, 'EventStayStrip list-level partner notice');
assert.doesNotMatch(eventStay, /PartnerBookingHandoff[\s\S]*kind="lodging"/, 'EventStayStrip card no PartnerBookingHandoff CTA');
assert.match(eventTna, /StayListPartnerNotice/, 'EventTnaStrip list-level partner notice');
assert.doesNotMatch(eventTna, /PartnerBookingHandoff[\s\S]*kind="tour"/, 'EventTnaStrip card no PartnerBookingHandoff CTA');
assert.match(mrtTnaWidget, /StayListPartnerNotice/, 'MrtTnaActivitiesWidget list-level partner notice');
assert.doesNotMatch(mrtTnaWidget, /PartnerBookingHandoff[\s\S]*kind="tour"/, 'MrtTnaActivitiesWidget card no PartnerBookingHandoff CTA');
assert.match(globeStay, /StayListPartnerNotice/, 'GlobeStayStrip list-level partner notice');
assert.doesNotMatch(globeStay, /PartnerBookingHandoff[\s\S]*kind="lodging"/, 'GlobeStayStrip card no PartnerBookingHandoff CTA');

assert.match(ko, /파트너 예약 페이지로 이동합니다 · 가격·잔여석은 그쪽 기준/, 'ko notice default');
assert.match(ko, /호텔 보고 예약 시작/, 'ko lodging hotel CTA');
assert.match(ko, /ctaLodgingHotelNamed/, 'ko named lodging aria i18n');
assert.match(ko, /상품 보고 예약 시작/, 'ko tour CTA');
assert.match(ko, /ctaTourProductNamed/, 'ko named tour aria i18n');

for (const forbidden of PARTNER_BOOKING_HANDOFF_FORBIDDEN_CTA) {
  assert.doesNotMatch(
    handoffJsx,
    new RegExp(forbidden.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')),
    `handoff component avoids forbidden copy: ${forbidden}`,
  );
}

assert.equal(resolveLodgingHandoffVariant({ itemName: '서울 호텔' }), 'lodging-hotel');
assert.equal(resolveLodgingHandoffVariant({ itemName: '제주 펜션' }), 'lodging-mixed');
assert.match(
  stayCardBookingAccessibleName({ itemName: 'KEX 호텔' }, (k) =>
    k === 'partnerBookingHandoff.ctaLodgingHotelNamed'
      ? 'KEX 호텔 — 호텔 보고 예약 시작'
      : '호텔 보고 예약 시작',
  ),
  /KEX 호텔/,
  'stay card aria includes hotel name',
);
assert.match(
  tourCardBookingAccessibleName(
    { itemName: '해운대 야경 투어' },
    (k) =>
      k === 'partnerBookingHandoff.ctaTourProductNamed'
        ? '해운대 야경 투어 — 상품 보고 예약 시작'
        : '상품 보고 예약 시작',
  ),
  /해운대 야경 투어/,
  'tour card aria includes product name',
);

console.log('OK smoke:partner-booking-handoff');
