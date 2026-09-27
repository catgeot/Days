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
  PROFILE_PHOTO_LIMIT,
  normalizeProfilePhotoUrls,
  ownerProfilePhotos,
  ownerProfilePublic,
  profileAvatarUrl,
  profileLabel,
  publicProfilePhotos,
} from '../src/shared/Auth/profileAvatar.js';
import {
  countReportsByPlace,
  fetchSamePlaceCount,
  listLogbookPlaceChips,
  logbookPlaceKey,
  logbookReadingMinutes,
  reportMatchesLogbookPlace,
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
assert.equal(logbookPlaceKey('보라카이'), '보라카이');
assert.equal(logbookPlaceKey('아이슬란드'), '아이슬란드');
assert.equal(logbookPlaceKey('길리 메모'), '길리 메모');
assert.equal(logbookPlaceKey('춘천'), '춘천');
assert.equal(logbookPlaceKey('춘천시 소양로3가'), '춘천');
assert.equal(logbookPlaceKey('춘천시 퇴계동'), '춘천');
assert.equal(logbookPlaceKey('춘천시'), '춘천');
assert.equal(logbookPlaceKey('파리 근교'), '파리 근교');
assert.equal(logbookPlaceKey('춘천시 근교'), '춘천시 근교');
assert.equal(logbookPlaceKey('서울특별시 종로구 사직동'), '서울');
assert.equal(logbookPlaceKey('제주특별자치도 제주시 애월읍'), '제주');
assert.equal(logbookPlaceKey('오사카시 난바'), '오사카시 난바');

const placeCounts = countReportsByPlace([
  { location: '파리' },
  { location: '파리 ' },
  { location: '파리 근교' },
  { location: '위치 미상' },
]);
assert.equal(samePlaceCount(placeCounts, '파리'), 2);
assert.equal(samePlaceCount(placeCounts, '파리 근교'), 1);
assert.equal(samePlaceCount(placeCounts, '위치 미상'), null);

const placeChips = listLogbookPlaceChips([
  { location: '방콕' },
  { location: '파리' },
  { location: '파리 ' },
  { location: '위치 미상' },
  { location: 'Location unknown' },
]);
assert.deepEqual(placeChips, [
  { name: '파리', count: 2 },
  { name: '방콕', count: 1 },
]);
assert.equal(reportMatchesLogbookPlace({ location: '파리 ' }, '파리'), true);
assert.equal(reportMatchesLogbookPlace({ location: '파리 근교' }, '파리'), false);
assert.equal(reportMatchesLogbookPlace({ location: '위치 미상' }, ''), true);
assert.equal(reportMatchesLogbookPlace({ location: '위치 미상' }, '파리'), false);

const koreaChips = listLogbookPlaceChips([
  { location: '보라카이' },
  { location: '보라카이' },
  { location: '아이슬란드' },
  { location: '아이슬란드' },
  { location: '길리 메모' },
  { location: '길리 메모' },
  { location: '춘천' },
  { location: '춘천시 소양로3가' },
  { location: '춘천시 퇴계동' },
  { location: '파리' },
  { location: '파리 근교' },
]);
assert.deepEqual(koreaChips, [
  { name: '춘천', count: 3 },
  { name: '길리 메모', count: 2 },
  { name: '보라카이', count: 2 },
  { name: '아이슬란드', count: 2 },
  { name: '파리', count: 1 },
  { name: '파리 근교', count: 1 },
]);
assert.equal(reportMatchesLogbookPlace({ location: '춘천시 퇴계동' }, '춘천'), true);
assert.equal(reportMatchesLogbookPlace({ location: '춘천시 소양로3가' }, '춘천'), true);
assert.equal(reportMatchesLogbookPlace({ location: '춘천' }, '춘천'), true);
assert.equal(reportMatchesLogbookPlace({ location: '길리 메모' }, '길리'), false);
assert.equal(reportMatchesLogbookPlace({ location: '파리 근교' }, '춘천'), false);
const chuncheonCounts = countReportsByPlace([
  { location: '춘천' },
  { location: '춘천시 소양로3가' },
  { location: '춘천시 퇴계동' },
  { location: '파리 근교' },
]);
assert.equal(samePlaceCount(chuncheonCounts, '춘천시 퇴계동'), 3);
assert.equal(samePlaceCount(chuncheonCounts, '파리 근교'), 1);

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
assert.match(recentList, /useState\('column'\)/);
assert.doesNotMatch(recentList, /useState\('grid'\)/);
assert.match(recentList, /viewMode === 'column'/);
assert.equal(profileAvatarUrl({ user_metadata: { avatar_url: 'http://cdn.example/a.jpg' } }), 'https://cdn.example/a.jpg');
assert.equal(profileAvatarUrl(''), '');
assert.equal(profileLabel('  길리  ', { email: 'a@b.c' }), '길리');
assert.equal(profileLabel('', { email: 'catgeot@x.com' }), 'catgeot');
assert.deepEqual(
  normalizeProfilePhotoUrls(['http://cdn.example/a.jpg', 'https://cdn.example/a.jpg', 'https://cdn.example/b.jpg']),
  ['https://cdn.example/a.jpg', 'https://cdn.example/b.jpg'],
);
assert.equal(normalizeProfilePhotoUrls(Array.from({ length: 12 }, (_, i) => `https://cdn.example/${i}.jpg`)).length, PROFILE_PHOTO_LIMIT);
assert.deepEqual(publicProfilePhotos({ profile_public: false, avatar_urls: ['https://cdn.example/a.jpg'], avatar_url: 'https://cdn.example/a.jpg' }), []);
assert.deepEqual(publicProfilePhotos({ avatar_url: 'http://cdn.example/a.jpg' }), ['https://cdn.example/a.jpg']);
assert.deepEqual(
  ownerProfilePhotos(null, { user_metadata: { avatar_urls: ['https://cdn.example/b.jpg', 'https://cdn.example/a.jpg'] } }),
  ['https://cdn.example/b.jpg', 'https://cdn.example/a.jpg'],
);
assert.equal(ownerProfilePublic({ profile_public: false }, { user_metadata: { profile_public: true } }), false);
assert.equal(ownerProfilePublic(null, null), true);
const logoPanel = readFileSync(join(root, 'src/pages/Home/components/LogoPanel.jsx'), 'utf8');
const dailyLayout = readFileSync(join(root, 'src/pages/DailyReport/layout/DailyLayout.jsx'), 'utf8');
const accountProfile = readFileSync(join(root, 'src/shared/Auth/AccountProfile.jsx'), 'utf8');
assert.doesNotMatch(logoPanel, /navigate\('\/account'\)/);
assert.match(logoPanel, /setProfileOpen\(true\)/);
assert.match(logoPanel, /embedded/);
assert.match(dailyLayout, /setProfileOpen\(true\)/);
assert.match(dailyLayout, /createPortal/);
assert.doesNotMatch(dailyLayout, /Link to="\/account"/);
assert.match(dailyLayout, /data-logbook-mobile-header/);
assert.match(dailyLayout, /min-h-0 flex-1/);
assert.match(dailyLayout, /data-logbook-header-profile/);
assert.match(accountProfile, /data-profile-close/);
assert.match(accountProfile, /overflow-x-hidden/);
assert.match(accountProfile, /overscroll-contain/);
assert.match(accountProfile, /profilePublic/);
const appSource = readFileSync(join(root, 'src/App.jsx'), 'utf8');
assert.match(appSource, /path="\/account"/);
assert.match(recentList, /grid-cols-1 gap-5/);
assert.match(recentList, /viewColumn/);
assert.match(recentList, /listLogbookPlaceChips/);
assert.match(recentList, /\{report\.location\}/);
assert.match(recentList, /logbook\.recentList\.placeGroup/);
assert.match(recentList, /logbook\.recentList\.placeAll/);
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
for (const key of ['placeGroup', 'placeAll', 'noPlaceResults']) {
  assert.equal(typeof ko.logbook.recentList[key], 'string');
  assert.equal(typeof en.logbook.recentList[key], 'string');
}
for (const key of ['readingMinutes', 'readingMinutesShort', 'readingAria', 'samePlace', 'samePlaceAria']) {
  assert.equal(typeof ko.logbook.meta[key], 'string');
  assert.equal(typeof en.logbook.meta[key], 'string');
}
for (const key of ['likeAria', 'unlikeAria', 'commentAria', 'commentsTitle', 'placeholder', 'submit', 'delete', 'empty', 'loginConfirm']) {
  assert.equal(typeof ko.logbook.reactions[key], 'string');
  assert.equal(typeof en.logbook.reactions[key], 'string');
}

console.log('smoke:logbook-view-count PASS');
