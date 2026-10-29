import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
import { CAIRO_CITY_FACTS } from '../../src/data/placeVerifiedFacts/cairo.js';
import {
  freshnessOf,
  freshnessTier,
  formatCheckedChipDate,
  isIsoDateString,
  CONSULAR_CALL_CENTER_DISPLAY,
  CONSULAR_CALL_CENTER_TEL,
  mofaOverseasSafetyUrl,
  seoulTodayYmd,
  splitConsularCallCenter,
} from '../../src/data/placeVerifiedFacts/freshness.js';
import { localInfoRegistry } from '../../src/data/placeVerifiedFacts/index.js';
import { PARIS_CITY_FACTS } from '../../src/data/placeVerifiedFacts/paris.js';

const parisSafety = PARIS_CITY_FACTS.slots.find((slot) => slot.id === 'safety');
const cairoMoney = CAIRO_CITY_FACTS.slots.find((slot) => slot.id === 'money-safety');
const cairoSafety = CAIRO_CITY_FACTS.slots.find((slot) => slot.id === 'safety');

test('event freshness bands use KST calendar days (Paris safety)', () => {
  assert.equal(parisSafety.kind, 'event');
  assert.equal(parisSafety.checkedOn, '2026-10-29');
  assert.equal(parisSafety.endsAt, '2026-11-05');

  assert.equal(freshnessTier(parisSafety, '2026-10-29'), 'fresh');
  assert.equal(freshnessTier(parisSafety, '2026-11-02'), 'fresh');
  assert.equal(freshnessTier(parisSafety, '2026-11-05'), 'fresh');
  assert.equal(freshnessTier(parisSafety, '2026-11-06'), 'hidden');

  const warn = freshnessOf(parisSafety, '2026-11-05');
  assert.equal(warn.tier, 'fresh');
  assert.equal(warn.ageDays, 7);
});

test('standing freshness bands (Cairo safety row)', () => {
  assert.equal(cairoMoney.kind, 'standing');
  assert.equal(cairoMoney.checkedOn, null);
  assert.equal(cairoMoney.checkedAt, '');
  assert.equal(freshnessTier(cairoMoney, '2027-06-01'), 'none');
  assert.equal(cairoSafety.kind, 'standing');
  assert.equal(cairoSafety.checkedOn, '2026-10-29');

  assert.equal(freshnessTier(cairoSafety, '2026-11-28'), 'fresh');
  assert.equal(freshnessTier(cairoSafety, '2026-11-29'), 'warn');
  assert.equal(freshnessTier(cairoSafety, '2027-01-27'), 'warn');
  assert.equal(freshnessTier(cairoSafety, '2027-01-28'), 'hidden');
});

test('endsAt forces hidden even when checkedOn is fresh', () => {
  const slot = {
    kind: 'event',
    checkedOn: '2026-10-22',
    endsAt: '2026-10-25',
    sources: [{ url: 'https://www.0404.go.kr/' }],
  };
  assert.equal(freshnessTier(slot, '2026-10-25'), 'fresh');
  assert.equal(freshnessTier(slot, '2026-10-26'), 'hidden');
});

test('slots without kind stay on legacy meta path', () => {
  const entry = PARIS_CITY_FACTS.slots.find((slot) => slot.id === 'entry');
  assert.equal(entry.kind, null);
  assert.equal(freshnessTier(entry, '2030-01-01'), 'none');
});

test('checked chip date and MOFA URL helpers', () => {
  assert.equal(isIsoDateString('2026-10-22'), true);
  assert.equal(isIsoDateString('2026-13-01'), false);
  assert.equal(formatCheckedChipDate('2026-10-22', 'ko'), '10/22');
  assert.equal(formatCheckedChipDate('2026-10-22', 'en'), '10/22');
  assert.equal(mofaOverseasSafetyUrl(), 'https://www.0404.go.kr/');
  assert.equal(typeof seoulTodayYmd(new Date('2026-10-24T20:00:00Z')), 'string');
});

test('registry event slots require checkedOn (schema advisory)', () => {
  for (const [slug, bundle] of Object.entries(localInfoRegistry)) {
    for (const card of [bundle.ko.city, bundle.en.city]) {
      for (const slot of card.slots || []) {
        if (slot.kind !== 'event') continue;
        assert.ok(isIsoDateString(slot.checkedOn), `${slug} ${slot.id} needs checkedOn`);
      }
    }
  }
});

test('splitConsularCallCenter isolates display number in safety copy', () => {
  const sample = `영사콜센터는 ${CONSULAR_CALL_CENTER_DISPLAY}예요.`;
  const parts = splitConsularCallCenter(sample);
  assert.deepEqual(
    parts.map((part) => part.type),
    ['text', 'phone', 'text'],
  );
  assert.equal(parts[1].text, CONSULAR_CALL_CENTER_DISPLAY);
});

test('freshness UI pins MOFA URL and consular tel in hidden + fact value paths', () => {
  const factsUi = readFileSync(
    join(root, 'src/components/PlaceCard/common/PlaceVerifiedFacts.jsx'),
    'utf8',
  );
  assert.match(factsUi, /mofaOverseasSafetyUrl/);
  assert.match(factsUi, /CONSULAR_CALL_CENTER_TEL/);
  assert.match(factsUi, /splitConsularCallCenter/);
  assert.match(factsUi, /data-fact-consular-phone/);
  assert.equal(CONSULAR_CALL_CENTER_TEL, 'tel:+82232100404');
  assert.equal(mofaOverseasSafetyUrl(), 'https://www.0404.go.kr/');
  assert.match(factsUi, /slot\.kind && !slot\.checkedOn/);
});

test('safety slot copy includes consular display for linkification', () => {
  for (const slot of [parisSafety, cairoSafety]) {
    assert.ok(
      String(slot.value).includes(CONSULAR_CALL_CENTER_DISPLAY),
      `${slot.id} value should include consular display`,
    );
  }
});

test('event slot staleness emits CI warning without failing', () => {
  const today = seoulTodayYmd();
  const stale = [];
  for (const [slug, bundle] of Object.entries(localInfoRegistry)) {
    for (const slot of bundle.ko.city.slots || []) {
      if (slot.kind !== 'event') continue;
      const { tier, ageDays } = freshnessOf(slot, today);
      if (tier === 'warn' || tier === 'hidden') {
        stale.push({ slug, id: slot.id, checkedOn: slot.checkedOn, tier, ageDays });
      }
    }
  }
  if (stale.length) {
    console.warn(
      '[place-verified-facts] event slot(s) past fresh window (non-blocking):',
      JSON.stringify(stale),
    );
  }
});
