import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  claimLogbookViewSession,
  readLogbookViewCount,
  releaseLogbookViewSession,
} from '../src/utils/logbookViewCount.js';
import {
  LOGBOOK_COMMENT_MAX,
  chunkList,
  isLogbookReactionSchemaMissing,
  logbookCommentsHref,
  nextLogbookLikeState,
  normalizeLogbookCommentBody,
  readLogbookCommentCount,
  readLogbookLikeCount,
} from '../src/utils/logbookReactions.js';
import {
  countReportsByPlace,
  fetchSamePlaceCount,
  logbookPlaceKey,
  logbookReadingMinutes,
  samePlaceCount,
} from '../src/utils/logbookReadingMeta.js';

assert.equal(readLogbookViewCount({ view_count: 0 }), 0);
assert.equal(readLogbookViewCount({ view_count: 12 }), 12);
assert.equal(readLogbookViewCount({ view_count: '4' }), 4);
assert.equal(readLogbookViewCount({ view_count: 3.8 }), 3);
assert.equal(readLogbookViewCount({}), null);
assert.equal(readLogbookViewCount({ view_count: -1 }), null);
assert.equal(readLogbookViewCount({ view_count: 'nope' }), null);

const mem = {
  store: new Map(),
  getItem(k) {
    return this.store.has(k) ? this.store.get(k) : null;
  },
  setItem(k, v) {
    this.store.set(k, v);
  },
  removeItem(k) {
    this.store.delete(k);
  },
};

assert.equal(claimLogbookViewSession('abc', mem), true);
assert.equal(claimLogbookViewSession('abc', mem), false);
releaseLogbookViewSession('abc', mem);
assert.equal(claimLogbookViewSession('abc', mem), true);
assert.equal(claimLogbookViewSession('', mem), false);

const root = join(import.meta.dirname, '..');
const migration = readFileSync(
  join(root, 'supabase/migrations/20260927120000_reports_view_count.sql'),
  'utf8',
);
assert.match(migration, /increment_report_view/);
assert.match(migration, /view_count/);
assert.match(migration, /GRANT EXECUTE ON FUNCTION public.increment_report_view\(text\) TO anon, authenticated/);

const vercel = readFileSync(join(root, 'vercel.json'), 'utf8');
const qa = readFileSync(join(root, 'src/shared/cloudPreview/cloudQaShareLinks.js'), 'utf8');
assert.match(vercel, /\/qa\/logbook-reads/);
assert.match(qa, /slug:\s*'logbook-reads'/);
assert.match(qa, /cursor\/logbook-reads-af3f/);

assert.equal(logbookReadingMinutes(''), null);
assert.equal(logbookReadingMinutes('가'.repeat(500)), 1);
assert.equal(logbookReadingMinutes('가'.repeat(501)), 2);
assert.equal(logbookReadingMinutes(`${'word '.repeat(200)}`), 1);
assert.equal(logbookReadingMinutes(`${'word '.repeat(201)}`), 2);
assert.equal(logbookReadingMinutes(`# ${'가'.repeat(10)}\n\n**본문**`), 1);
assert.equal(logbookPlaceKey('  파리  '), '파리');
assert.equal(logbookPlaceKey('위치 미상'), '');
assert.equal(logbookPlaceKey('Location unknown'), '');

const placeCounts = countReportsByPlace([
  { location: '파리' },
  { location: '파리 ' },
  { location: '파리 근교' },
  { location: '위치 미상' },
]);
assert.equal(samePlaceCount(placeCounts, '파리'), 2);
assert.equal(samePlaceCount(placeCounts, '파리 근교'), 1);
assert.equal(samePlaceCount(placeCounts, '위치 미상'), null);

function queryChain(result) {
  const api = {
    select() { return api; },
    eq() { return api; },
    ilike() { return api; },
    limit() { return Promise.resolve(result); },
  };
  return { from() { return api; } };
}

const publicRows = await fetchSamePlaceCount(
  queryChain({
    data: [
      { location: '파리', is_editorial: false },
      { location: '파리 ', is_editorial: false },
      { location: '파리 근교', is_editorial: false },
      { location: '파리', is_editorial: true, status: 'draft' },
    ],
    error: null,
  }),
  { location: '파리' },
);
assert.equal(publicRows, 2);

const mine = await fetchSamePlaceCount(
  queryChain({
    data: [
      { location: '제주', is_editorial: true, status: 'draft' },
      { location: '제주' },
    ],
    error: null,
  }),
  { location: '제주', userId: 'user-1' },
);
assert.equal(mine, 2);

let selects = 0;
const fallback = await fetchSamePlaceCount(
  {
    from() {
      const api = {
        select() {
          selects += 1;
          return api;
        },
        eq() { return api; },
        ilike() { return api; },
        limit() {
          if (selects === 1) {
            return Promise.resolve({ data: null, error: { code: 'PGRST204', message: 'column' } });
          }
          return Promise.resolve({ data: [{ location: '부산' }], error: null });
        },
      };
      return api;
    },
  },
  { location: '부산' },
);
assert.equal(fallback, 1);
assert.equal(selects, 2);

