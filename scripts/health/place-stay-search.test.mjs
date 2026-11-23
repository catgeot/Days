import assert from 'node:assert/strict';
import { test } from 'node:test';
import { getMrtAccommodationSearchUrl } from '../../src/utils/affiliate.js';
import { getPlaceStayBaseArea } from '../../src/data/placeStayLodgingGuidance.js';
import {
  buildPlannerMrtStayQuery,
  resolvePlannerMrtStayKeyword,
  resolvePlannerStayDisplayName,
} from '../../src/utils/placeStaySearch.js';
import { resolveMrtStayQuery } from '../../src/utils/mrtStayQuery.js';

const SIMILAN = {
  slug: 'similan-islands',
  name: '시미란 제도',
  name_en: 'Similan Islands',
  name_ko: '시미란 제도',
  country: '태국',
  country_en: 'Thailand',
};

const SEOUL = {
  slug: 'seoul',
  name: '서울',
  name_en: 'Seoul',
  country: '대한민국',
  country_en: 'South Korea',
  stayAdmin: { city: '서울' },
};

const PARIS = {
  slug: 'paris',
  name: '파리',
  name_en: 'Paris',
  country: '프랑스',
  country_en: 'France',
  stayAdmin: { city: 'Paris' },
};

test('similan — stayBaseArea, MRT keyword, planner labels and URLs', () => {
  const base = getPlaceStayBaseArea('similan-islands');
  assert.equal(base.ko, '카오락');
  assert.equal(base.en, 'Khao Lak');

  const q = resolveMrtStayQuery(SIMILAN);
  assert.equal(q.keyword, '카오락');
  assert.ok(q.altKeywords.includes('Khao Lak'));
  assert.equal(q.countryHint, '태국');

  assert.equal(resolvePlannerStayDisplayName(SIMILAN, 'ko'), '카오락');
  assert.equal(resolvePlannerStayDisplayName(SIMILAN, 'en'), 'Khao Lak');

  const stayQuery = buildPlannerMrtStayQuery(SIMILAN, '숙소');
  assert.equal(stayQuery, '카오락 태국 숙소');
  const guestQuery = buildPlannerMrtStayQuery(SIMILAN, '한인민박');
  assert.equal(guestQuery, '카오락 태국 한인민박');

  const stayUrl = getMrtAccommodationSearchUrl(stayQuery, { isDomestic: false });
  assert.match(stayUrl, /accommodation\.myrealtrip\.com\/union\/products/);
  assert.match(decodeURIComponent(stayUrl), /카오락/);
  assert.doesNotMatch(decodeURIComponent(stayUrl), /시미란/);
});

test('seoul — domestic regression (keyword and no country suffix)', () => {
  assert.equal(resolveMrtStayQuery(SEOUL).keyword, '서울');
  assert.equal(resolvePlannerMrtStayKeyword(SEOUL), '서울');
  assert.equal(buildPlannerMrtStayQuery(SEOUL, '숙소'), '서울 숙소');
  assert.equal(resolvePlannerStayDisplayName(SEOUL, 'ko'), '서울');
});

test('paris — overseas keyword stable with country disambiguation', () => {
  const kw = resolvePlannerMrtStayKeyword(PARIS);
  const q = resolveMrtStayQuery(PARIS);
  assert.ok(q.keyword);
  assert.match(kw, /파리/);
  assert.match(kw, /프랑스/);
  const phrase = buildPlannerMrtStayQuery(PARIS, '숙소');
  assert.match(phrase, /파리/);
  assert.match(phrase, /숙소/);
});