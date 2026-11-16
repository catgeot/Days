import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

import {
  applyCrawlerSearchIntent,
  CRAWLER_SEARCH_INTENT_OVERRIDES,
  crawlerSearchIntentKey,
} from '../../src/edge/crawlerSearchIntentOverrides.js';
import crawlerPlaceMeta from '../../src/edge/crawlerPlaceMeta.generated.js';
import { injectCrawlerMetaIntoHtml } from '../../src/edge/injectCrawlerMeta.js';
import {
  buildPlaceBaseDescription,
  isSyntheticEnglishPlaceIntro,
  placeBaseFallbackDescription,
  stripHtmlAndMarkdown,
  trimMetaDescription,
} from '../../src/edge/placeMetaDescription.js';
import { parseCrawlerPath, resolveCrawlerMeta } from '../../src/edge/resolveCrawlerMeta.js';

const indexHtml = readFileSync(new URL('../../index.html', import.meta.url), 'utf8');

function metaContent(html, pattern) {
  const raw = html.match(pattern)?.[1] ?? '';
  return raw
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&');
}

function headOf(pathname, locale) {
  const meta = resolveCrawlerMeta(pathname, locale);
  const html = injectCrawlerMetaIntoHtml(indexHtml, meta);
  return {
    meta,
    html,
    title: metaContent(html, /<title>([^<]*)<\/title>/i),
    description: metaContent(html, /<meta name="description" content="([^"]*)"/i),
    ogTitle: metaContent(html, /<meta property="og:title" content="([^"]*)"/i),
    ogDescription: metaContent(html, /<meta property="og:description" content="([^"]*)"/i),
    twitterTitle: metaContent(html, /<meta name="twitter:title" content="([^"]*)"/i),
    twitterDescription: metaContent(html, /<meta name="twitter:description" content="([^"]*)"/i),
  };
}

test('stripHtmlAndMarkdown removes tags, markdown, and entities', () => {
  assert.equal(
    stripHtmlAndMarkdown(
      '<p>Hello <b>world</b>.</p> **bold** [medina](https://example.com/fez) `souk`',
    ),
    'Hello world. bold medina souk',
  );
  assert.equal(stripHtmlAndMarkdown('Tom &amp; Jerry&#39;s'), "Tom & Jerry's");
  assert.equal(stripHtmlAndMarkdown('<script>alert(1)</script><p>본문</p>'), '본문');
});

test('trim keeps text under the max and a sentence that ends inside the window', () => {
  assert.equal(trimMetaDescription('짧은 소개입니다.'), '짧은 소개입니다.');
  const first = `${'가'.repeat(130)}.`;
  const second = ` ${'나'.repeat(40)}.`;
  assert.equal(trimMetaDescription(`${first}${second}`), first);
  assert.ok(first.length >= 120 && first.length <= 155);
});

test('trim cuts on a word boundary and does not end mid-word', () => {
  const word = 'skyscraper';
  const text = Array.from({ length: 30 }, () => word).join(' ');
  const out = trimMetaDescription(text);
  assert.ok(out.length >= 120 && out.length <= 155);
  assert.ok(out.split(' ').every((part) => part === word));
  assert.equal(text.startsWith(out), true);
  assert.match(text[out.length], /\s/);

  const korean = '골목 '.repeat(80).trim();
  const koreanOut = trimMetaDescription(`<em>${korean}</em> [link](https://example.com/x)`);
  assert.ok(koreanOut.length >= 120 && koreanOut.length <= 155);
  assert.equal(koreanOut.includes('<'), false);
  assert.equal(koreanOut.includes('http'), false);
  assert.ok(koreanOut.split(' ').every((part) => part === '골목'));
});

test('place base description uses the gallery intro and falls back without one', () => {
  const intro = '9,000개가 넘는 골목이 미로처럼 얽힌 중세 도시입니다.';
  assert.equal(
    buildPlaceBaseDescription({
      placeName: '페즈',
      galleryDescription: `페즈 여행 사진과 갤러리. <strong>**${intro}**</strong>`,
      locale: 'ko',
    }),
    intro,
  );

  const synthetic =
    'Discover Nowhere, Nowhere — a city travel guide with photos, videos, and trip planning on GATEO.';
  assert.equal(isSyntheticEnglishPlaceIntro(synthetic), true);
  assert.equal(
    isSyntheticEnglishPlaceIntro(
      'Discover Paris, France — the City of Light with the Eiffel Tower and café culture.',
    ),
    false,
  );
  assert.equal(
    buildPlaceBaseDescription({
      placeName: 'Nowhere',
      galleryDescription: `Browse Nowhere travel photos and gallery images. ${synthetic}`,
      locale: 'en',
    }),
    placeBaseFallbackDescription('Nowhere', 'en'),
  );
  assert.equal(
    buildPlaceBaseDescription({
      placeName: '파리',
      galleryDescription: '파리 travel guide on GATEO.',
      locale: 'ko',
    }),
    placeBaseFallbackDescription('파리', 'ko'),
  );

  const long = `Browse Wide travel photos and gallery images. ${'alpha '.repeat(40)}end.`;
  const trimmed = buildPlaceBaseDescription({
    placeName: 'Wide',
    galleryDescription: long,
    locale: 'en',
  });
  assert.ok(trimmed.length >= 120 && trimmed.length <= 155);
  assert.equal(trimmed.includes('Browse'), false);
  assert.equal(trimmed.includes('end.'), false);
});

