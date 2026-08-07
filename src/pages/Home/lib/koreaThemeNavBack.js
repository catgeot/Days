const KEY = 'gateo:theme-nav-back-stack';
const MAX_DEPTH = 8;

const MODULE_LABEL_BY_PATH = {
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
