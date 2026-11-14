import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  detectPosterEditionYear,
  festivalEditionYearFromStart,
  festivalEditionYearFromEventFields,
  isPriorEditionPoster,
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
      caption: '2025 서울빛초롱축제 포스터.jpg',
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
  const priorCaptionIndex = slides.findIndex((s) => /2025/.test(s.caption));
  assert.ok(priorCaptionIndex >= 0);
  assert.equal(
    shouldMarkPriorEditionPosterMeta({
      posterYear: detectPosterEditionYear(slides[priorCaptionIndex]),
      festivalYear,
      caption: slides[priorCaptionIndex].caption,
    }),
    true,
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