test('search-intent override map is data and leaves canonical alone', () => {
  assert.equal(CRAWLER_SEARCH_INTENT_OVERRIDES['place:pitcairn-islands:base:ko'], undefined);
  assert.equal(CRAWLER_SEARCH_INTENT_OVERRIDES['place:pitcairn-islands:base:en'], undefined);
  assert.equal(
    CRAWLER_SEARCH_INTENT_OVERRIDES['place:fez:gallery:en'].title,
    'Fez city gallery',
  );
  assert.equal(
    CRAWLER_SEARCH_INTENT_OVERRIDES['place:cape-verde:video:ko'].title,
    '카보베르데 여행 영상',
  );
  assert.equal(crawlerSearchIntentKey({ kind: 'hub', path: '/korea/theme/scenic', locale: 'ko' }), 'hub:/korea/theme/scenic:ko');

  for (const [key, hint] of Object.entries(CRAWLER_SEARCH_INTENT_OVERRIDES)) {
    if (!hint.title) continue;
    const full = `${hint.title} | GATEO`;
    assert.ok(full.length <= 60, `${key} title is ${full.length} chars: ${full}`);
  }

  const row = {
    title: 'old',
    description: '짧은 소개.',
    canonicalUrl: 'https://www.gateo.kr/place/cape-verde',
    placeName: '카보베르데',
  };
  const next = applyCrawlerSearchIntent(row, {
    kind: 'place',
    slug: 'cape-verde',
    tab: 'video',
    locale: 'ko',
  });
  assert.equal(row.title, 'old');
  assert.equal(next.canonicalUrl, row.canonicalUrl);
  assert.equal(next.title, '카보베르데 여행 영상');
  assert.match(next.description, /카포베르데/);
  assert.match(next.description, /영상/);
  assert.equal(
    applyCrawlerSearchIntent(row, { kind: 'place', slug: 'unknown', tab: 'base', locale: 'ko' }),
    row,
  );
});

