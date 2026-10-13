import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  enFestivalListHeadlineTail,
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

test('EN tab headlines do not duplicate «festivals festival list»', () => {
  for (const [id, phrase] of Object.entries(listEnFestivalTimeTabHeadlines())) {
    const tail = enFestivalListHeadlineTail(id, phrase);
    const plain = formatFestivalIndexHeadlinePlain({
      locale: 'en',
      timeTab: id,
      place: 'Gyeonggi Province',
      time: phrase,
      tasteSuffix: '',
      t: tEn,
    });
    assert.equal(
      /\bfestivals\s+festival\s+list\b/i.test(plain),
      false,
      `duplicate tail for tab ${id}: ${plain}`,
    );
    if (/\bfestivals\s*$/i.test(phrase)) {
      assert.equal(tail, '', `tab ${id} should omit list tail`);
      assert.match(plain, /Gyeonggi Province · .+festivals$/);
    } else if (id === 'now') {
      assert.equal(tail, ' festival list');
      assert.match(plain, /Festivals on now festival list$/);
    }
  }
});

test('EN province headlines for month, weekend, autumn, and nationwide scope', () => {
  const tabs = ['thisMonth', 'weekend', 'autumn', 'now'];
  for (const timeTab of tabs) {
    for (const [place] of PROVINCES) {
      const plain = formatFestivalIndexHeadlinePlain({
        locale: 'en',
        timeTab,
        place,
        time: 'unused',
        tasteSuffix: '',
        t: tEn,
      });
      assert.equal(/\bfestivals\s+festival\b/i.test(plain), false, plain);
    }
  }
  const nationwide = formatFestivalIndexHeadlinePlain({
    locale: 'en',
    timeTab: 'thisMonth',
    place: '',
    time: 'unused',
    tasteSuffix: '',
    t: tEn,
  });
  assert.match(nationwide, /^This month's festivals$/);
});
