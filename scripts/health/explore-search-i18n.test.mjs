import assert from 'node:assert/strict';
import test from 'node:test';

import { ensureI18n } from '../../src/i18n/config.js';
import {
  EXPLORE_GROUP_TITLE_ATTRACTIONS_SUFFIX,
  localizeExploreGroupTitle,
  localizeExploreSearchDesc,
  localizedExploreFestivalBadge,
} from '../../src/i18n/exploreUi.js';

const i18n = await ensureI18n();

test('localizeExploreGroupTitle — EN single header suffix (not raw 명소)', async () => {
  await i18n.changeLanguage('en');
  const t = i18n.t.bind(i18n);
  const title = localizeExploreGroupTitle(`강릉${EXPLORE_GROUP_TITLE_ATTRACTIONS_SUFFIX}`, 'en', t);
  assert.equal(title, 'Gangneung sights');
});

test('localizeExploreGroupTitle — consecutive rows share one localized header key', async () => {
  await i18n.changeLanguage('en');
  const t = i18n.t.bind(i18n);
  const a = localizeExploreGroupTitle(`강릉${EXPLORE_GROUP_TITLE_ATTRACTIONS_SUFFIX}`, 'en', t);
  const b = localizeExploreGroupTitle(`강릉${EXPLORE_GROUP_TITLE_ATTRACTIONS_SUFFIX}`, 'en', t);
  assert.equal(a, b);
  assert.notEqual(a, `강릉${EXPLORE_GROUP_TITLE_ATTRACTIONS_SUFFIX}`);
});

test('localizeExploreSearchDesc — hub browse blurb in EN', async () => {
  await i18n.changeLanguage('en');
  const t = i18n.t.bind(i18n);
  const out = localizeExploreSearchDesc('강릉의 명소·명물을 둘러보세요.', 'en', t, '강릉');
  assert.match(out, /Gangneung/);
  assert.doesNotMatch(out, /명소·명물/);
});

test('localizedExploreFestivalBadge — singular Festival in EN', async () => {
  await i18n.changeLanguage('en');
  assert.equal(localizedExploreFestivalBadge(i18n.t.bind(i18n)), 'Festival');
  await i18n.changeLanguage('ko');
  assert.equal(localizedExploreFestivalBadge(i18n.t.bind(i18n)), '축제');
});