test('place root descriptions use the intro, with the legacy template only as fallback', () => {
  const jakartaKo = resolveCrawlerMeta('/place/jakarta', 'ko');
  assert.equal(jakartaKo.title, '자카르타(Jakarta) 여행 — 명소·플래너·AI 도슨트');
  assert.equal(
    jakartaKo.description,
    '자카르타(Jakarta). 인도네시아의 수도이자 동남아시아 최대 도시 중 하나입니다. 네덜란드 식민지 시대의 코타 투아 구시가지와 현대적인 마천루가 공존합니다. 나시고렝과 사테를 맛보며 다양한 인도네시아 문화를 경험할 수 있습니다.',
  );

  const jakartaEn = resolveCrawlerMeta('/place/jakarta', 'en');
  assert.equal(jakartaEn.title, 'Jakarta travel — sights, planner, and AI docent');
  assert.equal(
    jakartaEn.description,
    'Explore Jakarta, Indonesia — a sprawling capital where colonial Kota Tua meets glittering skyscrapers, nasi goreng, satay, and rich multi-island Indonesian',
  );
  assert.ok(jakartaEn.description.length <= 155);
  assert.equal(jakartaEn.description.endsWith('Indonesian'), true);

  const tsushimaKo = resolveCrawlerMeta('/place/tsushima', 'ko');
  assert.equal(tsushimaKo.title, '대마도(Daemado island) 여행 — 명소·플래너·AI 도슨트');
  assert.match(tsushimaKo.description, /대마도/);
  assert.match(tsushimaKo.description, /Daemado/);
  assert.match(tsushimaKo.description, /히타카츠/);

  const tsushimaEn = resolveCrawlerMeta('/place/tsushima', 'en');
  assert.equal(tsushimaEn.title, 'Daemado island (대마도) travel');
  assert.match(tsushimaEn.description, /대마도/);
  assert.match(tsushimaEn.description, /Daemado/);

  const pitcairnKo = resolveCrawlerMeta('/place/pitcairn-islands', 'ko');
  assert.equal(pitcairnKo.title, '핏케언 제도 여행 — 명소·플래너·AI 도슨트');
  assert.match(pitcairnKo.description, /바운티|고립/);
  assert.equal(pitcairnKo.description.includes('GATEO에서 확인하세요'), false);

  const pitcairnEn = resolveCrawlerMeta('/place/pitcairn-islands', 'en');
  assert.equal(pitcairnEn.title, 'Pitcairn Islands travel — sights, planner, and AI docent');
  assert.equal(pitcairnEn.description, placeBaseFallbackDescription('Pitcairn Islands', 'en'));

  const santoriniKo = resolveCrawlerMeta('/place/santorini', 'ko');
  assert.equal(santoriniKo.title, '산토리니 여행 사진 — 명소·플래너·AI 도슨트');
  assert.match(santoriniKo.description, /^산토리니 여행 사진\./);
  assert.match(santoriniKo.description, /일몰/);

  const santoriniEn = resolveCrawlerMeta('/place/santorini', 'en');
  assert.equal(santoriniEn.title, 'Santorini travel photos');
  assert.match(santoriniEn.description, /Santorini travel photos/);

  const kotaKo = resolveCrawlerMeta('/place/kota-kinabalu', 'ko');
  assert.equal(kotaKo.title, '코타키나발루 여행 — 명소·플래너·AI 도슨트');
  assert.match(kotaKo.description, /석양/);
  assert.equal(kotaKo.description.includes('GATEO에서 확인하세요'), false);

  const fezKo = resolveCrawlerMeta('/place/fez/gallery', 'ko');
  assert.equal(fezKo.title, 'Fez city gallery · 페즈 여행 사진');
  assert.match(fezKo.description, /Fez city gallery/);
  assert.match(fezKo.description, /염색장/);
  assert.match(fezKo.description, /카라위인/);

  const fezEn = resolveCrawlerMeta('/place/fez/gallery', 'en');
  assert.equal(fezEn.title, 'Fez city gallery');
  assert.match(fezEn.description, /^Fez city gallery\./);
  assert.match(fezEn.description, /tanneries/);
  assert.ok(fezEn.description.length <= 155);

  const sriKo = resolveCrawlerMeta('/place/sri-jayawardenapura', 'ko');
  assert.equal(sriKo.title, '스리랑카 수도권 여행 — 명소·플래너·AI 도슨트');
  assert.match(sriKo.description, /콜롬보/);

  const sriEn = resolveCrawlerMeta('/place/sri-jayawardenapura', 'en');
  assert.equal(sriEn.title, 'Sri Jayawardenepura Kotte photos');
  assert.match(sriEn.description, /Sri Jayawardenepura Kotte photos/);

  const scenicKo = resolveCrawlerMeta('/korea/theme/scenic', 'ko');
  assert.equal(scenicKo.title, '한국의 명승 (scenic spots)');
  assert.match(scenicKo.description, /scenic spots/);
  assert.match(scenicKo.description, /명승/);

  const scenicEn = resolveCrawlerMeta('/korea/theme/scenic', 'en');
  assert.equal(scenicEn.title, 'Korea scenic spots');
  assert.match(scenicEn.description, /명승/);
  assert.match(scenicEn.description, /scenic spots/);

  const videoKo = resolveCrawlerMeta('/place/cape-verde/video', 'ko');
  const baseKo = resolveCrawlerMeta('/place/cape-verde', 'ko');
  assert.equal(videoKo.title, '카보베르데 여행 영상');
  assert.match(videoKo.description, /카보베르데/);
  assert.match(videoKo.description, /카포베르데/);
  assert.match(videoKo.description, /영상/);
  assert.equal(videoKo.canonicalUrl, baseKo.canonicalUrl);
  assert.equal(videoKo.canonicalUrl, 'https://www.gateo.kr/place/cape-verde');
  assert.notEqual(videoKo.description, baseKo.description);

  const videoEn = resolveCrawlerMeta('/place/cape-verde/video', 'en');
  assert.equal(videoEn.title, 'Cape Verde (카보베르데) travel video');
  assert.match(videoEn.description, /카포베르데/);
  assert.match(videoEn.description, /video/);
  assert.equal(videoEn.canonicalUrl, 'https://www.gateo.kr/place/cape-verde?lang=en');

  assert.equal(resolveCrawlerMeta('/world-events/vienna-staatsoper-season-2026', 'ko'), null);
});

