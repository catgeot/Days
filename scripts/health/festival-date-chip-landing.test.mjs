import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { defaultFestivalHubTimeTab } from '../../src/pages/Korea/festivalHubDefaultTimeTab.js';
import { festivalHubTimeTabAfterClearPeriod } from '../../src/pages/Korea/festivalHubClearPeriod.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '../..');
import { festivalIndexTimePhrase } from '../../src/pages/Korea/festivalIndexHeadline.js';
import { replaceMonthTabWithDateChips } from '../../src/pages/Korea/festivalDateFilter.js';
import { resolveSocialPromoPresentation } from '../../src/pages/Korea/socialPromoFestivalsLogic.js';

test('default hub time tab matches flag-off landing (thisMonth, not window30)', () => {
  assert.equal(defaultFestivalHubTimeTab(), 'thisMonth');
});

test('기간 풀기 restores default hub window (empty-region path), not 지금', () => {
  assert.equal(festivalHubTimeTabAfterClearPeriod(), 'thisMonth');
  assert.notEqual(festivalHubTimeTabAfterClearPeriod(), 'now');
  const hub = readFileSync(join(root, 'src/pages/Korea/index.jsx'), 'utf8');
  assert.match(hub, /festivalHubTimeTabAfterClearPeriod/);
  assert.match(hub, /data-festival-period-empty[\s\S]{0,400}onClick=\{clearPeriod\}/);
  assert.doesNotMatch(hub, /const clearPeriod = \(\) => \{[\s\S]{0,120}setTimeTab\('now'\)/);
});

test('flag-on time tabs omit thisMonth but headline still resolves 이번 달', () => {
  const timeTabs = replaceMonthTabWithDateChips(
    [
      { id: 'now', label: '지금' },
      { id: 'thisMonth', label: '이번 달' },
    ],
    {
      window30Label: '한 달 이내',
      window30Headline: '한 달 이내',
      dateLabel: '날짜',
    },
  );
  assert.ok(!timeTabs.some((tab) => tab.id === 'thisMonth'));
  const t = (key) => (key === 'korea.festival.timeTab.thisMonth' ? '이번 달' : '지금');
  const phrase = festivalIndexTimePhrase('ko', 'thisMonth', timeTabs, t);
  assert.equal(phrase, '이번 달');
});

test('recommended strip uses thisMonth default; window30 pre-filter hides it', () => {
  const row = {
    status: 'ready',
    cards: [{ item: { contentId: '1', title: '축제' }, entry: { contentId: '1' } }],
  };
  const landing = resolveSocialPromoPresentation(row, {
    searchActive: false,
    areaCode: 'all',
    cityName: 'all',
    timeTab: defaultFestivalHubTimeTab(),
    instagramStripEligible: true,
  });
  assert.equal(landing.show, true);
  const prefiltered = resolveSocialPromoPresentation(row, {
    searchActive: false,
    areaCode: 'all',
    cityName: 'all',
    timeTab: 'window30',
    instagramStripEligible: true,
  });
  assert.equal(prefiltered.show, false);
});
