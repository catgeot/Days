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
});
