import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { JSDOM } from 'jsdom';
import {
  clearLogbookOfficialReviewHubBackState,
  peekLogbookOfficialReviewHubBackState,
  readLogbookOfficialReviewHubBackState,
  snapshotLogbookOfficialReviewHubForBack,
} from '../../src/utils/logbookOfficialReviewHubState.js';
import { buildLogbookOfficialReviewHref } from '../../src/utils/logbookOfficialReviewHubRoutes.js';
import {
  PLACE_EDITORIAL_REVIEW_DISCLOSURE_FALLBACK_KO,
  resolveEditorialReviewDisclosure,
} from '../../src/utils/placeReviewEditorial.js';

const healthRoot = join(dirname(fileURLToPath(import.meta.url)), '..', '..');

function setupDom() {
  const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>', {
    url: 'https://www.gateo.kr/blog?tab=public',
  });
  globalThis.window = dom.window;
  globalThis.document = dom.window.document;
  globalThis.sessionStorage = dom.window.sessionStorage;
  globalThis.HTMLElement = dom.window.HTMLElement;
  globalThis.Element = dom.window.Element;
  globalThis.performance = dom.window.performance;
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
  assert.deepEqual(peekLogbookOfficialReviewHubBackState(), {
    expanded: true,
    visibleCount: 20,
    scrollTop: 180,
  });
  assert.equal(readLogbookOfficialReviewHubBackState('PUSH'), null);
  clearLogbookOfficialReviewHubBackState();
  assert.equal(readLogbookOfficialReviewHubBackState('POP'), null);
  dom.window.close();
});

test('ReviewsTab gates place review chrome alignment behind hub flag', () => {
  const src = readFileSync(
    join(healthRoot, 'src/components/PlaceCard/tabs/ReviewsTab.jsx'),
    'utf8',
  );
  assert.match(src, /isGateoLogbookReviewHubEnabled/);
  assert.match(src, /hubAlignedReviewFocus/);
  assert.match(src, /data-place-reviews-scroll-chrome/);
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
  assert.match(src, /onSuccess/);
  assert.match(src, /min-h-11/);
});

test('hub detail place CTA preserves hub back snapshot for place detour', () => {
  const src = readFileSync(
    join(
      healthRoot,
      'src/pages/DailyReport/components/LogbookOfficialReviewHubDetail.jsx',
    ),
    'utf8',
  );
  assert.match(src, /peekLogbookOfficialReviewHubBackState/);
  assert.match(src, /rememberHubBackBeforePlaceDetour/);
});

test('resolveEditorialReviewDisclosure uses DB text or production fallback', () => {
  assert.equal(resolveEditorialReviewDisclosure({ disclosure: '  custom  ' }), 'custom');
  assert.equal(
    resolveEditorialReviewDisclosure({ is_editorial: true }),
    PLACE_EDITORIAL_REVIEW_DISCLOSURE_FALLBACK_KO,
  );
});

test('buildLogbookOfficialReviewHref keeps tab=public on /blog', () => {
  assert.equal(
    buildLogbookOfficialReviewHref('abc-123'),
    '/blog?tab=public&review=abc-123',
  );
});

test('placeReviewFocus hub alignment is gated behind logbook review hub flag', () => {
  const src = readFileSync(join(healthRoot, 'src/utils/placeReviewFocus.js'), 'utf8');
  assert.match(src, /isGateoLogbookReviewHubEnabled/);
  assert.match(src, /hubAlignedPlaceReviewFocusEnabled/);
  assert.match(src, /findPlaceReviewElementLegacy/);
});

test('hub scroll restore module cancels on user intent and caps wait', () => {
  const src = readFileSync(
    join(healthRoot, 'src/utils/logbookOfficialReviewHubScrollRestore.js'),
    'utf8',
  );
  assert.match(src, /keydown/);
  assert.match(src, /RESTORE_READY_TIMEOUT_MS/);
  assert.match(src, /onSuccess/);
  assert.match(src, /onFinalize/);
});
