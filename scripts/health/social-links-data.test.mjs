import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import {
  buildSocialLinkCards,
  enrichSocialCards,
  parsePostedLinksMarkdown,
  resolveSocialLinkCards,
} from '../social/postedLinksModel.mjs';
import { loadSocialPlaceCatalog, syncPostedLinks } from '../social/sync-posted-links.mjs';
import { socialTargetHref } from '../../src/pages/Social/socialLinksView.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const samplePath = join(root, 'scripts/social/fixtures/posted-links.sample.md');
const bulletsPath = join(root, 'scripts/social/fixtures/posted-links-bullets.md');
const scriptPath = join(root, 'scripts/social/sync-posted-links.mjs');

function cells(postedOn, channel, url, campaignId, target, title, region, status) {
  return [postedOn, channel, url, campaignId, target, title, region, status];
}

test('sample fixture merges IG+FB, drops X deleted unconfirmed, keeps target order', () => {
  const parsed = parsePostedLinksMarkdown(readFileSync(samplePath, 'utf8'));
  assert.equal(parsed.ok, true);
  const built = buildSocialLinkCards(parsed.rows);
  assert.equal(built.ok, true);
  assert.deepEqual(
    built.cards.map((card) => card.campaignId),
    ['reel-03', 'fest-638576', 'reel-10', 'reel-02'],
  );
  assert.equal(built.cards[0].firstPostedAt, '2026-11-27');
  assert.deepEqual(built.cards[0].targets, [
    { type: 'place', slug: 'seongsan-ilchulbong' },
    { type: 'place', slug: 'tour-126201' },
  ]);
  assert.equal(built.cards[0].targets.length >= 1 && built.cards[0].targets.length <= 3, true);
  assert.equal(new Set(built.cards.map((card) => card.campaignId)).size, built.cards.length);
  assert.equal(built.excluded.some((row) => row.reason === 'x'), true);
  assert.equal(built.excluded.some((row) => row.reason === 'deleted'), true);
  assert.equal(built.excluded.some((row) => row.reason === 'unconfirmed'), true);
  assert.equal(
    built.cards.some((card) => card.campaignId === 'reel-13' || card.campaignId === 'reel-08'),
    false,
  );
  assert.equal(built.skipped.some((row) => row.reason === 'bad-targets'), true);
  for (const card of built.cards) {
    assert.ok(card.title);
    assert.ok(card.region);
    assert.match(card.campaignId, /^(?:reel-\d+|fest-\d+)$/);
  }
});

test('bullets under the table are ignored and an empty region uses the place region', () => {
  const parsed = parsePostedLinksMarkdown(readFileSync(bulletsPath, 'utf8'));
  assert.equal(parsed.ok, true);
  assert.equal(parsed.rows.length, 4);
  assert.equal(
    parsed.rows.some((row) => row.cells.some((cell) => String(cell).includes('reel-99'))),
    false,
  );
  const built = buildSocialLinkCards(parsed.rows);
  assert.equal(built.ok, true);
  assert.deepEqual(
    built.cards.map((card) => card.campaignId),
    ['reel-05', 'reel-10', 'reel-02'],
  );
  assert.equal(built.cards.find((card) => card.campaignId === 'reel-05').region, '');
  assert.equal(built.cards.find((card) => card.campaignId === 'reel-10').region, '전북 샘플');
  assert.equal(built.skipped.some((row) => row.reason === 'missing-region'), false);

  const catalog = loadSocialPlaceCatalog(root);
  const cards = enrichSocialCards(built.cards, catalog);
  assert.equal(cards.find((card) => card.campaignId === 'reel-05').region, '제주');
  assert.equal(cards.find((card) => card.campaignId === 'reel-10').region, '전북 샘플');
  assert.equal(cards.find((card) => card.campaignId === 'reel-02'), undefined);
});

test('same 홍보번호 with different targets fails', () => {
  const built = buildSocialLinkCards([
    {
      line: 2,
      cells: cells(
        '2026-11-01',
        'IG',
        'https://example.com/a',
        'reel-04',
        'place:seongsan-ilchulbong',
        '샘플',
        '제주',
        'live',
      ),
    },
    {
      line: 3,
      cells: cells(
        '2026-11-01',
        'FB',
        'https://example.com/b',
        'reel-04',
        'place:tour-126201',
        '샘플',
        '제주',
        'live',
      ),
    },
  ]);
  assert.equal(built.ok, false);
  assert.match(built.error, /reel-04/);
});

