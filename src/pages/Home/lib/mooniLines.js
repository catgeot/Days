/** MOONi FAB 말풍선 SSOT — intro · peek · idle · react · easterEgg */

import { i18n } from '../../../i18n/config';

const EASTER_EGG_CHANCE = 0.03;

const IDLE_CATEGORY_ORDER = ['playful', 'travel', 'hint'];

function getLinePool(key) {
  return /** @type {string[]} */ (i18n.t(key, { returnObjects: true }));
}

function pickRandomIndex(pool, lastIndex) {
  if (pool.length <= 1) return 0;
  let index;
  do {
    index = Math.floor(Math.random() * pool.length);
  } while (index === lastIndex);
  return index;
}

function rollEasterEgg() {
  return Math.random() < EASTER_EGG_CHANCE;
}

function pickFromFlatPool(pool, lastIndex) {
  const index = pickRandomIndex(pool, lastIndex);
  return { text: pool[index], index };
}

function readGateoMooniIntroIndexOverride() {
  if (typeof globalThis === 'undefined') return null;
  const raw = globalThis.__GATEO_MOONI_INTRO_INDEX__;
  if (typeof raw !== 'number' || !Number.isInteger(raw)) return null;
  return raw;
}

/** 세션 intro — 단일 줄 */
export function pickIntroLine(lastIndex = -1) {
  const pool = getLinePool('mooni.lines.intro');
  const forcedIndex = readGateoMooniIntroIndexOverride();
  if (forcedIndex != null && pool.length > 0) {
    const index = Math.min(Math.max(0, forcedIndex), pool.length - 1);
    return { text: pool[index], index };
  }
  return pickFromFlatPool(pool, lastIndex);
}

/** E2E·health — ko intro pool (i18n `mooni.lines.intro`와 동기) */
export function getMooniIntroLinePool() {
  return getLinePool('mooni.lines.intro');
}

/** 호버·누르고 있기 peek */
export function pickPeekLine(lastCategory = null) {
  if (rollEasterEgg()) {
    const { text } = pickFromFlatPool(getLinePool('mooni.lines.easterEgg'), -1);
    return { text, category: 'easterEgg' };
  }

  const peekPools = /** @type {Record<string, string[]>} */ (
    i18n.t('mooni.lines.peek', { returnObjects: true })
  );
  const categories = Object.keys(peekPools);
  let category = categories[Math.floor(Math.random() * categories.length)];
  if (categories.length > 1) {
    let guard = 0;
    while (category === lastCategory && guard < 8) {
      category = categories[Math.floor(Math.random() * categories.length)];
      guard += 1;
    }
  }

  const pool = peekPools[category];
  const index = Math.floor(Math.random() * pool.length);
  return { text: pool[index], category };
}

/** 45초(모바일 32초) idle nudge — 카테고리 순환 */
export function pickIdleLine(lastCategory = null) {
  if (rollEasterEgg()) {
    const { text } = pickFromFlatPool(getLinePool('mooni.lines.easterEgg'), -1);
    return { text, category: 'easterEgg' };
  }

  const idlePools = /** @type {Record<string, string[]>} */ (
    i18n.t('mooni.lines.idle', { returnObjects: true })
  );
  const lastIdx = lastCategory ? IDLE_CATEGORY_ORDER.indexOf(lastCategory) : -1;
  const nextIdx = (lastIdx + 1) % IDLE_CATEGORY_ORDER.length;
  const category = IDLE_CATEGORY_ORDER[nextIdx];
  const pool = idlePools[category];
  const index = Math.floor(Math.random() * pool.length);
  return { text: pool[index], category };
}

export function pickDragReactLine(lastIndex = -1) {
  return pickFromFlatPool(getLinePool('mooni.lines.react.drag'), lastIndex);
}

export function pickDismissReactLine(lastIndex = -1) {
  return pickFromFlatPool(getLinePool('mooni.lines.react.dismiss'), lastIndex);
}

export const MOONI_INTRO_SEEN_KEY = 'gateo_mooni_intro_seen';

export function hasMooniIntroSeen() {
  try {
    return sessionStorage.getItem(MOONI_INTRO_SEEN_KEY) === '1';
  } catch {
    return false;
  }
}

export function markMooniIntroSeen() {
  try {
    sessionStorage.setItem(MOONI_INTRO_SEEN_KEY, '1');
  } catch {
    // ignore
  }
}

/** 터치·coarse pointer — idle nudge 간격 단축 */
export function getMooniNudgeIntervalMs() {
  if (typeof window === 'undefined') return 45_000;
  return window.matchMedia('(hover: none)').matches ? 32_000 : 45_000;
}
