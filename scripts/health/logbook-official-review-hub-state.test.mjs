import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { JSDOM } from 'jsdom';
import {
  clearLogbookOfficialReviewHubBackState,
  readLogbookOfficialReviewHubBackState,
  snapshotLogbookOfficialReviewHubForBack,
} from '../../src/utils/logbookOfficialReviewHubState.js';

const healthRoot = join(dirname(fileURLToPath(import.meta.url)), '..', '..');

function setupDom() {
  const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>', {
    url: 'https://www.gateo.kr/blog?tab=public',
  });
  globalThis.window = dom.window;
  globalThis.document = dom.window.document;
  globalThis.sessionStorage = dom.window.sessionStorage;
  return dom;
}

test('hub back state restores only on POP', () => {
  const dom = setupDom();
  snapshotLogbookOfficialReviewHubForBack({ expanded: true, visibleCount: 20, scrollTop: 180 });
  assert.deepEqual(readLogbookOfficialReviewHubBackState('POP'), {
    expanded: true,
    visibleCount: 20,
    scrollTop: 180,
  });
  assert.equal(readLogbookOfficialReviewHubBackState('PUSH'), null);
  clearLogbookOfficialReviewHubBackState();
  assert.equal(readLogbookOfficialReviewHubBackState('POP'), null);
  dom.window.close();
});

test('hub card links use buildPlaceReviewsHref with review id', () => {
  const src = readFileSync(
    join(
      healthRoot,
      'src/pages/DailyReport/components/LogbookOfficialReviewHubCard.jsx',
    ),
    'utf8',
  );
  assert.match(src, /buildPlaceReviewsHref\(placePath, review\.id\)/);
  assert.match(src, /snapshotLogbookOfficialReviewHubForBack/);
  assert.match(src, /min-h-11/);
});