test('card list caps at 30 newest', () => {
  const rows = [];
  for (let day = 1; day <= 31; day += 1) {
    rows.push({
      line: day,
      cells: cells(
        `2026-01-${String(day).padStart(2, '0')}`,
        'IG',
        `https://example.com/${day}`,
        `reel-${day}`,
        'place:seongsan-ilchulbong',
        `샘플 ${day}`,
        '제주',
        'live',
      ),
    });
  }
  rows.push({
    line: 40,
    cells: cells(
      '2026-01-31',
      'X',
      'https://example.com/x',
      'reel-31',
      'place:seongsan-ilchulbong',
      '샘플',
      '제주',
      'live',
    ),
  });
  const built = buildSocialLinkCards(rows);
  assert.equal(built.ok, true);
  assert.equal(built.cards.length, 30);
  assert.equal(built.cards[0].campaignId, 'reel-31');
  assert.equal(
    built.cards.some((card) => card.campaignId === 'reel-1'),
    false,
  );
  assert.equal(built.excluded.some((row) => row.reason === 'x'), true);
});

test('wrong header fails and internal hrefs have no utm', () => {
  const parsed = parsePostedLinksMarkdown('| 게시일 | 채널 |\n| --- | --- |\n');
  assert.equal(parsed.ok, false);
  assert.equal(socialTargetHref({ type: 'place', slug: 'tour-126201' }), '/place/tour-126201');
  assert.equal(socialTargetHref({ type: 'festival', id: '2048902' }), '/korea?festival=2048902');
  assert.equal(socialTargetHref({ type: 'place', slug: 'tour-126201' }).includes('utm_'), false);
});

test('missing posted-links.md writes an empty list and ignores posted-log.md', () => {
  const dir = mkdtempSync(join(tmpdir(), 'social-links-'));
  const input = join(dir, 'posted-links.md');
  const output = join(dir, 'socialLinks.generated.json');
  writeFileSync(
    join(dir, 'posted-log.md'),
    '| 2026-11-27 | 01 | IG 릴스 | https://example.com/secret | 비고 |\n',
    'utf8',
  );
  const result = syncPostedLinks({
    inputPath: input,
    outputPath: output,
    catalog: { places: new Map(), festivals: new Map() },
  });
  assert.equal(result.ok, true);
  assert.equal(result.missingSource, true);
  assert.deepEqual(result.cards, []);
  const written = JSON.parse(readFileSync(output, 'utf8'));
  assert.deepEqual(written.cards, []);
  assert.equal(JSON.stringify(written).includes('secret'), false);

  const spawned = spawnSync(process.execPath, [scriptPath, input, output], { encoding: 'utf8' });
  assert.equal(spawned.status, 0, spawned.stderr);

  const conflict = join(dir, 'conflict.md');
  writeFileSync(
    conflict,
    [
      '| 게시일 | 채널 | 게시 URL | 홍보번호 | 대상 | 표시 이름 | 지역 | 상태 |',
      '| --- | --- | --- | --- | --- | --- | --- | --- |',
      '| 2026-11-01 | IG | https://example.com/a | reel-04 | place:seongsan-ilchulbong | 샘플 | 제주 | live |',
      '| 2026-11-01 | FB | https://example.com/b | reel-04 | place:tour-126201 | 샘플 | 제주 | live |',
    ].join('\n'),
    'utf8',
  );
  const failed = spawnSync(process.execPath, [scriptPath, conflict, join(dir, 'nope.json')], {
    encoding: 'utf8',
  });
  assert.equal(failed.status, 1);
  assert.match(failed.stderr, /reel-04/);
});

