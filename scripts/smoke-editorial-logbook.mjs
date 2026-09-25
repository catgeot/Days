import assert from 'node:assert/strict';
import { validateEditorialLogbookPayload } from './lib/validate-editorial-logbook-payload.mjs';
import { buildEditorialLogbookJsonLd } from '../src/pages/DailyReport/lib/logbookEditorialJsonLd.js';
import {
  isEditorialLogbook,
  LOGBOOK_EDITORIAL_DISCLOSURE_KO,
  publicLogbookDetailPath,
} from '../src/utils/logbookEditorial.js';

const draft = validateEditorialLogbookPayload({
  title: 'Test',
  slug: 'paris-test',
  place_slug: 'paris',
  content: 'Hello',
  status: 'draft',
  images: [],
});

assert.equal(draft.ok, true);
assert.equal(draft.data.is_editorial, true);
assert.equal(draft.data.is_public, false);
assert.equal(draft.data.disclosure_badge, LOGBOOK_EDITORIAL_DISCLOSURE_KO);

const published = validateEditorialLogbookPayload({
  title: 'Pub',
  slug: 'paris-pub',
  place_slug: 'paris',
  content: 'Body',
  status: 'published',
  images: [{ url: 'https://example.com/a.jpg', photographer: 'A' }],
});

assert.equal(published.ok, true);
assert.equal(published.data.is_public, true);
assert.ok(published.data.canonical_url.includes('/blog/e/paris-pub'));

const report = {
  is_editorial: true,
  status: 'published',
  title: 'Paris',
  slug: 'paris-pub',
  date: '2026-01-01',
  published_at: '2026-01-01T09:00:00Z',
  locale: 'ko',
  images: [{ url: 'https://example.com/a.jpg' }],
};

assert.equal(isEditorialLogbook(report), true);
assert.equal(publicLogbookDetailPath(report), '/blog/e/paris-pub');

const jsonLd = buildEditorialLogbookJsonLd(report, 'https://www.gateo.kr/blog/e/paris-pub');
assert.equal(jsonLd['@type'], 'Article');
assert.equal(jsonLd.author['@type'], 'Organization');
assert.equal(jsonLd.author.name, 'GATEO');
assert.ok(jsonLd.description.includes('실제 방문기 아님'));

console.log('smoke-editorial-logbook: OK');