test('alias tabs keep the place root unless that slug has a video hint', () => {
  const base = resolveCrawlerMeta('/place/paris', 'ko');
  const video = resolveCrawlerMeta('/place/paris/video', 'ko');
  assert.equal(video.title, base.title);
  assert.equal(video.title, '파리 여행 — 명소·플래너·AI 도슨트');
  assert.equal(video.description, base.description);
  assert.equal(video.canonicalUrl, base.canonicalUrl);
  assert.equal(parseCrawlerPath('/place/paris/video')?.kind, 'place-base');
  assert.equal(parseCrawlerPath('/place/paris/video')?.aliasTab, 'video');

  const tokyoGallery = resolveCrawlerMeta('/place/tokyo/gallery', 'ko');
  assert.match(tokyoGallery.title, /갤러리/);
  assert.match(tokyoGallery.description, /^도쿄 여행 사진과 갤러리\./);
});

test('every place root description is the intro snippet or the legacy template', () => {
  for (const slug of Object.keys(crawlerPlaceMeta)) {
    for (const locale of ['ko', 'en']) {
      const meta = resolveCrawlerMeta(`/place/${slug}`, locale);
      assert.ok(meta, `${slug} ${locale}`);
      const fallback = placeBaseFallbackDescription(meta.placeName, locale);
      if (meta.description === fallback) continue;
      assert.ok(
        meta.description.length <= 155,
        `${slug} ${locale} description is ${meta.description.length} chars`,
      );
      assert.equal(meta.description.includes('<'), false, slug);
    }
  }
});

test('prerendered HTML serves the search-intent title and description', () => {
  const cases = [
    {
      path: '/place/jakarta',
      locale: 'ko',
      title: '자카르타(Jakarta) 여행 — 명소·플래너·AI 도슨트 | GATEO',
      descriptionIncludes: ['Jakarta', '코타 투아'],
    },
    {
      path: '/place/jakarta',
      locale: 'en',
      title: 'Jakarta travel — sights, planner, and AI docent | GATEO',
      descriptionIncludes: ['Jakarta', 'Kota Tua'],
    },
    {
      path: '/place/tsushima',
      locale: 'ko',
      title: '대마도(Daemado island) 여행 — 명소·플래너·AI 도슨트 | GATEO',
      descriptionIncludes: ['대마도', 'Daemado'],
    },
    {
      path: '/place/tsushima',
      locale: 'en',
      title: 'Daemado island (대마도) travel | GATEO',
      descriptionIncludes: ['대마도', 'Daemado'],
    },
    {
      path: '/place/cape-verde/video',
      locale: 'ko',
      title: '카보베르데 여행 영상 | GATEO',
      descriptionIncludes: ['카보베르데', '카포베르데', '영상'],
    },
    {
      path: '/place/cape-verde/video',
      locale: 'en',
      title: 'Cape Verde (카보베르데) travel video | GATEO',
      descriptionIncludes: ['카포베르데', 'video'],
    },
    {
      path: '/korea/theme/scenic',
      locale: 'ko',
      title: '한국의 명승 (scenic spots) | GATEO',
      descriptionIncludes: ['명승', 'scenic spots'],
    },
    {
      path: '/korea/theme/scenic',
      locale: 'en',
      title: 'Korea scenic spots | GATEO',
      descriptionIncludes: ['명승', 'scenic spots'],
    },
  ];

  for (const row of cases) {
    const head = headOf(row.path, row.locale);
    assert.equal(head.title, row.title, `${row.path} ${row.locale} title`);
    assert.equal(head.ogTitle, head.title);
    assert.equal(head.twitterTitle, head.title);
    assert.equal(head.description, head.meta.description);
    assert.equal(head.ogDescription, head.description);
    assert.equal(head.twitterDescription, head.description);
    assert.ok(head.description.length <= 155, `${row.path} ${row.locale}`);
    for (const phrase of row.descriptionIncludes) {
      assert.ok(head.description.includes(phrase), `${row.path} ${row.locale} missing ${phrase}`);
    }
    assert.equal(head.html.match(/<meta name="description"/gi).length, 1);
    if (row.path === '/place/cape-verde/video') {
      const canonical = head.html.match(/<link rel="canonical" href="([^"]+)"/i)?.[1];
      assert.equal(
        canonical,
        row.locale === 'en'
          ? 'https://www.gateo.kr/place/cape-verde?lang=en'
          : 'https://www.gateo.kr/place/cape-verde',
      );
    }
  }
});