test('catalog hero is the scenic photo and a missing slug stays without a photo', () => {
  const catalog = loadSocialPlaceCatalog(root);
  const parsed = parsePostedLinksMarkdown(readFileSync(samplePath, 'utf8'));
  const built = buildSocialLinkCards(parsed.rows);
  const cards = enrichSocialCards(built.cards, catalog);
  const hero = cards.find((card) => card.campaignId === 'reel-03');
  assert.match(hero.photoUrl, /visitkorea\.or\.kr/);
  assert.equal(hero.photoCredit.kind, 'kto');
  assert.equal(hero.targets[1].name, '소수서원');
  assert.equal(cards.find((card) => card.campaignId === 'reel-02'), undefined);
  const fest = cards.find((card) => card.campaignId === 'fest-638576');
  assert.equal(fest.targets[0].eventEndDate, '20261108');
  assert.match(fest.photoUrl, /^https:\/\//);
});

test('an unknown named secondary is dropped and an unknown main removes the card', () => {
  const catalog = loadSocialPlaceCatalog(root);
  const resolved = resolveSocialLinkCards(
    [
      {
        campaignId: 'reel-07',
        firstPostedAt: '2026-11-04',
        title: '샘플',
        region: '',
        targets: [
          { type: 'place', slug: 'gaesimsa' },
          { type: 'place', slug: 'not-a-real-slug' },
        ],
      },
      {
        campaignId: 'reel-02',
        firstPostedAt: '2026-11-01',
        title: '샘플 없는 대표',
        region: '',
        targets: [{ type: 'place', slug: 'not-a-real-slug' }],
      },
    ],
    catalog,
  );
  assert.deepEqual(
    resolved.cards[0].targets.map((target) => target.slug),
    ['gaesimsa'],
  );
  assert.deepEqual(resolved.missingMains, [
    { campaignId: 'reel-02', target: 'place:not-a-real-slug' },
  ]);
});

test('posted-links.md matches the published file and builds the live cards', () => {
  const postedPath = join(root, 'data/social/posted-links.md');
  const bytes = readFileSync(postedPath);
  assert.equal(
    createHash('sha256').update(bytes).digest('hex'),
    '0b450729453e06fbac104fac2fa79f1bc82594d8dce1e963068ab80fc4417424',
  );
  const parsed = parsePostedLinksMarkdown(bytes.toString('utf8'));
  assert.equal(parsed.ok, true);
  assert.equal(parsed.rows.length, 39);
  const built = buildSocialLinkCards(parsed.rows);
  assert.equal(built.ok, true);
  const catalog = loadSocialPlaceCatalog(root);
  const resolved = resolveSocialLinkCards(built.cards, catalog);
  assert.deepEqual(resolved.missingMains, []);
  const cards = enrichSocialCards(resolved.cards, catalog);
  assert.deepEqual(
    cards.map((card) => card.campaignId),
    [
      'reel-14',
      'reel-13',
      'reel-10',
      'reel-11',
      'fest-2048902',
      'reel-09',
      'reel-06',
      'reel-08',
      'reel-07',
      'reel-05',
      'reel-03',
      'reel-04',
      'reel-02',
      'reel-01',
    ],
  );
  const reel06 = cards.find((card) => card.campaignId === 'reel-06');
  assert.deepEqual(
    reel06.targets.map((target) => target.slug),
    ['tour-127240', 'tour-128113', 'tour-990000000002'],
  );
  assert.equal(cards.find((card) => card.campaignId === 'reel-08').targets[0].slug, 'hwaseong-fortress');
  assert.equal(cards.find((card) => card.campaignId === 'reel-10').region, '전북 고창');
  assert.equal(cards.find((card) => card.campaignId === 'reel-01').region, '');
  assert.equal(cards.every((card) => card.status === 'live'), true);
  for (const unposted of ['reel-12', 'reel-15', 'reel-16']) {
    assert.equal(cards.some((card) => card.campaignId === unposted), false);
  }
  const generated = JSON.parse(
    readFileSync(join(root, 'src/pages/Social/data/socialLinks.generated.json'), 'utf8'),
  );
  assert.equal(generated.missingSource, false);
  assert.deepEqual(
    generated.cards.map((card) => card.campaignId),
    cards.map((card) => card.campaignId),
  );
  const syncSource = readFileSync(scriptPath, 'utf8');
  assert.equal(syncSource.includes('posted-log.md'), true);
  assert.equal(syncSource.includes("readFileSync(join(root, 'posted-log.md')"), false);
});
