import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import { KHAO_LAK_CITY_FACTS, resolveKhaoLakVerifiedFacts } from '../../src/data/placeVerifiedFacts/khao-lak.js';
import { CITY_SLOT_IDS } from '../../src/data/placeVerifiedFacts/schema.js';
import {
  extractFactTokens,
  factValueForLocale,
  hangulOutsideEnglishProperNounParens,
} from '../../src/data/placeVerifiedFacts/cairoEn.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');

test('khao-lak city has seven slots with itinerary place names', () => {
  assert.deepEqual(KHAO_LAK_CITY_FACTS.slots.map((slot) => slot.id), CITY_SLOT_IDS);
  const itinerary = KHAO_LAK_CITY_FACTS.slots.find((slot) => slot.id === 'itinerary');
  assert.match(itinerary.value, /낭통 해변/);
  assert.match(itinerary.value, /방삭·팍윕 해변/);
  assert.match(itinerary.value, /방니앙 시장/);
  assert.match(itinerary.value, /똔총파 폭포/);
  assert.match(itinerary.value, /탑라무 선착장/);
  assert.match(itinerary.value, /반남켐 쓰나미 추모공원/);
  assert.match(itinerary.value, /따꾸아빠 올드타운/);
  assert.equal(/완안칸|끄라창|나이므앙/.test(itinerary.value), false);

  const season = KHAO_LAK_CITY_FACTS.slots.find((slot) => slot.id === 'season');
  assert.match(season.value, /500바트/);
  assert.match(season.value, /250바트/);
  assert.match(season.value, /숙박.*금지/);
  assert.match(season.value, /당일/);
  assert.equal(season.endsAt, '2027-05-15');
  assert.equal(/gateo\.kr\/place/.test(season.value), false);
  assert.deepEqual(season.placeLinks, [
    { path: '/place/similan-islands', label: '시미란 제도', labelEn: 'Similan Islands' },
  ]);

  const airport = KHAO_LAK_CITY_FACTS.slots.find((slot) => slot.id === 'airport');
  assert.match(airport.value, /HKT/);

  assert.equal(resolveKhaoLakVerifiedFacts('khao-lak').slug, 'khao-lak');
  assert.equal(resolveKhaoLakVerifiedFacts('카오락').slug, 'khao-lak');

  const factsUi = readFileSync(join(root, 'src/components/PlaceCard/common/PlaceVerifiedFacts.jsx'), 'utf8');
  assert.match(factsUi, /data-fact-place-link/);
});

test('khao-lak English values keep token parity', () => {
  for (const slot of KHAO_LAK_CITY_FACTS.slots) {
    if (!slot.value.trim()) continue;
    const ko = factValueForLocale('khao-lak', slot, 'ko');
    const en = factValueForLocale('khao-lak', slot, 'en');
    assert.equal(ko, slot.value);
    assert.deepEqual(extractFactTokens(en), extractFactTokens(ko));
    assert.deepEqual(hangulOutsideEnglishProperNounParens(en), []);
  }
});
