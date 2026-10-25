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
import { buildLogbookOfficialReviewHref } from '../../src/utils/logbookOfficialReviewHubRoutes.js';

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

test('hub card links open in-logbook review URL', () => {
  const src = readFileSync(
    join(
      healthRoot,
      'src/pages/DailyReport/components/LogbookOfficialReviewHubCard.jsx',
    ),
    'utf8',
  );
  assert.match(src, /buildLogbookOfficialReviewHref\(review\.id\)/);
  assert.match(src, /snapshotLogbookOfficialReviewHubForBack/);
  assert.match(src, /min-h-11/);
});

test('buildLogbookOfficialReviewHref keeps tab=public on /blog', () => {
  assert.equal(
    buildLogbookOfficialReviewHref('abc-123'),
    '/blog?tab=public&review=abc-123',
  );
});
