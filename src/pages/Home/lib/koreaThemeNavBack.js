import { areaCodeForHubId } from '../../Korea/koreaHubSeeds.js';
import { resolveCityAttractionHub } from './cityAttractionHubs.js';
import { listKoreaScenicSpots } from './koreaScenicSpots.js';
import {
  SCENIC_REGION_ORDER,
  scenicAreaCodeForHubId,
  scenicRegionForAreaCode,
} from './koreaTourAttractionMap.js';
import { scenicClusterIdForHubId } from './koreaScenicClusters.js';

const KEY = 'gateo:theme-nav-back-stack';
const MAX_DEPTH = 8;

const MODULE_LABEL_BY_PATH = {
  '/korea': '축제',
  '/korea/theme': '한국의 명승',
  '/korea/theme/top10': '10대 절경',
  '/korea/theme/scenic': '한국의 명승',
  '/korea/theme/courses': '여행코스',
  '/korea/theme/regions': '방방곡곡',
  '/korea/theme/packages': '패키지',
};

/**
 * @param {string} basePath
 * @param {{ spotId?: string | null, areaCode?: string | number | null }} [opts]
 */
export function buildThemeModulePath(basePath, opts = {}) {
  const base = String(basePath || '').trim();
  if (!base) return '/korea/theme/scenic';
  let pathname = base;
  let existing = '';
  const qIdx = base.indexOf('?');
  if (qIdx >= 0) {
    pathname = base.slice(0, qIdx);
    existing = base.slice(qIdx + 1);
  }
  const params = new URLSearchParams(existing);
  const area = opts.areaCode != null ? String(opts.areaCode).trim() : '';
  if (area && area !== 'all') params.set('area', area);
  const spotId = opts.spotId != null ? String(opts.spotId).trim() : '';
  if (spotId) params.set('spot', spotId);
  else params.delete('spot');
  const q = params.toString();
  return q ? `${pathname}?${q}` : pathname;
}

/** @param {string} path */
export function themeModuleLabelForPath(path) {
  const pathname = String(path || '').split('?')[0];
  return MODULE_LABEL_BY_PATH[pathname] || '테마';
}

/**
 * hub → 명승 홈 베이스 경로 (spot 쿼리 제외). koreaThemeCrossLinks.scenicHomePathForHubId와 동기.
 * @param {string | null | undefined} hubId
 * @returns {string}
 */
function scenicHomeBasePathForHubId(hubId) {
  const hid = String(hubId || '')
    .trim()
    .toLowerCase();
  if (!hid || !resolveCityAttractionHub(hid)) return '/korea/theme/scenic';
  const areaCode = scenicAreaCodeForHubId(hid) || areaCodeForHubId(hid) || null;
  let region = scenicRegionForAreaCode(areaCode);
  if (!region) {
    const curated = listKoreaScenicSpots().find(
      (s) => String(s.hubId || '').toLowerCase() === hid,
    );
    const label = String(curated?.region || '').trim();
    if (label && SCENIC_REGION_ORDER.includes(label)) region = label;
  }
  const params = new URLSearchParams();
  if (region) {
    params.set('cregion', region);
    params.set('hregion', region);
    params.set('tregion', region);
  }
  if (areaCode && region) {
    const area = String(areaCode);
    params.set('carea', area);
    params.set('harea', area);
    params.set('tarea', area);
  }
  const clusterId = scenicClusterIdForHubId(hid);
  if (clusterId) params.set('ccluster', clusterId);
  params.set('hub', hid);
  return `/korea/theme/scenic?${params.toString()}`;
}

/**
 * 상세 모달 크로스 이동 시 「이전」스택 엔트리.
 * 축제(`/korea`) 등 테마 모듈이 아닌 returnTo에 scenic spotId를 붙이면
 * 헤더 「○○ · 테마」가 축제홈으로 튕기므로, 그 경우 명승 상세로 복귀한다.
 * @param {{ id?: string, name?: string, areaCode?: string | number | null } | null | undefined} spot
 * @param {string | null | undefined} returnTo
 * @returns {{ path: string, label: string, moduleLabel: string } | null}
 */
