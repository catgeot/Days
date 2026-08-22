/**
 * Travel Sketch magazine locale helpers — smoke (no network).
 */
import assert from 'node:assert/strict';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const {
  buildPlaceWikiLocaleCandidates,
  isEnglishMagazineRow,
  localizeMagazineContentText,
  magazineStorageIdForLocale,
  shouldLocalizeMagazineShell,
} = await import(pathToFileURL(join(root, 'src/components/PlaceCard/common/magazineLocale.js')).href);

const t = (key) => {
  const map = {
    'place.wiki.magazineAnchors.editorEye': "Editor's eye",
    'place.wiki.magazineAnchors.timeTraces': 'Traces of time',
  };
  return map[key] ?? key;
};

assert.equal(magazineStorageIdForLocale('washington-dc', 'en'), 'washington-dc@en');
assert.equal(magazineStorageIdForLocale('washington-dc@en', 'en'), 'washington-dc@en');
assert.equal(magazineStorageIdForLocale('washington-dc', 'ko'), 'washington-dc');
assert.equal(isEnglishMagazineRow('paris@en'), true);
assert.equal(isEnglishMagazineRow('paris'), false);

assert.equal(
  shouldLocalizeMagazineShell('en', { place_id: 'paris', summary: 'x', sections: [{}] }),
  true,
);
assert.equal(
  shouldLocalizeMagazineShell('en', { place_id: 'paris@en', summary: 'x', sections: [{}] }),
  false,
);

const localized = localizeMagazineContentText(
  '[ 에디터의 시선 ]\n본문\n\n[ 시간의 흔적 ]\n더 읽기',
  'en',
  t,
);
assert.ok(localized.includes("[ Editor's eye ]"));
assert.ok(localized.includes('[ Traces of time ]'));

const candidates = buildPlaceWikiLocaleCandidates({ slug: 'zermatt', name: '체르마트' }, 'en');
assert.equal(candidates[0], 'zermatt@en');
assert.ok(candidates.includes('zermatt'));

console.log('smoke-magazine-locale: PASS');
