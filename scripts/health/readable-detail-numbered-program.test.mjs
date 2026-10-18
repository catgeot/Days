import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { splitOverviewParagraphs } from '../../src/components/PlaceCard/common/placeOverviewText.js';
import { splitTourApiDetailParagraphs } from '../../src/shared/readableDetail/splitTourApiDetailParagraphs.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '../..');

test('numbered program blocks keep each index on its own paragraph', () => {
  const paras = splitOverviewParagraphs('내용\n1. 첫번째\n- a\n2. 두번째\n- b');
  assert.equal(paras.length, 3);
  assert.equal(paras[0], '내용');
  assert.match(paras[1], /^1\. 첫번째/);
  assert.match(paras[2], /^2\. 두번째/);
  assert.doesNotMatch(paras[1], /^1\.$/);
});

test('orphan numbered marker line merges with the next line', () => {
  const paras = splitOverviewParagraphs('1.\n첫번째 항목\n2. 두번째');
  assert.equal(paras.length, 2);
  assert.match(paras[0], /^1\.\s*첫번째 항목/);
  assert.match(paras[1], /^2\. 두번째/);
});

test('fixture festival program keeps five numbered sections', () => {
  const fixture = JSON.parse(
    readFileSync(join(root, 'e2e/fixtures/festival-2989642-detail.json'), 'utf8'),
  );
  const paras = splitTourApiDetailParagraphs(fixture.intro.program);
  assert.equal(paras.length, 5);
  assert.match(paras[0], /^1\./);
  assert.match(paras[4], /^5\./);
});
