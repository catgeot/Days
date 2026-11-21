import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { shouldShowGlobeHomeControls } from '../../src/pages/Home/lib/globeHomeControls.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');

test('지구본 컨트롤 — 홈에서만, 장소·리뷰에서는 숨김', () => {
  assert.equal(shouldShowGlobeHomeControls({ pathname: '/' }), true);
  assert.equal(shouldShowGlobeHomeControls({ pathname: '/explore' }), true);
  assert.equal(
    shouldShowGlobeHomeControls({ pathname: '/place/prague', isPlaceCardVisible: true }),
    false,
  );
  assert.equal(shouldShowGlobeHomeControls({ pathname: '/place/prague' }), false);
  assert.equal(
    shouldShowGlobeHomeControls({ pathname: '/place/prague/reviews' }),
    false,
  );
  assert.equal(
    shouldShowGlobeHomeControls({ pathname: '/', isPlaceCardVisible: true }),
    false,
  );
});

test('HomeUI는 장소 카드 위에 지구본 컨트롤을 다시 그리지 않는다', () => {
  const src = readFileSync(join(root, 'src/pages/Home/components/HomeUI.jsx'), 'utf8');
  assert.match(src, /shouldShowGlobeHomeControls/);
  assert.match(src, /showGlobeHomeControls \? globeChromeButtons : null/);
  assert.doesNotMatch(src, /fixed top-5 right-6/);
  const index = readFileSync(join(root, 'src/pages/Home/index.jsx'), 'utf8');
  assert.match(index, /isPlaceCardVisible=\{isPlaceCardSummaryVisible \|\| isPlaceRoute\}/);
  assert.match(index, /pathname\.startsWith\('\/place\/'\)/);
});
