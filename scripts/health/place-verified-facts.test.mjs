import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import {
  CAIRO_ATTRACTION_FACTS,
  CAIRO_CITY_FACTS,
  resolveOfficialMention,
  resolveVerifiedFacts,
} from '../../src/data/placeVerifiedFacts/cairo.js';
import {
  AI_GENERATED_LABEL,
  ATTRACTION_SLOT_IDS,
  CITY_SLOT_IDS,
  presentFactText,
  renderAiGeneratedLabel,
  slotLooksEmpty,
  UNVERIFIED_LABEL,
} from '../../src/data/placeVerifiedFacts/schema.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');

function assertSlotSchema(slot) {
  assert.equal(typeof slot.value, 'string');
  assert.equal(typeof slot.checkedAt, 'string');
  assert.ok('source' in slot);
  if (slot.source) {
    assert.equal(typeof slot.source.name, 'string');
    assert.equal(typeof slot.source.url, 'string');
  }
  assert.ok(Array.isArray(slot.sources));
  for (const source of slot.sources) {
    assert.equal(typeof source.name, 'string');
    assert.equal(typeof source.url, 'string');
    assert.equal(source.url.includes('google.com/search'), false);
  }
}

test('cairo city has 6 slots and attractions have 7', () => {
  assert.deepEqual(CAIRO_CITY_FACTS.slots.map((slot) => slot.id), CITY_SLOT_IDS);
  assert.equal(CAIRO_ATTRACTION_FACTS.length, 4);
  for (const card of CAIRO_ATTRACTION_FACTS) {
    assert.deepEqual(card.slots.map((slot) => slot.id), ATTRACTION_SLOT_IDS);
    for (const slot of card.slots) assertSlotSchema(slot);
  }
  for (const slot of CAIRO_CITY_FACTS.slots) assertSlotSchema(slot);
});

test('empty cells stay empty and render as unverified', () => {
  const cityEmpty = ['stay-area', 'season'];
  for (const id of cityEmpty) {
    const slot = CAIRO_CITY_FACTS.slots.find((item) => item.id === id);
    assert.equal(slot.value, '');
    assert.equal(slot.source, null);
    assert.equal(slot.checkedAt, '');
    assert.equal(slotLooksEmpty(slot), true);
    assert.equal(presentFactText(slot.value), UNVERIFIED_LABEL);
    assert.equal(presentFactText(slot.checkedAt), UNVERIFIED_LABEL);
    assert.doesNotMatch(presentFactText(slot.value), /겨울|봄|더위|성수기|10월/);
  }
  for (const card of CAIRO_ATTRACTION_FACTS) {
    for (const id of ['duration', 'nearby-food']) {
      const slot = card.slots.find((item) => item.id === id);
      assert.equal(slot.value, '');
      assert.equal(presentFactText(slot.value), UNVERIFIED_LABEL);
    }
  }
});

test('pilot booking and map links are used and search buttons are not', () => {
  const gem = resolveVerifiedFacts('grand-egyptian-museum');
  assert.equal(gem.bookingUrl, 'https://tickets.gem.eg/');
  assert.match(gem.mapUrl, /query_place_id=ChIJ0YpKmDRFWBQRGibsxFtMdkU/);
  const hassan = resolveVerifiedFacts({ name: '카이로 술탄하산모스크' });
  assert.equal(hassan.bookingUrl, 'https://egymonuments.com/details/Mosque-MadrassaSultanHassan');
  assert.match(hassan.mapUrl, /query_place_id=ChIJdRfpCqxAWBQR5IwPTJC5xnQ/);

  const giza = resolveOfficialMention('기자 피라미드', '카이로');
  assert.equal(giza.links[0].url, 'https://egymonuments.com/details/Pyramids');
  assert.match(giza.links[1].url, /query_place_id=ChIJ1-7Ki31PWBQRbbfEc4MNCJk/);
  assert.equal(giza.links.some((link) => link.url.includes('google.com/search')), false);

  const unnamed = resolveOfficialMention('칸 엘칼릴리', 'cairo');
  assert.equal(unnamed.plain, true);
  assert.equal(unnamed.links, undefined);

  assert.equal(resolveOfficialMention('에펠탑', '파리'), null);
});

test('AI generated label is present on verified-fact cards', () => {
  assert.equal(AI_GENERATED_LABEL, 'AI 생성 · 출처 없음');
  assert.equal(renderAiGeneratedLabel(''), AI_GENERATED_LABEL);
  assert.equal(renderAiGeneratedLabel('2026-10-11'), 'AI 생성 · 출처 없음 · 2026-10-11');
  const factsUi = readFileSync(join(root, 'src/components/PlaceCard/common/PlaceVerifiedFacts.jsx'), 'utf8');
  const wiki = readFileSync(join(root, 'src/components/PlaceCard/views/PlaceWikiDetailsView.jsx'), 'utf8');
  const gallery = readFileSync(join(root, 'src/components/PlaceCard/views/PlaceGalleryView.jsx'), 'utf8');
  assert.match(factsUi, /data-ai-generated-label/);
  assert.match(factsUi, /data-verified-facts/);
  assert.match(wiki, /AiGeneratedBanner/);
  assert.match(gallery, /PlaceVerifiedFacts/);
});

test('GEM and Sultan Hassan hub cards exist', () => {
  const hubs = JSON.parse(readFileSync(join(root, 'src/pages/Home/data/cityAttractionHubs.json'), 'utf8'));
  const cairo = hubs.find((hub) => hub.hubId === 'cairo');
  const names = cairo.attractions.map((item) => item.name_en);
  assert.ok(names.includes('Grand Egyptian Museum'));
  assert.ok(names.includes('Sultan Hassan Mosque'));
  assert.equal(resolveVerifiedFacts('Grand Egyptian Museum')?.slug, 'grand-egyptian-museum');
  assert.equal(resolveVerifiedFacts('Sultan Hassan Mosque')?.kind, 'attraction');
});
