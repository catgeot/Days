import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import { CAIRO_ATTRACTION_FACTS, mentionScore } from '../../src/data/placeVerifiedFacts/cairo.js';
import {
  extractFactTokens,
  factValueForLocale,
  hangulOutsideEnglishProperNounParens,
} from '../../src/data/placeVerifiedFacts/cairoEn.js';
import {
  localInfoRegistry,
  resolveRegisteredCard,
  resolveVerifiedFacts,
} from '../../src/data/placeVerifiedFacts/index.js';
import { slotLooksEmpty } from '../../src/data/placeVerifiedFacts/schema.js';
import { GATEO_ENV_FLAG_NAMES } from '../../src/shared/gateoFeatureFlags.js';
const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');

const giza = CAIRO_ATTRACTION_FACTS.find((card) => card.slug === 'giza-pyramids');
const gem = CAIRO_ATTRACTION_FACTS.find((card) => card.slug === 'grand-egyptian-museum');
const museum = CAIRO_ATTRACTION_FACTS.find((card) => card.slug === 'egyptian-museum-cairo');

test('registry maps cairo and paris and keeps ko and en card data', () => {
  assert.deepEqual(Object.keys(localInfoRegistry), ['cairo', 'paris']);
  assert.equal(localInfoRegistry.cairo.ko.city.slug, 'cairo');
  assert.equal(localInfoRegistry.cairo.en.city.name, 'Cairo');
  assert.equal(localInfoRegistry.cairo.ko.attractions.length, 4);
  assert.equal(localInfoRegistry.cairo.en.attractions.length, 4);

  const koAirport = localInfoRegistry.cairo.ko.city.slots.find((slot) => slot.id === 'airport');
  const enAirport = localInfoRegistry.cairo.en.city.slots.find((slot) => slot.id === 'airport');
  assert.match(koAirport.value, /흰색 택시/);
  assert.match(enAirport.value, /white taxi/i);
  assert.equal(/uber/i.test(koAirport.value), false);
  assert.equal(/uber/i.test(enAirport.value), false);
  assert.equal(koAirport.sources.length, 1);
  assert.equal(enAirport.sources.length, 1);
  assert.equal(koAirport.sources[0].url, undefined);
  assert.equal(enAirport.sources[0].url, undefined);
  assert.equal(koAirport.sources[0].name, '카이로국제공항 교통 안내');
  assert.equal(enAirport.sources[0].name, 'Cairo International Airport transport guide');
  assert.equal(koAirport.checkedAt, '2026-10-11');
  const cairoJs = readFileSync(join(root, 'src/data/placeVerifiedFacts/cairo.js'), 'utf8');
  assert.match(cairoJs, /URL unreachable as of 2026-10-21 \(WAF 500 \/ incomplete cert chain\)/);
});

test('registry lookup keeps cairo when the rollout flag is off and renders nothing for other places', () => {
  const flag = GATEO_ENV_FLAG_NAMES.LOCAL_INFO_ROLLOUT;
  const prev = globalThis.__VITE_ENV__[flag];
  globalThis.__VITE_ENV__[flag] = '';
  try {
    assert.equal(resolveVerifiedFacts({ slug: 'cairo' }).slug, 'cairo');
    assert.equal(resolveVerifiedFacts('grand-egyptian-museum').slug, 'grand-egyptian-museum');
    assert.equal(resolveVerifiedFacts('paris'), null);
    assert.equal(resolveVerifiedFacts({ slug: 'gangneung', name: '강릉' }), null);
    globalThis.__VITE_ENV__[flag] = '1';
    assert.equal(resolveVerifiedFacts('paris').slug, 'paris');
    assert.equal(resolveVerifiedFacts({ slug: 'paris', name: '파리' }).kind, 'city');
    assert.equal(resolveVerifiedFacts('cairo').kind, 'city');
  } finally {
    globalThis.__VITE_ENV__[flag] = prev;
  }

  const parisEntry = {
    slug: 'paris',
    pilot: false,
    resolve: (location) => (
      location === 'paris' || location?.slug === 'paris'
        ? { slug: 'paris', slots: [{ id: 'entry', value: 'x' }] }
        : null
    ),
  };
  assert.equal(resolveRegisteredCard('paris', [parisEntry], false), null);
  assert.equal(resolveRegisteredCard({ slug: 'paris' }, [parisEntry], true).slug, 'paris');
  assert.equal(
    resolveRegisteredCard('cairo', [{
      slug: 'cairo',
      pilot: true,
      resolve: () => localInfoRegistry.cairo.ko.city,
    }], false).slug,
    'cairo',
  );
});

