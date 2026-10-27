import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import {
  festivalHubGridThumbLoadKey,
  isFestivalHubGridEagerThumb,
} from '../../src/pages/Korea/festivalHubGridEagerThumb.js';
import { FESTIVAL_HUB_GRID_EAGER_THUMB_COUNT } from '../../src/pages/Korea/festivalHubGridLayout.js';

test('isFestivalHubGridEagerThumb covers first viewport band only', () => {
  assert.equal(isFestivalHubGridEagerThumb(-1), false);
  assert.equal(isFestivalHubGridEagerThumb(0), true);
  assert.equal(
    isFestivalHubGridEagerThumb(FESTIVAL_HUB_GRID_EAGER_THUMB_COUNT - 1),
    true,
  );
  assert.equal(
    isFestivalHubGridEagerThumb(FESTIVAL_HUB_GRID_EAGER_THUMB_COUNT),
    false,
  );
  assert.equal(isFestivalHubGridEagerThumb(341), false);
});

test('festivalHubGridThumbLoadKey changes eager flag when index crosses band', () => {
  const epoch = 'all|all|autumn|all|||off';
  const at5 = festivalHubGridThumbLoadKey({
    listEpoch: epoch,
    index: 5,
    contentId: 'a',
  });
  const at20 = festivalHubGridThumbLoadKey({
    listEpoch: epoch,
    index: 20,
    contentId: 'a',
  });
  assert.notEqual(at5, at20);
});

test('festivalHubGridThumbLoadKey changes when list epoch changes', () => {
  const a = festivalHubGridThumbLoadKey({
    listEpoch: 'a|all|autumn',
    index: 0,
    contentId: 'x',
  });
  const b = festivalHubGridThumbLoadKey({
    listEpoch: 'b|all|autumn',
    index: 0,
    contentId: 'x',
  });
  assert.notEqual(a, b);
});

const root = join(dirname(fileURLToPath(import.meta.url)), '../..');

test('Korea hub wires eager thumb helper and list epoch', () => {
  const indexJs = readFileSync(
    join(root, 'src/pages/Korea/index.jsx'),
    'utf8',
  );
  assert.match(indexJs, /isFestivalHubGridEagerThumb/);
  assert.match(indexJs, /festivalHubGridThumbLoadKey/);
  assert.match(indexJs, /thumbListEpoch=\{listFilterScrollKey\}/);
  assert.match(indexJs, /FESTIVAL_HUB_GRID_SCROLL_TOP_BOTTOM_CLASS/);
});

test('grid photo card shows pin fallback only after thumb exhausted', () => {
  const card = readFileSync(
    join(root, 'src/pages/Korea/components/FestivalGridPhotoCard.jsx'),
    'utf8',
  );
  assert.match(card, /data-festival-grid-thumb-fallback/);
  assert.doesNotMatch(card, /thumbExhausted \?\s*\(/);
  assert.match(card, /pendingShimmer=\{!thumbDecoded\}/);
});

test('grid scroll-top button centers without translate-x (translate-y safe)', () => {
  const layout = readFileSync(
    join(root, 'src/pages/Korea/festivalHubGridLayout.js'),
    'utf8',
  );
  assert.match(layout, /left-0 right-0 mx-auto w-max/);
  assert.doesNotMatch(layout, /-translate-x-1\/2/);
});

test('festival photo frame defers lazy complete+0 broken sync', () => {
  const frame = readFileSync(
    join(root, 'src/pages/Korea/festivalPhotoFrame.js'),
    'utf8',
  );
  assert.match(frame, /shouldSyncMarkFestivalPhotoBroken/);
});
