/**
 * Local Watson locale helpers — smoke (no network).
 */
import assert from 'node:assert/strict';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const {
  localizeWatsonContentText,
  magazineStorageIdForLocale,
  mergePlaceWikiRows,
  shouldLocalizeWatsonShell,
} = await import(pathToFileURL(join(root, 'src/components/PlaceCard/common/magazineLocale.js')).href);

assert.equal(magazineStorageIdForLocale('washington-dc', 'en'), 'washington-dc@en');

assert.equal(
  shouldLocalizeWatsonShell('en', {
    place_id: 'paris',
    watson_place_id: 'paris',
    ai_practical_info: '🌟 1분 요약\n본문',
  }),
  true,
);
assert.equal(
  shouldLocalizeWatsonShell('en', {
    place_id: 'paris',
    watson_place_id: 'paris@en',
    ai_practical_info: '🌟 1-minute summary\nbody',
  }),
  false,
);
assert.equal(
  shouldLocalizeWatsonShell('en', {
    place_id: 'paris@en',
    ai_practical_info: '🌟 1-minute summary\nbody',
  }),
  false,
);
const localized = localizeWatsonContentText(
  '🌟 1분 요약\n작성 기준일: 2026년 1월 1일\n\n🛂 입국/비용 & 이동 팁\n비자',
  'en',
);
assert.ok(localized.includes('🌟 1-minute summary'));
assert.ok(localized.includes('As of:'));
assert.ok(localized.includes('🛂 Entry, costs & getting around'));

const merged = mergePlaceWikiRows(
  [
    {
      place_id: 'torres-del-paine',
      summary: 'ko summary',
      sections: [{ title: 'a', content: 'b' }],
      ai_practical_info: 'ko watson',
    },
    {
      place_id: 'torres-del-paine@en',
      ai_practical_info: 'en watson',
    },
  ],
  ['torres-del-paine@en', 'torres-del-paine'],
);
assert.equal(merged.summary, 'ko summary');
assert.equal(merged.ai_practical_info, 'en watson');
assert.equal(merged.watson_place_id, 'torres-del-paine@en');

console.log('smoke-watson-locale: PASS');