test('paris rollout hides the money row and does not call ETIAS required', () => {
  const city = localInfoRegistry.paris.ko.city;
  const en = localInfoRegistry.paris.en.city;
  assert.equal(city.slots.some((slot) => slot.id === 'money-safety'), false);
  assert.equal(en.slots.some((slot) => slot.id === 'money-safety'), false);
  const safety = city.slots.find((slot) => slot.id === 'safety');
  const enSafety = en.slots.find((slot) => slot.id === 'safety');
  assert.equal(slotLooksEmpty(safety), false);
  assert.match(safety.value, /프랑스에서 시작된 대규모 시위/);
  assert.match(safety.value, /\+82-2-3210-0404/);
  assert.equal(/유로|환전|카드|통화|Banque/i.test(safety.value), false);
  assert.equal(/\beuro\b|currency|exchange|\bcard\b/i.test(enSafety.value), false);
  assert.equal(safety.sources[0].url, 'https://www.0404.go.kr/bbs/safetyNtc/53/detail2?ntnCd=130');
  assert.equal(safety.checkedAt, '2026-10-22');
  assert.equal(safety.kind, 'event');
  assert.equal(safety.checkedOn, '2026-10-22');
  assert.equal(enSafety.sources[0].name, 'MOFA safety notice');

  const airport = city.slots.find((slot) => slot.id === 'airport');
  assert.equal(slotLooksEmpty(airport), true);

  const entry = city.slots.find((slot) => slot.id === 'entry');
  const enEntry = en.slots.find((slot) => slot.id === 'entry');
  assert.match(entry.value, /ETIAS는 아직 운영되지 않아요/);
  assert.match(enEntry.value, /ETIAS is not in operation yet/);
  assert.equal(/ETIAS.{0,30}(필수|필요해요|받아야)/.test(entry.value), false);
  assert.equal(/mandatory|currently required|need an ETIAS|ETIAS is required/i.test(enEntry.value), false);
  assert.equal(entry.sources.some((source) => source.url === 'https://france-visas.gouv.fr/'), true);
  assert.equal(entry.sources.some((source) => source.url === 'https://travel-europe.europa.eu/etias_en'), true);
  assert.equal(
    entry.sources.some((source) => source.url === 'https://travel-europe.europa.eu/en/ees/what-is-the-ees'),
    true,
  );

  const itinerary = city.slots.find((slot) => slot.id === 'itinerary');
  assert.equal(itinerary.sources[0].url, 'https://www.louvre.fr/en/visit');
  assert.equal(/D[123] /.test(itinerary.value), false);
  assert.equal(itinerary.headingKey, 'louvre-visit');
  assert.equal(/22유로|32유로|18세 미만/.test(itinerary.value), false);
  assert.equal(/EUR 22|EUR 32|under 18/i.test(factValueForLocale('paris', itinerary, 'en')), false);
  for (const slot of city.slots) {
    const ko = factValueForLocale('paris', slot, 'ko');
    const translated = factValueForLocale('paris', slot, 'en');
    assert.equal(ko, slot.value);
    assert.deepEqual(extractFactTokens(translated), extractFactTokens(ko));
    assert.deepEqual(hangulOutsideEnglishProperNounParens(translated), []);
  }
  assert.equal(localInfoRegistry.paris.ko.attractions.length, 0);
  assert.equal(en.name, 'Paris');

  const cairoMoney = localInfoRegistry.cairo.ko.city.slots.find((slot) => slot.id === 'money-safety');
  const cairoSafety = localInfoRegistry.cairo.ko.city.slots.find((slot) => slot.id === 'safety');
  assert.equal(cairoMoney.kind, 'standing');
  assert.equal(cairoMoney.checkedOn, null);
  assert.equal(cairoMoney.checkedAt, '');
  assert.match(cairoMoney.value, /EGP/);
  assert.equal(cairoSafety.kind, 'standing');
  assert.equal(cairoSafety.checkedOn, '2026-10-11');
  assert.match(cairoSafety.value, /여행유의/);
  assert.equal(/EGP/.test(cairoSafety.value), false);
});

test('mention matching is whole-token exact and ignores short or partial keys', () => {
  assert.ok(mentionScore('기자 피라미드', giza) >= 1000);
  assert.ok(mentionScore('기자피라미드', giza) >= 1000);
  assert.ok(mentionScore('Giza Pyramids', giza) >= 1000);
  assert.equal(mentionScore('기자 피라미드 투어', giza), 0);
  assert.equal(mentionScore('Giza', giza), 0);
  assert.equal(mentionScore('giza-pyramids-tour', giza), 0);
  assert.equal(mentionScore('피라미드', giza), 0);

  assert.ok(mentionScore('GEM', gem) >= 1000);
  assert.ok(mentionScore('gem', gem) >= 1000);
  assert.equal(mentionScore('GE', gem), 0);
  assert.equal(mentionScore('GEMINI', gem), 0);
  assert.equal(mentionScore('Grand', gem), 0);

  assert.ok(mentionScore('이집트박물관', museum) >= 1000);
  assert.equal(mentionScore('이집트박물관투어', museum), 0);
  assert.equal(mentionScore('타흐리르 이집트박물관 관람', museum), 0);

  assert.equal(mentionScore('AI', { name: 'AI', nameEn: 'AI', slug: 'ai', aliases: ['AI'] }), 0);
  assert.equal(mentionScore('EM', { name: 'EM', nameEn: 'Museum', slug: 'em', aliases: ['EM'] }), 0);
  assert.equal(mentionScore('GEM', { name: 'G', nameEn: 'GE', slug: 'x', aliases: ['EM'] }), 0);
});

test('PlaceVerifiedFacts resolves through the registry and keeps unverified items', () => {
  const factsUi = readFileSync(
    join(root, 'src/components/PlaceCard/common/PlaceVerifiedFacts.jsx'),
    'utf8',
  );
  assert.match(factsUi, /placeVerifiedFacts\/index\.js/);
  assert.equal(factsUi.includes('placeVerifiedFacts/cairo.js'), false);
  assert.equal(factsUi.includes('placeVerifiedFacts/cairoEn.js'), false);
  assert.match(factsUi, /data-unverified-items/);
  const gallery = readFileSync(
    join(root, 'src/components/PlaceCard/views/PlaceGalleryView.jsx'),
    'utf8',
  );
  assert.match(gallery, /<PlaceVerifiedFacts/);
});
