import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  enFestivalListHeadlineTail,
  formatCompactPeriodHeadline,
  formatFestivalIndexHeadlinePlain,
  listEnFestivalTimeTabHeadlines,
} from '../../src/pages/Korea/festivalIndexHeadline.js';

const tEn = (key, opts = {}) => {
  if (key === 'korea.festival.headlineTasteSuffix') {
    return ` · ${opts.taste} themed`;
  }
  return opts?.defaultValue || key;
};

const PROVINCES = [
  ['Gyeonggi Province', '31'],
  ['Gangwon Province', '32'],
  ['South Jeolla', '38'],
];

const FOUR_TABS = ['now', 'weekend', 'thisMonth', 'autumn'];

const EXPECTED_PROVINCE = {
  now: (place) => `${place} · Festivals on now`,
  weekend: (place) => `${place} · This weekend's festivals`,
  thisMonth: (place) => `${place} · This month's festivals`,
  autumn: (place) => `${place} · Autumn festivals`,
};

const EXPECTED_NATIONWIDE = {
  now: 'Festivals on now',
  weekend: "This weekend's festivals",
  thisMonth: "This month's festivals",
  autumn: 'Autumn festivals',
};

test('EN standard time tabs never append «festival list»', () => {
  for (const [id, phrase] of Object.entries(listEnFestivalTimeTabHeadlines())) {
    assert.equal(
      enFestivalListHeadlineTail(id, phrase),
      '',
      `tail for tab ${id}`,
    );
    assert.equal(/\bfestivals\b/i.test(phrase), true, `tab ${id} uses Festivals wording`);
  }
});

test('EN headlines — 4 tabs × provinces and nationwide', () => {
  for (const timeTab of FOUR_TABS) {
    for (const [place] of PROVINCES) {
      const plain = formatFestivalIndexHeadlinePlain({
        locale: 'en',
        timeTab,
        place,
        time: 'unused',
        tasteSuffix: '',
        t: tEn,
      });
      assert.equal(plain, EXPECTED_PROVINCE[timeTab](place), timeTab);
      assert.equal(/\bfestival\s+list\b/i.test(plain), false, plain);
      assert.equal(/\bfestivals\s+festival\b/i.test(plain), false, plain);
    }
    const nationwide = formatFestivalIndexHeadlinePlain({
      locale: 'en',
      timeTab,
      place: '',
      time: 'unused',
      tasteSuffix: '',
      t: tEn,
    });
    assert.equal(nationwide, EXPECTED_NATIONWIDE[timeTab], timeTab);
    assert.equal(/\bfestival\s+list\b/i.test(nationwide), false, nationwide);
  }
});

test('compact period headlines stay one phrase without quotes or 축제 리스트', () => {
  const month = formatCompactPeriodHeadline({
    place: '서울특별시',
    time: '30일 안(~11.14)',
  });
  const picked = formatCompactPeriodHeadline({
    place: '제주도',
    time: '10.17\u201310.18',
  });
  const nationwide = formatCompactPeriodHeadline({
    place: '전국',
    time: '30일 안(~11.14)',
  });
  assert.equal(month, '서울특별시 · 30일 안(~11.14)');
  assert.equal(picked, '제주도 · 10.17\u201310.18');
  assert.equal(nationwide, '전국 · 30일 안(~11.14)');
  for (const line of [month, picked, nationwide]) {
    assert.equal(line.includes('"'), false, line);
    assert.equal(line.includes('축제 리스트'), false, line);
  }
});

test('EN fallback label adds festivals word without «festival list» tail', () => {
  const plain = formatFestivalIndexHeadlinePlain({
    locale: 'en',
    timeTab: 'unknown-tab',
    place: 'Jeju',
    time: 'Harvest',
    tasteSuffix: '',
    t: tEn,
  });
  assert.equal(plain, 'Jeju · Harvest festivals');
});
