import assert from 'node:assert/strict';
import test from 'node:test';
import {
  commonsSpecialFileThumbUrl,
  rewriteLogbookCreditHref,
} from '../../src/utils/commonsSpecialFileThumb.js';
import { resolveLogbookDisplaySrc } from '../../src/utils/logbookImageSrc.js';

const COVER =
  'https://commons.wikimedia.org/wiki/Special:FilePath/Top-Mount-Shiroyama-and-Aso-Bay-Tsushima.jpg?width=1600';
const COVER_THUMB =
  'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7d/Top-Mount-Shiroyama-and-Aso-Bay-Tsushima.jpg/960px-Top-Mount-Shiroyama-and-Aso-Bay-Tsushima.jpg';
const FILE_PAGE =
  'https://commons.wikimedia.org/wiki/File:Top-Mount-Shiroyama-and-Aso-Bay-Tsushima.jpg';

test('Special:FilePath becomes a direct Commons thumb', () => {
  assert.equal(commonsSpecialFileThumbUrl(COVER, 960), COVER_THUMB);
  assert.equal(resolveLogbookDisplaySrc(COVER, { role: 'thumb' }), COVER_THUMB);
});

test('a direct upload URL is left alone', () => {
  assert.equal(commonsSpecialFileThumbUrl(COVER_THUMB, 960), null);
  assert.equal(resolveLogbookDisplaySrc(COVER_THUMB, { role: 'thumb' }), COVER_THUMB);
});

test('Tsushima credit uses the Commons file page instead of the missing user page', () => {
  assert.equal(
    rewriteLogbookCreditHref('https://commons.wikimedia.org/wiki/User:Irisgazer'),
    FILE_PAGE,
  );
  assert.equal(
    rewriteLogbookCreditHref('https://commons.wikimedia.org/wiki/User:Saigen_Jiro'),
    'https://commons.wikimedia.org/wiki/User:Saigen_Jiro',
  );
});
