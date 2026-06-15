/** Home globe interaction mode — 2D default, 3D tour only on demand. */
export const GLOBE_MODE = {
  GLOBE_2D: 'globe2d',
  TOUR_BOOTSTRAPPING: 'tour_bootstrapping',
  TOUR_PLAYING: 'tour_playing',
  TOUR_READY: 'tour_ready'
};

export function isTourMode(mode) {
  return mode !== GLOBE_MODE.GLOBE_2D;
}

export function canSkipTour(mode) {
  return mode === GLOBE_MODE.TOUR_BOOTSTRAPPING || mode === GLOBE_MODE.TOUR_PLAYING;
}

export function canEndTour(mode) {
  return isTourMode(mode);
}

export function transitionGlobeMode(current, next) {
  const allowed = {
    [GLOBE_MODE.GLOBE_2D]: [GLOBE_MODE.TOUR_BOOTSTRAPPING],
    [GLOBE_MODE.TOUR_BOOTSTRAPPING]: [GLOBE_MODE.TOUR_PLAYING, GLOBE_MODE.GLOBE_2D, GLOBE_MODE.TOUR_READY],
    [GLOBE_MODE.TOUR_PLAYING]: [GLOBE_MODE.TOUR_READY, GLOBE_MODE.GLOBE_2D],
    [GLOBE_MODE.TOUR_READY]: [GLOBE_MODE.GLOBE_2D, GLOBE_MODE.TOUR_PLAYING, GLOBE_MODE.TOUR_BOOTSTRAPPING]
  };

  if (allowed[current]?.includes(next)) return next;
  return current;
}
