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

test('stay and tour card strips wire PartnerBookingHandoff', () => {
  const eventStay = readFileSync(
    join(root, 'src/pages/WorldEvents/EventStayStrip.jsx'),
    'utf8',
  );
  const eventTna = readFileSync(
    join(root, 'src/pages/WorldEvents/EventTnaStrip.jsx'),
    'utf8',
  );
  expect(eventStay).toContain('PartnerBookingHandoff');
  expect(eventStay).toContain('kind="lodging"');
  expect(eventTna).toContain('PartnerBookingHandoff');
  expect(eventTna).toContain('kind="tour"');
});
