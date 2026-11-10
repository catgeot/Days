#!/usr/bin/env node
/**
 * 식당 검색 카드 «지도·리뷰 보기 ↗» — <button> 밖 실제 <a> (PR753 회귀 방지).
 * PR751은 <a>를 <button> 안에 넣어 브라우저에서 링크/CTA가 안 보이는 케이스가 있었다.
 */
import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '../..');
const listPath = path.join(
  root,
  'src/pages/Home/components/SearchDiscovery/SearchSuggestionList.jsx',
);
const cuePath = path.join(
  root,
  'src/pages/Home/components/SearchDiscovery/ExploreRestaurantMapOutboundCue.jsx',
);

const listSrc = fs.readFileSync(listPath, 'utf8');
const cueSrc = fs.readFileSync(cuePath, 'utf8');

function assertNoCueInsideButton(block, label) {
  const buttonRe = /<button[\s\S]*?<\/button>/g;
  let match;
  while ((match = buttonRe.exec(block)) !== null) {
    assert.doesNotMatch(
      match[0],
      /ExploreRestaurantMapOutboundCue/,
      `${label}: CTA must not render inside <button>`,
    );
  }
}

test('ExploreRestaurantMapOutboundCue — target=_blank 외부 지도 링크', () => {
  assert.match(cueSrc, /target="_blank"/);
  assert.match(cueSrc, /stopPropagation/);
  assert.match(cueSrc, /if \(!href\) return null/);
});

test('SearchSuggestionList — 식당 CTA는 button 형제(리스트·모호함 카드)', () => {
  assert.match(listSrc, /isRestaurantRow/, 'isRestaurantRow guard');
  assert.match(listSrc, /ExploreRestaurantMapOutboundCue/, 'CTA component');

  const popoverBlock = listSrc.slice(
    listSrc.indexOf('export function SearchSuggestionList'),
    listSrc.indexOf('export function SearchDisambiguationCards'),
  );
  const disambBlock = listSrc.slice(listSrc.indexOf('export function SearchDisambiguationCards'));

  assertNoCueInsideButton(popoverBlock, 'SearchSuggestionList');
  assertNoCueInsideButton(disambBlock, 'SearchDisambiguationCards');

  assert.match(
    popoverBlock,
    /<\/button>\s*\{isRestaurantRow \? \(\s*<ExploreRestaurantMapOutboundCue/,
    'popover: CTA after </button>',
  );
  assert.match(
    disambBlock,
    /<\/button>\s*\{isRestaurantRow \? \(\s*<ExploreRestaurantMapOutboundCue/,
    'disambiguation: CTA after </button>',
  );
});
