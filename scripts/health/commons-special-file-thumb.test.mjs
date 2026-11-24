import assert from 'node:assert/strict';
import test from 'node:test';
import {
  COMMONS_THUMB_STEPS,
  commonsOriginalFileUrl,
  commonsOriginalFromThumbUrl,
  commonsSpecialFileThumbUrl,
  rewriteLogbookCreditHref,
  snapCommonsThumbWidth,
} from '../../src/utils/commonsSpecialFileThumb.js';
import { resolveLogbookDisplaySrc } from '../../src/utils/logbookImageSrc.js';

const COVER =
  'https://commons.wikimedia.org/wiki/Special:FilePath/Top-Mount-Shiroyama-and-Aso-Bay-Tsushima.jpg?width=1600';
const HARBOR =
  'https://commons.wikimedia.org/wiki/Special:FilePath/Izuhara,_Tsushima-1.jpg?width=1600';
const COVER_THUMB =
  'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7d/Top-Mount-Shiroyama-and-Aso-Bay-Tsushima.jpg/960px-Top-Mount-Shiroyama-and-Aso-Bay-Tsushima.jpg';
const COVER_1280 =
  'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7d/Top-Mount-Shiroyama-and-Aso-Bay-Tsushima.jpg/1280px-Top-Mount-Shiroyama-and-Aso-Bay-Tsushima.jpg';
const COVER_ORIGINAL =
  'https://upload.wikimedia.org/wikipedia/commons/7/7d/Top-Mount-Shiroyama-and-Aso-Bay-Tsushima.jpg';
const FILE_PAGE =
  'https://commons.wikimedia.org/wiki/File:Top-Mount-Shiroyama-and-Aso-Bay-Tsushima.jpg';

test('Special:FilePath becomes a direct Commons thumb', () => {
  assert.equal(commonsSpecialFileThumbUrl(COVER, 960), COVER_THUMB);
  assert.equal(resolveLogbookDisplaySrc(COVER, { role: 'thumb' }), COVER_THUMB);
});

test('detail width 1200 snaps to the 1280 step, not a 400 thumbnail', () => {
  assert.deepEqual(COMMONS_THUMB_STEPS, [20, 40, 60, 120, 250, 330, 500, 960, 1280, 1920, 3840]);
  assert.equal(snapCommonsThumbWidth(1200), 1280);
  assert.equal(snapCommonsThumbWidth(960), 960);
  assert.equal(snapCommonsThumbWidth(100), 120);
  assert.equal(snapCommonsThumbWidth(4000), null);
  assert.equal(commonsSpecialFileThumbUrl(COVER, 1200), COVER_1280);
  assert.equal(resolveLogbookDisplaySrc(COVER, { maxWidth: 1200 }), COVER_1280);
  assert.equal(
    commonsSpecialFileThumbUrl(HARBOR, 1200),
    'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c9/Izuhara%2C_Tsushima-1.jpg/1280px-Izuhara%2C_Tsushima-1.jpg',
  );
  assert.equal(commonsSpecialFileThumbUrl(COVER, 5000), COVER_ORIGINAL);
  assert.equal(commonsOriginalFileUrl(COVER), COVER_ORIGINAL);
  assert.equal(commonsOriginalFromThumbUrl(COVER_1280), COVER_ORIGINAL);
  assert.equal(commonsOriginalFromThumbUrl(COVER_ORIGINAL), null);
  assert.equal(COVER_1280.includes('1200px-'), false);
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
