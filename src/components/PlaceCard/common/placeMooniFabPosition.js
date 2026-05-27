export const PLACE_MOONI_FAB_SIZE = { width: 64, height: 80 };
export const PLACE_MOONI_POSITION_KEY = 'gateo_mooni_place_fab_pos';
export const PLACE_MOONI_EDGE_PADDING = 8;
export const PLACE_MOONI_DRAG_THRESHOLD = 6;

/** 플래너·위키 floating 「맨 위」 버튼 footprint (right/bottom 앵커 기준) */
const SCROLL_TOP_RESERVE = {
  PLANNER: { offsetRight: 12, offsetBottom: 12, width: 48, height: 48 },
  WIKI: { offsetRight: 24, offsetBottom: 96, width: 52, height: 52 },
};

function readSafeAreaBottom() {
  if (typeof window === 'undefined') return 0;
  const vv = window.visualViewport;
  if (!vv) return 0;
  return Math.max(0, Math.round(window.innerHeight - vv.height - (vv.offsetTop || 0)));
}

export function getPlaceMooniMinBottom(hasGalleryRelatedBar) {
  const safe = readSafeAreaBottom();
  if (hasGalleryRelatedBar) {
    return Math.max(88, safe + 72);
  }
  return Math.max(16, safe + 8);
}

export function getPlaceMooniScrollTopReserve(mediaMode) {
  return SCROLL_TOP_RESERVE[mediaMode] ?? null;
}

export function getPlaceMooniDefaultPosition(minBottom = 88) {
  if (typeof window === 'undefined') {
    return { right: PLACE_MOONI_EDGE_PADDING, bottom: minBottom };
  }
  return {
    right: window.innerWidth - PLACE_MOONI_FAB_SIZE.width - 12,
    bottom: minBottom,
  };
}

export function loadPlaceMooniPosition() {
  try {
    const raw = localStorage.getItem(PLACE_MOONI_POSITION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (typeof parsed?.right === 'number' && typeof parsed?.bottom === 'number') {
      return parsed;
    }
  } catch {
    // ignore
  }
  return null;
}

export function savePlaceMooniPosition(pos) {
  try {
    localStorage.setItem(PLACE_MOONI_POSITION_KEY, JSON.stringify(pos));
  } catch {
    // ignore
  }
}

function rectsOverlap(a, b) {
  const aRight = a.offsetRight;
  const aLeft = a.offsetRight + a.width;
  const aBottom = a.offsetBottom;
  const aTop = a.offsetBottom + a.height;

  const bRight = b.offsetRight;
  const bLeft = b.offsetRight + b.width;
  const bBottom = b.offsetBottom;
  const bTop = b.offsetBottom + b.height;

  return aLeft > bRight && aRight < bLeft && aTop > bBottom && aBottom < bTop;
}

/** right/bottom 고정 FAB가 예약 구역·화면 밖으로 나가지 않도록 clamp */
export function clampPlaceMooniPosition(pos, { minBottom, scrollTopReserve } = {}) {
  const fab = PLACE_MOONI_FAB_SIZE;
  const pad = PLACE_MOONI_EDGE_PADDING;
  const floorBottom = minBottom ?? 16;

  const maxRight = Math.max(pad, window.innerWidth - fab.width - pad);
  const maxBottom = Math.max(floorBottom, window.innerHeight - fab.height - pad);

  let next = {
    right: Math.min(Math.max(pos.right, pad), maxRight),
    bottom: Math.min(Math.max(pos.bottom, floorBottom), maxBottom),
  };

  if (scrollTopReserve) {
    const fabRect = {
      offsetRight: next.right,
      offsetBottom: next.bottom,
      width: fab.width,
      height: fab.height,
    };
    if (rectsOverlap(fabRect, scrollTopReserve)) {
      const nudgeRight = scrollTopReserve.offsetRight + scrollTopReserve.width + pad;
      const nudgeBottom = scrollTopReserve.offsetBottom + scrollTopReserve.height + pad;
      const tryRight = { ...next, right: Math.min(nudgeRight, maxRight) };
      const tryRightRect = {
        offsetRight: tryRight.right,
        offsetBottom: tryRight.bottom,
        width: fab.width,
        height: fab.height,
      };
      if (!rectsOverlap(tryRightRect, scrollTopReserve)) {
        next = tryRight;
      } else {
        next = { ...next, bottom: Math.min(nudgeBottom, maxBottom) };
      }
    }
  }

  return next;
}
