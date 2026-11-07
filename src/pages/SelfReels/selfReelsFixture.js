import { selectPublicSelfReels } from './selfReelsCatalog.js';

const FIXTURE_CREDIT = '테스트 출처: 공공누리 표기';

export const FIXTURE_SELF_REEL_ALLOW = {
  id: 'fixture-allow',
  rightsConfirmed: true,
  credit: FIXTURE_CREDIT,
  videoUrl: 'https://fixture.invalid/fixture-allow.mp4',
  placePaths: [
    '/place/fixture-path-1',
    '/place/fixture-path-2',
    '/place/fixture-path-3',
    '/place/fixture-path-4',
    '/place/fixture-path-5',
  ],
};

export const FIXTURE_SELF_REEL_SECOND = {
  id: 'fixture-second',
  rightsConfirmed: true,
  credit: FIXTURE_CREDIT,
  videoUrl: 'https://fixture.invalid/fixture-second.mp4',
  placePaths: ['/place/fixture-path-b'],
};

export const FIXTURE_SELF_REEL_FIVE_PLACES = {
  id: 'fixture-five-places',
  rightsConfirmed: true,
  credit: FIXTURE_CREDIT,
  videoUrl: 'https://fixture.invalid/fixture-five-places.mp4',
  placePaths: [
    '/place/fixture-path-1',
    '/place/fixture-path-2',
    '/place/fixture-path-3',
    '/place/fixture-path-4',
    '/place/fixture-path-5',
  ],
};

/** Fixture-only feed rows. Not used when the fixture flag is off. */
export function getFixtureSelfReels() {
  return selectPublicSelfReels([FIXTURE_SELF_REEL_ALLOW, FIXTURE_SELF_REEL_SECOND]).map((reel) => ({
    ...reel,
    isFixture: true,
  }));
}