const recentList = readFileSync(join(root, 'src/pages/DailyReport/components/RecentList.jsx'), 'utf8');
const publicViewer = readFileSync(join(root, 'src/pages/DailyReport/PublicViewer.jsx'), 'utf8');
const detail = readFileSync(join(root, 'src/pages/DailyReport/Detail.jsx'), 'utf8');
const readFacts = readFileSync(join(root, 'src/pages/DailyReport/components/LogbookReadFacts.jsx'), 'utf8');
const reactionSlot = readFileSync(join(root, 'src/pages/DailyReport/components/LogbookReactionSlot.jsx'), 'utf8');
assert.match(recentList, /LogbookReadFacts/);
assert.match(publicViewer, /tone="article"/);
assert.match(detail, /tone="article"/);
assert.doesNotMatch(publicViewer, /update\(\s*\{[^}]*view_count/);
assert.doesNotMatch(detail, /update\(\s*\{[^}]*view_count/);
assert.match(recentList, /LogbookReactionSlot/);
assert.match(recentList, /viewMode === 'column'/);
assert.match(recentList, /grid-cols-1 gap-5/);
assert.match(recentList, /viewColumn/);
assert.match(publicViewer, /LogbookComments/);
assert.match(publicViewer, /LogbookReactionSlot/);
assert.match(publicViewer, /tone="article"/);
assert.match(readFacts, /ChartColumn/);
assert.doesNotMatch(readFacts, /\bEye\b/);
assert.match(reactionSlot, /tone === 'article'/);
assert.match(reactionSlot, /logbook\.reactions\.like/);
assert.match(reactionSlot, /fill-none text-red-500/);

assert.equal(readLogbookLikeCount({ like_count: 0 }), 0);
assert.equal(readLogbookLikeCount({ like_count: '3' }), 3);
assert.equal(readLogbookLikeCount({}), null);
assert.equal(readLogbookLikeCount({ like_count: -2 }), null);
assert.equal(readLogbookCommentCount({ comment_count: 8 }), 8);
assert.equal(readLogbookCommentCount({}), null);
assert.deepEqual(nextLogbookLikeState({ liked: false, likeCount: 0 }), { liked: true, likeCount: 1 });
assert.deepEqual(nextLogbookLikeState({ liked: true, likeCount: 1 }), { liked: false, likeCount: 0 });
assert.deepEqual(nextLogbookLikeState({ liked: true, likeCount: 0 }), { liked: false, likeCount: 0 });
assert.equal(normalizeLogbookCommentBody('  안녕  '), '안녕');
assert.equal(normalizeLogbookCommentBody('   '), '');
assert.equal(normalizeLogbookCommentBody('가'.repeat(LOGBOOK_COMMENT_MAX + 20)).length, LOGBOOK_COMMENT_MAX);
assert.equal(logbookCommentsHref('/p/abc'), '/p/abc#logbook-comments');
assert.equal(chunkList(['a', 'b', 'c'], 2).length, 2);
assert.equal(isLogbookReactionSchemaMissing({ code: 'PGRST205' }), true);
assert.equal(isLogbookReactionSchemaMissing({ code: '23505' }), false);

const reactionsMigration = readFileSync(
  join(root, 'supabase/migrations/20260927150000_reports_likes_comments.sql'),
  'utf8',
);
assert.match(reactionsMigration, /report_likes/);
assert.match(reactionsMigration, /report_comments/);
assert.match(reactionsMigration, /like_count/);
assert.match(reactionsMigration, /comment_count/);
assert.match(reactionsMigration, /gateo\.report_reaction_counts/);
assert.match(reactionsMigration, /report_is_reaction_target/);
assert.doesNotMatch(reactionsMigration, /view_count\s*=/);
assert.match(reactionsMigration, /char_length\(btrim\(body\)\) BETWEEN 1 AND 500/);

const reactionClient = readFileSync(
  join(root, 'src/pages/DailyReport/lib/logbookReactionClient.js'),
  'utf8',
);
assert.match(reactionClient, /from\('report_likes'\)/);
assert.match(reactionClient, /from\('report_comments'\)/);
assert.doesNotMatch(reactionClient, /from\('reports'\)/);
assert.doesNotMatch(reactionClient, /view_count/);
assert.doesNotMatch(reactionClient, /\.update\(/);

const ko = JSON.parse(readFileSync(join(root, 'src/i18n/locales/ko.json'), 'utf8'));
const en = JSON.parse(readFileSync(join(root, 'src/i18n/locales/en.json'), 'utf8'));
for (const key of ['readingMinutes', 'readingMinutesShort', 'readingAria', 'samePlace', 'samePlaceAria']) {
  assert.equal(typeof ko.logbook.meta[key], 'string');
  assert.equal(typeof en.logbook.meta[key], 'string');
}
for (const key of ['likeAria', 'unlikeAria', 'commentAria', 'commentsTitle', 'placeholder', 'submit', 'delete', 'empty', 'loginConfirm']) {
  assert.equal(typeof ko.logbook.reactions[key], 'string');
  assert.equal(typeof en.logbook.reactions[key], 'string');
}

console.log('smoke:logbook-view-count PASS');
