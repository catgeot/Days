import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateEditorialLogbookPayload } from './lib/validate-editorial-logbook-payload.mjs';
import { buildEditorialLogbookJsonLd } from '../src/pages/DailyReport/lib/logbookEditorialJsonLd.js';
import {
  editorialLogbookBadgeLabel,
  editorialLogbookBadgeLocale,
  editorialLogbookSecondaryNotice,
  isEditorialLogbook,
  LOGBOOK_EDITORIAL_BADGE_EN,
  LOGBOOK_EDITORIAL_BADGE_KO,
  LOGBOOK_EDITORIAL_DISCLOSURE_KO,
  LOGBOOK_EDITORIAL_SECONDARY_KO,
  publicLogbookDetailPath,
} from '../src/utils/logbookEditorial.js';
import { filterPublicLogbookFeedRows } from '../src/utils/logbookPublicFeed.js';
import {
  normalizeLogbookPhotoPlaceholders,
  splitLogbookPhotoPlaceholders,
  parseLogbookPhotoIndex,
  stripLogbookMarkdownSnippet,
} from '../src/pages/DailyReport/utils/logbookMarkdownSnippet.js';

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

assert.equal(editorialLogbookBadgeLocale({ locale: 'ko' }), 'ko');
assert.equal(editorialLogbookBadgeLocale({ locale: null }), 'ko');
assert.equal(editorialLogbookBadgeLocale({}), 'ko');
assert.equal(editorialLogbookBadgeLocale({ locale: 'en-US' }), 'en-US');
assert.equal(editorialLogbookBadgeLabel(editorialLogbookBadgeLocale({})), LOGBOOK_EDITORIAL_BADGE_KO);
assert.equal(
  editorialLogbookSecondaryNotice(editorialLogbookBadgeLocale({})),
  LOGBOOK_EDITORIAL_SECONDARY_KO,
);
assert.equal(editorialLogbookBadgeLabel(editorialLogbookBadgeLocale({ locale: 'en' })), LOGBOOK_EDITORIAL_BADGE_EN);
assert.equal(
  editorialLogbookBadgeLabel(editorialLogbookBadgeLocale({ locale: null })),
  'GATEO 에디터',
);
assert.equal(
  editorialLogbookSecondaryNotice(editorialLogbookBadgeLocale({ locale: undefined })),
  'AI 보조 · 실제 방문기 아님',
);
assert.ok(
  !editorialLogbookBadgeLabel(editorialLogbookBadgeLocale({})).includes('·'),
  'feed chip must be primary label only',
);

const published = validateEditorialLogbookPayload({
  title: 'Pub',
  slug: 'paris-pub',
  place_slug: 'paris',
  content: 'Body\n\n[사진 1]',
  status: 'published',
  images: [{ url: 'https://example.com/a.jpg', photographer: 'A' }],
});

assert.equal(published.ok, true);
assert.equal(published.data.is_public, true);
assert.ok(published.data.canonical_url.includes('/blog/e/paris-pub'));

const badToken = validateEditorialLogbookPayload({
  title: 'Bad',
  slug: 'bad',
  place_slug: 'paris',
  content: '[LOGBOOK_PHOTO:0]',
  status: 'draft',
  images: [],
});
assert.equal(badToken.ok, false);

const bodyWithPhoto = 'Intro\n\n[사진 1]\n\nOutro';
const parts = splitLogbookPhotoPlaceholders(bodyWithPhoto);
assert.ok(parts.some((p) => parseLogbookPhotoIndex(p) === 0), '[사진 1] parses to image index 0');
assert.ok(!parts.some((p) => /^\[사진\s*\d+\]$/.test(p) === false && p.includes('[사진')), 'no stray unparsed photo tokens in split parts except placeholders');
const stripped = stripLogbookMarkdownSnippet(bodyWithPhoto);
assert.ok(!stripped.includes('[사진'), 'preview strip removes photo token text');

const legacyNorm = normalizeLogbookPhotoPlaceholders('before [LOGBOOK_PHOTO:0] after');
assert.equal(legacyNorm, 'before [사진 1] after');
assert.equal(parseLogbookPhotoIndex('[사진 1]'), 0);

const fixturePath = path.join(path.dirname(fileURLToPath(import.meta.url)), 'fixtures/editorial-logbook-draft.sample.json');
const fixtureRaw = fs.readFileSync(fixturePath, 'utf8');
assert.ok(!/\[LOGBOOK_PHOTO:/i.test(fixtureRaw), 'sample fixture must not use LOGBOOK_PHOTO tokens');
assert.ok(fixtureRaw.includes('[사진 1]'), 'sample fixture uses canonical [사진 1]');

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

const feed = filterPublicLogbookFeedRows([
  { is_editorial: true, status: 'draft', is_public: true },
  { is_editorial: true, status: 'published', is_public: true },
  { is_public: true },
]);
assert.equal(feed.length, 2);

console.log('smoke-editorial-logbook: OK');
