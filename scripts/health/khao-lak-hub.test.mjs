import assert from 'node:assert/strict';
import test from 'node:test';

import {
  listCityAttractionHubs,
  placeUrlSlug,
  resolveCityAttractionHub,
  resolveHubPlaceFromSlug,
} from '../../src/pages/Home/lib/cityAttractionHubs.js';
import { resolvePlaceTargetFromSlug } from '../../src/pages/Home/lib/placeRouteHydrate.js';
import { buildLocalSearchSuggestions } from '../../src/pages/Home/lib/searchSuggestions.js';
import { KHAO_LAK_CITY_FACTS } from '../../src/data/placeVerifiedFacts/khao-lak.js';

const EXPECTED = [
  ['낭통 해변', 'Nang Thong Beach', 'beach', 'nang-thong-beach'],
  ['방삭 해변', 'Bang Sak Beach', 'beach', 'bang-sak-beach'],
  ['방니앙 시장', 'Bang Niang Market', 'market', 'bang-niang-market'],
  ['뚝총파 폭포', 'Ton Chong Fa Waterfall', 'park', 'ton-chong-fa-waterfall'],
  ['반남켐 쓰나미 추모공원', 'Ban Nam Khem Tsunami Memorial Park', 'landmark', 'ban-nam-khem-tsunami-memorial-park'],
  ['따꾸아빠 올드타운', 'Takua Pa Old Town', 'neighborhood', 'takua-pa-old-town'],
];

function khaoLakHub() {
  return listCityAttractionHubs().find((hub) => hub.hubId === 'khao-lak');
}

test('khao-lak hub lists six sights with toUrlSlug pages', () => {
  const hub = khaoLakHub();
  assert.ok(hub);
  assert.equal(hub.name, '카오락');
  assert.equal(hub.name_en, 'Khao Lak');
  assert.equal(hub.lat, 8.6475);
  assert.equal(hub.lng, 98.2483);
  assert.equal(hub.attractions.length, 6);
  assert.deepEqual(
    hub.attractions.map((attraction) => [
      attraction.name,
      attraction.name_en,
      attraction.kind,
      placeUrlSlug(attraction.name_en, attraction.name),
    ]),
    EXPECTED,
  );
  for (const attraction of hub.attractions) {
    assert.equal(attraction.desc, undefined);
    assert.equal(attraction.overview, undefined);
    assert.equal(attraction.hours, undefined);
    assert.equal(attraction.fee, undefined);
    assert.ok(Number.isFinite(attraction.lat));
    assert.ok(Number.isFinite(attraction.lng));
    const slug = placeUrlSlug(attraction.name_en, attraction.name);
    const pin = resolveHubPlaceFromSlug(slug);
    assert.equal(pin?.hubId, 'khao-lak');
    assert.equal(pin?.name, attraction.name);
    assert.equal(pin?.slug, slug);
    const routed = resolvePlaceTargetFromSlug(slug);
    assert.equal(routed?.slug, slug);
    assert.equal(routed?.name, attraction.name);
    assert.equal(routed?.hubId, 'khao-lak');
  }
});

test('khao-lak place stays the travel spot; sights stay on the suggestion list', () => {
  const place = resolvePlaceTargetFromSlug('khao-lak');
  assert.equal(place?.slug, 'khao-lak');
  assert.equal(place?.name, '카오락');
  assert.equal(place?.lat, 8.6475);
  assert.equal(place?.lng, 98.2483);
  assert.equal(place?.id, 396);
  assert.notEqual(place?.hubId, 'khao-lak');

  const similan = resolvePlaceTargetFromSlug('similan-islands');
  assert.equal(similan?.slug, 'similan-islands');

  const season = KHAO_LAK_CITY_FACTS.slots.find((slot) => slot.id === 'season');
  assert.deepEqual(season.placeLinks, [
    { path: '/place/similan-islands', label: '시미란 제도', labelEn: 'Similan Islands' },
  ]);

  const names = new Set(buildLocalSearchSuggestions('카오락').map((item) => item.name));
  for (const [name] of EXPECTED) assert.ok(names.has(name), name);
  assert.equal(resolveCityAttractionHub('khaolak')?.hubId, 'khao-lak');
});
