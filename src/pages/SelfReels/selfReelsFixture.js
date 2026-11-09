import { selectPublicSelfReels } from './selfReelsCatalog.js';

const FIXTURE_CREDIT = '테스트 출처: 공공누리 표기';

export const FIXTURE_SELF_REEL_ALLOW = {
  id: 'fixture-allow',
  rightsConfirmed: true,
  credit: FIXTURE_CREDIT,
  videoUrl: 'https://fixture.invalid/fixture-allow.mp4',
  places: [
    { path: '/place/fixture-path-1', name: '테스트 장소 하나' },
    { path: '/place/fixture-path-2', name: '테스트 장소 둘' },
    { path: '/place/fixture-path-3', name: '테스트 장소 셋' },
    { path: '/place/fixture-path-4', name: '테스트 장소 넷' },
    { path: '/place/fixture-path-5', name: '테스트 장소 다섯' },
  ],
};

export const FIXTURE_SELF_REEL_SECOND = {
  id: 'fixture-second',
  rightsConfirmed: true,
  credit: FIXTURE_CREDIT,
  videoUrl: 'https://fixture.invalid/fixture-second.mp4',
  places: [{ path: '/place/fixture-path-b', name: '테스트 장소 둘째 편' }],
};

export const FIXTURE_SELF_REEL_FIVE_PLACES = {
  id: 'fixture-five-places',
  rightsConfirmed: true,
  credit: FIXTURE_CREDIT,
  videoUrl: 'https://fixture.invalid/fixture-five-places.mp4',
  places: [
    { path: '/place/fixture-path-1', name: '테스트 장소 하나' },
    { path: '/place/fixture-path-2', name: '테스트 장소 둘' },
    { path: '/place/fixture-path-3', name: '테스트 장소 셋' },
    { path: '/place/fixture-path-4', name: '테스트 장소 넷' },
    { path: '/place/fixture-path-5', name: '테스트 장소 다섯' },
  ],
};

/** Fixture-only feed rows. Not used when the fixture flag is off. */
export function getFixtureSelfReels() {
  return selectPublicSelfReels([FIXTURE_SELF_REEL_ALLOW, FIXTURE_SELF_REEL_SECOND]).map((reel) => ({
    ...reel,
    isFixture: true,
  }));
}