export function themeNavBackEntryForSpot(spot, returnTo) {
  if (!spot || !returnTo) return null;
  const returnPath = String(returnTo).split('?')[0];
  const label = String(spot.name || '').trim();
  const spotId = String(spot.id || spot.placeSlug || '').trim();
  if (returnPath === '/korea' || !returnPath.startsWith('/korea/theme/')) {
    if (!spotId) return null;
    const hubId = String(spot.hubId || '').trim().toLowerCase();
    const basePath = hubId
      ? scenicHomeBasePathForHubId(hubId)
      : '/korea/theme/scenic';
    return {
      path: buildThemeModulePath(basePath, { spotId }),
      label,
      moduleLabel: themeModuleLabelForPath('/korea/theme/scenic'),
    };
  }
  return {
    path: buildThemeModulePath(returnTo, {
      spotId: spot.id,
      areaCode: spot.areaCode,
    }),
    label,
    moduleLabel: themeModuleLabelForPath(returnTo),
  };
}

/**
 * @param {{ path?: string, label?: string, moduleLabel?: string } | null | undefined} entry
 */
export function formatThemeNavBackLabel(entry) {
  if (!entry) return '';
  const name = String(entry.label || '').trim();
  const mod =
    String(entry.moduleLabel || '').trim() ||
    themeModuleLabelForPath(entry.path);
  if (name && mod) return `${name} · ${mod}`;
  return name || mod || '';
}

function readStack() {
  try {
    const raw = sessionStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (row) => row && typeof row.path === 'string' && row.path.startsWith('/'),
    );
  } catch {
    return [];
  }
}

function writeStack(stack) {
  try {
    if (!stack.length) {
      sessionStorage.removeItem(KEY);
      return;
    }
    sessionStorage.setItem(KEY, JSON.stringify(stack.slice(-MAX_DEPTH)));
  } catch {
    /* private mode */
  }
}

function normPath(path) {
  return String(path || '').trim();
}

/**
 * @param {{ path: string, label?: string, moduleLabel?: string } | null | undefined} entry
 */
export function pushThemeNavBack(entry) {
  const path = normPath(entry?.path);
  if (!path || !path.startsWith('/korea')) return;
  const next = {
    path,
    label: String(entry?.label || '').trim(),
    moduleLabel:
      String(entry?.moduleLabel || '').trim() || themeModuleLabelForPath(path),
  };
  const stack = readStack();
  const top = stack[stack.length - 1];
  if (top && top.path === next.path) {
    stack[stack.length - 1] = next;
  } else {
    stack.push(next);
  }
  writeStack(stack);
}

export function peekThemeNavBack() {
  const stack = readStack();
  return stack.length ? stack[stack.length - 1] : null;
}

export function consumeThemeNavBack() {
  const stack = readStack();
  if (!stack.length) return null;
  const entry = stack.pop();
  writeStack(stack);
  return entry;
}

export function clearThemeNavBack() {
  writeStack([]);
}

/**
 * 브라우저 뒤로 등으로 이미 복귀한 경우 스택 top을 제거.
 * @param {string} currentPath pathname + search
 */
export function reconcileThemeNavBack(currentPath) {
  const top = peekThemeNavBack();
  if (!top) return;
  if (normPath(top.path) === normPath(currentPath)) {
    consumeThemeNavBack();
  }
}

/**
 * @param {unknown} routeState
 * @returns {{ path: string, label?: string, moduleLabel?: string } | null}
 */
export function resolveThemeNavBack(routeState) {
  const fromState =
    routeState && typeof routeState === 'object' && 'themeBack' in routeState
      ? /** @type {{ themeBack?: unknown }} */ (routeState).themeBack
      : null;
  if (
    fromState &&
    typeof fromState === 'object' &&
    typeof /** @type {{ path?: unknown }} */ (fromState).path === 'string' &&
    String(/** @type {{ path: string }} */ (fromState).path).startsWith('/')
  ) {
    return /** @type {{ path: string, label?: string, moduleLabel?: string }} */ (
      fromState
    );
  }
  return peekThemeNavBack();
}
