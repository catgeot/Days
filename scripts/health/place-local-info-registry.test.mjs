import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import { CAIRO_ATTRACTION_FACTS, mentionScore } from '../../src/data/placeVerifiedFacts/cairo.js';
import {
  localInfoRegistry,
  resolveRegisteredCard,
  resolveVerifiedFacts,
} from '../../src/data/placeVerifiedFacts/index.js';
import { GATEO_ENV_FLAG_NAMES } from '../../src/shared/gateoFeatureFlags.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const AIRPORT_URL = 'https://www.cairo-airport.com/en-us/Services/Passenger-Guide/Move-From-To-Airport';

const giza = CAIRO_ATTRACTION_FACTS.find((card) => card.slug === 'giza-pyramids');
const gem = CAIRO_ATTRACTION_FACTS.find((card) => card.slug === 'grand-egyptian-museum');
const museum = CAIRO_ATTRACTION_FACTS.find((card) => card.slug === 'egyptian-museum-cairo');

test('registry maps cairo only and keeps ko and en card data', () => {
  assert.deepEqual(Object.keys(localInfoRegistry), ['cairo']);
  assert.equal(localInfoRegistry.cairo.ko.city.slug, 'cairo');
  assert.equal(localInfoRegistry.cairo.en.city.name, 'Cairo');
  assert.equal(localInfoRegistry.cairo.ko.attractions.length, 4);
  assert.equal(localInfoRegistry.cairo.en.attractions.length, 4);

  const koAirport = localInfoRegistry.cairo.ko.city.slots.find((slot) => slot.id === 'airport');
  const enAirport = localInfoRegistry.cairo.en.city.slots.find((slot) => slot.id === 'airport');
  assert.equal(koAirport.sources.length, 1);
  assert.equal(koAirport.sources[0].url, AIRPORT_URL);
  assert.equal(koAirport.sources[0].name, '카이로국제공항 교통 안내');
  assert.equal(enAirport.sources.length, 1);
  assert.equal(enAirport.sources[0].url, AIRPORT_URL);
  assert.equal(enAirport.sources[0].name, 'Cairo International Airport transport guide');
  assert.equal(/uber/i.test(koAirport.value), false);
  assert.equal(/uber/i.test(enAirport.value), false);
  assert.match(enAirport.value, /white taxi/i);
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
    assert.equal(resolveVerifiedFacts('paris'), null);
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
