/**
 * Poster prior-edition UI — 1095732-shaped TourAPI fixture (390px).
 * Logic unit coverage: scripts/health/festival-poster-edition.test.mjs
 */
import { test, expect } from '@playwright/test';
import {
  FESTIVAL_POSTER_E2E_ID,
  buildFestivalPoster1095732Detail,
  buildFestivalPoster1095732Images,
  installFestivalPoster1095732Fixtures,
} from './festival-poster-1095732-fixture.js';
import {
  detectPosterEditionYear,
  festivalEditionYearFromEventFields,
  shouldMarkPriorEditionPosterMeta,
} from '../src/pages/Korea/lib/festivalPosterEdition.js';

test.describe('festival poster prior edition fixture @390', () => {
  test('1095732-shaped fixture — prior poster gate', () => {
    const detail = buildFestivalPoster1095732Detail();
    const images = buildFestivalPoster1095732Images();
    const festivalYear = festivalEditionYearFromEventFields(detail.intro);
    const slides = images.items.map((row) => ({
      url: row.imageUrl,
      caption: row.imgname,
    }));
    const commonFirst = detail.common.firstimage;
    slides.unshift({ url: commonFirst, caption: '' });

    const priorSlide = slides.find((s) => /2025/.test(s.caption));
    expect(priorSlide).toBeTruthy();
    expect(
      shouldMarkPriorEditionPosterMeta({
        posterYear: detectPosterEditionYear(priorSlide),
        festivalYear,
        activeUrl: priorSlide.url,
        commonFirstImage: commonFirst,
        slides,
      }),
    ).toBe(true);

    const commonHero = slides[0];
    expect(
      shouldMarkPriorEditionPosterMeta({
        posterYear: detectPosterEditionYear(commonHero),
        festivalYear,
        activeUrl: commonHero.url,
        commonFirstImage: commonFirst,
        slides,
      }),
    ).toBe(true);

    expect(FESTIVAL_POSTER_E2E_ID).toBe('1095732');
    expect(typeof installFestivalPoster1095732Fixtures).toBe('function');
  });
});