import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  detectPosterEditionYear,
  festivalEditionYearFromStart,
  festivalEditionYearFromEventFields,
  isPriorEditionPoster,
  isFestivalGalleryDemotionListed,
  reorderFestivalGallerySlides,
  shouldDemoteFestivalGallerySlide,
  shouldMarkPriorEditionPosterMeta,
} from '../../src/pages/Korea/lib/festivalPosterEdition.js';

const FIXTURE_1095732_POSTER = {
  festivalYear: 2026,
  commonFirstImage: 'https://tong.visitkorea.or.kr/cms/resource/35/4147235_image2_1.jpg',
  slides: [
    {
      url: 'https://tong.visitkorea.or.kr/cms/resource/35/4147235_image2_1.jpg',
      caption: '',
    },
    {
      url: 'https://tong.visitkorea.or.kr/cms/resource/82/4154282_image2_1.jpg',
      caption: '2026 서울빛초롱축제 포스터.jpg',
    },
    {
      url: 'https://tong.visitkorea.or.kr/cms/resource/39/4147239_image2_1.jpg',
      caption: '2026 서울빛초롱축제 (6).jpg',
    },
  ],
};

test('poster edition year from caption / filename', () => {
  assert.equal(
    detectPosterEditionYear({ caption: '2025 서울빛초롱축제 포스터' }),
    2025,
  );
  assert.equal(
    detectPosterEditionYear({ url: 'https://cdn.example/festival_2024_poster.jpg' }),
    2024,
  );
  assert.equal(detectPosterEditionYear({ url: 'https://cdn.example/no-year.jpg' }), null);
});

test('prior edition label gate', () => {
  assert.equal(festivalEditionYearFromStart('20261211'), 2026);
  assert.equal(festivalEditionYearFromEventFields({ eventStartDate: '20261211' }), 2026);
  assert.equal(isPriorEditionPoster(2025, 2026), true);
  assert.equal(isPriorEditionPoster(2026, 2026), false);
  assert.equal(isPriorEditionPoster(null, 2026), false);
});

test('festivalEditionYearFromEventFields is null-safe', () => {
  assert.equal(festivalEditionYearFromEventFields(null), null);
  assert.equal(festivalEditionYearFromEventFields(undefined), null);
});

test('1095732-shaped fixture — caption year only; yearless hero never labelled', () => {
  const { festivalYear, commonFirstImage, slides } = FIXTURE_1095732_POSTER;
  const mislabeledPriorUrlIndex = slides.findIndex((s) =>
    s.url.includes('4147239_image2'),
  );
  assert.ok(mislabeledPriorUrlIndex >= 0);
  assert.equal(isFestivalGalleryDemotionListed('1095732', slides[mislabeledPriorUrlIndex].url), true);
  assert.equal(
    shouldMarkPriorEditionPosterMeta({
      posterYear: detectPosterEditionYear(slides[mislabeledPriorUrlIndex]),
      festivalYear,
      caption: slides[mislabeledPriorUrlIndex].caption,
    }),
    false,
  );
  assert.equal(
    shouldMarkPriorEditionPosterMeta({
      posterYear: detectPosterEditionYear(slides[1]),
      festivalYear,
      caption: slides[1].caption,
    }),
    false,
  );
  assert.equal(
    shouldMarkPriorEditionPosterMeta({
      posterYear: null,
      festivalYear,
      caption: '',
      credit: '',
    }),
    false,
  );
  assert.equal(
    shouldMarkPriorEditionPosterMeta({
      posterYear: null,
      festivalYear,
      caption: '예년 포스터 안내',
    }),
    true,
  );
  assert.equal(detectPosterEditionYear({ url: commonFirstImage, caption: '' }), null);
});

test('reorderFestivalGallerySlides — prior-edition caption moves to tail (stable)', () => {
  const { festivalYear, slides } = FIXTURE_1095732_POSTER;
  const shuffled = [
    slides[0],
    slides[2],
    slides[1],
  ];
  const ordered = reorderFestivalGallerySlides(shuffled, {
    festivalYear,
    contentId: '1095732',
  });
  assert.equal(ordered.length, 3);
  assert.ok(ordered.at(-1)?.url.includes('4147239_image2'));
  assert.match(ordered[0]?.caption || '', /2026|^\s*$/);
  assert.equal(
    shouldDemoteFestivalGallerySlide(slides[2], festivalYear, '1095732'),
    true,
  );
  assert.equal(
    shouldDemoteFestivalGallerySlide(
      { url: slides[0].url, caption: '' },
      festivalYear,
      '1095732',
    ),
    false,
  );
});

test('reorderFestivalGallerySlides — demotion list works when caption year mismatches pixels', () => {
  const mislabeled = {
    url: 'https://tong.visitkorea.or.kr/cms/resource/39/4147239_image2_1.jpg',
    caption: '2026 서울빛초롱축제 (6).jpg',
  };
  const poster = {
    url: 'https://tong.visitkorea.or.kr/cms/resource/82/4154282_image2_1.jpg',
    caption: '2026 서울빛초롱축제 포스터.jpg',
  };
  const ordered = reorderFestivalGallerySlides([mislabeled, poster], {
    festivalYear: 2026,
    contentId: '1095732',
  });
  assert.equal(ordered[0].url, poster.url);
  assert.equal(ordered[1].url, mislabeled.url);
});

test('reorderFestivalGallerySlides — without festival year only explicit demotion list applies', () => {
  const demoted = {
    url: 'https://tong.visitkorea.or.kr/cms/resource/39/4147239_image2_1.jpg',
    caption: '2026 서울빛초롱축제 (6).jpg',
  };
  const other = {
    url: 'https://tong.visitkorea.or.kr/cms/resource/82/4154282_image2_1.jpg',
    caption: 'scene',
  };
  const ordered = reorderFestivalGallerySlides([demoted, other], {
    festivalYear: null,
    contentId: '1095732',
  });
  assert.equal(ordered[0].url, other.url);
  assert.equal(ordered[1].url, demoted.url);
});