import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

test('partner booking handoff CTA stays external (no GATEO checkout)', () => {
  const src = readFileSync(
    join(root, 'src/shared/affiliate/PartnerBookingHandoff.jsx'),
    'utf8',
  );
  expect(src).toMatch(/target="_blank"/);
  expect(src).toMatch(/data-partner-booking-handoff="cta"/);
  expect(src).not.toMatch(/gateo\.kr\/(pay|checkout|book)/i);
  expect(src).not.toMatch(/예약하기/);
});

test('stay and tour card strips wire booking handoff', () => {
  const stayCardLink = readFileSync(
    join(root, 'src/shared/affiliate/StayCardBookingLink.jsx'),
    'utf8',
  );
  const tourCardLink = readFileSync(
    join(root, 'src/shared/affiliate/TourCardBookingLink.jsx'),
    'utf8',
  );
  const eventStay = readFileSync(
    join(root, 'src/pages/WorldEvents/EventStayStrip.jsx'),
    'utf8',
  );
  const eventTna = readFileSync(
    join(root, 'src/pages/WorldEvents/EventTnaStrip.jsx'),
    'utf8',
  );
  const mrtTna = readFileSync(
    join(
      root,
      'src/components/PlaceCard/tabs/planner/components/MrtTnaActivitiesWidget.jsx',
    ),
    'utf8',
  );
  expect(stayCardLink).toMatch(/data-partner-booking-handoff="cta"/);
  expect(tourCardLink).toMatch(/data-partner-booking-handoff="cta"/);
  expect(eventStay).toContain('StayCardBookingLink');
  expect(eventStay).not.toMatch(/PartnerBookingHandoff[\s\S]*kind="lodging"/);
  expect(eventTna).toContain('TourCardBookingLink');
  expect(eventTna).not.toMatch(/PartnerBookingHandoff[\s\S]*kind="tour"/);
  expect(mrtTna).toContain('TourCardBookingLink');
  expect(mrtTna).not.toMatch(/PartnerBookingHandoff[\s\S]*kind="tour"/);
});
