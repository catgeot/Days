#!/usr/bin/env node
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import React, { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { I18nextProvider } from 'react-i18next';
import { ensureI18n } from '../../src/i18n/config.js';
import {
  ensureGateoReferralHref,
  formatExploreSearchThumbnailCreditPlain,
  normalizeExploreSearchThumbnailCredit,
} from '../../src/pages/Home/lib/exploreSearchThumbnailCredit.js';
import ExploreSearchThumbnailCreditCue from '../../src/pages/Home/components/SearchDiscovery/ExploreSearchThumbnailCreditCue.jsx';
import { attractionToSuggestion, resolveCityAttractionHub } from '../../src/pages/Home/lib/cityAttractionHubs.js';
import { enrichSearchCandidateScenicMedia } from '../../src/pages/Home/lib/koreaLocalScenicLists.js';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '../..');
const listPath = path.join(root, 'src/pages/Home/components/SearchDiscovery/SearchSuggestionList.jsx');
const listSrc = readFileSync(listPath, 'utf8');

const sampleCredit = {
  source: 'unsplash',
  photographer: 'Joshua Kettle',
  photographer_url: 'https://unsplash.com/@joshuakettle',
  unsplash_url: 'https://unsplash.com/photos/4AL1OnvWAng',
};

test('ensureGateoReferralHref appends gateo utm params', () => {
  const href = ensureGateoReferralHref('https://unsplash.com/photos/abc');
  assert.match(href, /utm_source=gateo/);
  assert.match(href, /utm_medium=referral/);
});

test('normalizeExploreSearchThumbnailCredit rejects missing photographer', () => {
  assert.equal(normalizeExploreSearchThumbnailCredit({ source: 'unsplash' }), null);
  assert.equal(normalizeExploreSearchThumbnailCredit(null), null);
});

test('formatExploreSearchThumbnailCreditPlain — ko / en', () => {
  const credit = normalizeExploreSearchThumbnailCredit(sampleCredit);
  assert.equal(formatExploreSearchThumbnailCreditPlain(credit, 'ko'), '사진 Joshua Kettle / Unsplash');
  assert.equal(
    formatExploreSearchThumbnailCreditPlain(credit, 'en'),
    'Photo: Joshua Kettle / Unsplash',
  );
});

test('prague enriched rows carry thumbnailCredit except icon-only castle', () => {
  const hub = resolveCityAttractionHub('prague');
  const rows = hub.attractions.map((a) =>
    enrichSearchCandidateScenicMedia(attractionToSuggestion(hub, a)),
  );
  const castle = rows.find((r) => r.name === '프라하성');
  const withCredit = rows.filter((r) => normalizeExploreSearchThumbnailCredit(r.thumbnailCredit));
  assert.equal(withCredit.length, 6);
  assert.equal(castle?.thumbnailCredit, undefined);
});

function renderCredit(locale) {
  const i18n = ensureI18n(locale);
  return renderToStaticMarkup(
    createElement(
      I18nextProvider,
      { i18n },
      createElement(ExploreSearchThumbnailCreditCue, { credit: sampleCredit }),
    ),
  );
}

test('ExploreSearchThumbnailCreditCue renders linked attribution', () => {
  const html = renderCredit('ko');
  assert.match(html, /data-explore-search-thumbnail-credit=""/);
  assert.match(html, /Joshua Kettle/);
  assert.match(html, /utm_source=gateo/);
  assert.match(html, /target="_blank"/);
  assert.match(html, /rel="noopener noreferrer"/);
});

test('ExploreSearchThumbnailCreditCue — English Photo: prefix', () => {
  const html = renderCredit('en');
  assert.match(html, />Photo:</);
});

test('SearchSuggestionList — credit cue outside <button>', () => {
  const buttonRe = /<button[\s\S]*?<\/button>/g;
  let match;
  while ((match = buttonRe.exec(listSrc)) !== null) {
    assert.doesNotMatch(
      match[0],
      /ExploreSearchThumbnailCreditCue/,
      'credit must not render inside <button>',
    );
  }
  assert.match(listSrc, /ExploreSearchThumbnailCreditCue/);
  assert.match(
    readFileSync(
      path.join(root, 'src/pages/Home/components/SearchDiscovery/ExploreSearchThumbnailCreditCue.jsx'),
      'utf8',
    ),
    /stopPropagation/,
  );
});